(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Typing roles ---------- */
  const roles = [
    "Design Verification Engineer",
    "Silicon & System Validation",
    "Embedded Firmware Validation",
    "RTL Designer · Verilog / SystemVerilog",
    "Computer Architecture Enthusiast",
  ];
  const typed = document.getElementById("typed");
  if (reduced) {
    typed.textContent = roles[0];
  } else {
    let r = 0, i = 0, deleting = false;
    const tick = () => {
      const word = roles[r];
      typed.textContent = word.slice(0, i);
      if (!deleting && i < word.length) { i++; setTimeout(tick, 55); }
      else if (!deleting) { deleting = true; setTimeout(tick, 1800); }
      else if (i > 0) { i--; setTimeout(tick, 28); }
      else { deleting = false; r = (r + 1) % roles.length; setTimeout(tick, 300); }
    };
    tick();
  }

  /* ---------- Reveal on scroll + counters ---------- */
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    if (reduced) { el.textContent = target.toFixed(decimals) + suffix; return; }
    const start = performance.now(), dur = 1600;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll("[data-count]").forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".reveal").forEach((el) => {
    // stagger siblings in the same parent
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 6) * 80}ms`;
    io.observe(el);
  });

  /* ---------- Nav: scrolled state, progress bar, active link, mobile menu ---------- */
  const nav = document.getElementById("nav");
  const progress = document.getElementById("progress");
  const links = [...document.querySelectorAll("#menu a[href^='#']")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href")));

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 10);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    let current = -1;
    sections.forEach((s, idx) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = idx; });
    links.forEach((a, idx) => a.classList.toggle("active", idx === current));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");
  menuBtn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- Cursor spotlight on cards ---------- */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".spot, .job-card, .edu, .mini, .skill, .feature, .stat").forEach((card) => {
      card.classList.add("spot");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Static circuit-board background ---------- */
  const canvas = document.getElementById("circuit");
  const ctx = canvas.getContext("2d");
  const GRID = 40;

  const draw = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // seeded random so the pattern stays the same between resizes
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    // faint dot grid
    ctx.fillStyle = "rgba(148, 163, 184, 0.10)";
    for (let gx = 0; gx < W; gx += GRID) for (let gy = 0; gy < H; gy += GRID) ctx.fillRect(gx - .5, gy - .5, 1, 1);

    // sparse right-angle traces
    const cols = Math.ceil(W / GRID) + 1, rows = Math.ceil(H / GRID) + 1;
    const count = Math.round((W * H) / 40000);
    ctx.strokeStyle = "rgba(100, 140, 190, 0.13)";
    ctx.fillStyle = "rgba(100, 140, 190, 0.28)";
    ctx.lineWidth = 1;
    for (let n = 0; n < count; n++) {
      let x = Math.floor(rand() * cols), y = Math.floor(rand() * rows);
      const pts = [[x * GRID, y * GRID]];
      let dir = Math.floor(rand() * 4);
      const segs = 2 + Math.floor(rand() * 3);
      for (let s = 0; s < segs; s++) {
        const len = 1 + Math.floor(rand() * 4);
        x += [1, 0, -1, 0][dir] * len; y += [0, 1, 0, -1][dir] * len;
        pts.push([x * GRID, y * GRID]);
        dir = (dir + (rand() < 0.5 ? 1 : 3)) % 4;
      }
      ctx.beginPath();
      pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
      [pts[0], pts[pts.length - 1]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill(); });
    }
  };

  draw();
  let resizeTimer;
  addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(draw, 200); });
})();