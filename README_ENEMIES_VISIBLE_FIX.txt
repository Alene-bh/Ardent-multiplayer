# Ardent multiplayer - fix enemigos invisibles

Esta versión corrige el bug donde el servidor de Render aplicaba daño, pero el cliente no veía los enemigos.

Cambios principales:
- El servidor ahora manda el estado del mundo dentro del evento `snapshot`, no solo por `hostGameState`.
- El cliente aplica inmediatamente `data.world` al recibir cada snapshot.
- Se agregó compatibilidad con un evento extra `serverWorldState`.
- Se normalizan enemigos/proyectiles recibidos del server para asegurar `x`, `y`, `radius`, `hp`, `maxHp` y `color` antes de dibujar.
- El jugador local sincroniza HP, monedas y score reales desde el snapshot del servidor.

Qué subir a GitHub:
- index.html
- script.js
- style.css
- server.js
- package.json
- package-lock.json
- render.yaml
- .gitignore

Después de subir, hacer en Render: Manual Deploy -> Deploy latest commit.
