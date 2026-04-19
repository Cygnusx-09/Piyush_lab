/**
 * PIYUSH — LAB ARCHIVE
 * Main Interaction Logic
 * -----------------------------------------
 * Handling Lozad, Audio Hovers, and GSAP Project Dossier
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 🔥 Lozad Initialization ---
    const observer = lozad('.lozad', {
        loaded: function (el) {
            el.classList.add('loaded'); // Triggers the CSS fade-in
            if (el.tagName === 'VIDEO') {
                el.loop = true;
                el.play().catch(e => console.log("Autoplay blocked", e));
            }
        }
    });
    observer.observe();
    lucide.createIcons();

    // --- ✨ Cinematic Grid Entrance ---
    gsap.from(".archive-item", {
        yPercent: 15,
        opacity: 0,
        duration: 1.4,
        stagger: 0.1,
        ease: "power4.out",
        delay: 0.8
    });

    // --- 🔉 Audio Hover Logic (Grid & Dossier) ---
    document.addEventListener('mouseover', e => {
        const item = e.target.closest('.archive-item, .dossier-item');
        if (item) {
            const video = item.querySelector('video');
            if (video) {
                video.muted = false;
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
        gsap.set(dossier, { display: 'block', opacity: 0, scale: 1.02 });

        const tl = gsap.timeline();

        tl.to(grid, { scale: 0.98, opacity: 0, duration: 0.8, ease: "expo.out" });

        tl.to(dossier, {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "expo.out",
            onStart: () => {
                window.scrollTo(0, 0);
                document.body.classList.add('dossier-open'); // LOCK SCROLL

                // Inject raw text
                titleEl.innerText = data.title;
                descEl.innerText = data.description;

                // Simple smooth block-level animation
                gsap.from([titleEl, descEl], {
                    yPercent: 20,
                    opacity: 0,
                    duration: 1.2,
                    stagger: 0.15,
                    ease: "power3.out",
                    delay: 0.4
                });
            }
        }, "-=0.6");

        // Staggered entrance for stats and gallery items
        tl.from(".dossier-stats, .dossier-item", {
            yPercent: 10,
            opacity: 0,
            duration: 1.2,
            stagger: 0.1,
            ease: "power3.out"
        }, "-=0.5");

        observer.observe(); // Refresh Lozad for new gallery items
        lucide.createIcons();
    }

    window.closeDossier = function () {
        document.body.classList.remove('dossier-open'); // UNLOCK SCROLL

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(dossier, { display: 'none' });
            }
        });

        tl.to(dossier, { opacity: 0, scale: 1.05, duration: 0.6, ease: "expo.in" });
        tl.to(grid, {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "expo.out"
        }, "-=0.3");
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDossier();
    });
});
