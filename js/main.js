document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    initPixelArt();
    initScrollAnimations();
});

/* ===== Carousel ===== */
function initCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = track.querySelectorAll('.carousel-slide');
    const dotsContainer = document.querySelector('.carousel-dots');
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');
    let current = 0;
    let autoPlayTimer;
    let touchStartX = 0;
    let touchEndX = 0;

    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        dot.setAttribute('aria-label', `Foto ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
    });

    function goTo(index) {
        slides[current].classList.remove('active');
        dotsContainer.children[current].classList.remove('active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        dotsContainer.children[current].classList.add('active');
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(next, 5000);
    }

    function stopAutoPlay() {
        clearInterval(autoPlayTimer);
    }

    prevBtn.addEventListener('click', () => { prev(); startAutoPlay(); });
    nextBtn.addEventListener('click', () => { next(); startAutoPlay(); });

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) next();
            else prev();
        }
        startAutoPlay();
    }, { passive: true });

    goTo(0);
    startAutoPlay();
}

/* ===== Scroll Animations ===== */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.card, .carousel, .pixel-canvas-wrapper').forEach(el => {
        observer.observe(el);
    });
}

/* ===== Pixel Art Scene ===== */
function initPixelArt() {
    const canvas = document.getElementById('pixelCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const art = window.BENJI_PIXEL_ART;
    if (!art) return;

    const pixelSize = art.pixelSize;
    const scenePadding = 8;
    const sceneWidth = art.width + scenePadding * 2;
    const sceneHeight = art.height + 16;
    const dogX = scenePadding;
    const dogBaseY = 14;
    canvas.width = sceneWidth * pixelSize;
    canvas.height = sceneHeight * pixelSize;

    ctx.imageSmoothingEnabled = false;

    const ballPalette = {
        '_': null,
        'o': '#3B2A1B',
        'p': '#FF6B9D',
        't': '#4ECDC4',
        'y': '#FFE66D',
        'w': '#FFFFFF',
        's': '#F0D8C0',
    };

    const ballFrames = [
        [
            '__oo__',
            '_owto_',
            'opptyo',
            'otpyto',
            '_oypo_',
            '__oo__',
        ],
        [
            '__oo__',
            '_oywo_',
            'otppyo',
            'opytto',
            '_otpo_',
            '__oo__',
        ],
        [
            '__oo__',
            '_otyo_',
            'oyptpo',
            'opptyo',
            '_owto_',
            '__oo__',
        ],
        [
            '__oo__',
            '_opto_',
            'otyppo',
            'oytpto',
            '_oywo_',
            '__oo__',
        ],
    ];

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function drawPixelSprite(rows, palette, ox, oy) {
        for (let row = 0; row < rows.length; row++) {
            for (let col = 0; col < rows[row].length; col++) {
                const color = palette[rows[row][col]];
                if (!color) continue;

                ctx.fillStyle = color;
                ctx.fillRect(
                    (ox + col) * pixelSize,
                    (oy + row) * pixelSize,
                    pixelSize,
                    pixelSize
                );
            }
        }
    }

    function drawBenji(oy) {
        drawPixelSprite(art.rows, art.palette, dogX, dogBaseY + oy);
    }

    function drawPixel(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(
            x * pixelSize,
            y * pixelSize,
            pixelSize,
            pixelSize
        );
    }

    function drawEyes(lookTargetX, lookTargetY, dogOffsetY) {
        const eyes = [
            { x: dogX + 12, y: dogBaseY + dogOffsetY + 16 },
            { x: dogX + 23, y: dogBaseY + dogOffsetY + 16 },
        ];

        eyes.forEach((eye) => {
            const lookX = clamp(Math.round((lookTargetX - eye.x) / 9), -1, 1);
            const lookY = clamp(Math.round((lookTargetY - eye.y) / 9), -1, 1);

            [
                [-1, -1], [0, -1],
                [-1, 0], [0, 0], [1, 0],
                [-1, 1], [0, 1],
            ].forEach(([dx, dy]) => {
                drawPixel(eye.x + dx, eye.y + dy, '#120C08');
            });

            drawPixel(eye.x + lookX, eye.y - 1 + lookY, '#FFFFFF');
            drawPixel(eye.x + lookX + 1, eye.y + lookY, '#2A1F16');
        });
    }

    function drawBall(x, y, frame) {
        drawPixelSprite(ballFrames[frame % ballFrames.length], ballPalette, x, y);
    }

    function getBallState(progress) {
        const bounce = Math.abs(Math.sin(progress * Math.PI * 2));
        return {
            x: Math.round(dogX + 20 + Math.sin(progress * Math.PI * 2) * 7),
            y: Math.round(dogBaseY - 4 - bounce * 9),
            frame: Math.floor(progress * 16),
            contact: 1 - bounce,
        };
    }

    function drawFrame(timestamp) {
        const progress = ((timestamp || 0) % 2600) / 2600;
        const ball = getBallState(progress);
        const dogNod = ball.contact > 0.86 ? 1 : 0;
        const ballCenterX = ball.x + 3;
        const ballCenterY = ball.y + 3;

        ctx.fillStyle = art.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawBenji(dogNod);
        drawEyes(ballCenterX, ballCenterY, dogNod);
        drawBall(ball.x, ball.y, ball.frame);

        requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
}
