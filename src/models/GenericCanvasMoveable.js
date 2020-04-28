const { CanvasController } = require('./');

module.exports = class GenericCanvasMoveable extends CanvasController {
    constructor (canvas, options) {
        super(canvas);
        this.id = options.id || `component-${Math.random() * 1e6}`
        this.width = options.width;
        this.height = options.height;
        this.type = options.type || 'rect' // can be 'rect' or 'arc
        this.img = options.img || null,
        this.radius = options.radius || 10 // when 'arc' is specified
        this.speedX = options.speedX || 0;
        this.speedY = options.speedY || 0;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.velX = options.velX || 0;
        this.velY = options.velY || 0;
        this.angle = options.angle || 0;
        this.color = options.color || '#ffffff';
        this.moveTowards = options.moveTowards || null;
        this.alpha = options.alpha || null;
        this.age = 0;
        this.maxAge = options.maxAge || 10e2;
    }

    changeColor (color) {
        this.color = color;
    }

    draw () {
        this.age++;
        
        if (this.moveTowards) {
            const pos = { x: this.moveTowards[0], y: this.moveTowards[1] };
            let speedX = 0;
            let speedY = 0;
            speedX = -Math.min(this.speedX, (pos.x - this.x) * 0.01);
            speedY = -Math.min(this.speedY, (pos.y - this.y) * 0.01);
            this.move(this.x - speedX, this.y - speedY);
        } else if (this.speedX || this.speedY) {
            this.move(this.x + this.speedX, this.y + this.speedY);
        }

        const ctx = this.getContext();
        ctx.save();
        
        if (this.alpha) {
            ctx.globalAlpha = this.alpha;
        }

        ctx.fillStyle = this.color;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.id === 'player') {
            ctx.rotate(90 * Math.PI / 180)
        }
        if (this.angle) {
            ctx.rotate(this.angle * Math.PI / 180);
        }
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        
        if (this.type === 'rect') {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'arc') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            ctx.fill();
        } else if (this.type === 'image') {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height)
        }
        ctx.restore();
    }

    setAngle (angle) {
        this.angle = angle;
    }

    setSpeed (x, y) {
        this.speedX = x;
        this.speedY = y;
    }

    move (x, y) {
        this.x = x || this.x;
        this.y = y || this.y;
    }

    intersects (component) {
        const width = this.width || this.radius;
        const height = this.height || this.radius;
        const componentWidth = component.width || component.radius;
        const componentHeight = component.height || component.radius;
        return !(component.x > (this.x + width) || 
                 (component.x + componentWidth) < this.x || 
                 component.y > (this.y + height) ||
                 (component.y + componentHeight) < this.y);
    }
}