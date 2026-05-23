/**
 * canvas.js - Interactive Fluid Pastel Canvas Animation
 * Implements organic, morphing metaball-like pastel blobs that react dynamically
 * to mouse movements, touch input, and the narrative scene states.
 */

class InteractiveCanvas {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.currentScene = 1;
        
        // Mouse/Touch state
        this.mouse = {
            x: -1000,
            y: -1000,
            targetX: -1000,
            targetY: -1000,
            radius: 180,
            isPressed: false,
            speed: 0,
            lastX: 0,
            lastY: 0
        };

        this.blobs = [];
        this.particles = [];
        this.animationFrameId = null;
        this.time = 0;

        // Custom Pastel Palettes (RGB for gradient interpolation)
        this.palette = {
            pink: { r: 250, g: 208, b: 196 },      // #FAD0C4
            purple: { r: 224, g: 195, b: 252 },    // #E0C3FC
            blue: { r: 179, g: 221, b: 242 },      // #B3DDF2
            peach: { r: 255, g: 210, b: 196 },     // #FFD2C4
            gold: { r: 255, g: 234, b: 165 },      // #FFEAA5
            green: { r: 212, g: 241, b: 201 }      // #D4F1C9
        };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInteraction();
        this.setupScene(1);
        this.loop();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setupInteraction() {
        const handleMove = (x, y) => {
            this.mouse.targetX = x;
            this.mouse.targetY = y;
            
            // Calculate velocity/speed for chime spark triggers
            const dx = x - this.mouse.lastX;
            const dy = y - this.mouse.lastY;
            this.mouse.speed = Math.sqrt(dx * dx + dy * dy);
            
            this.mouse.lastX = x;
            this.mouse.lastY = y;

            // Trigger random high-pitched background sparks if cursor moves quickly (tactile feel)
            if (this.mouse.speed > 25 && Math.random() < 0.08) {
                if (window.sound && window.sound.initialized) {
                    window.sound.playSpark(Math.min(0.08, this.mouse.speed / 400));
                }
                this.spawnTrailParticle(x, y);
            }
        };

        window.addEventListener('mousemove', (e) => {
            handleMove(e.clientX, e.clientY);
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('mousedown', () => {
            this.mouse.isPressed = true;
            if (this.currentScene === 4) {
                if (window.sound) window.sound.setHeartResonance(true);
            }
        });

        window.addEventListener('mouseup', () => {
            this.mouse.isPressed = false;
            if (this.currentScene === 4) {
                if (window.sound) window.sound.setHeartResonance(false);
            }
        });

        window.addEventListener('touchstart', (e) => {
            this.mouse.isPressed = true;
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
            if (this.currentScene === 4) {
                if (window.sound) window.sound.setHeartResonance(true);
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.mouse.isPressed = false;
            if (this.currentScene === 4) {
                if (window.sound) window.sound.setHeartResonance(false);
            }
        });
    }

    /**
     * Changes blob configuration depending on the narrative slide state.
     * @param {number} sceneNum - The slide number (1 to 5)
     */
    setupScene(sceneNum) {
        this.currentScene = sceneNum;
        this.blobs = [];
        this.particles = [];

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        switch (sceneNum) {
            case 1:
                // Scene 1: One huge central breathing blob (The Origin)
                this.blobs.push(new MorphingBlob(
                    centerX, 
                    centerY, 
                    Math.min(this.width, this.height) * 0.22, 
                    this.palette.pink, 
                    this.palette.gold, 
                    0.008
                ));
                break;

            case 2:
                // Scene 2: 4 smaller playful pastel blobs wandering around (Warmth of Hands)
                const colors = [this.palette.pink, this.palette.purple, this.palette.blue, this.palette.peach];
                const altColors = [this.palette.gold, this.palette.blue, this.palette.peach, this.palette.green];
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const bx = centerX + Math.cos(angle) * 150;
                    const by = centerY + Math.sin(angle) * 150;
                    const size = Math.min(this.width, this.height) * 0.12 + Math.random() * 20;
                    this.blobs.push(new MorphingBlob(bx, by, size, colors[i], altColors[i], 0.012 + i * 0.002));
                }
                break;

            case 3:
                // Scene 3: Layered pastel fields / horizontal scrolling waves (Garden of Gratitude)
                // We make them large and slow-moving, positioned bottom-aligned
                this.blobs.push(new MorphingBlob(
                    this.width * 0.2, 
                    this.height * 0.7, 
                    Math.min(this.width, this.height) * 0.26, 
                    this.palette.purple, 
                    this.palette.blue, 
                    0.006
                ));
                this.blobs.push(new MorphingBlob(
                    this.width * 0.8, 
                    this.height * 0.65, 
                    Math.min(this.width, this.height) * 0.24, 
                    this.palette.blue, 
                    this.palette.green, 
                    0.005
                ));
                this.blobs.push(new MorphingBlob(
                    this.width * 0.5, 
                    this.height * 0.8, 
                    Math.min(this.width, this.height) * 0.28, 
                    this.palette.green, 
                    this.palette.gold, 
                    0.004
                ));
                break;

            case 4:
                // Scene 4: Single large central morphing heart-ish blob (Symphony of Heart)
                this.blobs.push(new MorphingBlob(
                    centerX, 
                    centerY, 
                    Math.min(this.width, this.height) * 0.25, 
                    this.palette.pink, 
                    this.palette.purple, 
                    0.018 // vibrates slightly more
                ));
                break;

            case 5:
                // Scene 5: Beautiful endless flowing pastel waves
                // Let's spawn many medium-sized, lazy floating bubbles that drift upwards
                const oceanColors = [this.palette.pink, this.palette.purple, this.palette.blue, this.palette.peach, this.palette.gold, this.palette.green];
                for (let i = 0; i < 8; i++) {
                    const bx = Math.random() * this.width;
                    const by = Math.random() * this.height;
                    const size = 50 + Math.random() * 70;
                    const c1 = oceanColors[i % oceanColors.length];
                    const c2 = oceanColors[(i + 1) % oceanColors.length];
                    const blob = new MorphingBlob(bx, by, size, c1, c2, 0.006 + Math.random() * 0.005);
                    blob.isDrifter = true; // Drifts upward
                    blob.vx = (Math.random() - 0.5) * 0.4;
                    blob.vy = -0.3 - Math.random() * 0.4;
                    this.blobs.push(blob);
                }
                break;
        }
    }

    /**
     * Spawns a beautiful CSS/HTML based particle trail that drifts upwards and fades out
     */
    spawnTrailParticle(x, y) {
        const parent = document.getElementById('particles-overlay');
        if (!parent) return;

        const particle = document.createElement('div');
        particle.className = 'trail-particle';
        
        // Random pastel color from palette
        const colors = ['#FAD0C4', '#E0C3FC', '#B3DDF2', '#FFD2C4', '#FFEAA5', '#D4F1C9'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 10px ${color}`;
        
        // Random scaling and drifting behavior
        const scale = 0.5 + Math.random() * 1.5;
        const driftX = (Math.random() - 0.5) * 80;
        particle.style.transform = `scale(${scale})`;
        
        parent.appendChild(particle);

        // Remove after animation completes
        setTimeout(() => {
            particle.remove();
        }, 1200);
    }

    /**
     * Dynamic visual flare/particles spawned inside the Canvas upon action (like clicking gratitude sparks)
     */
    triggerCanvasFlare(x, y, colorCode) {
        const count = 25;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 5,
                color: colorCode || `rgba(255, 180, 180, 0.8)`,
                alpha: 1.0,
                decay: 0.015 + Math.random() * 0.02
            });
        }
    }

    loop() {
        this.time += 0.02;

        // Smooth mouse position damping (exponential decay)
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

        // Clear Canvas with a semi-transparent layer to create elegant motion tails
        this.ctx.fillStyle = `rgba(252, 246, 245, 0.16)`;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Blending operation for smooth overlapping metaball integration
        // 'multiply' or 'source-over' with heavy canvas blur (via CSS) creates beautiful organic melting colors
        this.ctx.globalCompositeOperation = 'source-over';

        // Draw and update morphing blobs
        this.blobs.forEach(blob => {
            blob.update(this.time, this.mouse, this.width, this.height, this.currentScene);
            blob.draw(this.ctx);
        });

        // Update and draw canvas particles (flares)
        this.ctx.globalCompositeOperation = 'screen';
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.03; // Slight gravity
            p.alpha -= p.decay;
            p.radius *= 0.98;

            if (p.alpha <= 0 || p.radius < 0.2) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            this.ctx.restore();
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}

/**
 * MorphingBlob helper class - renders a highly organic fluid blob using Bézier loops
 */
class MorphingBlob {
    constructor(x, y, radius, colorRGB1, colorRGB2, morphSpeed) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.radius = radius;
        this.baseRadius = radius;
        this.colorRGB1 = colorRGB1;
        this.colorRGB2 = colorRGB2;
        this.morphSpeed = morphSpeed;
        
        // Drifter properties (Scene 5)
        this.isDrifter = false;
        this.vx = 0;
        this.vy = 0;

        // Blob surface quality: Number of control points on perimeter
        this.numPoints = 12;
        this.points = [];
        this.angleStep = (Math.PI * 2) / this.numPoints;

        // Initialize individual radial control offsets
        for (let i = 0; i < this.numPoints; i++) {
            this.points.push({
                angle: i * this.angleStep,
                offset: 0,
                targetOffset: 0,
                waveOffset: Math.random() * 100 // Phase offset
            });
        }
    }

    update(time, mouse, width, height, currentScene) {
        // 1. Drifting movement for Scene 5
        if (this.isDrifter) {
            this.x += this.vx;
            this.y += this.vy;

            // Recirculate drift bubbles upwards
            if (this.y < -this.radius) {
                this.y = height + this.radius;
                this.x = Math.random() * width;
            }
            if (this.x < -this.radius) this.x = width + this.radius;
            if (this.x > width + this.radius) this.x = -this.radius;
        } else if (currentScene === 1) {
            // Scene 1: Central orbital oscillation
            this.x = this.startX + Math.sin(time * 0.4) * 25;
            this.y = this.startY + Math.cos(time * 0.3) * 15;
        } else if (currentScene === 4) {
            // Scene 4: Magnetic pull and heartbeat pulse animation
            this.x += (this.startX - this.x) * 0.05;
            this.y += (this.startY - this.y) * 0.05;
            
            // Adjust base size on heartbeat pulse or mouse hold
            let targetRad = this.baseRadius;
            if (mouse.isPressed) {
                targetRad = this.baseRadius * 1.35 + Math.sin(time * 15) * 12; // Rapid pulsing expansion
            } else {
                targetRad = this.baseRadius + Math.sin(time * 3) * 6; // Relaxed organic heartbeat
            }
            this.radius += (targetRad - this.radius) * 0.1;
        } else {
            // General scene movement: slow, organic drifting
            this.x += Math.sin(time * this.morphSpeed * 20 + this.baseRadius) * 0.25;
            this.y += Math.cos(time * this.morphSpeed * 15 + this.baseRadius) * 0.25;
        }

        // 2. Adjust points along perimeter to morph organically and react to mouse
        this.points.forEach(p => {
            const pCos = Math.cos(p.angle);
            const pSin = Math.sin(p.angle);
            
            // Absolute coordinates of this point on the perimeter
            const px = this.x + pCos * this.radius;
            const py = this.y + pSin * this.radius;

            // Calculate distance to mouse
            const dx = px - mouse.x;
            const dy = py - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let mousePush = 0;
            // Repulsive surface tension if cursor is close
            if (dist < mouse.radius) {
                const force = (1.0 - dist / mouse.radius);
                // Push points inward or outward depending on state
                mousePush = -force * 45 * (mouse.isPressed ? 1.5 : 1.0);
            }

            // Natural wave fluctuation based on trigonometric noise
            const wave = Math.sin(time * this.morphSpeed * 50 + p.waveOffset) * (this.radius * 0.12);
            const waveSecondary = Math.cos(time * this.morphSpeed * 25 - p.waveOffset) * (this.radius * 0.05);

            p.targetOffset = wave + waveSecondary + mousePush;
            
            // Smoothly ease the offset changes
            p.offset += (p.targetOffset - p.offset) * 0.1;
        });
    }

    draw(ctx) {
        ctx.save();

        // 1. Create elegant multi-stop radial gradient for the pastel bubble
        const grad = ctx.createRadialGradient(
            this.x - this.radius * 0.2, 
            this.y - this.radius * 0.2, 
            this.radius * 0.05, 
            this.x, 
            this.y, 
            this.radius * 1.2
        );
        
        const c1 = this.colorRGB1;
        const c2 = this.colorRGB2;
        grad.addColorStop(0, `rgba(${c1.r + 15}, ${c1.g + 15}, ${c1.b + 15}, 0.85)`);
        grad.addColorStop(0.5, `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.7)`);
        grad.addColorStop(1, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0.0)`);

        ctx.fillStyle = grad;

        // 2. Draw smooth organic perimeter using quadratic curve interpolation
        ctx.beginPath();

        const firstPoint = this.points[0];
        const firstR = this.radius + firstPoint.offset;
        let startX = this.x + Math.cos(firstPoint.angle) * firstR;
        let startY = this.y + Math.sin(firstPoint.angle) * firstR;

        ctx.moveTo(startX, startY);

        for (let i = 0; i < this.numPoints; i++) {
            const curr = this.points[i];
            const next = this.points[(i + 1) % this.numPoints];

            const currR = this.radius + curr.offset;
            const nextR = this.radius + next.offset;

            const cx1 = this.x + Math.cos(curr.angle) * currR;
            const cy1 = this.y + Math.sin(curr.angle) * currR;

            const cx2 = this.x + Math.cos(next.angle) * nextR;
            const cy2 = this.y + Math.sin(next.angle) * nextR;

            // Average current and next points to create smooth control joints
            const midX = (cx1 + cx2) / 2;
            const midY = (cy1 + cy2) / 2;

            ctx.quadraticCurveTo(cx1, cy1, midX, midY);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// Instantiate and bind InteractiveCanvas globally
window.interactiveCanvas = new InteractiveCanvas();
