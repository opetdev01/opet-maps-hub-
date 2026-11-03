// Futuristic starfield drawn behind the globe (the map canvas is transparent around it).
// Three depth layers drift with the globe (parallax), a few stars are linked like a
// star-chart, and now and then a cyan streak crosses the sky.
window.startStars = function (map) {
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CYAN = '0, 243, 255';
  const LAYERS = [ // depth = how strongly it follows the globe
    { n: 320, size: [0.8, 1.4], alpha: [0.45, 0.8], depth: 0.6 },
    { n: 130, size: [1.3, 2], alpha: [0.7, 1], depth: 1.4 },
    { n: 40, size: [2, 3], alpha: [0.9, 1], depth: 2.6, links: true }
  ];
  const rnd = (a, b) => a + Math.random() * (b - a);
  let W = 0, H = 0, dpr = 1, streaks = [], nextStreak = 0;

  const layers = LAYERS.map((l) => ({
    ...l,
    stars: Array.from({ length: l.n }, () => ({
      x: Math.random(), y: Math.random(),
      r: rnd(...l.size), a: rnd(...l.alpha),
      cyan: Math.random() < 0.18,
      tw: rnd(0.6, 2.2), ph: rnd(0, Math.PI * 2)
    }))
  }));

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  const wrap = (v, m) => ((v % m) + m) % m;

  function draw(t) {
    // the globe fills the screen once zoomed in, so fade the sky out and stop working
    const fade = Math.max(0, Math.min(1, (6 - map.getZoom()) / 1.5));
    canvas.style.opacity = fade;
    if (!fade) return;

    ctx.clearRect(0, 0, W, H);
    const c = map.getCenter(), deg = W / 360;

    layers.forEach((l) => {
      const ox = -c.lng * deg * l.depth, oy = c.lat * deg * l.depth;
      const pts = l.stars.map((s) => {
        const x = wrap(s.x * W + ox, W), y = wrap(s.y * H + oy, H);
        const a = still ? s.a : s.a * (0.65 + 0.35 * Math.sin(t / 1000 * s.tw + s.ph));
        return { x, y, a, s };
      });

      if (l.links) { // faint star-chart lines between close neighbours
        ctx.lineWidth = 0.6;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 190) {
            ctx.strokeStyle = `rgba(${CYAN}, ${0.32 * (1 - d / 190)})`;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }

      pts.forEach(({ x, y, a, s }) => {
        const col = s.cyan ? CYAN : '220, 240, 255';
        ctx.fillStyle = `rgba(${col}, ${a})`;
        ctx.beginPath(); ctx.arc(x, y, s.r / 2, 0, Math.PI * 2); ctx.fill();
        if (l.links) { // bright stars get a small cross glint
          ctx.fillStyle = `rgba(${col}, ${a * 0.5})`;
          ctx.fillRect(x - s.r * 3, y - 0.4, s.r * 6, 0.8);
          ctx.fillRect(x - 0.4, y - s.r * 3, 0.8, s.r * 6);
          ctx.fillStyle = `rgba(${col}, ${a * 0.12})`; // soft halo
          ctx.beginPath(); ctx.arc(x, y, s.r * 1.6, 0, Math.PI * 2); ctx.fill();
        }
      });
    });

    if (!still) {
      if (t > nextStreak) {
        const ang = rnd(0.25, 0.6) * (Math.random() < 0.5 ? 1 : -1) + (Math.random() < 0.5 ? 0 : Math.PI);
        streaks.push({ x: rnd(0, W), y: rnd(0, H * 0.7), vx: Math.cos(ang) * 9, vy: Math.abs(Math.sin(ang)) * 9, life: 0, len: rnd(80, 160) });
        nextStreak = t + rnd(3500, 8000);
      }
      streaks = streaks.filter((s) => s.life < 70);
      streaks.forEach((s) => {
        s.life++; s.x += s.vx; s.y += s.vy;
        const k = Math.sin((s.life / 70) * Math.PI); // fade in and out
        const tx = s.x - s.vx / 9 * s.len, ty = s.y - s.vy / 9 * s.len;
        const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
        g.addColorStop(0, `rgba(${CYAN}, ${0.9 * k})`);
        g.addColorStop(1, `rgba(${CYAN}, 0)`);
        ctx.strokeStyle = g; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
      });
    }
  }

  function loop(t) { draw(t); requestAnimationFrame(loop); }
  if (still) { map.on('move', () => draw(0)); addEventListener('resize', () => draw(0)); draw(0); }
  else requestAnimationFrame(loop);
};
