const { CanvasController, GenericCanvasMoveable } = require('./../models');

module.exports = class Game extends CanvasController {
    constructor (canvas, options) {
        super(canvas);
        this.canvas = canvas;
        this.lastAmplitudes = [];
        this.amplitude = 0;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.EnemySpawner = new EnemySpawner(canvas);
        this.keysPressed = {};

        this.playing = true;
        this.SCORE = 0;
        this.PLAYER_HEALTH = 100;
        this.BASE_HEALTH = 100;
        this.PLAYER_ICON = document.querySelector('.player-icon');
        this.PLAYER_ANGLE = 0;
        this.PLAYER_MAX_SPEED = 5;
        this.PLAYER_CURRENT_SPEED = 0;
        this.PLAYER_MOVEMENT_RESISTANCE = 3;
        this.TIME_SINCE_LAST_BASE_DAMAGE_TICK = 0;
        this.TIME_SINCE_LAST_PLAYER_DAMAGE_TICK = 0;
        this.BASE_DAMAGE_INTERVAL = 3e3;
        this.PLAYER_DAMAGE_INTERVAL = 1e3;

        this.POWERUPS = [{
            id: 'BULLET_STREAM',
            name: 'Bullet Stream',
            lastsFor: 5e3,
            func: this.enableBulletStream,
            color: '#26c6da'
        }]
        this.TIME_SINCE_LAST_POWERUP_DISPENSED = 0;
        this.POWERUP_COOLDOWN = 0;

        this.TIME_SINCE_ANNOUNCEMENT_DISPLAYED = 0;

        this.endCallback = options.endCallback || (() => void 0);
        const gameInfo = document.querySelector('.game-info');
        const vignette = document.querySelector('.vignette');
        this.MAX_BULLETS = 100;
        this.BULLETS = 50;
        this.BULLET_METER_CONTAINER = document.querySelector('.bullet-meter');
        this.BULLET_METER_ELEMENT = document.querySelector('.bullet-meter-progress');
        this.BULLET_METER_CONTAINER.style.display = '';
        this.TIME_SINCE_LAST_BULLET_GAIN = 0;
        this.BULLET_GAIN_INTERVAL = 100;
        gameInfo.classList.add('fade-in');
        gameInfo.classList.remove('fade-out');
        gameInfo.classList.add('fade-in');
        vignette.style.display = '';
    }

    get playerObject () {
        return {
            id: 'player',
            type: 'image',
            width: 50,
            height: 50,
            x: 300,
            y: 200,
            maxAge: Infinity,
            img: this.PLAYER_ICON
        }
    }

    get bulletObject () {
        return {
            id: `bullet-${Math.floor(Math.random() * 1e6)}`,
            type: 'arc',
            radius: 5,
            color: '#000000'
        }
    }

    start () {
        // Handle movement
        document.addEventListener('keydown', e => this.handleKeyPress(e));
        document.addEventListener('keyup', e => this.handleKeyRelease(e));

        this.interval = setInterval(() => this.update(), 16)
        // Register the player as a component
        this.player = this.registerComponent(new GenericCanvasMoveable(this.canvas, this.playerObject))
        // Start animating
        this.startAnimatingCanvas();
    }

    _handleEvent (event) {
        switch (event.type) {
            case 'audio': {
                if (this.lastAmplitudes.length > 5) {
                    this.lastAmplitudes.shift();
                }
                
                this.amplitude = event.amp;
                this.lastAmplitudes.push(this.amplitude)

                if (this.lastAmplitudes.length > 1) {
                    if (event.bass > 325) {
                        if (Math.random() > 0.8) this.spawnEnemy();
                    }
                    if (this.amplitude > this.lastAmplitudes[4]) {
                        if (Math.random() > 0.95) this.spawnEnemy();
                    }
                }
            }
        }
    }

    shoot (useBullet = true) {
        if (this.BULLETS < 1) {
            return;
        }
        if (useBullet) this.BULLETS--;
        const BULLET_SPEED = 10;
        let speedX = BULLET_SPEED * Math.cos(this.player.angle * Math.PI / 180);
        let speedY = BULLET_SPEED * Math.sin(this.player.angle * Math.PI / 180);
        this.bullets.push(this.registerComponent(new GenericCanvasMoveable(this.canvas, 
            {
                x: this.player.x,
                y: this.player.y,
                speedX,
                speedY,
                ...this.bulletObject,
            }
        )))
    }

    transferAudioData (data) {
        this._handleEvent({ type: 'audio', ...data });
    }

    damagePlayer (health) {
        this.PLAYER_HEALTH = health;
        document.querySelector('.player-health-progress').style.width = `${this.PLAYER_HEALTH}%`
    }

    damageBase (health) {
        this.BASE_HEALTH = health;
        document.querySelector('.base-health-progress').style.width = `${this.BASE_HEALTH}%`
    }

    lose () {
        this.log('User lost the game')
        const gameInfo = document.querySelector('.game-info');
        this.makeAnnouncement(`You lost!<br/><div class=\'healthbar-header\'>Final Score  -  ${this.SCORE}</div>`, 5e3)
        this.BULLET_METER_CONTAINER.classList.add('fade-out');
        setTimeout(() => {
            const vignette = document.querySelector('.vignette');
            gameInfo.classList.add('fade-out-lyrics')
            vignette.classList.add('fade-out')
            this.BULLET_METER_CONTAINER.style.display = 'none';
            setTimeout(() => {
                vignette.style.display = 'none';
            }, 1e3)
        }, 5e3);
        this.end();
    }

    end () {
        this.playing = false;
        this.removeAllComponents();
        this.stopAnimatingCanvas();
        this.clearCanvas();
        if (this.endCallback && typeof this.endCallback === 'function') {
            this.endCallback();
        }
    }

    setScore (score) {
        this.SCORE = score;
    }

    makeAnnouncement (text, displayFor = 5e3) {
        this.TIME_SINCE_ANNOUNCEMENT_DISPLAYED = Date.now();
        const announcement = document.querySelector('.lyrics');
        announcement.innerHTML = text;
        announcement.classList.remove('fade-out-lyrics')
        announcement.classList.add('fade-in-lyrics')
        this.ANNOUNCEMENT_INTERVAL = setInterval(() => {
            if (Date.now() - this.TIME_SINCE_ANNOUNCEMENT_DISPLAYED > displayFor) {
                announcement.classList.remove('fade-in-lyrics')
                announcement.classList.add('fade-out-lyrics')
                clearInterval(this.ANNOUNCEMENT_INTERVAL);
            }
        }, 1e3)
    }

    spawnPowerup () {
        this.POWERUP_COOLDOWN = Math.max(10e3, Math.random() * 60e3);
        this.TIME_SINCE_LAST_POWERUP_DISPENSED = Date.now();
        const powerup = this.POWERUPS[Math.floor(Math.random() * this.POWERUPS.length)];
        if (powerup) {
            this.powerups.push({ powerup, component: this.registerComponent(
                new GenericCanvasMoveable(this.canvas, 
                    {
                        id: `powerup-${powerup.id}`,
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        type: 'arc',
                        radius: 20,
                        color: powerup.color
                    }
                )
            ) });
        }
    }

    enableBulletStream (time) {
        let timer = 0;
        this.POWERUP_INTERVAL = setInterval(() => {
            timer += 16;
            this.shoot(false);
            if (timer > time) {
                clearInterval(this.POWERUP_INTERVAL);
            }
        }, 16);
    }

    update () {
        if (!this.playing) return;
        
        if (Date.now() - this.TIME_SINCE_LAST_POWERUP_DISPENSED > this.POWERUP_COOLDOWN) {
            this.spawnPowerup();
        }

        if (this.BULLETS < this.MAX_BULLETS) {
            if (Date.now() - this.TIME_SINCE_LAST_BULLET_GAIN > this.BULLET_GAIN_INTERVAL) {
                this.TIME_SINCE_LAST_BULLET_GAIN = Date.now();
                this.BULLETS++;
            }
        }
        this.BULLET_METER_ELEMENT.style.height = `${this.BULLETS}%`;

        for (const bullet of this.bullets) {
            for (const enemy of this.enemies) {
                if (bullet.intersects(enemy)) {
                    if (enemy.id === 'player') continue; // this really shouldn't be possible
                    this.setScore(this.SCORE + 20);
                    this.removeComponent(enemy.id);
                    this.enemies.splice(this.enemies.findIndex(e => e.id === enemy.id), 1);
                }
            }
        }
        for (const enemy of this.enemies) {
            if (enemy.intersects(this.player)) {
                if (Date.now() - this.TIME_SINCE_LAST_PLAYER_DAMAGE_TICK > this.PLAYER_DAMAGE_INTERVAL) {
                    this.TIME_SINCE_LAST_PLAYER_DAMAGE_TICK = Date.now();
                    this.damagePlayer(this.PLAYER_HEALTH - Math.random() * 20);
                }
            }
            const barrier = 50;
            const insideWidth = window.innerWidth / 2;
            const insideHeight = (window.innerHeight / 2) - 40;
            if (enemy.x > insideWidth - barrier && enemy.x < insideWidth + barrier && enemy.y > insideHeight - barrier && enemy.y < insideHeight + barrier) {
                if (Date.now() - this.TIME_SINCE_LAST_BASE_DAMAGE_TICK > this.BASE_DAMAGE_INTERVAL) {
                    this.TIME_SINCE_LAST_BASE_DAMAGE_TICK = Date.now();
                    this.damageBase(this.BASE_HEALTH - 10);
                }
            }
        }
        for (const powerup of this.powerups) {
            if (powerup.component.intersects(this.player)) {
                this.setScore(this.SCORE + 100);
                this.removeComponent(powerup.component.id);
                this.makeAnnouncement(`${powerup.powerup.name} enabled for ${powerup.powerup.lastsFor / 1000} seconds!`, 3e3)
                this.powerups.splice(this.powerups.findIndex(e => e.id === powerup.component.id), 1);
                const func = powerup.powerup.func.bind(this);
                func(powerup.powerup.lastsFor);
            }
        }

        if (this.PLAYER_HEALTH < 1 || this.BASE_HEALTH < 1) {
            this.lose();
        }

        // Build up to max speed
        this.PLAYER_CURRENT_SPEED = Math.min(this.PLAYER_CURRENT_SPEED + this.PLAYER_MOVEMENT_RESISTANCE, this.PLAYER_MAX_SPEED);
        if (this.keysPressed[38]) { // up
            this.player.move(this.player.x + (this.PLAYER_CURRENT_SPEED * Math.cos(this.player.angle * Math.PI / 180)),
             this.player.y + (this.PLAYER_CURRENT_SPEED * Math.sin(this.player.angle * Math.PI / 180)));
        }
        if (this.keysPressed[40]) { // down
            this.player.move(this.player.x - (this.PLAYER_CURRENT_SPEED * Math.cos(this.player.angle * Math.PI / 180)),
             this.player.y - (this.PLAYER_CURRENT_SPEED * Math.sin(this.player.angle * Math.PI / 180)));
        }
        if (this.keysPressed[37]) { // left 
            this.player.setAngle(this.player.angle - 6);
        }
        if (this.keysPressed[39]) { // right
            this.player.setAngle(this.player.angle + 6);
        }
        if (this.keysPressed[13]) {
            this.shoot();
        }
    }

    handleKeyPress (e) {
        e = e || window.event;
        this.keysPressed[e.keyCode] = true;
    }

    handleKeyRelease (e) {
        e = e || window.event;
        this.keysPressed[e.keyCode] = false;
    }

    spawnEnemy () {
        this.enemies.push(this.registerComponent(this.EnemySpawner.spawn()));
    }
}

class EnemySpawner {
    constructor (canvas) {
        this.canvas = canvas;
        this.radius = (window.innerHeight / 2) - 60;
        this.x = window.innerWidth / 2;
        this.y = (window.innerHeight / 2) - 40;
        this.spawnAngle = 0;
        this.interval = setInterval(() => this.updateSpawner(), 16);
        this.ENEMY_ICON = document.querySelector('.enemy-icon');
    }

    updateSpawner () {
        if (this.spawnAngle > 359) {
            this.spawnAngle = 0;
        }
        this.spawnAngle += 0.01;
    }

    get enemyObject () {
        return {
            id: `enemy-${Math.floor(Math.random() * 1e6)}`,
            type: 'image',
            width: 25,
            height: 20,
            color: '#f44336',
            img: this.ENEMY_ICON
        }
    }

    spawn () {
        const pos = {
            x: Math.cos(this.spawnAngle) * this.radius + this.x,
            y: Math.sin(this.spawnAngle) * this.radius + this.y
        }
        let speedX = Math.min(1, Math.max(this.x - pos.x, -1));
        let speedY = Math.min(1, Math.max(this.y - pos.y, -1));
        return new GenericCanvasMoveable(this.canvas, 
            { 
                x: pos.x,
                y: pos.y,
                speedX,
                speedY,
                moveTowards: [this.x, this.y],
                ...this.enemyObject,
            }
        )
    }
}