(function() {
    // 1. Setup the Container
    const container = document.createElement('div');
    container.id = 'falling-cubes-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '-1';
    container.style.pointerEvents = 'none';
    container.style.overflow = 'hidden';
    document.body.prepend(container);

    // 2. Mouse Tracking logic
    let mouseX = -1000;
    let mouseY = -1000;
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const numCubes = isMobile ? 8 : 20;
    const cubes = [];

    // 3. Clean ES6 Class Definition for DOM Cube
    class DOMCube {
        constructor() {
            this.element = document.createElement('div');
            this.element.className = 'falling-cube-wrapper';
            
            const scaler = document.createElement('div');
            scaler.className = 'cube-scaler';
            
            const rotator = document.createElement('div');
            rotator.className = 'cube-rotator';
            
            const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
            for (let i = 0; i < faces.length; i++) {
                const faceDiv = document.createElement('div');
                faceDiv.className = `cube-face ${faces[i]}`;
                rotator.appendChild(faceDiv);
            }
            
            scaler.appendChild(rotator);
            this.element.appendChild(scaler);
            container.appendChild(this.element);

            this.reset(true);
        }

        reset(randomY = false) {
            this.size = 15 + Math.random() * 20; 
            this.x = Math.random() * window.innerWidth;
            this.y = randomY ? Math.random() * window.innerHeight : -this.size - 50;
            this.speed = 0.5 + Math.random() * 1.5; 
            
            const duration = 3 + Math.random() * 7; 
            const rotNode = this.element.querySelector('.cube-rotator');
            rotNode.style.animationDuration = `${duration}s`;
            rotNode.style.animationDirection = Math.random() > 0.5 ? 'normal' : 'reverse';

            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.setProperty('--tz', `${this.size / 2}px`);
            this.element.style.opacity = (0.2 + Math.random() * 0.4).toFixed(2);
            
            this.updateTransform();
        }

        updateTransform() {
            this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
        }

        update() {
            this.y += this.speed;
            this.updateTransform();

            const centerX = this.x + this.size / 2;
            const centerY = this.y + this.size / 2;
            const dist = Math.sqrt(Math.pow(centerX - mouseX, 2) + Math.pow(centerY - mouseY, 2));

            if (dist < 80) {
                this.element.classList.add('pulsing');
                this.element.style.opacity = '1';
            } else {
                this.element.classList.remove('pulsing');
            }

            if (this.y > window.innerHeight + 50) {
                this.reset();
            }
        }
    }

    // 4. Initialize Instances
    for (let i = 0; i < numCubes; i++) {
        cubes.push(new DOMCube());
    }

    // 5. Render Loop
    function animate() {
        for (let i = 0; i < cubes.length; i++) {
            cubes[i].update();
        }
        requestAnimationFrame(animate);
    }
    
    animate();
})();
