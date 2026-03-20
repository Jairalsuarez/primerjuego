import { Player } from './player.js';
import { World } from './world.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener la capa donde se dibujarán las entidades
    const entitiesLayer = document.getElementById('entitiesLayer');
    
    // 2. Inicializar los módulos
    const world = new World();
    const player = new Player(entitiesLayer);
    
    // 3. Variables para el Game Loop
    let lastTime = performance.now();

    // 4. El Game Loop (Bucle principal)
    function gameLoop(currentTime) {
        // Calcular el tiempo transcurrido (deltaTime) para fluidez sin importar los FPS
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Actualizar el jugador
        player.update(deltaTime);
        
        // Actualizar el mundo (el fondo se mueve según lo que haga el jugador)
        world.update(deltaTime, player.state);

        // Volver a llamar al bucle en el siguiente frame
        requestAnimationFrame(gameLoop);
    }

    // Iniciar el bucle
    requestAnimationFrame(gameLoop);
});