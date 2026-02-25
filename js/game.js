/* ============================================================
   GAME — Multi-Game Director (Professional Hub)
   Enhanced version with bug fixes and robustness
   ============================================================ */

(function () {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('gameOverlay');
    const startBtn = document.getElementById('startGame');
    const gameTitle = document.getElementById('gameTitle');
    const scoreLabel = document.getElementById('scoreLabel');

    let activeGame = 'ocean';
    let isRunning = false;
    let score = 0;
    let lastTime = 0;

    // Canvas Sizing
    const resize = () => {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (isRunning && Engines[activeGame]?.onResize) {
            Engines[activeGame].onResize();
        }
    };
    window.addEventListener('resize', resize);
    resize();

    /* ------------------------------------------------------------
       GAME DIRECTOR: Modular Engines
       ------------------------------------------------------------ */

    const Engines = {
        ocean: {
            player: { x: 50, y: 0, w: 40, h: 40, vy: 0 },
            obstacles: [],
            init() {
                this.player.y = canvas.height / 2;
                this.obstacles = [];
                score = 0;
            },
            update(dt) {
                this.player.vy += 0.5;
                this.player.y += this.player.vy;
                if (this.player.y < 0) this.player.y = 0;
                if (this.player.y > canvas.height - this.player.h) this.player.y = canvas.height - this.player.h;

                if (Math.random() < 0.02) {
                    this.obstacles.push({ x: canvas.width, y: Math.random() * (canvas.height - 40), w: 30, h: 40 });
                }

                for (let i = this.obstacles.length - 1; i >= 0; i--) {
                    const o = this.obstacles[i];
                    o.x -= 4;
                    if (o.x + o.w < 0) {
                        this.obstacles.splice(i, 1);
                        score += 10;
                    }
                    if (this.player.x < o.x + o.w && this.player.x + this.player.w > o.x &&
                        this.player.y < o.y + o.h && this.player.y + this.player.h > o.y) {
                        gameOver();
                    }
                }
            },
            draw() {
                ctx.fillStyle = '#8a9a7b';
                ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
                ctx.fillStyle = '#b5a89b';
                this.obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
            },
            input() { this.player.vy = -8; }
        },

        tetris: {
            grid: [],
            piece: { pos: { x: 0, y: 0 }, shape: null },
            cols: 10,
            rows: 0,
            size: 25,
            dropCounter: 0,
            dropInterval: 1000,
            shapes: [
                [[1, 1, 1, 1]],
                [[1, 1], [1, 1]],
                [[0, 1, 0], [1, 1, 1]],
                [[1, 0, 0], [1, 1, 1]],
                [[0, 0, 1], [1, 1, 1]],
                [[1, 1, 0], [0, 1, 1]],
                [[0, 1, 1], [1, 1, 0]]
            ],
            onResize() {
                this.rows = Math.floor(canvas.height / this.size);
                if (this.grid.length !== this.rows) {
                    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
                }
            },
            init() {
                this.rows = Math.floor(canvas.height / this.size);
                this.cols = 10;
                this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
                score = 0;
                this.spawn();
            },
            spawn() {
                const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
                this.piece.shape = shape;
                let startX = Math.floor((this.cols - shape[0].length) / 2);
                this.piece.pos = { x: startX, y: 0 };

                if (this.collide()) {
                    gameOver();
                }
            },
            collide(shape = this.piece.shape, pos = this.piece.pos) {
                for (let y = 0; y < shape.length; y++) {
                    for (let x = 0; x < shape[y].length; x++) {
                        if (shape[y][x] !== 0) {
                            const boardY = pos.y + y;
                            const boardX = pos.x + x;
                            if (boardY >= this.rows || boardX < 0 || boardX >= this.cols || boardY < 0) return true;
                            if (this.grid[boardY] && this.grid[boardY][boardX] !== 0) return true;
                        }
                    }
                }
                return false;
            },
            merge() {
                this.piece.shape.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value !== 0) {
                            const boardY = this.piece.pos.y + y;
                            const boardX = this.piece.pos.x + x;
                            if (boardY >= 0 && boardY < this.rows && boardX >= 0 && boardX < this.cols) {
                                this.grid[boardY][boardX] = value;
                            }
                        }
                    });
                });
            },
            rotate(dir = 1) {
                const s = this.piece.shape;
                const newShape = s[0].map((_, i) => s.map(row => row[i]).reverse());
                if (!this.collide(newShape, this.piece.pos)) {
                    this.piece.shape = newShape;
                }
            },
            hardDrop() {
                while (!this.collide(this.piece.shape, { x: this.piece.pos.x, y: this.piece.pos.y + 1 })) {
                    this.piece.pos.y++;
                }
                this.merge();
                this.sweep();
                this.spawn();
                this.dropCounter = 0;
            },
            sweep() {
                for (let y = this.rows - 1; y >= 0; y--) {
                    if (this.grid[y].every(cell => cell !== 0)) {
                        this.grid.splice(y, 1);
                        this.grid.unshift(new Array(this.cols).fill(0));
                        score += 100;
                        y++;
                    }
                }
            },
            update(dt) {
                this.dropCounter += dt;
                while (this.dropCounter > this.dropInterval) {
                    this.drop();
                }
            },
            drop() {
                if (!this.collide(this.piece.shape, { x: this.piece.pos.x, y: this.piece.pos.y + 1 })) {
                    this.piece.pos.y++;
                } else {
                    this.merge();
                    this.sweep();
                    this.spawn();
                }
                this.dropCounter = 0;
            },
            draw() {
                const offsetX = (canvas.width - this.cols * this.size) / 2;
                ctx.save();
                ctx.translate(offsetX, 0);

                this.grid.forEach((row, y) => {
                    row.forEach((value, x) => {
                        if (value !== 0) {
                            ctx.fillStyle = '#7b7fa3';
                            ctx.fillRect(x * this.size, y * this.size, this.size - 1, this.size - 1);
                        }
                    });
                });

                if (this.piece.shape) {
                    this.piece.shape.forEach((row, y) => {
                        row.forEach((value, x) => {
                            if (value !== 0) {
                                ctx.fillStyle = '#c4a882';
                                ctx.fillRect((x + this.piece.pos.x) * this.size, (y + this.piece.pos.y) * this.size, this.size - 1, this.size - 1);
                            }
                        });
                    });
                }

                ctx.restore();
            },
            input(key) {
                if (key === 'ArrowLeft' || key === 'Left') {
                    const newPos = { x: this.piece.pos.x - 1, y: this.piece.pos.y };
                    if (!this.collide(this.piece.shape, newPos)) this.piece.pos.x--;
                }
                if (key === 'ArrowRight' || key === 'Right') {
                    const newPos = { x: this.piece.pos.x + 1, y: this.piece.pos.y };
                    if (!this.collide(this.piece.shape, newPos)) this.piece.pos.x++;
                }
                if (key === 'ArrowDown' || key === 'Down') this.drop();
                if (key === 'ArrowUp' || key === 'Up') this.rotate();
                if (key === ' ') this.hardDrop();
            }
        },

        platform: {
            player: { x: 50, y: 0, w: 30, h: 30, vx: 0, vy: 0, grounded: false },
            platforms: [
                { x: 0, y: 350, w: 800, h: 50 },
                { x: 200, y: 250, w: 150, h: 20 },
                { x: 450, y: 180, w: 150, h: 20 },
                { x: 100, y: 120, w: 150, h: 20 }
            ],
            init() {
                this.player.x = 50; this.player.y = 200;
                this.player.vx = 0; this.player.vy = 0;
                score = 0;
            },
            update(dt) {
                this.player.vy += 0.8;
                this.player.x += this.player.vx;
                this.player.y += this.player.vy;
                this.player.grounded = false;

                this.platforms.forEach(p => {
                    if (this.player.x < p.x + p.w && this.player.x + this.player.w > p.x &&
                        this.player.y + this.player.h > p.y && this.player.y + this.player.h < p.y + p.h + 20 && this.player.vy >= 0) {
                        this.player.y = p.y - this.player.h;
                        this.player.vy = 0;
                        this.player.grounded = true;
                    }
                });

                if (this.player.y > canvas.height) gameOver();
                score = Math.max(score, Math.floor(this.player.x / 10));
            },
            draw() {
                ctx.fillStyle = '#8a9a7b';
                ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
                ctx.fillStyle = '#444';
                this.platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
            },
            input(key, type) {
                if (type === 'keydown') {
                    if (key === 'ArrowLeft') this.player.vx = -5;
                    if (key === 'ArrowRight') this.player.vx = 5;
                    if (key === 'Space' && this.player.grounded) this.player.vy = -12;
                } else {
                    if (key === 'ArrowLeft' || key === 'ArrowRight') this.player.vx = 0;
                }
            }
        },

        tanks: {
            player: { x: 400, y: 300, angle: 0 },
            bullets: [],
            enemies: [],
            init() {
                this.player.x = canvas.width / 2;
                this.player.y = canvas.height / 2;
                this.bullets = [];
                this.enemies = [];
                score = 0;
            },
            update(dt) {
                if (Math.random() < 0.03) {
                    const side = Math.floor(Math.random() * 4);
                    let ex, ey;
                    if (side === 0) { ex = Math.random() * canvas.width; ey = -20; }
                    else if (side === 1) { ex = canvas.width + 20; ey = Math.random() * canvas.height; }
                    else if (side === 2) { ex = Math.random() * canvas.width; ey = canvas.height + 20; }
                    else { ex = -20; ey = Math.random() * canvas.height; }
                    this.enemies.push({ x: ex, y: ey, speed: 1.5 });
                }

                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const e = this.enemies[i];
                    const dx = this.player.x - e.x;
                    const dy = this.player.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    e.x += (dx / dist) * e.speed;
                    e.y += (dy / dist) * e.speed;
                    if (dist < 20) gameOver();
                }

                for (let i = this.bullets.length - 1; i >= 0; i--) {
                    const b = this.bullets[i];
                    b.x += Math.cos(b.a) * 7;
                    b.y += Math.sin(b.a) * 7;
                    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
                        this.bullets.splice(i, 1);
                        continue;
                    }
                    for (let j = this.enemies.length - 1; j >= 0; j--) {
                        const e = this.enemies[j];
                        const edx = b.x - e.x;
                        const edy = b.y - e.y;
                        if (Math.sqrt(edx * edx + edy * edy) < 20) {
                            this.enemies.splice(j, 1);
                            this.bullets.splice(i, 1);
                            score += 50;
                            break;
                        }
                    }
                }
            },
            draw() {
                ctx.save();
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.player.angle);
                ctx.fillStyle = '#b5a89b';
                ctx.fillRect(-15, -15, 30, 30);
                ctx.fillStyle = '#333';
                ctx.fillRect(0, -3, 20, 6);
                ctx.restore();

                ctx.fillStyle = '#777';
                this.enemies.forEach(e => ctx.fillRect(e.x - 10, e.y - 10, 20, 20));
                ctx.fillStyle = '#e67e22';
                this.bullets.forEach(b => {
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                });
            },
            input(key, type, e) {
                if (type === 'mousemove') {
                    const rect = canvas.getBoundingClientRect();
                    this.player.angle = Math.atan2(e.clientY - rect.top - this.player.y, e.clientX - rect.left - this.player.x);
                }
                if (type === 'mousedown' || key === ' ') {
                    this.bullets.push({ x: this.player.x, y: this.player.y, a: this.player.angle });
                }
            }
        }
    };

    /* ------------------------------------------------------------
       CORE ENGINE: Lifecycle
       ------------------------------------------------------------ */

    const loop = (time) => {
        if (!isRunning) return;
        const dt = time - lastTime;
        lastTime = time;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        Engines[activeGame].update(dt);
        Engines[activeGame].draw();

        scoreLabel.textContent = activeGame === 'ocean' ? `${score}m` : score;
        requestAnimationFrame(loop);
    };

    const gameOver = () => {
        isRunning = false;
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        gameTitle.textContent = "Game Over!";
        startBtn.textContent = "Try Again";
        scoreLabel.style.opacity = '0';
    };

    const startGame = () => {
        isRunning = true;
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        scoreLabel.style.opacity = '1';
        Engines[activeGame].init();
        lastTime = performance.now();
        requestAnimationFrame(loop);
    };

    /* ------------------------------------------------------------
       HANDLERS
       ------------------------------------------------------------ */

    startBtn.addEventListener('click', startGame);

    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            if (isRunning) e.preventDefault();
        }
        if (isRunning) Engines[activeGame].input(e.key, 'keydown');
        if (e.key === ' ' && !isRunning) {
            e.preventDefault();
            startGame();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            if (isRunning) e.preventDefault();
        }
        if (isRunning && Engines[activeGame].input) {
            Engines[activeGame].input(e.key, 'keyup');
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isRunning && Engines[activeGame].input) {
            Engines[activeGame].input(null, 'mousemove', e);
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        if (isRunning && Engines[activeGame].input) {
            Engines[activeGame].input(null, 'mousedown', e);
        }
    });

    window.addEventListener('switchGame', (e) => {
        activeGame = e.detail;
        isRunning = false;
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        scoreLabel.style.opacity = '0';
        gameTitle.textContent = activeGame === 'ocean' ? "Ready to Surf?" :
            activeGame === 'tetris' ? "Block Stack" :
                activeGame === 'platform' ? "Hero Quest" : "Iron Arena";
        startBtn.textContent = "Start Module";
    });

})();