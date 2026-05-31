const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 3000;
const IS_RENDER = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  // Para Radmin / distancia: evitamos colas enormes y compresión costosa.
  perMessageDeflate: false,
  pingInterval: 10000,
  pingTimeout: 8000
});

app.disable('x-powered-by');
app.use(express.static(__dirname));

app.get('/health', (_req, res) => {
  res.json({ ok: true, mode: 'online-render', rooms: rooms.size, uptime: process.uptime() });
});

const rooms = new Map();
const MAX_PLAYERS_PER_ROOM = 5;
const PLAYER_COLORS = ['#73ff9f', '#69a7ff', '#ff7ad9', '#ffd166', '#b98cff'];

function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return rooms.has(code) ? makeRoomCode() : code;
}

function getRoomColor(room, socketId) {
  const used = new Set([...room.players.values()].map(player => player.color));
  const preferred = PLAYER_COLORS[[...room.players.keys()].indexOf(socketId) % PLAYER_COLORS.length];
  if (preferred && !used.has(preferred)) return preferred;
  return PLAYER_COLORS.find(color => !used.has(color)) || PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
}

function getRoomSettings(roomId) {
  const room = rooms.get(roomId);
  return { speed: room?.speed || 1 };
}

function getRoomPlayers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return [...room.players.values()].map(player => ({
    id: player.id,
    name: player.name,
    host: player.id === room.hostId,
    x: player.x,
    y: player.y,
    hp: player.hp,
    maxHp: player.maxHp,
    isMoving: player.isMoving,
    lastMoveX: player.lastMoveX,
    lastMoveY: player.lastMoveY,
    wave: player.wave,
    score: player.score,
    damage: player.damage,
    fireDelay: player.fireDelay,
    attackSpeedActive: player.attackSpeedActive,
    doubleShotActive: player.doubleShotActive,
    lifeStealActive: player.lifeStealActive,
    critChance: player.critChance || 0,
    critMultiplier: player.critMultiplier || 1.8,
    shieldCharges: player.shieldCharges || 0,
    aimX: player.aimX,
    aimY: player.aimY,
    firing: player.firing,
    color: player.color,
    coins: player.coins || 0,
    towerSlots: player.towerSlots || 12,
    alive: player.alive !== false,
    spectating: Boolean(player.spectating),
    pageVisible: player.pageVisible !== false,
    lastDeathCause: player.lastDeathCause || '',
    diedAtWave: player.diedAtWave || player.wave || 1
  }));
}

function emitRoomUpdate(roomId) {
  io.to(roomId).emit('roomUpdate', { roomId, hostId: rooms.get(roomId)?.hostId || '', settings: getRoomSettings(roomId), players: getRoomPlayers(roomId) });
}

function emitSnapshot(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const players = {};
  for (const player of room.players.values()) {
    players[player.id] = { ...player };
  }
  io.to(roomId).volatile.emit('snapshot', { roomId, hostId: room.hostId, settings: getRoomSettings(roomId), players, serverTime: Date.now() });
}

function cleanEmptyRoom(roomId) {
  const room = rooms.get(roomId);
  if (room && room.players.size === 0) rooms.delete(roomId);
}

io.on('connection', socket => {
  socket.data.roomId = '';
  socket.data.name = 'Jugador';

  socket.on('createRoom', ({ name, speed } = {}) => {
    leaveCurrentRoom(socket);
    const roomId = makeRoomCode();
    const safeName = String(name || 'Jugador').slice(0, 18);
    const roomSpeed = clampNumber(speed, 1, 4, 1);
    const room = {
      id: roomId,
      hostId: socket.id,
      speed: roomSpeed,
      players: new Map()
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = safeName;
    room.players.set(socket.id, makePlayer(socket.id, safeName, getRoomColor(room, socket.id)));
    socket.emit('roomJoined', { roomId, hostId: room.hostId, settings: getRoomSettings(roomId), players: getRoomPlayers(roomId) });
    emitRoomUpdate(roomId);
  });

  socket.on('joinRoom', ({ roomId, name } = {}) => {
    const code = String(roomId || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      socket.emit('serverMessage', 'No existe esa sala. Revisá el código o pedile al host que cree una nueva.');
      return;
    }
    if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
      socket.emit('serverMessage', 'La sala está llena. Por ahora el límite es de 5 jugadores.');
      return;
    }

    leaveCurrentRoom(socket);
    const safeName = String(name || 'Jugador').slice(0, 18);
    socket.join(code);
    socket.data.roomId = code;
    socket.data.name = safeName;
    room.players.set(socket.id, makePlayer(socket.id, safeName, getRoomColor(room, socket.id)));
    socket.emit('roomJoined', { roomId: code, hostId: room.hostId, settings: getRoomSettings(code), players: getRoomPlayers(code) });
    emitRoomUpdate(code);
  });

  socket.on('leaveRoom', () => leaveCurrentRoom(socket));

  socket.on('playerState', state => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || !room.players.has(socket.id)) return;
    const player = room.players.get(socket.id);
    player.name = String(state?.name || socket.data.name || 'Jugador').slice(0, 18);
    player.x = clampNumber(state?.x, 0, 3400, player.x);
    player.y = clampNumber(state?.y, 0, 2300, player.y);
    player.hp = clampNumber(state?.hp, 0, 999999, player.hp);
    player.maxHp = clampNumber(state?.maxHp, 1, 999999, player.maxHp);
    player.isMoving = Boolean(state?.isMoving);
    player.lastMoveX = clampNumber(state?.lastMoveX, -1, 1, player.lastMoveX);
    player.lastMoveY = clampNumber(state?.lastMoveY, -1, 1, player.lastMoveY);
    player.aimX = clampNumber(state?.aimX, 0, 3400, player.aimX || player.x);
    player.aimY = clampNumber(state?.aimY, 0, 2300, player.aimY || player.y);
    player.firing = Boolean(state?.firing);
    player.damage = clampNumber(state?.damage, 1, 999999, player.damage || 1);
    player.fireDelay = clampNumber(state?.fireDelay, 100, 5000, player.fireDelay || 550);
    player.attackSpeedActive = Boolean(state?.attackSpeedActive);
    player.doubleShotActive = Boolean(state?.doubleShotActive);
    player.lifeStealActive = Boolean(state?.lifeStealActive);
    player.critChance = clampNumber(state?.critChance, 0, 0.85, player.critChance || 0);
    player.critMultiplier = clampNumber(state?.critMultiplier, 1, 10, player.critMultiplier || 1.8);
    player.shieldCharges = clampNumber(state?.shieldCharges, 0, 99, player.shieldCharges || 0);
    player.wave = clampNumber(state?.wave, 1, 999999, player.wave);
    player.score = clampNumber(state?.score, 0, 999999999, player.score);
    player.coins = clampNumber(state?.coins, 0, 999999999, player.coins || 0);
    player.towerSlots = clampNumber(state?.towerSlots, 1, 99, player.towerSlots || 12);
    player.spectating = Boolean(state?.spectating);
    player.pageVisible = state?.pageVisible !== false;
    player.alive = state?.alive !== false && player.hp > 0 && !player.spectating;
    player.lastDeathCause = String(state?.lastDeathCause || player.lastDeathCause || '').slice(0, 80);
    player.diedAtWave = clampNumber(state?.diedAtWave, 1, 999999, player.diedAtWave || player.wave || 1);
    player.updatedAt = Date.now();
    maybeElectRoomHost(roomId);
  });

  socket.on('hostGameState', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    socket.to(roomId).volatile.emit('hostGameState', { roomId, state: payload?.state || null });
  });

  socket.on('abilityUse', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || socket.id === room.hostId) return;
    io.to(room.hostId).emit('remoteAbilityUse', {
      roomId,
      playerId: socket.id,
      abilityId: String(payload?.abilityId || ''),
      x: clampNumber(payload?.x, 0, 3400, 1700),
      y: clampNumber(payload?.y, 0, 2300, 1150),
      aimX: clampNumber(payload?.aimX, 0, 3400, 1700),
      aimY: clampNumber(payload?.aimY, 0, 2300, 1150),
      damage: clampNumber(payload?.damage, 1, 999999, 1)
    });
  });

  socket.on('buildTowerRequest', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || socket.id === room.hostId) return;
    io.to(room.hostId).emit('remoteBuildTowerRequest', {
      roomId,
      playerId: socket.id,
      defKey: String(payload?.defKey || ''),
      price: clampNumber(payload?.price, 0, 999999999, 0),
      x: clampNumber(payload?.x, 0, 3400, 1700),
      y: clampNumber(payload?.y, 0, 2300, 1150),
      rotation: clampNumber(payload?.rotation, 0, Math.PI * 2, 0)
    });
  });



  socket.on('playerReward', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    const targetId = String(payload?.targetId || '');
    if (!room.players.has(targetId)) return;
    io.to(targetId).emit('playerReward', {
      roomId,
      gold: clampNumber(payload?.gold, 0, 999999999, 0),
      score: clampNumber(payload?.score, 0, 999999999, 0),
      reason: String(payload?.reason || 'kill').slice(0, 30),
      x: clampNumber(payload?.x, 0, 3400, 1700),
      y: clampNumber(payload?.y, 0, 2300, 1150)
    });
  });

  socket.on('buildResult', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    const targetId = String(payload?.targetId || '');
    if (!room.players.has(targetId)) return;
    io.to(targetId).emit('buildResult', {
      roomId,
      ok: Boolean(payload?.ok),
      refund: clampNumber(payload?.refund, 0, 999999999, 0),
      message: String(payload?.message || '').slice(0, 90)
    });
  });





  socket.on('buildTrapRequest', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || socket.id === room.hostId) return;
    io.to(room.hostId).emit('remoteBuildTrapRequest', {
      roomId,
      playerId: socket.id,
      typeKey: String(payload?.typeKey || ''),
      price: clampNumber(payload?.price, 0, 999999999, 0),
      x: clampNumber(payload?.x, 0, 3400, 1700),
      y: clampNumber(payload?.y, 0, 2300, 1150)
    });
  });

  socket.on('buildMineRequest', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || socket.id === room.hostId) return;
    io.to(room.hostId).emit('remoteBuildMineRequest', {
      roomId,
      playerId: socket.id,
      price: clampNumber(payload?.price, 0, 999999999, 0),
      x: clampNumber(payload?.x, 0, 3400, 1700),
      y: clampNumber(payload?.y, 0, 2300, 1150)
    });
  });

  socket.on('buildBarricadeRequest', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || socket.id === room.hostId) return;
    io.to(room.hostId).emit('remoteBuildBarricadeRequest', {
      roomId,
      playerId: socket.id,
      kind: String(payload?.kind || 'standard'),
      price: clampNumber(payload?.price, 0, 999999999, 0),
      x: clampNumber(payload?.x, 0, 3400, 1700),
      y: clampNumber(payload?.y, 0, 2300, 1150),
      orientation: payload?.orientation === 'vertical' ? 'vertical' : 'horizontal'
    });
  });


  socket.on('chatMessage', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || !room.players.has(socket.id)) return;
    const player = room.players.get(socket.id);
    const text = String(payload?.text || '').trim().slice(0, 240);
    if (!text) return;
    io.to(roomId).emit('chatMessage', {
      roomId,
      type: 'message',
      playerId: socket.id,
      name: player.name,
      color: player.color,
      text
    });
  });

  socket.on('chatCommand', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || !room.players.has(socket.id)) return;
    const player = room.players.get(socket.id);
    const command = String(payload?.command || '').trim().toLowerCase().slice(0, 40);
    const allowed = new Set(['greedisgood', 'canttouchme', 'beginner']);
    if (!allowed.has(command)) return;
    io.to(roomId).emit('chatMessage', {
      roomId,
      type: 'command',
      playerId: socket.id,
      name: player.name,
      color: player.color,
      command
    });
  });


  socket.on('titanRewardOffer', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    io.to(roomId).emit('titanRewardOffer', {
      roomId,
      rewardWave: clampNumber(payload?.rewardWave, 1, 999999, 1),
      x: clampNumber(payload?.x, 0, 3400, 1700),
      y: clampNumber(payload?.y, 0, 2300, 1150)
    });
  });

  socket.on('structureActionRequest', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || socket.id === room.hostId) return;
    const ids = Array.isArray(payload?.ids) ? payload.ids.map(id => String(id)).slice(0, 40) : [];
    io.to(room.hostId).emit('remoteStructureActionRequest', {
      roomId,
      playerId: socket.id,
      type: payload?.type === 'barricade' ? 'barricade' : 'tower',
      action: String(payload?.action || '').slice(0, 20),
      ids,
      x: clampNumber(payload?.x, 0, 3400, 1700),
      y: clampNumber(payload?.y, 0, 2300, 1150),
      rotation: clampNumber(payload?.rotation, 0, Math.PI * 2, 0)
    });
  });

  socket.on('structureActionResult', payload => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    const targetId = String(payload?.targetId || '');
    if (!room.players.has(targetId)) return;
    io.to(targetId).emit('structureActionResult', {
      roomId,
      ok: Boolean(payload?.ok),
      action: String(payload?.action || '').slice(0, 20),
      expense: clampNumber(payload?.expense, 0, 999999999, 0),
      refund: clampNumber(payload?.refund, 0, 999999999, 0),
      message: String(payload?.message || '').slice(0, 90)
    });
  });


  socket.on('disconnect', () => leaveCurrentRoom(socket));
});

function makePlayer(id, name, color = '#73ff9f') {
  return {
    id,
    name,
    color,
    coins: 0,
    towerSlots: 12,
    x: 1700 + Math.random() * 80 - 40,
    y: 1150 + Math.random() * 80 - 40,
    hp: 20,
    maxHp: 20,
    isMoving: false,
    lastMoveX: 1,
    lastMoveY: 0,
    aimX: 1700,
    aimY: 1150,
    firing: false,
    damage: 1,
    fireDelay: 550,
    attackSpeedActive: false,
    doubleShotActive: false,
    lifeStealActive: false,
    critChance: 0,
    critMultiplier: 1.8,
    shieldCharges: 0,
    wave: 1,
    score: 0,
    alive: true,
    spectating: false,
    pageVisible: true,
    lastDeathCause: '',
    diedAtWave: 1,
    updatedAt: Date.now()
  };
}


function maybeElectRoomHost(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const current = room.players.get(room.hostId);
  const now = Date.now();
  const currentOk = current && current.alive !== false && !current.spectating && current.pageVisible !== false && now - (current.updatedAt || 0) < 9000;
  if (currentOk) return;

  const candidates = [...room.players.values()]
    .filter(p => p && p.alive !== false && !p.spectating && p.pageVisible !== false && now - (p.updatedAt || 0) < 12000)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const fallback = [...room.players.values()]
    .filter(p => p && p.alive !== false && !p.spectating)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const next = candidates[0] || fallback[0] || room.players.values().next().value;
  const nextId = next?.id || '';
  if (nextId && nextId !== room.hostId) {
    room.hostId = nextId;
    io.to(roomId).emit('chatMessage', {
      roomId,
      type: 'message',
      playerId: 'server',
      name: 'Sistema',
      color: '#ffd166',
      text: `La simulación pasó a ${next.name || 'otro jugador'} para que la run no se frene.`
    });
    emitRoomUpdate(roomId);
  } else if (!nextId) {
    room.hostId = '';
  }
}

function leaveCurrentRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (room) {
    room.players.delete(socket.id);
    socket.leave(roomId);
    if (room.hostId === socket.id) {
      room.hostId = '';
    }
    maybeElectRoomHost(roomId);
    emitRoomUpdate(roomId);
    cleanEmptyRoom(roomId);
  }
  socket.data.roomId = '';
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

setInterval(() => {
  for (const roomId of rooms.keys()) {
    maybeElectRoomHost(roomId);
    emitSnapshot(roomId);
  }
}, 1000 / 15);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ardent Tower Defense ONLINE server activo`);
  console.log(`Puerto: ${PORT}`);
  if (!IS_RENDER) console.log(`Local:  http://localhost:${PORT}`);
  if (IS_RENDER) console.log('Render: usá la URL .onrender.com asignada a este Web Service');
});
