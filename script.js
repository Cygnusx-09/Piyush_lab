/**
 * PIYUSH — LAB ARCHIVE
 * Main Interaction Logic
 * -----------------------------------------
 * Handling Lozad, Audio Hovers, and GSAP Project Dossier
 */

document.addEventListener('DOMContentLoaded', () => {
    // Movement/blur/scale animations are dropped (opacity kept) when the OS asks for reduced motion
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- ⌛ Odometer Loader Logic ---
    const loader = document.getElementById('loader');
    const digit100 = document.querySelector('#digit-100 .digit-strip');
    const digit10 = document.querySelector('#digit-10 .digit-strip');
    const digit1 = document.querySelector('#digit-1 .digit-strip');

    let loadStatus = { value: 0 };
    let windowLoaded = false;

    // Phase 1: Fast start to 30% (Initial Parse)
    // Phase 2: Steady climb to 90%
    // Phase 3: Wait for window.onload -> 100%
    const loadTl = gsap.timeline({
        onUpdate: () => {
            updateOdometer(loadStatus.value);
        }
    });

    loadTl.to(loadStatus, {
        value: 30,
        duration: 0.8,
        ease: "power2.out"
    })
        .to(loadStatus, {
            value: 90,
            duration: 1.5, // Short crawl; then hold at 90% until window.load
            ease: "power1.out",
            onUpdate: () => {
                updateOdometer(loadStatus.value);
                // If window already loaded, we speed up
                if (windowLoaded && loadStatus.value < 100) {
                    loadTl.kill();
                    finishLoading();
                }
            }
        });

    window.addEventListener('load', () => {
        windowLoaded = true;
        if (!loadTl.isActive()) {
            finishLoading();
        }
    });

    function finishLoading() {
        gsap.to(loadStatus, {
            value: 100,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => updateOdometer(loadStatus.value),
            onComplete: () => {
                gsap.to(loader, {
                    opacity: 0,
                    duration: 1,
                    ease: "power4.inOut",
                    onComplete: () => {
                        loader.style.display = 'none';
                        triggerEntrance();
                    }
                });
            }
        });
    }

    // Populate the ones strip for continuous roll (101 spans total)
    const strip1 = document.getElementById('strip-1');
    if (strip1) {
        let content = '';
        for (let i = 0; i < 11; i++) { // 11 cycles of 0-9
            content += '<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
        }
        content += '<span>0</span>'; // The final 100
        strip1.innerHTML = content;
    }

    function updateOdometer(val) {
        const rounded = Math.floor(val);

        const hRem = window.innerWidth < 1024 ? 5 : 8; // Match CSS height

        const y1 = -val * hRem;
        const y10 = -(val / 10) * hRem;
        const y100 = -(val / 100) * hRem;

        gsap.set(digit1, { y: y1 + "rem" });
        gsap.set(digit10, { y: y10 + "rem" });
        gsap.set(digit100, { y: y100 + "rem" });
    }

    function triggerEntrance() {
        gsap.from(".archive-item", {
            yPercent: reduceMotion ? 0 : 15,
            opacity: 0,
            duration: 1.4,
            stagger: 0.1,
            ease: "power4.out",
            onComplete: () => observer.observe() // Re-scan after all transforms settle
        });

        // Any other reveal logic
        gsap.from("#header-canvas", {
            opacity: 0,
            scale: reduceMotion ? 1 : 1.05,
            duration: 2,
            ease: "power3.out"
        });

        showAudioCue();
    }

    // --- 🔥 Lozad Initialization ---
    const observer = lozad('.lozad', {
        rootMargin: '500px 0px',
        loaded: function (el) {
            el.classList.add('loaded'); // Triggers the CSS fade-in
            if (el.tagName === 'VIDEO') {
                el.loop = true;
                el.volume = 0; // Hover fades it up to 45%
                // Grid videos only play while on screen (see playObserver); dossier videos play on load
                if (!el.closest('.archive-grid') || el.dataset.visible === 'true') {
                    el.play().catch(e => console.log("Autoplay blocked", e));
                }
            }
        }
    });
    observer.observe();
    lucide.createIcons();

    // --- ▶️ Play grid videos only while visible (saves decode/battery) ---
    const playObserver = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
            target.dataset.visible = isIntersecting;
            if (!isIntersecting) target.pause();
            else if (target.classList.contains('loaded')) target.play().catch(() => { });
        });
    });
    document.querySelectorAll('.archive-grid video').forEach(v => playObserver.observe(v));

    // --- 🔉 Audio Hover Logic (Grid & Dossier - Smooth Fades) ---
    // relatedTarget check: moving between children of the same item isn't an enter/leave.
    // overwrite: a new fade kills the opposite one (and its pending mute).
    // Browsers pause a video unmuted before the first click/keypress, so stay muted until then.
    const canUnmute = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;

    document.addEventListener('mouseover', e => {
        const item = e.target.closest('.archive-item, .dossier-item');
        if (!item || item.contains(e.relatedTarget) || !canUnmute()) return;
        const video = item.querySelector('video');
        if (video) {
            video.muted = false;
            gsap.to(video, {
                volume: 0.45,
                duration: 1,
                ease: "power2.out",
                overwrite: true
            });
            video.play().catch(() => { });
        }
    });

    document.addEventListener('mouseout', e => {
        const item = e.target.closest('.archive-item, .dossier-item');
        if (!item || item.contains(e.relatedTarget)) return;
        const video = item.querySelector('video');
        if (video) {
            gsap.to(video, {
                volume: 0,
                duration: 0.5,
                ease: "power2.in",
                overwrite: true,
                onComplete: () => {
                    video.muted = true;
                }
            });
        }
    });

    // --- 🖲️ Audio Cue Cursor Follower ---
    const audioCue = document.getElementById('audio-cue');

    window.addEventListener('mousemove', e => {
        if (audioCue) {
            const offsetX = 16;
            const offsetY = 18;
            gsap.to(audioCue, {
                x: e.clientX + offsetX,
                y: e.clientY + offsetY,
                duration: 0.1,
                ease: "power2.out"
            });
        }
    });

    function showAudioCue() {
        if (audioCue) audioCue.classList.add('visible');
    }

    document.body.addEventListener('click', () => {
        if (audioCue) {
            audioCue.classList.remove('visible');
            setTimeout(() => audioCue.remove(), 500);
        }
    }, { once: true });

    // 🌪️ INITIALIZE SMOOTH SCROLL (LENIS)
    const lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 1.2,
        gestureOrientation: 'vertical',
        smoothWheel: !reduceMotion // Instance stays (dossier calls stop/start/scrollTo); only the easing is dropped
    });
    document.documentElement.classList.add('lenis');

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Safety net: re-observe on scroll to catch any missed lazy-load elements
    let scrollObserveTimeout;
    lenis.on('scroll', () => {
        if (!scrollObserveTimeout) {
            scrollObserveTimeout = setTimeout(() => {
                observer.observe();
                scrollObserveTimeout = null;
            }, 500);
        }
    });

    // --- 🚀 DEEP DIVE LOGIC (Staggered Float) ---
    const grid = document.querySelector('.archive-grid');
    const dossier = document.getElementById('dossier');

    let lastTrigger = null; // Grid item that opened the dossier; focus returns here on close

    document.querySelectorAll('.archive-item').forEach(item => {
        const caption = item.querySelector('.caption');
        const id = caption.textContent.trim();
        const data = projectData[id];
        item.dataset.id = id;
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        if (data) {
            item.setAttribute('aria-label', `${id}: ${data.title}`);
            caption.insertAdjacentHTML('beforeend', `<span class="caption-title"> / ${data.title}</span>`);
        }

        item.addEventListener('click', (e) => {
            e.preventDefault();
            lastTrigger = item;
            openDossier(item.dataset.id);
        });
    });

    // Enter/Space activate role="button" elements (grid items, dossier close)
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) {
            e.preventDefault();
            e.target.click();
        }
    });

    window.openDossier = function (id) {
        const data = projectData[id];
        if (!data) return;

        // 1. Prepare Content
        const titleEl = document.getElementById('dossier-title');
        const descEl = document.getElementById('dossier-description');
        const statsEl = document.querySelector('.dossier-stats');

        // Reset Stats Table (built as one string: a single DOM parse)
        statsEl.innerHTML =
            (data.team ? `<span class="stat-label">TEAM</span><span class="stat-value">${data.team}</span>` : '') +
            (data.tools ? `<span class="stat-label">TOOLS</span><span class="stat-value">${data.tools.join(", ")}</span>` : '');

        const gallery = document.getElementById('dossier-gallery');

        gallery.innerHTML = data.process.map(media => {
            if (media.type === 'image') {
                return `<div class="dossier-item">
                                        <img data-src="${media.src}" class="lozad">
                                      </div>`;
            } else if (media.type === 'video') {
                return `<div class="dossier-item">
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

                return `<div class="dossier-item dossier-pair">
                                    ${renderAsset(media.items[0])}
                                    ${renderAsset(media.items[1])}
                                  </div>`;
            }
            return '';
        }).join('');

        // 2. Immersive GSAP Sequence
        lenis.stop(); // 🌪️ FREEZE SMOOTH SCROLL
        gsap.set(dossier, { display: 'block', opacity: 0, scale: reduceMotion ? 1 : 1.15, filter: "blur(0px)" });

        const tl = gsap.timeline();

        const bgElements = [grid, document.getElementById('header-canvas')];
        bgElements.forEach(el => el.inert = true); // Keep Tab inside the dossier
        tl.to(bgElements, {
            scale: reduceMotion ? 1 : 0.98,
            filter: reduceMotion ? "blur(0px)" : "blur(4px)",
            opacity: 0, duration: 0.8, ease: "expo.out"
        });
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
                dossier.querySelector('.close-dossier').focus({ preventScroll: true });

                // Simple smooth block-level animation
                gsap.from([titleEl, descEl], {
                    yPercent: reduceMotion ? 0 : 60,
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
            yPercent: reduceMotion ? 0 : 30,
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

        const bgElements = [grid, document.getElementById('header-canvas')];
        bgElements.forEach(el => el.inert = false);
        if (lastTrigger) lastTrigger.focus({ preventScroll: true });

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(dossier, { display: 'none' });
                lenis.start(); // 🌪️ RESTORE SMOOTH SCROLL
            }
        });

        tl.to(dossier, {
            opacity: 0,
            scale: reduceMotion ? 1 : 2,
            filter: reduceMotion ? "blur(0px)" : "blur(40px)",
            duration: 0.8,
            ease: "expo.in"
        });
        tl.to(bgElements, {
            scale: 1,
            filter: "blur(0px)",
            opacity: 1,
            duration: 1,
            ease: "expo.out"
        }, "-=0.4");
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('dossier-open')) closeDossier();
    });
});
