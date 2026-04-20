/**
 * PIYUSH — LAB ARCHIVE
 * Main Interaction Logic
 * -----------------------------------------
 * Handling Lozad, Audio Hovers, and GSAP Project Dossier
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- ⌛ Odometer Loader Logic ---
    const loader = document.getElementById('loader');
    const digit100 = document.querySelector('#digit-100 .digit-strip');
    const digit10 = document.querySelector('#digit-10 .digit-strip');
    const digit1 = document.querySelector('#digit-1 .digit-strip');

    let loadStatus = { value: 0 };

    // Animate counter to 100
    const loadTl = gsap.to(loadStatus, {
        value: 100,
        duration: 3,
        ease: "expo.inOut",
        onUpdate: () => {
            const val = Math.floor(loadStatus.value);
            const h = Math.floor(val / 100);
            const t = Math.floor((val % 100) / 10);
            const o = val % 10;

            const rowHeight = window.innerWidth < 1024 ? (window.innerWidth < 640 ? 80 : 80) : 128;
            // Better to use actual computed height or just use vh/rem logic
            // Since we know the height in CSS is 8rem or 5rem
            const hRem = window.innerWidth < 1024 ? 5 : 8;

            gsap.to(digit100, { y: -h * hRem + "rem", duration: 0.4, ease: "power2.out" });
            gsap.to(digit10, { y: -t * hRem + "rem", duration: 0.5, ease: "power2.out" });
            gsap.to(digit1, { y: -o * hRem + "rem", duration: 0.6, ease: "power2.out" });
        },
        onComplete: () => {
            checkReady();
        }
    });

    let windowLoaded = false;
    window.addEventListener('load', () => {
        windowLoaded = true;
        checkReady();
    });

    function checkReady() {
        if (windowLoaded && loadStatus.value === 100) {
            gsap.to(loader, {
                opacity: 0,
                duration: 1,
                ease: "power4.inOut",
                onComplete: () => {
                    loader.style.display = 'none';
                    // Trigger entrance animations for main content
                    triggerEntrance();
                }
            });
        }
    }

    function triggerEntrance() {
        gsap.from(".archive-item", {
            yPercent: 15,
            opacity: 0,
            duration: 1.4,
            stagger: 0.1,
            ease: "power4.out"
        });

        // Any other reveal logic
        gsap.from("#header-canvas", {
            opacity: 0,
            scale: 1.05,
            duration: 2,
            ease: "power3.out"
        });
    }

    // --- 🔥 Lozad Initialization ---
    const observer = lozad('.lozad', {
        loaded: function (el) {
            el.classList.add('loaded'); // Triggers the CSS fade-in
            if (el.tagName === 'VIDEO') {
                el.loop = true;
                el.volume = 0.45; // 🔊 Comfort Volume (45%)
                el.play().catch(e => console.log("Autoplay blocked", e));
            }
        }
    });
    observer.observe();
    lucide.createIcons();

    // --- 🔉 Audio Hover Logic (Grid & Dossier) ---
    document.addEventListener('mouseover', e => {
        const item = e.target.closest('.archive-item, .dossier-item');
        if (item) {
            const video = item.querySelector('video');
            if (video) {
                video.muted = false;
                video.volume = 0.45; // Ensure volume is set on unmute
                video.play().catch(() => { });
            }
        }
    });

    document.addEventListener('mouseout', e => {
        const item = e.target.closest('.archive-item, .dossier-item');
        if (item) {
            const video = item.querySelector('video');
            if (video) video.muted = true;
        }
    });

    // 🔓 Unlock browser audio context on first click
    document.body.addEventListener('click', () => {
        // This is a dummy move to satisfy browser autoplay policies
    }, { once: true });

    // 🌪️ INITIALIZE SMOOTH SCROLL (LENIS)
    const lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 1.2,
        gestureOrientation: 'vertical',
        smoothWheel: true
    });
    document.documentElement.classList.add('lenis');

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // --- 🚀 DEEP DIVE LOGIC (Staggered Float) ---
    const grid = document.querySelector('.archive-grid');
    const dossier = document.getElementById('dossier');

    document.querySelectorAll('.archive-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const caption = item.querySelector('.caption').innerText;
            const id = caption.split(' / ')[0].trim();
            openDossier(id);
        });
    });

    window.openDossier = function (id) {
        const data = projectData[id];
        if (!data) return;

        // 1. Prepare Content
        const titleEl = document.getElementById('dossier-title');
        const descEl = document.getElementById('dossier-description');
        const statsEl = document.querySelector('.dossier-stats');

        // Reset Stats Table
        statsEl.innerHTML = '';
        if (data.team) statsEl.innerHTML += `<span class="stat-label">TEAM</span><span class="stat-value">${data.team}</span>`;
        if (data.tools) statsEl.innerHTML += `<span class="stat-label">TOOLS</span><span class="stat-value">${data.tools.join(", ")}</span>`;

        const gallery = document.getElementById('dossier-gallery');
        gallery.innerHTML = '';

        data.process.forEach(media => {
            if (media.type === 'image') {
                gallery.innerHTML += `<div class="dossier-item">
                                        <img data-src="${media.src}" class="lozad">
                                      </div>`;
            } else if (media.type === 'video') {
                gallery.innerHTML += `<div class="dossier-item">
                                    <video class="lozad" data-src="${media.src}" loop muted autoplay playsinline preload="auto"></video>
                                  </div>`;
            } else if (media.type === 'pair') {
                const renderAsset = (src) => {
                    const isVideo = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');
                    if (isVideo) {
                        return `<video class="lozad" data-src="${src}" loop muted autoplay playsinline preload="auto"></video>`;
                    } else {
                        return `<img data-src="${src}" class="lozad">`;
                    }
                };

                gallery.innerHTML += `<div class="dossier-item dossier-pair">
                                    ${renderAsset(media.items[0])}
                                    ${renderAsset(media.items[1])}
                                  </div>`;
            }
        });

        // 2. Immersive GSAP Sequence
        lenis.stop(); // 🌪️ FREEZE SMOOTH SCROLL
        gsap.set(dossier, { display: 'block', opacity: 0, scale: 1.15, filter: "blur(0px)" });

        const tl = gsap.timeline();

        const bgElements = [grid, document.getElementById('header-canvas')];
        tl.to(bgElements, { scale: 0.98, filter: "blur(4px)", opacity: 0, duration: 0.8, ease: "expo.out" });
        tl.to(dossier, {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "expo.out",
            onStart: () => {
                lenis.scrollTo(0, { immediate: true });
                document.body.classList.add('dossier-open'); // LOCK SCROLL

                // Inject raw text
                titleEl.innerText = data.title;
                descEl.innerText = data.description;

                // Simple smooth block-level animation
                gsap.from([titleEl, descEl], {
                    yPercent: 60,
                    opacity: 0,
                    duration: 1,
                    stagger: 0.1,
                    ease: "power4.out",
                    delay: 0.2
                });
            }
        }, "-=0.6");

        // Staggered entrance for stats and gallery items
        tl.from(".dossier-stats, .dossier-item", {
            yPercent: 30,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            ease: "power4.out"
        }, "-=0.7");

        observer.observe(); // Refresh Lozad for new gallery items
        lucide.createIcons();
    }

    window.closeDossier = function () {
        document.body.classList.remove('dossier-open'); // UNLOCK SCROLL

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(dossier, { display: 'none' });
                lenis.start(); // 🌪️ RESTORE SMOOTH SCROLL
            }
        });

        tl.to(dossier, {
            opacity: 0,
            scale: 2,
            filter: "blur(40px)",
            duration: 0.8,
            ease: "expo.in"
        });
        tl.to([grid, document.getElementById('header-canvas')], {
            scale: 1,
            filter: "blur(0px)",
            opacity: 1,
            duration: 1,
            ease: "expo.out"
        }, "-=0.4");
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDossier();
    });
});
