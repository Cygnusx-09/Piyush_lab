// -------------------------------------------------------------
// ⚙️ CONFIGURATION
// -------------------------------------------------------------
let textStr = "Lab.";
let subTitleStr = "A collection of things piyush has built while \nfiguring stuff out";
let baseFontSize = 120;
let baseSubTitleSize = 20;

// Dynamics
let dotSize = 1;
let maxSpeed = 20;
let maxForce = 0.5;
let mouseRadius = 45;
let homeLoyalty = 0.8;
let mouseFear = 2.0;

// Colors
let particleColor = [245, 245, 245];
let subTitleColor = [175, 175, 175];
// -------------------------------------------------------------

let fontHeader;
let fontSubtitle;
let particles = [];
let initialized = false;
let header;

function preload() {
    fontHeader = loadFont('Satoshi-Bold.otf');
    fontSubtitle = loadFont('Satoshi_Complete/Fonts/OTF/Satoshi-Regular.otf');
}

function setup() {
    header = document.getElementById('header-canvas');
    let canvas = createCanvas(header.offsetWidth, header.offsetHeight);
    canvas.parent('header-canvas');
    pixelDensity(displayDensity());
    textFont(fontHeader);
    rectMode(CENTER); // Fixed: Set rectMode to CENTER for squares

    // Initializing responsive params
    updateResponsiveParams();
}

function updateResponsiveParams() {
    if (width < 600) {
        fontSize = width * 0.18; // More air for the 60px margin
        subTitleSize = 14;
        marginX = 48; // Safer indentation for mobile
        marginY = 80;
        textAlignMode = LEFT;
    } else {
        fontSize = baseFontSize;
        subTitleSize = baseSubTitleSize;
        marginX = 60;
        marginY = 150;
        textAlignMode = LEFT;
    }
}

function initSketch() {
    if (fontHeader && !initialized) {
        particles = [];
        let pg = createGraphics(width, height);
        pg.pixelDensity(1);
        pg.textFont(fontHeader);
        pg.textSize(fontSize);
        pg.textAlign(textAlignMode, TOP);
        pg.fill(255);

        // Responsive text anchor
        pg.textAlign(LEFT, TOP);
        pg.text(textStr, 0, marginY);

        pg.loadPixels();
        const step = dotSize; // Synchronize sampling with particle size for "zero distance" at rest
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
    if (fontHeader && fontSubtitle) {
        if (!initialized) initSketch();

        push();
        translate(marginX, 0); // Enforce left alignment via translate

        // Draw Subtitle
        textFont(fontSubtitle);
        textAlign(LEFT, TOP);
        textSize(subTitleSize);
        fill(subTitleColor[0], subTitleColor[1], subTitleColor[2]);
        noStroke();

        let subTitleY = marginY + fontSize + (width < 600 ? 5 : 10);
        let wrapWidth = width - (marginX * 2);

        if (width < 600) {
            text(subTitleStr, 0, subTitleY, wrapWidth); 
        } else {
            text(subTitleStr, 0, subTitleY);
        }

        // Draw Particles relative to the same 0,0 translate
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
        fill(particleColor[0], particleColor[1], particleColor[2]);
        noStroke();
        // Drawing squares slightly larger (0.5px) to eliminate sub-pixel gaps at rest
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

