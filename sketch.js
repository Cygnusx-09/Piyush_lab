// -------------------------------------------------------------
// ⚙️ CONFIGURATION - INTERACTIVE TITLE ONLY
// -------------------------------------------------------------
let textStr = "Lab.";
let baseFontSize = 120; // Restored to 120

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

function preload() {
    fontHeader = loadFont('Satoshi-Bold.otf');
}

function setup() {
    header = document.getElementById('header-canvas');
    let canvas = createCanvas(header.offsetWidth, header.offsetHeight);
    canvas.parent('header-canvas');
    pixelDensity(displayDensity());
    textFont(fontHeader);
    rectMode(CENTER);

    updateResponsiveParams();
}

function updateResponsiveParams() {
    if (width < 600) {
        fontSize = width * 0.20;
        marginX = 60; // Back to 60 as per "like tablet" request earlier
        marginY = 80;
    } else {
        fontSize = baseFontSize;
        marginX = 60;
        marginY = 150;
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

        push();
        translate(marginX, marginY);

        for (let p of particles) {
            p.update();
            p.show();
        }
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

    update() {
        // Essential: mouse offset by translation
        let mouse = createVector(mouseX - marginX, mouseY - marginY);

        let arrive = this.calculateArrive(this.home);
        let flee = this.calculateFlee(mouse);

        // RESTORED: Dynamic Multipliers
        arrive.mult(homeLoyalty);
        flee.mult(mouseFear);

        this.applyForce(arrive);
        this.applyForce(flee);

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
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        if (d < mouseRadius) {
            desired.setMag(maxSpeed);
            desired.mult(-1);
            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(maxForce);
            return steer;
        } else {
            return createVector(0, 0);
        }
    }

    applyForce(f) {
        this.acc.add(f);
    }

    show() {
        fill(particleColor[0], particleColor[1], particleColor[2]);
        noStroke();
        // RESTORED: +0.5 size fix for gapless rendering
        rect(this.pos.x, this.pos.y, dotSize + 0.5, dotSize + 0.5);
    }
}

function windowResized() {
    if (header) {
        resizeCanvas(header.offsetWidth, header.offsetHeight);
        updateResponsiveParams();
        initialized = false;
    }
}
