// js/three-bg.js
(function () {
    // 1. Setup Scene, Camera, and Renderer
    const canvas = document.getElementById('three-bg');
    if (!canvas) return;

    const scene = new THREE.Scene();

    // Field of View, Aspect Ratio, Near, Far planes
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Transparent background so CSS gradients show through
        antialias: true,
        powerPreference: "high-performance"
    });

    // Enable advanced rendering features
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // 2. Lighting - Dynamic Cinematic Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Main warm accent light (Golden/Clay)
    const light1 = new THREE.PointLight(0xc4a882, 2.5, 100);
    light1.position.set(10, 10, 10);
    scene.add(light1);

    // Secondary cool accent light (Soft Sage/Indigo)
    const light2 = new THREE.PointLight(0x8a9a7b, 2.0, 100);
    light2.position.set(-15, -10, 15);
    scene.add(light2);

    // Subtle back light for rim lighting
    const light3 = new THREE.PointLight(0x7b7fa3, 1.5, 100);
    light3.position.set(0, 0, -20);
    scene.add(light3);

    // 3. Hyper-Realistic Glass Objects (MeshPhysicalMaterial)
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.05,        // Very smooth
        transmission: 0.9,      // Glass-like transparency
        ior: 1.5,               // Index of Refraction (glass)
        thickness: 0.5,         // Volume thickness
        clearcoat: 1.0,         // Extra shine
        clearcoatRoughness: 0.1
    });

    const objectGroup = new THREE.Group();
    scene.add(objectGroup);

    // Create a mix of geometries (Icosahedron for crystal look, Torus for abstract)
    const geometries = [
        new THREE.IcosahedronGeometry(2, 0),
        new THREE.OctahedronGeometry(1.5, 0),
        new THREE.TorusGeometry(1.2, 0.4, 16, 32)
    ];

    const glassObjects = [];
    const objectCount = 20;

    for (let i = 0; i < objectCount; i++) {
        const geo = geometries[Math.floor(Math.random() * geometries.length)];
        const mesh = new THREE.Mesh(geo, glassMaterial);

        // Randomly position in a wide space
        mesh.position.x = (Math.random() - 0.5) * 60;
        mesh.position.y = (Math.random() - 0.5) * 40;
        mesh.position.z = (Math.random() - 0.5) * 40 - 10;

        // Random rotation
        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;

        // Save initial rotation speeds for animation
        mesh.userData = {
            rotSpeedX: (Math.random() - 0.5) * 0.01,
            rotSpeedY: (Math.random() - 0.5) * 0.01,
            floatSpeed: (Math.random() * 0.005) + 0.002,
            floatOffset: Math.random() * Math.PI * 2
        };

        const scale = Math.random() * 1.5 + 0.5;
        mesh.scale.set(scale, scale, scale);

        objectGroup.add(mesh);
        glassObjects.push(mesh);
    }

    // 4. Ambient Cinematic Dust (Depth of Field Simulation)
    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 1500;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSizes = new Float32Array(dustCount);

    for (let i = 0; i < dustCount * 3; i += 3) {
        dustPositions[i] = (Math.random() - 0.5) * 100;
        dustPositions[i + 1] = (Math.random() - 0.5) * 100;
        dustPositions[i + 2] = (Math.random() - 0.5) * 80;

        // Vary sizes to simulate out-of-focus vs in-focus dust
        dustSizes[i / 3] = Math.random() * 0.3 + 0.05;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));

    // Custom shader material for soft glowing dust
    const dustMaterial = new THREE.PointsMaterial({
        color: 0xe0d6cc, // Warm border color
        size: 0.1,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const dustSystem = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustSystem);


    // 5. Mouse Interaction (Parallax)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        // Normalize mouse coordinates for subtle movement
        mouseX = (event.clientX - windowHalfX) * 0.001;
        mouseY = (event.clientY - windowHalfY) * 0.001;
    });

    // Handle Scroll Parallax
    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // 6. Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Animate Glass Objects
        glassObjects.forEach((mesh) => {
            mesh.rotation.x += mesh.userData.rotSpeedX;
            mesh.rotation.y += mesh.userData.rotSpeedY;
            // Gentle hovering up and down
            mesh.position.y += Math.sin(elapsedTime * mesh.userData.floatSpeed * 100 + mesh.userData.floatOffset) * 0.01;
        });

        // Rotate entire group slowly for cinematic feel
        objectGroup.rotation.y = elapsedTime * 0.05;
        dustSystem.rotation.y = elapsedTime * 0.02;

        // Move lights dynamically to create changing reflections on the glass
        light1.position.x = Math.sin(elapsedTime * 0.5) * 20;
        light1.position.z = Math.cos(elapsedTime * 0.3) * 20;

        light2.position.y = Math.sin(elapsedTime * 0.4) * 15;
        light2.position.z = Math.cos(elapsedTime * 0.6) * 15;

        // Smooth Camera Parallax Response
        targetX = mouseX * 5;
        targetY = mouseY * 5;

        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (-targetY - camera.position.y) * 0.02;

        // Scroll effect - camera descends slightly as you scroll down
        const targetScrollY = -scrollY * 0.01;
        camera.position.y += (targetScrollY - camera.position.y) * 0.05;

        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    animate();

    // 7. Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
