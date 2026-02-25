/* ============================================================
   CURSOR SYSTEM — Custom cursor with trailing & magnetic pull
   Enhanced version with better error handling and dynamic checks
   ============================================================ */

(function () {
    // Skip on mobile/touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    if (window.innerWidth < 769) return;

    // Prevent duplicate cursors
    if (document.querySelector('.cursor-dot')) return;

    // Create cursor elements
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);

    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);

    // Flag body as having a successful custom cursor
    document.body.classList.add('has-custom-cursor');

    // Create trail particles
    const TRAIL_COUNT = 6;
    const trails = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
        const t = document.createElement('div');
        t.className = 'cursor-trail';
        t.style.opacity = (0.3 - i * 0.04).toString();
        t.style.width = (4 - i * 0.5) + 'px';
        t.style.height = (4 - i * 0.5) + 'px';
        document.body.appendChild(t);
        trails.push({ el: t, x: 0, y: 0 });
    }

    // Initialize mouse position to center
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX, dotY = mouseY;
    let ringX = mouseX, ringY = mouseY;
    let isHovering = false;
    let isMagnetic = false;
    let magnetTarget = null;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Click feedback
    document.addEventListener('mousedown', () => ring.classList.add('click'));
    document.addEventListener('mouseup', () => ring.classList.remove('click'));
    window.addEventListener('blur', () => ring.classList.remove('click'));

    // Hover detection
    const interactiveSelectors = 'a, button, .story-card, .power-card, .mission-card, .skill-button, .reset-btn, .mode-btn, .map-dot, .enter-btn, .chat-toggle, .chat-send, .cta-btn, .social-link, .game-project, .guide-character, .skill-pill, .tech-badge';
    const magneticSelectors = 'button, .cta-btn, .enter-btn, .chat-send, .social-link, .mode-btn, .map-dot, .reset-btn';

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest(interactiveSelectors);
        if (target) {
            isHovering = true;
            ring.classList.add('hover');

            if (target.matches(magneticSelectors)) {
                isMagnetic = true;
                magnetTarget = target;
                ring.classList.add('magnetic');
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest(interactiveSelectors);
        if (target) {
            isHovering = false;
            isMagnetic = false;
            magnetTarget = null;
            ring.classList.remove('hover', 'magnetic');
        }
    });

    // Animation loop
    function animate() {
        let targetX = mouseX;
        let targetY = mouseY;

        if (isMagnetic && magnetTarget && magnetTarget.isConnected) {
            const rect = magnetTarget.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distX = mouseX - centerX;
            const distY = mouseY - centerY;
            const dist = Math.sqrt(distX * distX + distY * distY);
            const maxDist = 80;

            if (dist < maxDist) {
                const pull = 0.3 * (1 - dist / maxDist);
                targetX = mouseX - distX * pull;
                targetY = mouseY - distY * pull;
            }
        }

        const dotSpeed = 0.35;
        const ringSpeed = 0.15;

        dotX += (targetX - dotX) * dotSpeed;
        dotY += (targetY - dotY) * dotSpeed;
        ringX += (targetX - ringX) * ringSpeed;
        ringY += (targetY - ringY) * ringSpeed;

        dot.style.left = dotX + 'px';
        dot.style.top = dotY + 'px';
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';

        for (let i = 0; i < trails.length; i++) {
            const prev = i === 0 ? { x: dotX, y: dotY } : trails[i - 1];
            const speed = 0.2 - (i * 0.02);
            trails[i].x += (prev.x - trails[i].x) * speed;
            trails[i].y += (prev.y - trails[i].y) * speed;
            trails[i].el.style.left = trails[i].x + 'px';
            trails[i].el.style.top = trails[i].y + 'px';
        }

        requestAnimationFrame(animate);
    }

    animate();

    // Hide cursor when leaving window
    document.addEventListener('mouseout', (e) => {
        // Only hide if the cursor truly leaves the document window
        if (!e.relatedTarget && !e.toElement) {
            dot.style.opacity = '0';
            ring.style.opacity = '0';
            trails.forEach(t => t.el.style.opacity = '0');
        }
    });

    document.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        trails.forEach((t, i) => t.el.style.opacity = (0.3 - i * 0.04).toString());
    });

    // Ensure cursor stays visible during scroll events
    window.addEventListener('scroll', () => {
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        trails.forEach((t, i) => t.el.style.opacity = (0.3 - i * 0.04).toString());
    }, { passive: true });

    // Clean up on page unload (optional)
    window.addEventListener('beforeunload', () => {
        dot.remove();
        ring.remove();
        trails.forEach(t => t.el.remove());
    });
})();