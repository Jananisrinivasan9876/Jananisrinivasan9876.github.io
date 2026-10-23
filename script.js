(function () {
    "use strict";

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Theme ---------- */
    const themeToggle = document.getElementById("theme-toggle");
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    function applyTheme(theme) {
        const isDark = theme === "dark";
        root.setAttribute("data-theme", theme);
        themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        if (themeColorMeta) themeColorMeta.setAttribute("content", isDark ? "#070b14" : "#f6f5f1");
        document.dispatchEvent(new CustomEvent("themechange"));
    }

    applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

    themeToggle.addEventListener("click", function () {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try {
            localStorage.setItem("theme", next);
        } catch (e) { /* storage unavailable: theme still switches for this visit */ }
    });

    /* ---------- Mobile menu ---------- */
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");

    function setMenu(open) {
        navLinks.classList.toggle("is-open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    menuToggle.addEventListener("click", function () {
        setMenu(!navLinks.classList.contains("is-open"));
    });

    navLinks.addEventListener("click", function (e) {
        if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", function (e) {
        if (!e.target.closest(".nav")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setMenu(false);
    });

    /* ---------- Scroll: header, progress bar, back-to-top ---------- */
    const header = document.querySelector(".site-header");
    const progress = document.querySelector(".scroll-progress");
    const toTop = document.querySelector(".to-top");
    let scrollQueued = false;
    let menuOpenedAt = 0;

    menuToggle.addEventListener("click", function () {
        menuOpenedAt = window.scrollY;
    });

    function onScroll() {
        const y = window.scrollY;
        if (navLinks.classList.contains("is-open") && Math.abs(y - menuOpenedAt) > 60) setMenu(false);
        const max = root.scrollHeight - window.innerHeight;
        header.classList.toggle("is-scrolled", y > 20);
        progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
        toTop.classList.toggle("is-visible", y > window.innerHeight * 0.8);
        scrollQueued = false;
    }

    window.addEventListener("scroll", function () {
        if (!scrollQueued) {
            scrollQueued = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    onScroll();

    /* ---------- Highlight the nav link for the section in view ---------- */
    const linkForSection = new Map();
    navLinks.querySelectorAll('a[href^="#"]').forEach(function (link) {
        const section = document.querySelector(link.getAttribute("href"));
        if (section) linkForSection.set(section, link);
    });

    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            linkForSection.forEach(function (link) { link.classList.remove("is-active"); });
            const active = linkForSection.get(entry.target);
            if (active) active.classList.add("is-active");
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sectionObserver.observe(document.getElementById("top"));
    linkForSection.forEach(function (_, section) { sectionObserver.observe(section); });

    /* ---------- Reveal on scroll ---------- */
    const revealEls = document.querySelectorAll(".reveal");

    if (reduceMotion) {
        revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
        const revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

        revealEls.forEach(function (el) { revealObserver.observe(el); });
    }

    /* ---------- Typing effect in the hero ---------- */
    const typed = document.getElementById("typed");

    if (typed && !reduceMotion) {
        const words = JSON.parse(typed.dataset.words);
        let wordIndex = 0;
        let charIndex = words[0].length;
        let deleting = true;

        function type() {
            const word = words[wordIndex];

            if (deleting) {
                charIndex--;
                typed.textContent = word.slice(0, charIndex);
                if (charIndex === 0) {
                    deleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                    setTimeout(type, 400);
                } else {
                    setTimeout(type, 35);
                }
                return;
            }

            charIndex++;
            typed.textContent = word.slice(0, charIndex);
            if (charIndex === word.length) {
                deleting = true;
                setTimeout(type, 2400);
            } else {
                setTimeout(type, 70);
            }
        }

        setTimeout(type, 2800);
    }

    /* ---------- Count-up stats ---------- */
    const counters = document.querySelectorAll("[data-count]");

    function countUp(el) {
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const duration = 1600;
        const start = performance.now();

        function frame(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = (target * eased).toFixed(decimals);
            if (t < 1) requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }

    if (!reduceMotion) {
        const counterObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    countUp(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });

        counters.forEach(function (el) { counterObserver.observe(el); });
    }

    /* ---------- Card spotlight that follows the cursor ---------- */
    document.querySelectorAll(".card").forEach(function (card) {
        card.addEventListener("pointermove", function (e) {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
            card.style.setProperty("--my", (e.clientY - rect.top) + "px");
        });
    });

    /* ---------- Copy email ---------- */
    const copyBtn = document.getElementById("copy-email");
    const copyStatus = document.getElementById("copy-status");

    if (copyBtn) {
        const label = copyBtn.querySelector(".copy-label");
        let resetTimer = 0;

        copyBtn.addEventListener("click", function () {
            const email = copyBtn.dataset.email;
            const done = function () {
                copyBtn.classList.add("is-copied");
                label.textContent = "Copied!";
                copyStatus.textContent = "Email address copied to clipboard";
                clearTimeout(resetTimer);
                resetTimer = setTimeout(function () {
                    copyBtn.classList.remove("is-copied");
                    label.textContent = "Copy";
                    copyStatus.textContent = "";
                }, 2000);
            };

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(email).then(done, function () {
                    window.location.href = "mailto:" + email;
                });
            } else {
                window.location.href = "mailto:" + email;
            }
        });
    }

    /* ---------- Footer year ---------- */
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- Hero: animated circuit board ---------- */
    const canvas = document.getElementById("circuit-canvas");
    if (canvas && canvas.getContext) initCircuit(canvas);

    function initCircuit(canvas) {
        const ctx = canvas.getContext("2d");
        const board = document.createElement("canvas"); // static traces, drawn once per resize/theme
        const boardCtx = board.getContext("2d");

        const GRID = 26;
        // 8 directions, in 45° steps, so traces turn like PCB routing
        const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

        let width = 0;
        let height = 0;
        let dpr = 1;
        let traces = [];
        let pulses = [];
        let colors = {};
        let rafId = 0;
        let lastTime = 0;
        let inView = true;

        function readColors() {
            const style = getComputedStyle(root);
            colors = {
                bg: style.getPropertyValue("--bg").trim(),
                trace: style.getPropertyValue("--trace").trim(),
                node: style.getPropertyValue("--trace-node").trim(),
                pulse: style.getPropertyValue("--pulse").trim(),
                pulse2: style.getPropertyValue("--pulse-2").trim()
            };
        }

        function buildTraces() {
            const cols = Math.ceil(width / GRID) + 1;
            const rows = Math.ceil(height / GRID) + 1;
            const used = new Uint8Array(cols * rows);
            const wanted = Math.round((cols * rows) / 30);
            let attempts = 0;
            traces = [];

            while (traces.length < wanted && attempts < wanted * 10) {
                attempts++;
                let x = Math.floor(Math.random() * cols);
                let y = Math.floor(Math.random() * rows);
                if (used[y * cols + x]) continue;

                let dir = Math.floor(Math.random() * 4) * 2; // start horizontal or vertical
                const points = [[x, y]];
                const segments = 2 + Math.floor(Math.random() * 3);
                let steps = 0;
                used[y * cols + x] = 1;

                for (let s = 0; s < segments; s++) {
                    const length = 2 + Math.floor(Math.random() * 6);
                    let moved = 0;
                    for (let i = 0; i < length; i++) {
                        const nx = x + DIRS[dir][0];
                        const ny = y + DIRS[dir][1];
                        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || used[ny * cols + nx]) break;
                        x = nx;
                        y = ny;
                        used[y * cols + x] = 1;
                        moved++;
                    }
                    if (moved === 0) break;
                    points.push([x, y]);
                    steps += moved;
                    dir = (dir + (Math.random() < 0.5 ? 1 : 7)) % 8; // turn 45° left or right
                }

                if (steps < 4) continue;

                const pts = points.map(function (p) { return [p[0] * GRID + 0.5, p[1] * GRID + 0.5]; });
                const lengths = [0];
                for (let i = 1; i < pts.length; i++) {
                    lengths.push(lengths[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
                }
                traces.push({ pts: pts, lengths: lengths, total: lengths[lengths.length - 1] });
            }
        }

        function drawBoard() {
            board.width = canvas.width;
            board.height = canvas.height;
            boardCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            boardCtx.clearRect(0, 0, width, height);
            boardCtx.lineWidth = 1.2;
            boardCtx.lineJoin = "round";
            boardCtx.lineCap = "round";
            boardCtx.strokeStyle = colors.trace;

            traces.forEach(function (t) {
                boardCtx.beginPath();
                t.pts.forEach(function (p, i) {
                    if (i === 0) boardCtx.moveTo(p[0], p[1]);
                    else boardCtx.lineTo(p[0], p[1]);
                });
                boardCtx.stroke();
            });

            // Solder pads at both ends of each trace
            boardCtx.lineWidth = 1.4;
            boardCtx.strokeStyle = colors.node;
            boardCtx.fillStyle = colors.bg;
            traces.forEach(function (t) {
                [t.pts[0], t.pts[t.pts.length - 1]].forEach(function (p) {
                    boardCtx.beginPath();
                    boardCtx.arc(p[0], p[1], 3, 0, Math.PI * 2);
                    boardCtx.fill();
                    boardCtx.stroke();
                });
            });
        }

        function pointAt(trace, distance) {
            const d = Math.max(0, Math.min(distance, trace.total));
            let i = 1;
            while (i < trace.lengths.length - 1 && trace.lengths[i] < d) i++;
            const segLength = trace.lengths[i] - trace.lengths[i - 1] || 1;
            const k = (d - trace.lengths[i - 1]) / segLength;
            const a = trace.pts[i - 1];
            const b = trace.pts[i];
            return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
        }

        function newPulse(midway) {
            const trace = traces[Math.floor(Math.random() * traces.length)];
            return {
                trace: trace,
                reverse: Math.random() < 0.5,
                d: midway ? Math.random() * trace.total : 0,
                speed: 60 + Math.random() * 90,
                tail: 40 + Math.random() * 40,
                alt: Math.random() < 0.45
            };
        }

        function drawPulse(p) {
            const trace = p.trace;
            const at = function (d) {
                return pointAt(trace, p.reverse ? trace.total - d : d);
            };
            const color = p.alt ? colors.pulse2 : colors.pulse;
            const SAMPLES = 8;

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            for (let i = 0; i < SAMPLES; i++) {
                const d0 = p.d - p.tail * (1 - i / SAMPLES);
                const d1 = p.d - p.tail * (1 - (i + 1) / SAMPLES);
                if (d1 < 0 || d0 > trace.total) continue;
                const a = at(Math.max(d0, 0));
                const b = at(Math.min(d1, trace.total));
                ctx.globalAlpha = ((i + 1) / SAMPLES) * 0.9;
                ctx.beginPath();
                ctx.moveTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
                ctx.stroke();
            }

            if (p.d <= trace.total) {
                const head = at(p.d);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.18;
                ctx.beginPath();
                ctx.arc(head[0], head[1], 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(head[0], head[1], 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        function render(dt) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(board, 0, 0);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            for (let i = 0; i < pulses.length; i++) {
                const p = pulses[i];
                p.d += p.speed * dt;
                if (p.d - p.tail > p.trace.total) {
                    pulses[i] = newPulse(false);
                    continue;
                }
                drawPulse(p);
            }
        }

        function loop(now) {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            render(dt);
            rafId = requestAnimationFrame(loop);
        }

        function start() {
            if (rafId || reduceMotion || !inView || document.hidden) return;
            lastTime = performance.now();
            rafId = requestAnimationFrame(loop);
        }

        function stop() {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }

        function setup() {
            const rect = canvas.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);

            buildTraces();
            drawBoard();

            const count = Math.min(Math.round(traces.length * 0.35), 36);
            pulses = [];
            for (let i = 0; i < count && traces.length; i++) pulses.push(newPulse(true));
            render(0);
        }

        readColors();
        setup();
        start();

        let lastWidth = width;
        let lastHeight = height;
        let resizeTimer = 0;
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                const rect = canvas.getBoundingClientRect();
                // Ignore small height changes from mobile browser toolbars
                if (rect.width === lastWidth && Math.abs(rect.height - lastHeight) < 120) return;
                lastWidth = rect.width;
                lastHeight = rect.height;
                setup();
            }, 150);
        });

        document.addEventListener("themechange", function () {
            readColors();
            drawBoard();
            render(0);
        });

        new IntersectionObserver(function (entries) {
            inView = entries[0].isIntersecting;
            if (inView) start();
            else stop();
        }).observe(canvas);

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) stop();
            else start();
        });
    }
})();
