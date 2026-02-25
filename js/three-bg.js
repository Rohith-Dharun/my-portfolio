// js/three-bg.js — Saturn with orbiting particles
(function () {
    // 1. Setup Scene, Camera, and Renderer
    const canvas = document.getElementById('three-bg');
    if (!canvas) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 45;
    camera.position.y = 5;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    // Key light — warm golden (sun-like)
    const sunLight = new THREE.PointLight(0xffe4b5, 3.0, 200);
    sunLight.position.set(30, 15, 20);
    scene.add(sunLight);

    // Fill light — cool indigo
    const fillLight = new THREE.PointLight(0x7b7fa3, 1.5, 150);
    fillLight.position.set(-20, -10, 15);
    scene.add(fillLight);

    // Rim light — sage accent
    const rimLight = new THREE.PointLight(0x8a9a7b, 1.0, 100);
    rimLight.position.set(0, -5, -25);
    scene.add(rimLight);

    // 3. SATURN PLANET
    const saturnGroup = new THREE.Group();
    scene.add(saturnGroup);

    // Planet body
    const planetGeo = new THREE.SphereGeometry(6, 64, 64);
    const planetMat = new THREE.MeshPhysicalMaterial({
        color: 0xd4a76a,
        metalness: 0.1,
        roughness: 0.6,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4
    });

    // Create procedural bands on Saturn
    const planetCanvas = document.createElement('canvas');
    planetCanvas.width = 512;
    planetCanvas.height = 256;
    const ctx = planetCanvas.getContext('2d');

    // Gradient bands like Saturn
    const bandColors = [
        '#e8c778', '#d4a76a', '#c99a5e', '#dbb572', '#c48f4f',
        '#d9b36c', '#c7985a', '#e0c07e', '#d4a56a', '#ca9d60',
        '#ddb875', '#c89458', '#e2c480', '#c5915b', '#d8b06b'
    ];
    const bandHeight = planetCanvas.height / bandColors.length;
    bandColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, i * bandHeight, planetCanvas.width, bandHeight + 1);
    });

    // Add subtle noise to bands
    const imageData = ctx.getImageData(0, 0, planetCanvas.width, planetCanvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15;
        imageData.data[i] += noise;
        imageData.data[i + 1] += noise;
        imageData.data[i + 2] += noise;
    }
    ctx.putImageData(imageData, 0, 0);

    const planetTexture = new THREE.CanvasTexture(planetCanvas);
    planetMat.map = planetTexture;

    const planet = new THREE.Mesh(planetGeo, planetMat);
    saturnGroup.add(planet);

    // 4. SATURN RING
    const ringGeo = new THREE.RingGeometry(8, 13, 128);

    // Fix ring UVs for proper gradient
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const dist = Math.sqrt(x * x + y * y);
        uv.setXY(i, (dist - 8) / 5, 0.5);
    }

    // Ring texture
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512;
    ringCanvas.height = 16;
    const rCtx = ringCanvas.getContext('2d');
    const ringGrad = rCtx.createLinearGradient(0, 0, 512, 0);
    ringGrad.addColorStop(0, 'rgba(200, 180, 150, 0.0)');
    ringGrad.addColorStop(0.05, 'rgba(200, 180, 150, 0.3)');
    ringGrad.addColorStop(0.15, 'rgba(220, 195, 160, 0.6)');
    ringGrad.addColorStop(0.25, 'rgba(180, 160, 130, 0.2)');
    ringGrad.addColorStop(0.3, 'rgba(210, 190, 155, 0.5)');
    ringGrad.addColorStop(0.5, 'rgba(195, 175, 145, 0.45)');
    ringGrad.addColorStop(0.65, 'rgba(180, 160, 130, 0.15)');
    ringGrad.addColorStop(0.7, 'rgba(210, 185, 155, 0.5)');
    ringGrad.addColorStop(0.85, 'rgba(190, 170, 140, 0.35)');
    ringGrad.addColorStop(0.95, 'rgba(200, 180, 150, 0.15)');
    ringGrad.addColorStop(1, 'rgba(200, 180, 150, 0.0)');
    rCtx.fillStyle = ringGrad;
    rCtx.fillRect(0, 0, 512, 16);

    const ringTexture = new THREE.CanvasTexture(ringCanvas);

    const ringMat = new THREE.MeshPhysicalMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        metalness: 0.2,
        roughness: 0.5,
        depthWrite: false
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2.4;
    saturnGroup.add(ring);

    // Tilt Saturn slightly
    saturnGroup.rotation.z = 0.2;
    saturnGroup.rotation.x = 0.15;

    // 5. ORBITING PARTICLES (like asteroids / cosmic dust around Saturn)
    const orbitParticleCount = 800;
    const orbitGeo = new THREE.BufferGeometry();
    const orbitPositions = new Float32Array(orbitParticleCount * 3);
    const orbitColors = new Float32Array(orbitParticleCount * 3);
    const orbitData = []; // Store orbit parameters

    for (let i = 0; i < orbitParticleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 20; // Between ring and far away
        const height = (Math.random() - 0.5) * 6;
        const speed = (0.1 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1);

        orbitPositions[i * 3] = Math.cos(angle) * radius;
        orbitPositions[i * 3 + 1] = height;
        orbitPositions[i * 3 + 2] = Math.sin(angle) * radius;

        // Warm golden / amber colors
        const warmth = Math.random();
        orbitColors[i * 3] = 0.75 + warmth * 0.25;     // R
        orbitColors[i * 3 + 1] = 0.65 + warmth * 0.2;  // G
        orbitColors[i * 3 + 2] = 0.4 + warmth * 0.2;   // B

        orbitData.push({ angle, radius, height, speed });
    }

    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    orbitGeo.setAttribute('color', new THREE.BufferAttribute(orbitColors, 3));

    const orbitMat = new THREE.PointsMaterial({
        size: 0.15,
        transparent: true,
        opacity: 0.7,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const orbitSystem = new THREE.Points(orbitGeo, orbitMat);
    scene.add(orbitSystem);

    // 6. DISTANT STAR FIELD
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 80 + Math.random() * 60;
        starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = r * Math.cos(phi);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMat = new THREE.PointsMaterial({
        color: 0xe0d6cc,
        size: 0.08,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 7. ORBITING MOONS / ASTEROIDS (Larger 3D Objects)
    const moonGroup = new THREE.Group();
    scene.add(moonGroup);

    const moonGeometries = [
        new THREE.IcosahedronGeometry(1.2, 0),
        new THREE.DodecahedronGeometry(0.8, 0),
        new THREE.SphereGeometry(1.5, 32, 32),
        new THREE.TetrahedronGeometry(1.0, 1) // Asteroid look
    ];

    const moonMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xcccccc,
        metalness: 0.3,
        roughness: 0.7,
        clearcoat: 0.2,
        clearcoatRoughness: 0.8
    });

    // Glassy asteroid material
    const glassyMoonMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe0d6cc,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.8,
        ior: 1.5,
        thickness: 0.5
    });

    const moons = [];
    const moonCount = 8; // Number of larger orbiting bodies

    for (let i = 0; i < moonCount; i++) {
        const isGlassy = Math.random() > 0.5;
        const geo = moonGeometries[Math.floor(Math.random() * moonGeometries.length)];
        const mesh = new THREE.Mesh(geo, isGlassy ? glassyMoonMaterial : moonMaterial);

        // Orbit parameters
        const distance = 25 + Math.random() * 20; // Distance from Saturn
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 15;

        // Random scale variation
        const scale = 0.5 + Math.random() * 1.2;
        mesh.scale.set(scale, scale, scale);

        // Initial position
        mesh.position.set(
            Math.cos(angle) * distance,
            height,
            Math.sin(angle) * distance
        );

        // Store orbit data
        mesh.userData = {
            angle: angle,
            distance: distance,
            height: height,
            orbitSpeed: (0.05 + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1),
            rotSpeedX: (Math.random() - 0.5) * 0.02,
            rotSpeedY: (Math.random() - 0.5) * 0.02,
            rotSpeedZ: (Math.random() - 0.5) * 0.02
        };

        moonGroup.add(mesh);
        moons.push(mesh);
    }

    // 7. Mouse Interaction (Parallax)
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    }, { passive: true });

    // 8. Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Rotate Saturn slowly
        planet.rotation.y = elapsed * 0.08;

        // Rotate ring slightly differently
        ring.rotation.z = elapsed * 0.02;

        // Animate larger moons / asteroids
        moons.forEach(moon => {
            const data = moon.userData;
            // Orbit movement
            data.angle += data.orbitSpeed * 0.01;
            moon.position.x = Math.cos(data.angle) * data.distance;
            moon.position.z = Math.sin(data.angle) * data.distance;
            // Add a slight bobbing to height
            moon.position.y = data.height + Math.sin(elapsed * 0.5 + data.angle) * 2.0;

            // Self rotation
            moon.rotation.x += data.rotSpeedX;
            moon.rotation.y += data.rotSpeedY;
            moon.rotation.z += data.rotSpeedZ;
        });

        // Animate orbiting particles
        const positions = orbitGeo.attributes.position.array;
        for (let i = 0; i < orbitParticleCount; i++) {
            const data = orbitData[i];
            data.angle += data.speed * 0.002;
            positions[i * 3] = Math.cos(data.angle) * data.radius;
            positions[i * 3 + 1] = data.height + Math.sin(elapsed * 0.5 + data.angle) * 0.5;
            positions[i * 3 + 2] = Math.sin(data.angle) * data.radius;
        }
        orbitGeo.attributes.position.needsUpdate = true;

        // Slowly rotate the star field
        stars.rotation.y = elapsed * 0.005;
        stars.rotation.x = elapsed * 0.002;

        // Dynamic lighting orbit
        sunLight.position.x = Math.sin(elapsed * 0.3) * 30;
        sunLight.position.z = Math.cos(elapsed * 0.2) * 25;

        // Smooth Camera Parallax
        camera.position.x += (mouseX * 6 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 4 + 5 - camera.position.y) * 0.02;

        // Scroll parallax
        const targetScrollY = -scrollY * 0.008 + 5;
        camera.position.y += (targetScrollY - camera.position.y) * 0.03;

        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    animate();

    // 9. Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
