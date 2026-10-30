p5.disableFriendlyErrors = true; // Must run before setup()

// -------------------------------------------------------------
// ⚙️ CONFIGURATION - INTERACTIVE TITLE ONLY
// -------------------------------------------------------------
let textStr = "Lab.";
let baseFontSize = 184; // Increased by 4rem (64px) from 120

// Dynamics (RESTORED TO ORIGINAL)
let dotSize = 1;
let maxSpeed = 20;
let maxForce = 0.5;
let mouseRadius = 45;
let homeLoyalty = 0.8;
let mouseFear = 2.0;

// Colors
let particleColor = [245, 245, 245]; // Restored to 245
// -------------------------------------------------------------

let fontHeader;
let particles = [];
let initialized = false;
let header;
let fontSize;
let marginX, marginY;
let mouseLocal; // Reused every frame instead of allocating one per particle

function preload() {
    fontHeader = loadFont('Satoshi-Bold.otf');
}

function setup() {
    header = document.getElementById('header-canvas');
    let canvas = createCanvas(header.offsetWidth, header.offsetHeight);
    canvas.parent('header-canvas');
    pixelDensity(min(displayDensity(), 2)); // Cap at 2x: same crispness on retina, skips 3x phone overdraw
    textFont(fontHeader);
    mouseLocal = createVector(0, 0);

    updateResponsiveParams();
}

function updateResponsiveParams() {
    if (width < 600) {
        fontSize = (width * 0.20) + 32; // Added ~2rem (32px) to the base responsive size
        marginX = width * 0.06; // Match 6vw from CSS --site-pad
        marginY = height * 0.35; // Position text higher in the tighter 45vh container
    } else {
        fontSize = baseFontSize;
        marginX = 60; 
        marginY = height * 0.35; // Moved up slightly to ensure 184px font doesn't hit the top:60% description
    }
}

function initSketch() {
    if (fontHeader && !initialized) {
        particles = [];
        let pg = createGraphics(width, height);
        pg.pixelDensity(1);
        pg.textFont(fontHeader);
        pg.textSize(fontSize);
        pg.textAlign(LEFT, TOP);
        pg.fill(255);

        // Draw text starting at 0 (we translate in draw)
        pg.text(textStr, 0, 0);

        pg.loadPixels();
        const step = dotSize; // Restored to exactly dotSize
        for (let y = 0; y < pg.height; y += step) {
            for (let x = 0; x < pg.width; x += step) {
                let index = (x + y * pg.width) * 4;
                if (pg.pixels[index] > 128) {
                    particles.push(new Particle(x, y));
                }
            }
        }
        initialized = true;
    }
}

function draw() {
    background(0);
    if (fontHeader) {
        if (!initialized) initSketch();

        // Essential: mouse offset by translation
        mouseLocal.set(mouseX - marginX, mouseY - marginY);

        push();
        translate(marginX, marginY);

        // Batched: every particle goes into one canvas path, filled once
        // (+0.5 size fix kept for gapless rendering; rects centered on the particle)
        const ctx = drawingContext;
        const s = dotSize + 0.5;
        ctx.fillStyle = `rgb(${particleColor[0]}, ${particleColor[1]}, ${particleColor[2]})`;
        ctx.beginPath();
        for (let p of particles) {
            p.update(mouseLocal);
            ctx.rect(p.pos.x - s / 2, p.pos.y - s / 2, s, s);
        }
        ctx.fill();
        pop();
    }
}

class Particle {
    constructor(x, y) {
        this.home = createVector(x, y);
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.acc = createVector(0, 0);
    }

    update(mouse) {
        let arrive = this.calculateArrive(this.home);

        // RESTORED: Dynamic Multipliers
        arrive.mult(homeLoyalty);
        this.applyForce(arrive);

        // Flee only inside mouseRadius (cheap squared-distance test; outside it the force was zero)
        let dx = mouse.x - this.pos.x;
        let dy = mouse.y - this.pos.y;
        if (dx * dx + dy * dy < mouseRadius * mouseRadius) {
            let flee = this.calculateFlee(mouse);
            flee.mult(mouseFear);
            this.applyForce(flee);
        }

        this.vel.add(this.acc);
        this.vel.limit(maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    calculateArrive(target) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        let speed = maxSpeed;
        if (d < 100) speed = map(d, 0, 100, 0, maxSpeed);
        desired.setMag(speed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(maxForce);
        return steer;
    }

    calculateFlee(target) {
        // Caller has already checked the particle is inside mouseRadius
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(maxSpeed);
        desired.mult(-1);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(maxForce);
        return steer;
    }

    applyForce(f) {
        this.acc.add(f);
    }
}

function windowResized() {
    if (header) {
        resizeCanvas(header.offsetWidth, header.offsetHeight);
        updateResponsiveParams();
        initialized = false;
    }
}
