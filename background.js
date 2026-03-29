(function() {
    // 1. Setup the Non-Interactable Background Container
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

    // 2. Track Mouse for Collision Distance
    let mouseX = -1000;
    let mouseY = -1000;
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // 3. Define the Physical Falling DOM Cube
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const numCubes = isMobile ? 8 : 20;
    const cubes = [];

    class DOMCube {
        constructor() {
            // Main positional wrapper
            this.element = document.createElement('div');
            this.element.className = 'falling-cube-wrapper';
            
            // Contains the scale pulsing animation independent of position
            const scaler = document.createElement('div');
            scaler.className = 'cube-scaler';
            
            // Rotates all the 3D faces continuously
            const rotator = document.createElement('div');
            rotator.className = 'cube-rotator';
            
            // Construct the 6 physical faces
            const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
            faces.forEach(face => {
                const faceDiv = document.createElement('div');
                faceDiv.className = `cube-face ${face}`;
                rotator.appendChild(faceDiv);
            });
            
            scaler.appendChild(rotator);
            this.element.appendChild(scaler);
            container.appendChild(this.element);

            this.reset(true);
        }

        reset(randomY = false) {
            this.size = 15 + Math.random() * 20; // Box sizes between 15px and 35px
            this.x = Math.random() * window.innerWidth;
            this.y = randomY ? Math.random() * window.innerHeight : -this.size - 50;
            this.speed = 0.5 + Math.random() * 1.5; // Float down speed
            
            // Set rotation logic inside CSS via variables and styles directly
            const duration = 3 + Math.random() * 7; 
            const rotNode = this.element.querySelector('.cube-rotator');
            rotNode.style.animationDuration = `${duration}s`;
            rotNode.style.animationDirection = Math.random() > 0.5 ? 'normal' : 'reverse';

            // Establish proportional 3D dimensions via CSS variables
            this.element.style.width = `${this.size}px`;
            this.element.style.height = `${this.size}px`;
            this.element.style.setProperty('--tz', `${this.size / 2}px`);
            
            // Random base opacity so some look further away
            this.element.style.opacity = (0.2 + Math.random() * 0.4).toFixed(2);
            
            this.updateTransform();
        }

        updateTransform() {
            // Apply coordinates smoothly 
            this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
        }

        update() {
            this.y += this.speed;
            this.updateTransform();

            // 4. Mouse Collision Check
            const centerX = this.x + this.size / 2;
            const centerY = this.y + this.size / 2;
            const dx = centerX - mouseX;
            const dy = centerY - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // If mouse is within 80px, add a scale-up class.
            if (dist < 80) {
                this.element.classList.add('pulsing');
                // Temporarily boost opacity fully!
                this.element.style.opacity = '1';
            } else {
                this.element.classList.remove('pulsing');
                // Revert opacity naturally (CSS transitions not used on opacity directly to avoid flickering, 
                // but the size scale transitions via CSS). 
                // We'll leave the code simple since removing class lets it rest.
            }

            // Fallout reset
            if (this.y > window.innerHeight + 50) {
                this.reset();
            }
        }
    }

    // Spawn identical instances
    for (let i = 0; i < numCubes; i++) {
        cubes.push(new DOMCube());
    }

    // Animation Loop
    function animate() {
        for (let cube of cubes) {
            cube.update();
        }
        requestAnimationFrame(animate);
    }
    
    animate();
})();
