ARDENT TOWER DEFENSE - SERVER AUTHORITATIVE / RENDER

Esta versión cambia la arquitectura multiplayer:

1) Render simula el mundo compartido:
   - oleadas
   - spawns de enemigos
   - movimiento/ataques de enemigos
   - disparos de jugadores
   - disparos de torres
   - daño y recompensas
   - construcciones básicas

2) Los navegadores ya no son el host real de la partida.
   Cada cliente manda inputs/estado del jugador y Render envía snapshots del mundo.
   Si alguien minimiza, alt-tabea o abre chat, la simulación sigue corriendo en Render.

3) Bugs corregidos/mantenidos:
   - chat no pausa la partida
   - el host original ya no congela la sala
   - eliminado el circulito de color en los pies de los jugadores
   - archivos renombrados a index.html, script.js y style.css para deploy correcto

IMPORTANTE:
Esta es una migración compatible y jugable, no una copia 1:1 de absolutamente todos los poderes avanzados del cliente original. El servidor implementa una simulación completa funcional de oleadas, enemigos, torres, disparos, recompensas y construcciones, pero algunos comportamientos muy específicos del cliente original quedan simplificados para priorizar estabilidad online.

Para deploy en Render:
- Build command: npm install
- Start command: npm start
- Node >= 18
