// Drawing tool: outline each project's area on the map, preview the fly-in and line animation,
// then copy the coordinates. Drawings are remembered in this browser until copied into data.js.
(function () {
  const $ = (id) => document.getElementById(id);
  const KEY = 'opet-boundaries', TIMING = 'opet-boundary-timing';
  const pad = () => (innerWidth > 760 ? { left: 360, top: 0, right: 0, bottom: 0 } : { left: 0, top: 60, right: 0, bottom: Math.round(innerHeight * 0.46) + 70 });
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* drawing still works, just isn't remembered */ } };
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };

  // every project, with the city it sits in
  const PROJECTS = window.HUB_DATA.flatMap((c) => c.cities.flatMap((ct) => ct.maps.map((m) => ({ ...m, city: ct, country: c }))));
  const drawings = load(KEY, {});
  const timing = load(TIMING, { fly: 3, line: 4 });
  PROJECTS.forEach((p) => { if (!drawings[p.id] && p.boundary) drawings[p.id] = { points: p.boundary, closed: true }; });

  let project = PROJECTS[0];
  let handles = [], cursor = null, dragged = false, simMarker = null, timers = [];
  const shape = () => drawings[project.id] || (drawings[project.id] = { points: [], closed: false });

  const map = new maplibregl.Map({
    container: 'map',
    center: project.city.coords,
    zoom: 13.5,
    attributionControl: { compact: true },
    doubleClickZoom: false, // double-click is for deleting points
    style: {
      version: 8,
      projection: { type: 'globe' },
      sources: {
        sat: {
          type: 'raster', tileSize: 256, maxzoom: 18,
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          attribution: 'Imagery © Esri'
        }
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#000' } },
        { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-saturation': -0.7, 'raster-brightness-max': 0.7, 'raster-contrast': 0.25 } }
      ]
    }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  let boundary;
  $('title').textContent = project.name;
  $('city').textContent = 'Loading map…';
  map.once('style.load', () => { // don't wait for every satellite photo
    boundary = window.HubBoundary(map);
    map.addSource('edit', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'edit-line', type: 'line', source: 'edit', paint: { 'line-color': '#00f3ff', 'line-width': 2, 'line-dasharray': [2, 1.5] } });
    select(project);
  });

  /* ---------- editing ---------- */

  function drawEdit() {
    const { points, closed } = shape();
    const c = closed && points.length ? [...points, points[0]] : cursor && points.length ? [...points, cursor] : points;
    map.getSource('edit').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: c.length > 1 ? c : [] } });
  }

  function clearHandles() { handles.forEach((m) => m.remove()); handles = []; }

  function addVertex(p, i) {
    const el = document.createElement('div');
    el.className = 'vtx' + (i === 0 ? ' first' : '');
    const m = new maplibregl.Marker({ element: el, draggable: true }).setLngLat(p).addTo(map);
    m.on('dragstart', () => { dragged = true; });
    m.on('drag', () => { const l = m.getLngLat(); shape().points[i] = [l.lng, l.lat]; drawEdit(); });
    m.on('dragend', () => { refresh(); setTimeout(() => { dragged = false; }, 0); });
    el.addEventListener('click', () => {
      const s = shape();
      if (!dragged && i === 0 && !s.closed && s.points.length >= 3) { s.closed = true; cursor = null; refresh(); }
    });
    el.addEventListener('dblclick', () => {
      const s = shape();
      s.points.splice(i, 1);
      if (s.points.length < 3) s.closed = false;
      refresh();
    });
    handles.push(m);
  }

  // dots between points: drag one (or click it) to add a point there
  function addMidpoint(a, b, i) {
    const el = document.createElement('div');
    el.className = 'mid';
    const m = new maplibregl.Marker({ element: el, draggable: true }).setLngLat([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]).addTo(map);
    const insert = () => { const l = m.getLngLat(); shape().points.splice(i + 1, 0, [l.lng, l.lat]); };
    m.on('dragstart', () => { dragged = true; insert(); });
    m.on('drag', () => { const l = m.getLngLat(); shape().points[i + 1] = [l.lng, l.lat]; drawEdit(); });
    m.on('dragend', () => { refresh(); setTimeout(() => { dragged = false; }, 0); });
    el.addEventListener('click', () => { if (!dragged) { insert(); refresh(); } });
    handles.push(m);
  }

  function refresh() {
    const s = shape(), n = s.points.length;
    clearHandles();
    s.points.forEach((p, i) => addVertex(p, i));
    const segs = s.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) addMidpoint(s.points[i], s.points[(i + 1) % n], i);
    drawEdit();
    store(KEY, drawings);

    $('editStatus').textContent = !n ? 'Click on the map to place the first point on the project boundary.'
      : s.closed ? `Area closed with ${n} points. Press Play to watch it.`
      : n < 3 ? `${n} ${n > 1 ? 'points' : 'point'}. Keep clicking around the area.`
      : `${n} points. Click the filled square to close the area.`;
    $('play').disabled = !s.closed;
    $('undo').disabled = !n;
    $('clear').disabled = !n;
    output();
    renderTabs();
  }

  function output() {
    const done = {};
    PROJECTS.forEach((p) => {
      const d = drawings[p.id];
      if (d && d.closed) done[p.id] = d.points.map(([x, y]) => [+x.toFixed(6), +y.toFixed(6)]);
    });
    const n = Object.keys(done).length;
    $('out').value = n ? JSON.stringify({ animation: { flySeconds: timing.fly, lineSeconds: timing.line }, boundaries: done }) : '';
    $('copy').disabled = !n;
  }

  function renderTabs() {
    const tabs = $('tabs');
    tabs.innerHTML = '';
    PROJECTS.forEach((p) => {
      const b = document.createElement('button');
      const d = drawings[p.id];
      b.className = 'tab' + (p === project ? ' on' : '');
      b.innerHTML = `${p.name}${d && d.closed ? ' <span class="tick">✓</span>' : ''}`;
      b.onclick = () => select(p);
      tabs.appendChild(b);
    });
  }

  function select(p) {
    project = p;
    cursor = null;
    $('title').textContent = p.name;
    $('city').textContent = `${p.city.name}, ${p.country.name}`;
    const s = shape();
    map.jumpTo({ padding: pad() });
    map.jumpTo(s.closed ? boundary.camera(s.points) : { center: p.city.coords, zoom: 13.5 });
    refresh();
  }

  map.on('click', (e) => {
    if (!boundary) return; // map still loading
    const s = shape();
    if (document.body.classList.contains('sim') || s.closed || e.originalEvent.target.closest('.vtx, .mid')) return;
    s.points.push([e.lngLat.lng, e.lngLat.lat]);
    refresh();
  });
  map.on('mousemove', (e) => {
    if (!boundary || document.body.classList.contains('sim') || shape().closed) return;
    cursor =[e.lngLat.lng, e.lngLat.lat];
    drawEdit();
  });

  function undo() {
    const s = shape();
    if (s.closed) s.closed = false; else s.points.pop();
    refresh();
  }
  $('undo').onclick = undo;
  $('clear').onclick = () => { shape().points = []; shape().closed = false; cursor = null; refresh(); };
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && document.body.classList.contains('edit')) { e.preventDefault(); undo(); }
    if (e.key === 'Escape' && document.body.classList.contains('sim')) stopSim();
  });

  $('copy').onclick = async () => {
    const b = $('copy'), out = $('out');
    out.select();
    try { await navigator.clipboard.writeText(out.value); } catch (e) { document.execCommand('copy'); }
    b.textContent = 'Copied ✓';
    setTimeout(() => { b.textContent = 'Copy coordinates'; }, 1600);
  };

  /* ---------- timing sliders ---------- */

  [['fly', 'flyVal'], ['line', 'lineVal']].forEach(([id, val]) => {
    const input = $(id);
    input.value = timing[id];
    const show = () => { $(val).textContent = `${input.value}s`; };
    show();
    input.oninput = () => { timing[id] = +input.value; store(TIMING, timing); show(); output(); };
  });

  /* ---------- simulation: same steps a visitor will see ---------- */

  function resetSim() {
    timers.forEach(clearTimeout); timers = [];
    map.stop();
    boundary.clear();
    if (simMarker) { simMarker.remove(); simMarker = null; }
  }

  function startSim() {
    resetSim();
    clearHandles();
    map.getSource('edit').setData({ type: 'FeatureCollection', features: [] });
    document.body.className = 'sim';
    $('editTools').hidden = true;
    $('simTools').hidden = false;
    $('replay').hidden = true;
    $('simStatus').textContent = 'Click the logo on the map to start.';
    map.jumpTo({ center: project.city.coords, zoom: project.city.zoom, padding: pad() });

    const el = document.createElement('div');
    el.className = 'pin call';
    el.innerHTML = `<div class="tag">${project.name}</div><div class="badge"><img class="logo" src="${project.logo}" alt="" onload="if(this.naturalWidth/this.naturalHeight>2)this.parentNode.classList.add('wide')"></div><div class="stem"></div><div class="tip"></div>`;
    el.addEventListener('click', () => flyIn(el), { once: true });
    simMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(project.city.coords).addTo(map);
  }

  function flyIn(pin) {
    const pts = shape().points, flyMs = timing.fly * 1000, lineMs = timing.line * 1000;
    pin.classList.remove('call');
    $('simStatus').textContent = 'Camera flying in…';
    map.flyTo({ ...boundary.camera(pts), duration: flyMs, essential: true });
    timers.push(setTimeout(() => {
      $('simStatus').textContent = 'Drawing the area…';
      boundary.draw(pts, lineMs, () => {
        $('simStatus').textContent = 'Done. Replay it, or go back to adjust the lines.';
        $('replay').hidden = false;
      });
    }, flyMs * 0.6)); // the line starts just before the camera lands
  }

  function stopSim() {
    resetSim();
    document.body.className = 'edit';
    $('editTools').hidden = false;
    $('simTools').hidden = true;
    map.jumpTo(boundary.camera(shape().points));
    refresh();
  }

  $('play').onclick = startSim;
  $('replay').onclick = startSim;
  $('back').onclick = stopSim;

  // live HUD readout
  const fmt = (v, p, n) => Math.abs(v).toFixed(4) + '° ' + (v >= 0 ? p : n);
  function tick() {
    const c = map.getCenter();
    $('readout').innerHTML = `LAT <b>${fmt(c.lat, 'N', 'S')}</b><br>LNG <b>${fmt(c.lng, 'E', 'W')}</b><br>ZOOM <b>${map.getZoom().toFixed(2)}</b>`;
  }
  map.on('move', tick); tick();
})();
