(function() {
    // Dynamically inject canvas perfectly behind the content so it takes up no layout space
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none'; // Essential so buttons remain clickable!
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    // Standard local coordinates for an 8-pointed 3D cube
    const vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    // Line assignments to link the 8 points into 12 edges
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // front face
        [4, 5], [5, 6], [6, 7], [7, 4], // back face
        [0, 4], [1, 5], [2, 6], [3, 7]  // connecting lines
    ];

    let mouseX = -1000;
    let mouseY = -1000;
    
    // Track mouse specifically for collision
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    class Cube {
        constructor() {
            this.reset(true);
        }

        reset(randomY = false) {
            this.x = Math.random() * width;
            this.y = randomY ? Math.random() * height : -50; 
            this.size = 15 + Math.random() * 20; // 15px to 35px
            this.speed = 0.5 + Math.random() * 1.5; // fall speed
            this.rx = Math.random() * Math.PI * 2;
            this.ry = Math.random() * Math.PI * 2;
            this.rxSpeed = (Math.random() - 0.5) * 0.02;
            this.rySpeed = (Math.random() - 0.5) * 0.02;
            this.pulseTimer = 0;
            this.baseOpacity = 0.4 + Math.random() * 0.2; // 0.4 to 0.6 opacity
        }

        update() {
            this.y += this.speed;
            this.rx += this.rxSpeed;
            this.ry += this.rySpeed;

            // Trigger mouse collision physics (roughly 80px interaction radius around center)
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 80) {
                // If touched, fully set pulse timer to max (~400ms decay)
                this.pulseTimer = 24;
            }

            if (this.pulseTimer > 0) {
                this.pulseTimer--;
            }

            // Loop smoothly back to the top
            if (this.y - this.size * 2 > height) {
                this.reset();
            }
        }

        draw(ctx) {
            let currentSize = this.size;
            let currentOpacity = this.baseOpacity;
            let glow = 0;

            if (this.pulseTimer > 0) {
                // Sine wave interpolation from 0 back to 0 simulating swelling/pulsing
                let progress = this.pulseTimer / 24; 
                let pulseScale = 1 + Math.sin(progress * Math.PI) * 0.5; // 1 -> 1.5 -> 1
                currentSize *= pulseScale;
                currentOpacity = Math.min(1, this.baseOpacity + Math.sin(progress * Math.PI) * 0.5);
                glow = Math.sin(progress * Math.PI) * 5; // Extra glow limited to 5px max
            }

            // Project 3D mathematical vertices into 2D canvas context via matrices
            const projected = vertices.map(v => {
                // Y-axis rotation
                let z1 = v[2] * Math.cos(this.ry) - v[0] * Math.sin(this.ry);
                let x1 = v[2] * Math.sin(this.ry) + v[0] * Math.cos(this.ry);
                let y1 = v[1];

                // X-axis rotation
                let y2 = y1 * Math.cos(this.rx) - z1 * Math.sin(this.rx);
                let z2 = y1 * Math.sin(this.rx) + z1 * Math.cos(this.rx);

                // Simple FOV Perspective
                let fov = 200;
                let distance = 3;
                let z = z2 + distance;
                let factor = fov / z;

                return [
                    this.x + x1 * currentSize * factor,
                    this.y + y2 * currentSize * factor
                ];
            });

            ctx.beginPath();
            for (let edge of edges) {
                let p1 = projected[edge[0]];
                let p2 = projected[edge[1]];
                ctx.moveTo(p1[0], p1[1]);
                ctx.lineTo(p2[0], p2[1]);
            }
            
            ctx.strokeStyle = `rgba(0, 240, 255, ${currentOpacity})`;
            ctx.lineWidth = 1.5;
            
            if (glow > 0) {
                ctx.shadowBlur = glow;
                ctx.shadowColor = '#00f0ff';
            } else {
                ctx.shadowBlur = 0; // Maintain absolute performance when not active
            }

            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // Limit instances automatically based on device performance expectations
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const numCubes = isMobile ? 8 : 20;
    const cubes = Array.from({length: numCubes}, () => new Cube());

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let cube of cubes) {
            cube.update();
            cube.draw(ctx);
        }
        requestAnimationFrame(animate);
    }

    animate();
})();
