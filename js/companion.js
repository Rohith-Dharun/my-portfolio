// js/companion.js — Interactive 3D Companion Character
// A cute robot buddy that watches the user's cursor and reacts to interactions
(function () {
    const container = document.getElementById('companion-container');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(160, 160);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0xc4a882, 1.5, 20);
    keyLight.position.set(3, 3, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x7b7fa3, 0.8, 20);
    rimLight.position.set(-3, 1, -3);
    scene.add(rimLight);

    // ----- BUILD THE COMPANION -----
    const companion = new THREE.Group();
    scene.add(companion);

    // Head (main sphere)
    const headGeo = new THREE.SphereGeometry(1, 32, 32);
    const headMat = new THREE.MeshPhysicalMaterial({
        color: 0xf5ede3,
        metalness: 0.05,
        roughness: 0.3,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2
    });
    const head = new THREE.Mesh(headGeo, headMat);
    companion.add(head);

    // Face plate (darker front circle)
    const faceGeo = new THREE.CircleGeometry(0.65, 32);
    const faceMat = new THREE.MeshPhysicalMaterial({
        color: 0x2e2a24,
        metalness: 0.2,
        roughness: 0.4,
        clearcoat: 0.8
    });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.z = 0.88;
    companion.add(face);

    // LEFT EYE
    const eyeGeo = new THREE.SphereGeometry(0.13, 16, 16);
    const eyeMat = new THREE.MeshPhysicalMaterial({
        color: 0xc4a882,
        emissive: 0xc4a882,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.1
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.22, 0.1, 0.95);
    companion.add(leftEye);

    // RIGHT EYE
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    rightEye.position.set(0.22, 0.1, 0.95);
    companion.add(rightEye);

    // LEFT PUPIL
    const pupilGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.08);
    leftEye.add(leftPupil);

    // RIGHT PUPIL
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat.clone());
    rightPupil.position.set(0, 0, 0.08);
    rightEye.add(rightPupil);

    // Mouth (happy arc)
    const mouthCurve = new THREE.EllipseCurve(0, -0.15, 0.2, 0.08, 0, Math.PI, false, 0);
    const mouthPoints = mouthCurve.getPoints(20);
    const mouthGeo = new THREE.BufferGeometry().setFromPoints(mouthPoints);
    const mouthMat = new THREE.LineBasicMaterial({ color: 0xc4a882, linewidth: 2 });
    const mouth = new THREE.Line(mouthGeo, mouthMat);
    mouth.position.z = 0.96;
    mouth.rotation.z = Math.PI;
    companion.add(mouth);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
    const antennaMat = new THREE.MeshPhysicalMaterial({
        color: 0xb5a89b,
        metalness: 0.5,
        roughness: 0.3
    });
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0, 1.15, 0);
    companion.add(antenna);

    // Antenna tip (glowing ball)
    const tipGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const tipMat = new THREE.MeshPhysicalMaterial({
        color: 0x8a9a7b,
        emissive: 0x8a9a7b,
        emissiveIntensity: 1.0,
        metalness: 0.1,
        roughness: 0.1
    });
    const antennaTip = new THREE.Mesh(tipGeo, tipMat);
    antennaTip.position.set(0, 1.4, 0);
    companion.add(antennaTip);

    // Ear bumps
    const earGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const earMat = new THREE.MeshPhysicalMaterial({
        color: 0xb5a89b,
        metalness: 0.3,
        roughness: 0.4
    });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.95, 0.3, 0);
    companion.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat.clone());
    rightEar.position.set(0.95, 0.3, 0);
    companion.add(rightEar);

    // Scale and position the entire companion
    companion.scale.set(0.85, 0.85, 0.85);
    companion.position.y = -0.1;

    // ----- MOUSE TRACKING -----
    let mouseX = 0;
    let mouseY = 0;
    let targetLookX = 0;
    let targetLookY = 0;
    let isHovering = false;
    let blinkTimer = 0;
    let isBlinking = false;
    let currentEmotion = 'neutral'; // neutral, happy, surprised

    document.addEventListener('mousemove', (e) => {
        // Normalize to -1 to 1 range
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Hover reactions
    container.addEventListener('mouseenter', () => {
        isHovering = true;
        currentEmotion = 'happy';
    });

    container.addEventListener('mouseleave', () => {
        isHovering = false;
        currentEmotion = 'neutral';
    });

    // Click reaction (surprise!)
    container.addEventListener('click', () => {
        currentEmotion = 'surprised';
        companion.scale.set(0.95, 0.75, 0.85);
        setTimeout(() => {
            companion.scale.set(0.85, 0.85, 0.85);
            currentEmotion = isHovering ? 'happy' : 'neutral';
        }, 400);
    });

    // Scroll reaction
    let lastScrollY = window.scrollY;
    let scrollDelta = 0;
    window.addEventListener('scroll', () => {
        scrollDelta = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
    }, { passive: true });

    // ----- ANIMATION LOOP -----
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();
        const delta = clock.getDelta();

        // Smooth eye tracking
        targetLookX += (mouseX * 0.35 - targetLookX) * 0.08;
        targetLookY += (mouseY * 0.25 - targetLookY) * 0.08;

        // Head follows mouse with subtle tilting
        companion.rotation.y += (targetLookX * 0.6 - companion.rotation.y) * 0.05;
        companion.rotation.x += (-targetLookY * 0.3 - companion.rotation.x) * 0.05;

        // Move pupils to track cursor
        const pupilRange = 0.04;
        leftPupil.position.x = targetLookX * pupilRange;
        leftPupil.position.y = targetLookY * pupilRange;
        rightPupil.position.x = targetLookX * pupilRange;
        rightPupil.position.y = targetLookY * pupilRange;

        // Gentle hovering bob
        companion.position.y = -0.1 + Math.sin(elapsed * 1.5) * 0.08;

        // Antenna sway
        antenna.rotation.z = Math.sin(elapsed * 2) * 0.1 + targetLookX * 0.15;
        antennaTip.position.x = Math.sin(elapsed * 2) * 0.06;

        // Antenna tip glow pulse
        tipMat.emissiveIntensity = 0.7 + Math.sin(elapsed * 3) * 0.3;

        // Blink system
        blinkTimer += 1;
        if (blinkTimer > 180 + Math.random() * 120) {
            isBlinking = true;
            blinkTimer = 0;
        }
        if (isBlinking) {
            leftEye.scale.y = 0.1;
            rightEye.scale.y = 0.1;
            setTimeout(() => {
                leftEye.scale.y = 1;
                rightEye.scale.y = 1;
                isBlinking = false;
            }, 120);
        }

        // Emotional eye reactions
        if (currentEmotion === 'happy') {
            eyeMat.emissiveIntensity = 1.2;
            leftEye.scale.set(1.15, 1.15, 1);
            rightEye.scale.set(1.15, 1.15, 1);
        } else if (currentEmotion === 'surprised') {
            eyeMat.emissiveIntensity = 1.5;
            leftEye.scale.set(1.4, 1.4, 1);
            rightEye.scale.set(1.4, 1.4, 1);
        } else if (!isBlinking) {
            eyeMat.emissiveIntensity = 0.8;
            leftEye.scale.set(1, 1, 1);
            rightEye.scale.set(1, 1, 1);
        }

        // Scroll reaction (head tilts with scroll direction)
        if (Math.abs(scrollDelta) > 2) {
            companion.rotation.x += scrollDelta * 0.002;
            scrollDelta *= 0.9;
        }

        // Hover bounce
        if (isHovering) {
            companion.position.y += Math.sin(elapsed * 3) * 0.02;
            const bounceScale = 0.85 + Math.sin(elapsed * 2) * 0.02;
            companion.scale.set(bounceScale, bounceScale, bounceScale);
        }

        renderer.render(scene, camera);
    }

    animate();
})();
