const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 3000;
const IS_RENDER = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  perMessageDeflate: false,
  pingInterval: 10000,
  pingTimeout: 8000
});

app.disable('x-powered-by');
app.use(express.static(__dirname));

const WORLD_WIDTH = 3400;
const WORLD_HEIGHT = 2300;
const BASE_RADIUS = 34;
const PLAYER_RADIUS = 22;
const TOWER_RADIUS = 26;
const BUILD_GRID_SIZE = 25;
const MAX_PLAYERS_PER_ROOM = 5;
const PLAYER_COLORS = ['#73ff9f', '#69a7ff', '#ff7ad9', '#ffd166', '#b98cff'];
const MAX_WAVE_SPAWN_DURATION = 58000;
const MIN_WAVE_SPAWN_INTERVAL = 85;
const MAX_LATE_WAVE_ENEMIES = 430;
const MAX_BOSS_WAVE_ENEMIES = 300;
const ENEMY_SURVIVAL_SPEED_MULTIPLIER = 0.72;
const SNAPSHOT_HZ = 20;
const TICK_MS = 1000 / SNAPSHOT_HZ;

const towerDefinitions = [
  { key: 'tower1', name: 'Básica', type: 'basic', cost: 70, damage: 0.75, range: 230, fireDelay: 900, color: 'cyan', label: 'B' },
  { key: 'tower2', name: 'Rápida', type: 'rapid', cost: 40, damage: 0.30, range: 205, fireDelay: 315, color: '#b9ff7a', label: 'R', maxHp: 22 },
  { key: 'tower3', name: 'Perforante', type: 'pierce', cost: 160, damage: 2.2, range: 250, fireDelay: 1200, color: '#ffdf6b', label: 'P' },
  { key: 'tower4', name: 'Hielo', type: 'slow', cost: 220, damage: 0, range: 260, fireDelay: 2600, color: '#9be7ff', label: 'H', slowAmount: 0.45, slowDuration: 1600, areaRadius: 58 },
  { key: 'tower5', name: 'Doble', type: 'double', cost: 260, damage: 0.65, range: 235, fireDelay: 1050, color: '#ff8bd1', label: 'D' },
  { key: 'tower6', name: 'Veneno', type: 'poison', cost: 310, damage: 2.45, range: 248, fireDelay: 2850, color: '#8cff4a', label: 'V', areaRadius: 58 },
  { key: 'tower7', name: 'Ballesta', type: 'ballista', cost: 360, damage: 9.5, range: 320, fireDelay: 2850, color: '#c58b4b', label: 'X' },
  { key: 'tower8', name: 'Sanguijuela', type: 'siphon', cost: 420, damage: 0.55, range: 245, fireDelay: 850, color: '#b81444', label: 'S' },
  { key: 'tower9', name: 'Buffer', type: 'buffer', cost: 620, damage: 0, range: 180, fireDelay: 999999, color: '#b78cff', label: '+' },
  { key: 'tower10', name: 'Lucky Block', type: 'lucky', cost: 240, damage: 0, range: 0, fireDelay: 999999, color: '#ffe28a', label: '?' },
  { key: 'tower11', name: 'Cuchilla', type: 'blade', cost: 90, damage: 0.55, range: 62, fireDelay: 620, color: '#d9d9d9', label: 'C', maxHp: 60 },
  { key: 'tower12', name: 'Lancera', type: 'spear', cost: 135, damage: 1.05, range: 310, fireDelay: 1650, color: '#d7b06a', label: 'L', maxHp: 44 },
  { key: 'tower13', name: 'Láser', type: 'laser', cost: 1450, damage: 14, range: 360, fireDelay: 120, color: '#ff4fd8', label: '⚡', maxHp: 52 }
];
const towerByKey = new Map(towerDefinitions.map(t => [t.key, t]));

const enemyTypes = [
  { name: 'Bicho Verde', color: 'limegreen', hp: 1, speed: 0.82, reward: 3, score: 5, damageToDefense: 1, attackDelay: 900 },
  { name: 'Bicho Azul', color: 'dodgerblue', hp: 3, speed: 0.68, reward: 5, score: 9, damageToDefense: 1, attackDelay: 1000 },
  { name: 'Bicho Rojo', color: 'crimson', hp: 2, speed: 1.15, reward: 6, score: 11, damageToDefense: 1, attackDelay: 850 },
  { name: 'Bicho Amarillo', color: 'gold', hp: 5, speed: 0.58, reward: 9, score: 17, damageToDefense: 2, attackDelay: 1050 },
  { name: 'Bicho Violeta', color: 'violet', hp: 8, speed: 0.45, reward: 13, score: 25, damageToDefense: 3, attackDelay: 1200 }
];
const specialEnemyTypes = [
  { name: 'Clérigo Verde', color: '#73ff9f', hp: 12, speed: 0.50, reward: 18, score: 30, damageToDefense: 1, attackDelay: 1200, special: 'healer', unlockWave: 8 },
  { name: 'Kamikaze Carmesí', color: '#ff4747', hp: 3, speed: 1.45, reward: 10, score: 24, damageToDefense: 4, attackDelay: 700, special: 'exploder', unlockWave: 11 },
  { name: 'Parpadeante', color: '#d58cff', hp: 6, speed: 0.76, reward: 16, score: 34, damageToDefense: 2, attackDelay: 950, special: 'teleporter', unlockWave: 14 },
  { name: 'Hechicero Blanco', color: '#ece6ff', hp: 15, speed: 0.42, reward: 22, score: 40, damageToDefense: 1, attackDelay: 1300, special: 'summoner', unlockWave: 18 }
];
const bossTypes = [
  { name: 'Boss Carmesí', color: '#ff4747', hp: 65, speed: 0.45, reward: 90, score: 180, damageToDefense: 6, attackDelay: 1350 },
  { name: 'Boss Violeta', color: '#d58cff', hp: 86, speed: 0.39, reward: 120, score: 240, damageToDefense: 7, attackDelay: 1500 },
  { name: 'Boss Verde', color: '#73ff9f', hp: 110, speed: 0.35, reward: 150, score: 300, damageToDefense: 8, attackDelay: 1600 }
];

const rooms = new Map();

app.get('/health', (_req, res) => {
  res.json({ ok: true, mode: 'server-authoritative-render', rooms: rooms.size, uptime: process.uptime() });
});

function createWorld(speed = 1) {
  return {
    serverAuthoritative: true,
    wave: 1,
    gameTime: 0,
    gameSpeed: clampNumber(speed, 1, 4, 1),
    gameRunning: false,
    waveInProgress: false,
    buildPhaseActive: false,
    enemiesToSpawn: 0,
    enemiesSpawned: 0,
    spawnInterval: 900,
    lastSpawnTime: -900,
    baseCore: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, radius: BASE_RADIUS, hp: 250, maxHp: 250, active: true },
    barricades: [],
    towers: [],
    enemies: [],
    projectiles: [],
    bossProjectiles: [],
    slowZones: [],
    poisonZones: [],
    fireZones: [],
    traps: [],
    mines: [],
    titanShards: [],
    effects: [],
    nextEnemyId: 1,
    nextProjectileId: 1,
    nextTowerId: 1,
    lastTickAt: Date.now(),
    ended: false
  };
}

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
  return { speed: room?.speed || 1, serverAuthoritative: true };
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
    wave: room.world.wave,
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
    diedAtWave: player.diedAtWave || room.world.wave || 1
  }));
}

function emitRoomUpdate(roomId) {
  io.to(roomId).emit('roomUpdate', { roomId, hostId: rooms.get(roomId)?.hostId || '', settings: getRoomSettings(roomId), players: getRoomPlayers(roomId) });
}

function emitSnapshot(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const players = {};
  for (const player of room.players.values()) players[player.id] = { ...player, wave: room.world.wave };
  const world = buildWorldSnapshot(room);

  // En la versión server-authoritative el snapshot del mundo viaja junto al
  // snapshot normal. Antes iba solo por `hostGameState`; si ese paquete se
  // perdía o el cliente no lo aplicaba a tiempo, el server podía hacer daño
  // con enemigos que el navegador todavía no estaba dibujando.
  io.to(roomId).volatile.emit('snapshot', {
    roomId,
    hostId: room.hostId,
    settings: getRoomSettings(roomId),
    players,
    world,
    serverTime: Date.now()
  });

  // Compatibilidad con clientes que todavía escuchan el nombre anterior.
  io.to(roomId).volatile.emit('hostGameState', { roomId, state: world });
  io.to(roomId).volatile.emit('serverWorldState', { roomId, state: world });
}

function buildWorldSnapshot(room) {
  const w = room.world;
  return {
    serverAuthoritative: true,
    wave: w.wave,
    gameTime: Math.round(w.gameTime),
    gameSpeed: w.gameSpeed,
    gameRunning: w.gameRunning,
    waveInProgress: w.waveInProgress,
    buildPhaseActive: w.buildPhaseActive,
    enemiesToSpawn: w.enemiesToSpawn,
    enemiesSpawned: w.enemiesSpawned,
    spawnInterval: w.spawnInterval,
    lastSpawnTime: w.lastSpawnTime,
    baseCore: w.baseCore,
    barricades: w.barricades,
    towers: w.towers,
    enemies: w.enemies,
    projectiles: w.projectiles,
    bossProjectiles: w.bossProjectiles,
    slowZones: w.slowZones,
    poisonZones: w.poisonZones,
    fireZones: w.fireZones,
    traps: w.traps,
    mines: w.mines,
    titanShards: w.titanShards,
    effects: w.effects,
    sentAt: Date.now()
  };
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
    const room = { id: roomId, hostId: socket.id, speed: roomSpeed, players: new Map(), world: createWorld(roomSpeed) };
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
    if (!room) return socket.emit('serverMessage', 'No existe esa sala. Revisá el código o pedile al host que cree una nueva.');
    if (room.players.size >= MAX_PLAYERS_PER_ROOM) return socket.emit('serverMessage', 'La sala está llena. Por ahora el límite es de 5 jugadores.');
    leaveCurrentRoom(socket);
    const safeName = String(name || 'Jugador').slice(0, 18);
    socket.join(code);
    socket.data.roomId = code;
    socket.data.name = safeName;
    room.players.set(socket.id, makePlayer(socket.id, safeName, getRoomColor(room, socket.id)));
    socket.emit('roomJoined', { roomId: code, hostId: room.hostId, settings: getRoomSettings(code), players: getRoomPlayers(code) });
    emitRoomUpdate(code);
    emitSnapshot(code);
  });

  socket.on('leaveRoom', () => leaveCurrentRoom(socket));
  socket.on('clientReady', () => ensureWaveStarted(getSocketRoom(socket)));
  socket.on('startServerRun', () => ensureWaveStarted(getSocketRoom(socket)));
  socket.on('startServerWave', payload => {
    const room = getSocketRoom(socket);
    if (!room) return;
    const requested = clampNumber(payload?.wave, 1, 999999, room.world.wave);
    if (!room.world.waveInProgress) startWave(room, Math.max(room.world.wave, requested));
  });

  socket.on('playerState', state => {
    const room = getSocketRoom(socket);
    if (!room || !room.players.has(socket.id)) return;
    const player = room.players.get(socket.id);
    player.name = String(state?.name || socket.data.name || 'Jugador').slice(0, 18);
    player.x = clampNumber(state?.x, 0, WORLD_WIDTH, player.x);
    player.y = clampNumber(state?.y, 0, WORLD_HEIGHT, player.y);
    // El server es dueño del HP. Solo acepta maxHp/mejoras/estado de input.
    player.maxHp = clampNumber(state?.maxHp, 1, 999999, player.maxHp);
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    player.isMoving = Boolean(state?.isMoving);
    player.lastMoveX = clampNumber(state?.lastMoveX, -1, 1, player.lastMoveX);
    player.lastMoveY = clampNumber(state?.lastMoveY, -1, 1, player.lastMoveY);
    player.aimX = clampNumber(state?.aimX, 0, WORLD_WIDTH, player.aimX || player.x);
    player.aimY = clampNumber(state?.aimY, 0, WORLD_HEIGHT, player.aimY || player.y);
    player.firing = Boolean(state?.firing);
    player.damage = clampNumber(state?.damage, 1, 999999, player.damage || 1);
    player.fireDelay = clampNumber(state?.fireDelay, 100, 5000, player.fireDelay || 550);
    player.attackSpeedActive = Boolean(state?.attackSpeedActive);
    player.doubleShotActive = Boolean(state?.doubleShotActive);
    player.lifeStealActive = Boolean(state?.lifeStealActive);
    player.critChance = clampNumber(state?.critChance, 0, 0.85, player.critChance || 0);
    player.critMultiplier = clampNumber(state?.critMultiplier, 1, 10, player.critMultiplier || 1.8);
    player.shieldCharges = clampNumber(state?.shieldCharges, 0, 99, player.shieldCharges || 0);
    player.score = clampNumber(state?.score, 0, 999999999, player.score);
    player.coins = clampNumber(state?.coins, 0, 999999999, player.coins || 0);
    player.towerSlots = clampNumber(state?.towerSlots, 1, 99, player.towerSlots || 12);
    player.spectating = Boolean(state?.spectating);
    player.pageVisible = state?.pageVisible !== false;
    player.alive = !player.spectating && player.hp > 0;
    player.lastDeathCause = String(player.lastDeathCause || '').slice(0, 80);
    player.diedAtWave = player.diedAtWave || room.world.wave || 1;
    player.updatedAt = Date.now();
    ensureWaveStarted(room);
  });

  socket.on('hostGameState', () => { /* Ignorado: Render es la autoridad. */ });

  socket.on('abilityUse', payload => {
    const room = getSocketRoom(socket);
    const p = getRoomPlayer(room, socket.id);
    if (!room || !p || p.alive === false) return;
    applyAbility(room, p, String(payload?.abilityId || ''), clampNumber(payload?.aimX, 0, WORLD_WIDTH, p.aimX), clampNumber(payload?.aimY, 0, WORLD_HEIGHT, p.aimY));
  });

  socket.on('buildTowerRequest', payload => buildTowerForPlayer(socket, payload));
  socket.on('buildTrapRequest', payload => buildTrapForPlayer(socket, payload));
  socket.on('buildMineRequest', payload => buildMineForPlayer(socket, payload));
  socket.on('buildBarricadeRequest', payload => buildBarricadeForPlayer(socket, payload));

  socket.on('remotePlayerDamage', () => { /* Ignorado: solo el server daña jugadores. */ });
  socket.on('playerReward', () => { /* Ignorado: solo el server entrega recompensas. */ });
  socket.on('buildResult', () => { /* Ignorado: solo el server responde construcciones. */ });
  socket.on('titanRewardOffer', () => {});
  socket.on('structureActionRequest', () => {});
  socket.on('structureActionResult', () => {});

  socket.on('chatMessage', payload => {
    const room = getSocketRoom(socket);
    if (!room || !room.players.has(socket.id)) return;
    const player = room.players.get(socket.id);
    const text = String(payload?.text || '').trim().slice(0, 240);
    if (!text) return;
    io.to(room.id).emit('chatMessage', { roomId: room.id, type: 'message', playerId: socket.id, name: player.name, color: player.color, text });
  });

  socket.on('chatCommand', payload => {
    const room = getSocketRoom(socket);
    if (!room || !room.players.has(socket.id)) return;
    const player = room.players.get(socket.id);
    const command = String(payload?.command || '').trim().toLowerCase().slice(0, 40);
    if (!new Set(['greedisgood', 'canttouchme', 'beginner']).has(command)) return;
    if (command === 'greedisgood') {
      rewardPlayer(room, player.id, 1000, 0, 'command', player.x, player.y);
    }
    io.to(room.id).emit('chatMessage', { roomId: room.id, type: 'command', playerId: socket.id, name: player.name, color: player.color, command });
  });

  socket.on('disconnect', () => leaveCurrentRoom(socket));
});

function getSocketRoom(socket) { return rooms.get(socket?.data?.roomId || ''); }
function getRoomPlayer(room, id) { return room?.players?.get(id) || null; }

function makePlayer(id, name, color = '#73ff9f') {
  return {
    id, name, color, coins: 140, towerSlots: 12,
    x: 1700 + Math.random() * 80 - 40, y: 1150 + Math.random() * 80 - 40,
    hp: 20, maxHp: 20, isMoving: false, lastMoveX: 1, lastMoveY: 0,
    aimX: 1700, aimY: 1150, firing: false,
    damage: 1, fireDelay: 550, lastShotAt: 0,
    attackSpeedActive: false, doubleShotActive: false, lifeStealActive: false,
    critChance: 0, critMultiplier: 1.8, shieldCharges: 0,
    score: 0, alive: true, spectating: false, pageVisible: true,
    lastDeathCause: '', diedAtWave: 1, updatedAt: Date.now()
  };
}

function ensureWaveStarted(room) {
  if (!room || room.world.waveInProgress || room.world.ended) return;
  startWave(room, room.world.wave || 1);
}

function startWave(room, waveNumber) {
  const w = room.world;
  w.wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  w.gameRunning = true;
  w.waveInProgress = true;
  w.buildPhaseActive = false;
  w.enemies = [];
  w.projectiles = [];
  w.bossProjectiles = [];
  w.slowZones = [];
  w.poisonZones = [];
  w.fireZones = [];
  w.effects = [];
  w.enemiesToSpawn = getEnemiesAmountForWave(w.wave);
  w.enemiesSpawned = 0;
  w.spawnInterval = getSpawnIntervalForWave(w.wave, w.enemiesToSpawn);
  w.lastSpawnTime = w.gameTime - w.spawnInterval;
  w.ended = false;
  w.lastTickAt = Date.now();
  io.to(room.id).emit('chatMessage', { roomId: room.id, type: 'message', playerId: 'server', name: 'Sistema', color: '#ffd166', text: `Oleada ${w.wave} iniciada en Render.` });
  emitRoomUpdate(room.id);
}

function completeWave(room) {
  const w = room.world;
  if (!w.waveInProgress) return;
  w.waveInProgress = false;
  w.gameRunning = false;
  w.projectiles = [];
  const bonus = Math.floor(12 + w.wave * 3);
  for (const p of room.players.values()) {
    if (p.alive !== false && !p.spectating) rewardPlayer(room, p.id, bonus, getWaveScoreBonus(w.wave), 'wave', p.x, p.y);
  }
  w.wave += 1;
  setTimeout(() => {
    if (rooms.get(room.id) === room && !room.world.waveInProgress && !room.world.ended) startWave(room, room.world.wave);
  }, 1800);
}

function getEnemiesAmountForWave(wave) {
  const earlyCount = 12 + wave * 4;
  if (wave <= 35) return wave % 10 === 0 ? Math.max(18, Math.floor(earlyCount * 0.75)) : earlyCount;
  const lateCount = Math.floor(150 + Math.log10(wave + 1) * 42 + Math.pow(wave - 35, 0.36) * 18);
  const capped = Math.min(MAX_LATE_WAVE_ENEMIES, lateCount);
  if (wave % 10 === 0) return Math.min(MAX_BOSS_WAVE_ENEMIES, Math.max(65, Math.floor(capped * 0.72)));
  return capped;
}
function getSpawnIntervalForWave(wave, amount) {
  const naturalInterval = Math.max(MIN_WAVE_SPAWN_INTERVAL, 900 - wave * 16);
  const maxDurationInterval = Math.max(MIN_WAVE_SPAWN_INTERVAL, Math.floor(MAX_WAVE_SPAWN_DURATION / Math.max(1, amount)));
  return Math.min(naturalInterval, maxDurationInterval);
}
function getWaveScoreBonus(wave) { return wave < 40 ? wave : Math.floor(40 + Math.pow(wave - 39, 0.78) * 4); }
function getEnemyHpScaling(wave) { return wave <= 45 ? 1 + wave * 0.13 : 1 + 45 * 0.13 + Math.pow(wave - 45, 0.78) * 0.34; }
function getEnemySpeedScaling(wave) { return wave <= 60 ? wave * 0.012 : 60 * 0.012 + Math.min(1.15, Math.log10(wave - 50) * 0.16); }
function getEnemyRewardForWave(wave, baseReward) { return wave < 40 ? baseReward + Math.floor(wave * 0.52) : baseReward + Math.floor(21 + Math.pow(wave - 39, 0.74) * 1.08); }

function spawnEnemy(room) {
  const w = room.world;
  let type;
  if (w.wave % 10 === 0 && w.enemiesSpawned === w.enemiesToSpawn - 1) {
    type = bossTypes[Math.floor((w.wave / 10 - 1) % bossTypes.length)];
  } else {
    const unlocked = w.wave < 5 ? 1 : w.wave < 10 ? 2 : w.wave < 20 ? 3 : w.wave < 25 ? 4 : 5;
    const pool = enemyTypes.slice(0, unlocked);
    const specials = specialEnemyTypes.filter(t => w.wave >= t.unlockWave);
    type = specials.length && Math.random() < Math.min(0.5, 0.11 + w.wave * 0.006) ? specials[Math.floor(Math.random() * specials.length)] : pool[Math.floor(Math.random() * pool.length)];
  }
  const boss = w.wave % 10 === 0 && w.enemiesSpawned === w.enemiesToSpawn - 1;
  const spawn = boss ? { x: WORLD_WIDTH / 2 + (Math.random() - 0.5) * 60, y: WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 60 } : getRandomSpawnPoint();
  const hpScaling = boss ? (1 + w.wave * 0.28) : getEnemyHpScaling(w.wave);
  const speedScaling = boss ? (w.wave * 0.0045) : getEnemySpeedScaling(w.wave);
  const maxHp = Math.max(1, Math.ceil(type.hp * hpScaling));
  w.enemies.push({
    id: w.nextEnemyId++, x: spawn.x, y: spawn.y, radius: boss ? 42 : 18,
    color: type.color, hp: maxHp, maxHp,
    baseSpeed: (type.speed + speedScaling) * ENEMY_SURVIVAL_SPEED_MULTIPLIER,
    speed: (type.speed + speedScaling) * ENEMY_SURVIVAL_SPEED_MULTIPLIER,
    reward: boss ? (type.reward + w.wave * 8) : getEnemyRewardForWave(w.wave, type.reward),
    scoreValue: type.score + (boss ? getWaveScoreBonus(w.wave) * 10 : getWaveScoreBonus(w.wave)),
    damageToDefense: type.damageToDefense, attackDelay: type.attackDelay, lastAttackTime: 0,
    isBoss: boss, name: type.name, special: type.special || null, target: null, hitFlash: 0
  });
  w.enemiesSpawned += 1;
}

function getRandomSpawnPoint() {
  const side = Math.floor(Math.random() * 4);
  const margin = 55;
  if (side === 0) return { x: Math.random() * WORLD_WIDTH, y: -margin };
  if (side === 1) return { x: WORLD_WIDTH + margin, y: Math.random() * WORLD_HEIGHT };
  if (side === 2) return { x: Math.random() * WORLD_WIDTH, y: WORLD_HEIGHT + margin };
  return { x: -margin, y: Math.random() * WORLD_HEIGHT };
}

function updateRoom(room, dtMs) {
  const w = room.world;
  const alivePlayers = [...room.players.values()].filter(p => p.alive !== false && !p.spectating && p.hp > 0);
  if (!alivePlayers.length) return;
  if (!w.waveInProgress || !w.gameRunning || w.ended) return;
  const speed = clampNumber(room.speed, 1, 4, 1);
  w.gameSpeed = speed;
  w.gameTime += dtMs * speed;
  while (w.enemiesSpawned < w.enemiesToSpawn && w.gameTime - w.lastSpawnTime >= w.spawnInterval) {
    spawnEnemy(room);
    w.lastSpawnTime += w.spawnInterval;
  }
  updatePlayerShots(room, dtMs);
  updateTowers(room, dtMs);
  updateProjectiles(room, dtMs);
  updateEnemies(room, dtMs);
  w.effects.forEach(e => e.life = (Number(e.life) || 20) - dtMs / 16.666);
  w.effects = w.effects.filter(e => e.life > 0).slice(-120);
  if (w.enemiesSpawned >= w.enemiesToSpawn && w.enemies.length === 0) completeWave(room);
}

function updatePlayerShots(room) {
  const w = room.world;
  for (const p of room.players.values()) {
    if (!p.firing || p.alive === false || p.spectating || p.hp <= 0) continue;
    const delay = Math.max(95, Number(p.fireDelay) || 550) * (p.attackSpeedActive ? 0.65 : 1);
    if (w.gameTime - (p.lastShotAt || 0) < delay) continue;
    p.lastShotAt = w.gameTime;
    shootProjectile(w, p.x, p.y, p.aimX, p.aimY, {
      owner: 'player', ownerId: p.id, damage: p.damage || 1, speed: 9, radius: 5, color: p.color, hitsLeft: p.doubleShotActive ? 2 : 1
    });
    if (p.doubleShotActive) shootProjectile(w, p.x, p.y, p.aimX, p.aimY, { owner: 'player', ownerId: p.id, damage: p.damage || 1, speed: 9, radius: 5, color: p.color, angleOffset: 0.12, hitsLeft: 1 });
  }
}

function updateTowers(room) {
  const w = room.world;
  for (const tower of w.towers) {
    if (!tower || tower.hp <= 0 || tower.type === 'buffer' || tower.type === 'lucky') continue;
    if (w.gameTime - (tower.lastShotTime || 0) < (tower.fireDelay || 1000)) continue;
    const target = findClosestEnemy(w, tower.x, tower.y, tower.range || 220);
    if (!target) continue;
    tower.lastShotTime = w.gameTime;
    const base = Math.max(0.05, Number(tower.damage) || 0.5);
    const projectileOpts = { owner: 'tower', ownerId: tower.ownerId, damage: base, speed: tower.type === 'ballista' ? 12 : 7, radius: tower.type === 'ballista' ? 7 : 5, color: tower.color, hitsLeft: tower.type === 'pierce' || tower.type === 'spear' ? 4 : 1 };
    if (tower.type === 'slow') { projectileOpts.damage = 0.15; projectileOpts.slowAmount = tower.slowAmount || 0.45; projectileOpts.slowDuration = tower.slowDuration || 1600; projectileOpts.areaRadius = tower.areaRadius || 58; }
    if (tower.type === 'poison') { projectileOpts.poisonDamage = Math.max(0.5, base * 0.45); projectileOpts.poisonTicks = 5; }
    shootProjectile(w, tower.x, tower.y, target.x, target.y, projectileOpts);
    if (tower.type === 'double') shootProjectile(w, tower.x, tower.y, target.x, target.y, { ...projectileOpts, angleOffset: 0.14 });
    if (tower.type === 'laser') damageEnemy(room, target, base * 0.35, tower.ownerId, tower.x, tower.y);
  }
}

function shootProjectile(w, x, y, targetX, targetY, opts = {}) {
  const angle = Math.atan2(targetY - y, targetX - x) + (opts.angleOffset || 0);
  w.projectiles.push({ id: w.nextProjectileId++, x, y, radius: opts.radius || 5, speed: opts.speed || 7, damage: opts.damage || 1, owner: opts.owner || 'tower', ownerId: opts.ownerId || '', dx: Math.cos(angle), dy: Math.sin(angle), angle, color: opts.color || 'white', hitsLeft: opts.hitsLeft || 1, slowAmount: opts.slowAmount, slowDuration: opts.slowDuration, areaRadius: opts.areaRadius, poisonDamage: opts.poisonDamage, poisonTicks: opts.poisonTicks, age: 0, life: 2800 });
}

function updateProjectiles(room, dtMs) {
  const w = room.world;
  const factor = dtMs / 16.666;
  for (let i = w.projectiles.length - 1; i >= 0; i--) {
    const p = w.projectiles[i];
    p.x += p.dx * p.speed * factor;
    p.y += p.dy * p.speed * factor;
    p.age += dtMs;
    p.life -= dtMs;
    let remove = p.life <= 0 || p.x < -90 || p.x > WORLD_WIDTH + 90 || p.y < -90 || p.y > WORLD_HEIGHT + 90;
    if (!remove) {
      for (let j = w.enemies.length - 1; j >= 0; j--) {
        const e = w.enemies[j];
        if (Math.hypot(e.x - p.x, e.y - p.y) > (e.radius || 18) + (p.radius || 5)) continue;
        if (p.areaRadius) {
          for (const other of w.enemies) if (Math.hypot(other.x - e.x, other.y - e.y) <= p.areaRadius) applyProjectileDamage(room, other, p);
        } else {
          applyProjectileDamage(room, e, p);
        }
        p.hitsLeft -= 1;
        if (p.hitsLeft <= 0) { remove = true; break; }
      }
    }
    if (remove) w.projectiles.splice(i, 1);
  }
}

function applyProjectileDamage(room, enemy, p) {
  if (p.slowAmount) {
    enemy.slowUntil = room.world.gameTime + (p.slowDuration || 1400);
    enemy.slowMultiplier = Math.max(0.1, 1 - p.slowAmount);
  }
  damageEnemy(room, enemy, p.damage || 1, p.ownerId, p.x, p.y);
  if (p.poisonDamage && p.poisonTicks) enemy.poison = { damage: p.poisonDamage, ticks: p.poisonTicks, nextAt: room.world.gameTime + 500, ownerId: p.ownerId };
}

function updateEnemies(room, dtMs) {
  const w = room.world;
  const factor = dtMs / 16.666;
  for (let i = w.enemies.length - 1; i >= 0; i--) {
    const e = w.enemies[i];
    if (e.poison && w.gameTime >= e.poison.nextAt && e.poison.ticks > 0) {
      e.poison.ticks -= 1;
      e.poison.nextAt = w.gameTime + 500;
      damageEnemy(room, e, e.poison.damage, e.poison.ownerId, e.x, e.y);
    }
    if (e.hp <= 0) { killEnemy(room, i); continue; }
    if (e.slowUntil && e.slowUntil > w.gameTime) e.speed = e.baseSpeed * (e.slowMultiplier || 0.55); else e.speed = e.baseSpeed;
    const target = getEnemyTarget(room, e);
    if (!target) continue;
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const attackDistance = (e.radius || 18) + (target.radius || PLAYER_RADIUS);
    if (dist > attackDistance) {
      e.x = clampNumber(e.x + dx / dist * e.speed * factor, -80, WORLD_WIDTH + 80, e.x);
      e.y = clampNumber(e.y + dy / dist * e.speed * factor, -80, WORLD_HEIGHT + 80, e.y);
      e.isAttacking = false;
    } else if (w.gameTime - (e.lastAttackTime || 0) >= (e.attackDelay || 1000)) {
      e.lastAttackTime = w.gameTime;
      e.isAttacking = true;
      if (target.type === 'player') damagePlayer(room, target.player, e.damageToDefense || 1, e);
      else damageBase(room, e.damageToDefense || 1, e);
    }
  }
}

function getEnemyTarget(room, enemy) {
  const alive = [...room.players.values()].filter(p => p.alive !== false && !p.spectating && p.hp > 0);
  let best = null;
  for (const p of alive) {
    const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
    if (!best || d < best.d) best = { type: 'player', player: p, x: p.x, y: p.y, radius: PLAYER_RADIUS, d };
  }
  const b = room.world.baseCore;
  const bd = Math.hypot(b.x - enemy.x, b.y - enemy.y);
  if (!best || bd < best.d * 0.85) return { type: 'base', x: b.x, y: b.y, radius: BASE_RADIUS, d: bd };
  return best;
}

function findClosestEnemy(w, x, y, range) {
  let best = null;
  for (const e of w.enemies) {
    if (!e || e.hp <= 0) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d <= range && (!best || d < best.d)) best = { ...e, d };
  }
  return best ? w.enemies.find(e => e.id === best.id) : null;
}

function damageEnemy(room, enemy, amount, ownerId, x, y) {
  if (!enemy || enemy.hp <= 0) return;
  enemy.hp -= Math.max(0, Number(amount) || 0);
  enemy.lastHitOwnerId = ownerId || enemy.lastHitOwnerId || '';
  enemy.hitFlash = 0.55;
  if (enemy.hp <= 0) enemy.killedBy = ownerId || enemy.lastHitOwnerId || '';
  room.world.effects.push({ type: 'circle', x: x || enemy.x, y: y || enemy.y, radius: 3, maxRadius: 18, life: 12, color: enemy.color || '#fff' });
}

function killEnemy(room, index) {
  const w = room.world;
  const enemy = w.enemies[index];
  if (!enemy) return;
  const ownerId = enemy.killedBy || enemy.lastHitOwnerId || pickRewardPlayer(room, enemy);
  rewardPlayer(room, ownerId, enemy.reward || 1, enemy.scoreValue || 1, 'kill', enemy.x, enemy.y);
  if (enemy.special === 'exploder') {
    for (const other of w.enemies) if (other !== enemy && Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 78) damageEnemy(room, other, 4, ownerId, enemy.x, enemy.y);
  }
  w.enemies.splice(index, 1);
}

function pickRewardPlayer(room, enemy) {
  let best = null;
  for (const p of room.players.values()) {
    if (p.alive === false || p.spectating) continue;
    const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
    if (!best || d < best.d) best = { id: p.id, d };
  }
  return best?.id || room.players.keys().next().value || '';
}

function rewardPlayer(room, playerId, gold, score, reason, x, y) {
  const p = room.players.get(playerId);
  if (!p) return;
  p.coins = Math.min(999999999, (Number(p.coins) || 0) + Math.max(0, Math.ceil(gold || 0)));
  p.score = Math.min(999999999, (Number(p.score) || 0) + Math.max(0, Math.ceil(score || 0)));
  io.to(playerId).emit('playerReward', { roomId: room.id, gold: Math.max(0, Math.ceil(gold || 0)), score: Math.max(0, Math.ceil(score || 0)), reason: reason || 'kill', x, y });
}

function damagePlayer(room, player, amount, source) {
  if (!player || player.alive === false) return;
  if (player.shieldCharges > 0) { player.shieldCharges -= 1; return; }
  player.hp = Math.max(0, player.hp - Math.max(0, Number(amount) || 0));
  player.lastDeathCause = source?.name || source?.special || 'enemigo';
  io.to(player.id).emit('playerDamage', { roomId: room.id, amount, source: source || null, x: source?.x || player.x, y: source?.y || player.y });
  if (player.hp <= 0) {
    player.alive = false;
    player.diedAtWave = room.world.wave;
    emitRoomUpdate(room.id);
  }
}

function damageBase(room, amount, source) {
  const b = room.world.baseCore;
  b.hp = Math.max(0, (Number(b.hp) || 0) - Math.max(0, Number(amount) || 0));
  room.world.effects.push({ type: 'circle', x: source?.x || b.x, y: source?.y || b.y, radius: 10, maxRadius: 60, life: 20, color: '#ff4747' });
  if (b.hp <= 0) {
    room.world.ended = true;
    room.world.gameRunning = false;
    room.world.waveInProgress = false;
    io.to(room.id).emit('chatMessage', { roomId: room.id, type: 'message', playerId: 'server', name: 'Sistema', color: '#ff7777', text: 'La base cayó. Run terminada.' });
  }
}

function applyAbility(room, player, abilityId, x, y) {
  const w = room.world;
  const damage = Math.max(1, player.damage || 1);
  const radiusById = { bomb: 90, freeze: 145, tsunami: 165, lightning: 150, meteor: 120, eclipse: 210 };
  const multById = { bomb: 7, freeze: 1, tsunami: 3, lightning: 6, meteor: 11, eclipse: 4 };
  const radius = radiusById[abilityId] || 100;
  const dmg = damage * (multById[abilityId] || 3);
  for (const e of w.enemies) {
    if (Math.hypot(e.x - x, e.y - y) <= radius) {
      if (abilityId === 'freeze' || abilityId === 'eclipse') { e.slowUntil = w.gameTime + 3000; e.slowMultiplier = abilityId === 'freeze' ? 0.15 : 0.42; }
      damageEnemy(room, e, dmg, player.id, x, y);
    }
  }
  for (let i = w.enemies.length - 1; i >= 0; i--) if (w.enemies[i].hp <= 0) killEnemy(room, i);
  w.effects.push({ type: 'circle', x, y, radius: 8, maxRadius: radius, life: 35, color: abilityId === 'freeze' ? '#9be7ff' : '#ffe28a' });
}

function buildTowerForPlayer(socket, payload) {
  const room = getSocketRoom(socket);
  const p = getRoomPlayer(room, socket.id);
  if (!room || !p) return;
  const key = String(payload?.defKey || '');
  let def = towerByKey.get(key);
  if (!def) return sendBuildResult(room, p, false, 0, 'Torre desconocida');
  if (def.type === 'lucky') {
    const choices = towerDefinitions.filter(t => t.type !== 'lucky');
    def = choices[Math.floor(Math.random() * choices.length)];
  }
  const price = Math.max(0, Math.floor(Number(payload?.price) || def.cost || 0));
  const x = snap(clampNumber(payload?.x, 0, WORLD_WIDTH, WORLD_WIDTH / 2));
  const y = snap(clampNumber(payload?.y, 0, WORLD_HEIGHT, WORLD_HEIGHT / 2));
  if ((p.coins || 0) < price) return sendBuildResult(room, p, false, 0, 'Monedas insuficientes');
  if (!isTowerSpotFree(room.world, x, y)) return sendBuildResult(room, p, false, 0, 'Lugar ocupado o inválido');
  const ownedCount = room.world.towers.filter(t => t.ownerId === p.id).length;
  if (ownedCount >= (p.towerSlots || 12)) return sendBuildResult(room, p, false, 0, 'Límite de torres alcanzado');
  p.coins -= price;
  room.world.towers.push({ ...def, id: room.world.nextTowerId++, owned: true, x, y, rotation: clampNumber(payload?.rotation, 0, Math.PI * 2, 0), slotIndex: room.world.towers.length, level: 1, lastShotTime: 0, spent: price, upgradeCost: def.upgradeCost || Math.floor((def.cost || price) * 1.35), maxHp: def.maxHp || 38, hp: def.maxHp || 38, damageMultiplier: 1, fireDelayMultiplier: 1, ownerId: p.id, ownerColor: p.color });
  sendBuildResult(room, p, true, price, `${def.name} colocada en Render`);
}
function buildTrapForPlayer(socket, payload) {
  const room = getSocketRoom(socket); const p = getRoomPlayer(room, socket.id); if (!room || !p) return;
  const price = Math.max(0, Math.floor(Number(payload?.price) || 55));
  if ((p.coins || 0) < price) return sendBuildResult(room, p, false, 0, 'Monedas insuficientes');
  p.coins -= price;
  room.world.traps.push({ id: Date.now() + Math.random(), type: String(payload?.typeKey || 'snare'), x: clampNumber(payload?.x, 0, WORLD_WIDTH, p.x), y: clampNumber(payload?.y, 0, WORLD_HEIGHT, p.y), radius: 18, color: '#9be7ff', ownerId: p.id });
  sendBuildResult(room, p, true, price, 'Trampa colocada en Render');
}
function buildMineForPlayer(socket, payload) {
  const room = getSocketRoom(socket); const p = getRoomPlayer(room, socket.id); if (!room || !p) return;
  const price = Math.max(0, Math.floor(Number(payload?.price) || 120));
  if ((p.coins || 0) < price) return sendBuildResult(room, p, false, 0, 'Monedas insuficientes');
  p.coins -= price;
  room.world.mines.push({ id: Date.now() + Math.random(), x: clampNumber(payload?.x, 0, WORLD_WIDTH, p.x), y: clampNumber(payload?.y, 0, WORLD_HEIGHT, p.y), radius: 24, hp: 120, maxHp: 120, ownerId: p.id });
  sendBuildResult(room, p, true, price, 'Mina colocada en Render');
}
function buildBarricadeForPlayer(socket, payload) {
  const room = getSocketRoom(socket); const p = getRoomPlayer(room, socket.id); if (!room || !p) return;
  const price = Math.max(0, Math.floor(Number(payload?.price) || 48));
  if ((p.coins || 0) < price) return sendBuildResult(room, p, false, 0, 'Monedas insuficientes');
  p.coins -= price;
  room.world.barricades.push({ id: Date.now() + Math.random(), x: clampNumber(payload?.x, 0, WORLD_WIDTH, p.x), y: clampNumber(payload?.y, 0, WORLD_HEIGHT, p.y), orientation: payload?.orientation === 'vertical' ? 'vertical' : 'horizontal', active: true, hp: 100, maxHp: 100, ownerId: p.id, color: '#8b5a2b' });
  sendBuildResult(room, p, true, price, 'Barricada colocada en Render');
}
function sendBuildResult(room, p, ok, expense, message) {
  io.to(p.id).emit('buildResult', { roomId: room.id, ok: Boolean(ok), expense: Math.max(0, expense || 0), refund: 0, message: String(message || '').slice(0, 120) });
  emitRoomUpdate(room.id);
}

function isTowerSpotFree(w, x, y) {
  if (x < TOWER_RADIUS || x > WORLD_WIDTH - TOWER_RADIUS || y < TOWER_RADIUS || y > WORLD_HEIGHT - TOWER_RADIUS) return false;
  if (Math.hypot(x - w.baseCore.x, y - w.baseCore.y) < BASE_RADIUS + TOWER_RADIUS + 18) return false;
  return !w.towers.some(t => Math.hypot(t.x - x, t.y - y) < TOWER_RADIUS * 2 + 4);
}
function snap(value) { return Math.round(Number(value || 0) / BUILD_GRID_SIZE) * BUILD_GRID_SIZE; }

function leaveCurrentRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (room) {
    room.players.delete(socket.id);
    socket.leave(roomId);
    if (room.hostId === socket.id) room.hostId = room.players.keys().next().value || '';
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
  const now = Date.now();
  for (const room of rooms.values()) {
    const dt = Math.max(1, Math.min(125, now - (room.world.lastTickAt || now)));
    room.world.lastTickAt = now;
    updateRoom(room, dt);
    emitSnapshot(room.id);
  }
}, TICK_MS);

server.listen(PORT, '0.0.0.0', () => {
  console.log('Ardent Tower Defense server-authoritative activo');
  console.log(`Puerto: ${PORT}`);
  if (!IS_RENDER) console.log(`Local:  http://localhost:${PORT}`);
  if (IS_RENDER) console.log('Render: usá la URL .onrender.com asignada a este Web Service');
});
