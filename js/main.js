/* ============================================================
   MAIN — Core orchestration, high-performance animations (Optimized)
   ============================================================ */

(function () {
    /* ---- STATE & REFS ---- */
    const state = {
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        centerX: window.innerWidth / 2,
        centerY: window.innerHeight / 2,
        isIntroActive: true
    };

    const DOM = {
        loader: document.getElementById('loader'),
        loaderFill: document.getElementById('loaderFill'),
        intro: document.getElementById('introScreen'),
        main: document.getElementById('portfolioMain'),
        enterBtn: document.getElementById('enterBtn'),
        navbar: document.getElementById('mainNavbar'),
        modeToggles: document.querySelector('.mode-toggles'),
        worldMap: document.querySelector('.world-map'),
        guide: document.getElementById('guideCharacter'),
        guideSpeech: document.getElementById('guideSpeech'),
        bgCharacter: document.getElementById('bg-character-layer'),
        eyeL: document.getElementById('char-eye-l'),
        eyeR: document.getElementById('char-eye-r'),
        gradientLayer: document.getElementById('bg-gradient-layer')
    };

    /* ---- LOADER ENGINE ---- */
    let progress = 0;
    const loadInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadInterval);
            setTimeout(() => {
                if (DOM.loader) DOM.loader.classList.add('fade-out');
                setTimeout(() => {
                    document.body.classList.remove('loading-lock');
                    document.documentElement.classList.remove('loading-lock');
                }, 500);
            }, 300);
        }
        if (DOM.loaderFill) DOM.loaderFill.style.width = progress + '%';
    }, 100);

    /* ---- BACKGROUND PARTICLES ---- */
    const spawnParticles = () => {
        const container = document.getElementById('bg-particles');
        if (!container) return;
        for (let i = 0; i < 15; i++) {
            const p = document.createElement('div');
            p.className = 'bg-particle';
            const size = 100 + Math.random() * 300;
            p.style.cssText = `
                width: ${size}px; height: ${size}px;
                left: ${Math.random() * 100}%; top: ${Math.random() * 100}%;
                --duration: ${40 + Math.random() * 40}s;
                --delay: ${Math.random() * -30}s;
            `;
            container.appendChild(p);
        }
    };
    spawnParticles();

    /* ---- RENDER LOOP (High Performance) ---- */
    const render = () => {
        state.targetX += (state.mouseX - state.targetX) * 0.1;
        state.targetY += (state.mouseY - state.targetY) * 0.1;

        const offsetX = (state.targetX - state.centerX);
        const offsetY = (state.targetY - state.centerY);

        // 1. Character Reactivity
        if (DOM.bgCharacter) {
            const tiltX = -offsetY * 0.015;
            const tiltY = offsetX * 0.015;
            DOM.bgCharacter.style.transform = `perspective(1200px) translate3d(${offsetX * 0.02}px, ${offsetY * 0.02}px, 50px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        }

        // 2. Eye Tracking
        if (DOM.eyeL && DOM.eyeR) {
            const eyeX = offsetX * 0.005;
            const eyeY = offsetY * 0.005;
            DOM.eyeL.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
            DOM.eyeR.style.transform = `translate(${eyeX}px, ${eyeY}px)`;
        }

        // 3. Side Visuals Parallax
        document.querySelectorAll('.side-visual-container').forEach(visual => {
            const rect = visual.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const distXRat = (state.targetX - (rect.left + rect.width / 2)) / window.innerWidth;
                const distYRat = (state.targetY - (rect.top + rect.height / 2)) / window.innerHeight;
                visual.style.transform = `perspective(1200px) translate(${distXRat * 20}px, ${distYRat * 20}px) rotateX(${distYRat * -8}deg) rotateY(${distXRat * 8}deg)`;
            }
        });

        // 4. Particle Layer Parallax
        document.querySelectorAll('.bg-particle').forEach((p, i) => {
            const depth = (i - 7) * 80;
            const factor = 0.015 + (i * 0.004);
            p.style.transform = `perspective(1200px) translate3d(${offsetX * factor}px, ${offsetY * factor}px, ${depth}px)`;
        });

        // 5. Magnetic Buttons (only update if hovering)
        document.querySelectorAll('.cta-btn, .enter-btn').forEach(btn => {
            if (btn.classList.contains('hovering')) {
                const bRect = btn.getBoundingClientRect();
                const mX = (state.mouseX - (bRect.left + bRect.width / 2)) * 0.35;
                const mY = (state.mouseY - (bRect.top + bRect.height / 2)) * 0.35;
                btn.style.transform = `translate3d(${mX}px, ${mY}px, 0) scale(1.05)`;
            }
        });

        requestAnimationFrame(render);
    };

    /* ---- INTERACTION HANDLERS ---- */
    window.addEventListener('mousemove', (e) => {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
    });

    window.addEventListener('resize', () => {
        state.centerX = window.innerWidth / 2;
        state.centerY = window.innerHeight / 2;
    });

    // Magnetic Button Triggers
    document.querySelectorAll('.cta-btn, .enter-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => btn.classList.add('hovering'));
        btn.addEventListener('mouseleave', () => {
            btn.classList.remove('hovering');
            btn.style.transform = '';
        });
    });

    /* ---- OBSERVERS & FLOW ---- */
    // Gaming Hub Selectors
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.dispatchEvent(new CustomEvent('switchGame', { detail: btn.dataset.game }));
        });
    });

    if (DOM.enterBtn) {
        DOM.enterBtn.addEventListener('click', () => {
            state.isIntroActive = false;
            if (DOM.intro) DOM.intro.classList.add('hidden');
            if (DOM.main) DOM.main.style.opacity = '1';
            setTimeout(() => {
                if (DOM.navbar) DOM.navbar.classList.add('visible');
                if (DOM.modeToggles) DOM.modeToggles.classList.add('visible');
                if (DOM.worldMap) DOM.worldMap.classList.add('visible');
                if (DOM.guide) DOM.guide.classList.add('visible');
                initScrollObservers();
            }, 600);
        });
    }

    function initScrollObservers() {
        const revealConfig = { threshold: 0.2, rootMargin: '0px 0px -50px 0px' };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view', 'visible', 'active');

                    const staggerable = entry.target.querySelectorAll('.power-category, .mission-card, .timeline-entry, .game-btn');
                    staggerable.forEach((child, i) => {
                        child.style.transitionDelay = `${i * 0.1}s`;
                        child.classList.add('reveal');
                    });

                    const id = entry.target.id;
                    if (id) {
                        document.querySelectorAll('.map-dot').forEach(d => d.classList.remove('active'));
                        const dot = document.querySelector(`.map-dot[data-dest="${id}"]`);
                        if (dot) dot.classList.add('active');
                        updateBackgroundGradient(id);

                        // Highlight active navbar link
                        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                        const navLink = document.querySelector(`.nav-link[data-section="${id}"]`);
                        if (navLink) navLink.classList.add('active');
                    }
                }
            });
        }, revealConfig);

        document.querySelectorAll('.chapter, .fade-up, .scroll-reveal').forEach(el => observer.observe(el));
    }

    function updateBackgroundGradient(chapterId) {
        if (!DOM.gradientLayer) return;
        const gradients = {
            awakening: 'radial-gradient(ellipse at 20% 30%, rgba(123,127,163,0.06) 0%, transparent 50%)',
            path: 'radial-gradient(ellipse at 30% 50%, rgba(138,154,123,0.08) 0%, transparent 50%)',
            skills: 'radial-gradient(ellipse at 50% 40%, rgba(196,168,130,0.07) 0%, transparent 50%)',
            trials: 'radial-gradient(ellipse at 70% 60%, rgba(123,127,163,0.07) 0%, transparent 50%)',
            evolving: 'radial-gradient(ellipse at 40% 50%, rgba(138,154,123,0.06) 0%, transparent 50%)',
            horizon: 'radial-gradient(ellipse at 60% 40%, rgba(181,168,155,0.08) 0%, transparent 50%)'
        };
        DOM.gradientLayer.style.background = gradients[chapterId] || gradients.awakening;
    }

    /* ---- WORLD MAP NAVIGATION ---- */
    document.querySelectorAll('.map-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const target = document.getElementById(dot.dataset.dest);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    /* ---- SCROLL PROGRESS BAR ---- */
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    }, { passive: true });

    /* ---- BUTTON RIPPLE EFFECT ---- */
    document.querySelectorAll('.enter-btn, .cta-btn, .manifest-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    /* ---- POWER BAR FILL ON SCROLL ---- */
    const powerBarObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const fills = entry.target.querySelectorAll('.power-fill');
                fills.forEach(fill => {
                    const targetWidth = fill.getAttribute('data-width');
                    if (targetWidth) {
                        setTimeout(() => {
                            fill.style.width = targetWidth;
                        }, 300);
                    }
                });
                powerBarObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('#skills').forEach(el => powerBarObserver.observe(el));

    /* ---- STORY CARD 3D TILT ON HOVER ---- */
    document.querySelectorAll('.story-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });

    /* ---- SIDE VISUAL IMAGE 3D TILT ON HOVER ---- */
    document.querySelectorAll('.side-visual-container').forEach(container => {
        const img = container.querySelector('.side-visual-img');
        if (!img) return;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;
            img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.06) translateZ(20px)`;
        });

        container.addEventListener('mouseleave', () => {
            img.style.transform = '';
        });
    });

    /* ---- SMOOTH NUMBER COUNTER FOR STATS ---- */
    function animateCounter(element, target, duration) {
        let start = 0;
        const startTime = performance.now();
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(eased * target);
            element.textContent = current;
            if (progress < 1) requestAnimationFrame(step);
            else element.textContent = target;
        }
        requestAnimationFrame(step);
    }

    /* ---- NAVBAR HAMBURGER & SCROLL ---- */
    const navHamburger = document.getElementById('navHamburger');
    const navLinks = document.querySelector('.nav-links');
    const mainNavbar = document.getElementById('mainNavbar');

    if (navHamburger && navLinks) {
        navHamburger.addEventListener('click', () => {
            navHamburger.classList.toggle('open');
            navLinks.classList.toggle('open');
        });

        // Close mobile nav when a link is clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navHamburger.classList.remove('open');
                navLinks.classList.remove('open');
            });
        });
    }

    // Shrink navbar slightly on scroll
    window.addEventListener('scroll', () => {
        if (!mainNavbar) return;
        if (window.scrollY > 50) {
            mainNavbar.style.padding = '0 3%';
            mainNavbar.style.background = 'rgba(250, 245, 239, 0.9)';
            mainNavbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
        } else {
            mainNavbar.style.padding = '10px 3%';
            mainNavbar.style.background = 'rgba(250, 245, 239, 0.75)';
            mainNavbar.style.boxShadow = 'none';
        }
    }, { passive: true });

    /* ---- BACKEND SERVICE ---- */
    const API_BASE = 'http://127.0.0.1:5000/api';

    async function initBackendFeatures() {
        // 1. Visits
        try {
            const vRes = await fetch(`${API_BASE}/visits`, { method: 'POST' });
            const vData = await vRes.json();
            const counterEl = document.querySelector('#visitorCounter span');
            if (counterEl) counterEl.textContent = `Visitors: ${vData.count}`;
        } catch (e) { console.error("Visits API down"); }

        // 2. Likes
        try {
            const lRes = await fetch(`${API_BASE}/likes`);
            const lData = await lRes.json();
            Object.keys(lData).forEach(pid => {
                const countEl = document.querySelector(`.mission-card[data-project-id="${pid}"] .like-count`);
                if (countEl) countEl.textContent = lData[pid];
            });
        } catch (e) { console.error("Likes API down"); }


    }



    // Like Click Handler
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            if (this.classList.contains('liked')) return;

            const card = this.closest('.mission-card');
            const pid = card ? card.dataset.projectId : null;
            if (!pid) return;

            this.classList.add('animating');
            try {
                const res = await fetch(`${API_BASE}/likes/${pid}`, { method: 'POST' });
                const data = await res.json();
                this.querySelector('.like-count').textContent = data.like_count;
                this.classList.add('liked');
            } catch (e) {
                console.error("Failed to like project");
            } finally {
                setTimeout(() => this.classList.remove('animating'), 500);
            }
        });
    });



    // Initialize backend features
    initBackendFeatures();

    // Start Loops
    requestAnimationFrame(render);
})();