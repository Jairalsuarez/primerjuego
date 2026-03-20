export class Player {
    constructor(stageElement) {
        this.stage = stageElement;
        this.state = 'walking'; // Estados: walking, idle, attacking
        
        // Crear el elemento HTML del jugador
        this.element = document.createElement('div');
        this.element.className = `entity player ${this.state}`;
        this.element.style.left = '150px'; // Posición inicial en pantalla

        // Estructura del cuerpo según el CSS
        this.element.innerHTML = `
            <div class="shadow"></div>
            <div class="body-core">
                <div class="limb left-leg"></div>
                <div class="limb right-leg"></div>
                <div class="limb left-arm"></div>
                <div class="part torso"></div>
                <div class="part head"></div>
                <div class="weapon-shape"></div>
                <div class="limb right-arm"></div>
            </div>
            <div class="nameplate">
                <p>Héroe</p>
                <div class="meter"><div class="meter-fill hp" style="width: 100%"></div></div>
            </div>
        `;
        
        this.stage.appendChild(this.element);
    }

    setState(newState) {
        this.element.classList.remove(this.state);
        this.state = newState;
        this.element.classList.add(this.state);
    }

    update(deltaTime) {
        // Aquí iría la lógica de regeneración de vida, etc.
        // Por ahora, solo se mantiene caminando si el estado es 'walking'
    }
}