// -------------------------------------------------------------
// ⚙️ CONFIGURATION
// -------------------------------------------------------------
let textStr = "Lab.";
let subTitleStr = "A collection of things piyush has built while figuring stuff out";
let baseFontSize = 120;
let baseSubTitleSize = 32;

// Dynamics
let dotSize = 3;
let maxSpeed = 10;
let maxForce = 0.5;
let mouseRadius = 60;
let homeLoyalty = 0.8;
let mouseFear = 2.0;

// Colors
let particleColor = [255, 255, 255];
let subTitleColor = [100, 100, 100];
// -------------------------------------------------------------

let font;
let particles = [];
let initialized = false;
let header;

function preload() {
    font = loadFont('Satoshi-Bold.otf');
}

function setup() {
    header = document.getElementById('header-canvas');
    let canvas = createCanvas(header.offsetWidth, header.offsetHeight);
    canvas.parent('header-canvas');
    pixelDensity(displayDensity());
    textFont(font);

    // Initializing responsive params
    updateResponsiveParams();
}

function updateResponsiveParams() {
    // Breakpoint: Mobile Logic
    if (width < 600) {
        fontSize = width * 0.25;
        subTitleSize = 16;
        marginX = width / 2; // Center horizontally
        marginY = 100; // Shifted Down
        textAlignMode = CENTER;
    } else {
        fontSize = baseFontSize;
        subTitleSize = baseSubTitleSize;
        marginX = 60; // Now represents LEFT margin
        marginY = 150; // Shifted Down
        textAlignMode = LEFT;
    }
}

function initSketch() {
    if (font && !initialized) {
        particles = [];
        let pg = createGraphics(width, height);
        pg.pixelDensity(1);
        pg.textFont(font);
        pg.textSize(fontSize);
        pg.textAlign(textAlignMode, TOP);
        pg.fill(255);

        // Responsive text anchor
        let drawX = (textAlignMode === CENTER) ? width / 2 : marginX;
        pg.text(textStr, drawX, marginY);

        pg.loadPixels();
        const step = 4;
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
    if (font) {
        if (!initialized) initSketch();

        textAlign(textAlignMode, TOP);
        textSize(subTitleSize);
        fill(subTitleColor[0], subTitleColor[1], subTitleColor[2]);
        noStroke();

        let drawX = (textAlignMode === CENTER) ? width / 2 : marginX;
        let subTitleY = marginY + fontSize + (width < 600 ? 5 : 10);

        // Wrap subtitle logic for mobile
        if (width < 600) {
            text(subTitleStr, width / 2 - (width * 0.4), subTitleY, width * 0.8);
        } else {
            text(subTitleStr, drawX, subTitleY);
        }

        for (let p of particles) {
            p.update();
            p.show();
        }
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
        let mouse = createVector(mouseX, mouseY);
        let arrive = this.calculateArrive(this.home);
        let flee = this.calculateFlee(mouse);

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
        stroke(particleColor[0], particleColor[1], particleColor[2]);
        strokeWeight(dotSize);
        point(this.pos.x, this.pos.y);
    }
}

function windowResized() {
    if (header) {
        resizeCanvas(header.offsetWidth, header.offsetHeight);
        updateResponsiveParams();
        initialized = false;
    }
}

