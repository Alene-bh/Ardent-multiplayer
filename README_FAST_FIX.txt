Ardent Tower Defense - server-authoritative fast/visible target fix

Cambios de esta versión:

1) Enemigos más rápidos en mundo grande
- El server ahora escala la velocidad de enemigos para el mapa WORLD_WIDTH/WORLD_HEIGHT.
- Antes usaba velocidades demasiado bajas para un mundo de 3400x2300, por eso todo se sentía en cámara lenta.

2) Menos carga de red
- El server actualiza simulación a 30Hz pero envía snapshots a 12Hz.
- Los snapshots van compactados para no mandar objetos enormes en cada paquete.

3) Suavizado visual en cliente
- El cliente extrapola visualmente enemigos/proyectiles entre snapshots.
- El daño/colisiones siguen siendo del server; esto solo mejora fluidez visual.

4) Base visible
- En server-authoritative, si el server manda baseCore, el cliente marca basePlaced=true.
- Así los enemigos no parecen pegarle a algo invisible en el centro.

5) Spectator/dead safety
- El cliente ya no manda HP positivo cuando está muerto/especteando en modo server-authoritative.

Recomendación de prueba:
- Subir todos los archivos a GitHub reemplazando los anteriores.
- Render: Manual Deploy -> Deploy latest commit.
- Crear sala nueva desde cero después del deploy.
