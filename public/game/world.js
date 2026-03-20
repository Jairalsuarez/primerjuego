export class World {
    constructor() {
        this.ground = document.querySelector('.ground-layer');
        this.groundPos = 0;
        this.speed = 0.15; // Velocidad de desplazamiento
    }

    update(deltaTime, playerState) {
        // Solo movemos el mundo si el jugador está caminando
        if (playerState === 'walking') {
            this.groundPos -= this.speed * deltaTime;
            this.ground.style.backgroundPosition = `${this.groundPos}px bottom`;
        }
    }
}