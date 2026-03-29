// Custom 3D Cursor Implementation
if (window.matchMedia("(pointer: fine)").matches) {
    // Generate the DOM structure for the 3D cube
    const cursor = document.createElement('div');
    cursor.className = 'cursor-wrapper';
    cursor.innerHTML = `
        <div class="cube-scaler">
            <div class="cube-rotator">
                <div class="cube-face front"></div>
                <div class="cube-face back"></div>
                <div class="cube-face right"></div>
                <div class="cube-face left"></div>
                <div class="cube-face top"></div>
                <div class="cube-face bottom"></div>
            </div>
        </div>
    `;
    document.body.appendChild(cursor);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cubeX = mouseX;
    let cubeY = mouseY;

    // Track mouse position
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Delegate hover events for pulsing effect
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, input, textarea, .project-card, .btn')) {
            cursor.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, input, textarea, .project-card, .btn')) {
            cursor.classList.remove('hovering');
        }
    });

    // Lerp loop for smooth follow
    const loop = () => {
        cubeX += (mouseX - cubeX) * 0.15;
        cubeY += (mouseY - cubeY) * 0.15;
        cursor.style.transform = `translate3d(${cubeX}px, ${cubeY}px, 0)`;
        requestAnimationFrame(loop);
    };
    loop();
}
