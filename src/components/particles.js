const { CanvasController, GenericCanvasMoveable } = require('./../models');

module.exports = class ParticleSpawner extends CanvasController {
    constructor (canvas) {
        super(canvas);
        this.canvas = canvas;
        this.radius = 5;
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
        this.spawnAngle = 0;
        this.particleInterval = setInterval(() => this.updateSpawner(), 16);
        this.particles = [];
    }

    recenterParticles () {
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
    }

    start () {
        this.startAnimatingCanvas();
    }

    stop () {
        this.stopAnimatingCanvas();
        this.removeAllComponents();
        this.clearCanvas();
        clearInterval(this.particleInterval);
    }

    _handleEvent (event) {
        switch (event.type) {
            case 'audio': {
                this.amplitude = event.amp;
            }
        }
    }

    transferAudioData (data) {
        this._handleEvent({ type: 'audio', ...data });
    }

    updateSpawner () {
        if (this.spawnAngle > 359) {
            this.spawnAngle = 0;
        }
        this.spawnAngle += 0.1;
        if (Math.random() > (0.97 - (this.amplitude / 3 / 100))) this.spawn();
        for (const particle of this.particles) {
            let speedAmp = Math.min(1, Math.max(0.5, Math.floor(this.amplitude / 100) / 2));
            particle.setSpeed((particle.speedX + particle.velX) * speedAmp, (particle.speedY + particle.velY) * speedAmp)
        }
    }

    get particleObject () {
        return {
            id: `particle-${Math.floor(Math.random() * 1e6)}`,
            type: 'arc',
            color: '#000'
        }
    }

    spawn () {
        const pos = {
            x: Math.cos(this.spawnAngle) * this.radius + this.x,
            y: Math.sin(this.spawnAngle) * this.radius + this.y
        }
        const vel = {
            x: -0.5 + Math.random() * (Math.random() * 5),
            y: -0.5 + Math.random() * (Math.random() * 5)
        }
        let speedX = -Math.min(0.2, Math.max(this.x - pos.x, -0.2));
        let speedY = -Math.min(0.2, Math.max(this.y - pos.y, -0.2));
        this.particles.push(this.registerComponent(new GenericCanvasMoveable(this.canvas, 
            { 
                x: pos.x,
                y: pos.y,
                speedX,
                speedY,
                alpha: Math.random() * 0.75,
                radius: Math.floor(Math.random() * 10),
                velX: vel.x,
                velY: vel.y,
                ...this.particleObject,
            }
        )))
    }
}