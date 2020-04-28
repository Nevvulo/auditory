module.exports = class CanvasController {
    constructor (canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.frameRate = 1000 / 60; // 60 fps
        this.components = [];
    }

    log (data) {
        console.log('%c[ CanvasController ]', 'color: #ffeb3b', data);
    }

    startAnimatingCanvas () {
        this.log('Canvas animation started')
        this.interval = setInterval(() => this.updateCanvas(), this.frameRate);
        this.garbageCollector = setInterval(() => this.flushComponents(), 5e3);
    }

    stopAnimatingCanvas () {
        clearInterval(this.interval);
    }

    registerComponent (component) {
        this.components.push(component);
        return component;
    }

    removeComponent (id) {
        const component = this.components.findIndex(component => component.id === id);
        if (component > -1) {
            this.components.splice(component, 1);
        }
    }

    getComponent (id) {
        return this.components.find(component => component.id === id)
    }

    findComponents (roughID) {
        let components = [];
        for (const component of this.components) {
            if (component.id.includes(roughID)) components.push(component);
        }
        return components;
    }

    removeAllComponents () {
        this.components = [];
    }

    flushComponents () {
        this.log('Garbage collector called')
        const filtered = this.components.filter(component => component.age < component.maxAge);
        if (filtered.length !== this.components.length) {
            this.components = filtered;
        }
    }

    getContext () {
        return this.context || this.canvas.getContext('2d');
    }

    clearCanvas () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return true;
    }

    updateCanvas () {
        if (this.components.length > 3e3) {
            this.log(`Component count is high! ${this.components.length} components being rendered`)
        }
        this.clearCanvas();
        for (const component of this.components) {
            component.draw();
        }
    }
}