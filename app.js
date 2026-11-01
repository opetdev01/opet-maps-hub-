(function () {
  const DATA = window.HUB_DATA;
  const $ = (id) => document.getElementById(id);
  const WORLD = { center: [43, 20], zoom: 2.4 };
  const pad = () => (innerWidth > 760 ? { left: 360, top: 0, right: 0, bottom: 0 } : { left: 0, top: 60, right: 0, bottom: Math.round(innerHeight * 0.46) + 70 });
  const two = (n) => String(n).padStart(2, '0');

  const map = new maplibregl.Map({
    container: 'map',
    center: WORLD.center,
    zoom: WORLD.zoom,
    padding: pad(),
    attributionControl: { compact: true },
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
      ],
      sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] }
    }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  window.startStars(map);

  // state: { country, city } ids or null
  let state = { country: null, city: null };
  let markers = [];

  const country = () => DATA.find((c) => c.id === state.country);
  const city = () => country() && country().cities.find((c) => c.id === state.city);

  function clearMarkers() { markers.forEach((m) => m.remove()); markers = []; }

  function addPin(coords, label, count, onClick, logo, kind = '') {
    const el = document.createElement('div');
    el.className = 'pin' + (kind === 'flag' ? ' compact' : '');
    const tag = `<div class="tag">${label}${count != null ? `<em>${count}</em>` : ''}</div>`;
    // label on top, stem pointing down: the marker's bottom edge is the exact coordinate
    el.innerHTML = logo
      ? `${tag}<div class="badge ${kind}"><img class="logo" src="${logo}" alt="" onload="if(this.naturalWidth/this.naturalHeight>2)this.parentNode.classList.add('wide')"></div><div class="stem"></div><div class="tip"></div>`
      : `${tag}<div class="dot"></div>`;
    el.addEventListener('click', onClick);
    const img = el.querySelector('img');
    if (img) img.addEventListener('load', declutter);
    markers.push(new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(coords).addTo(map));
    declutter();
  }

  // pins close together on screen (e.g. New Cairo / Giza at country zoom) would cover each other:
  // keep the lowest pin as is and lengthen the stems of the others until their badges clear it
  const STEM = 18, FOOT = 22; // default stem height; stem + tip height below the badge
  let declutterQueued = false;
  function declutter() {
    if (declutterQueued) return;
    declutterQueued = true;
    requestAnimationFrame(() => {
      declutterQueued = false;
      const placed = [];
      markers
        .map((m) => ({ el: m.getElement(), p: map.project(m.getLngLat()) }))
        .sort((a, b) => b.p.y - a.p.y)
        .forEach(({ el, p }) => {
          const stem = el.querySelector('.stem');
          const w = el.offsetWidth, h = el.offsetHeight - (stem ? stem.offsetHeight - STEM : 0);
          const box = (lift) => ({ l: p.x - w / 2, r: p.x + w / 2, t: p.y - h - lift, b: p.y - FOOT - lift });
          const hits = (a) => placed.some((o) => a.l < o.r && a.r > o.l && a.t < o.b && a.b > o.t);
          let lift = 0;
          if (stem) while (lift < 400 && hits(box(lift))) lift += 4;
          if (stem) stem.style.height = STEM + lift + 'px';
          placed.push(box(lift));
        });
    });
  }
  map.on('move', declutter);

  const mapCount = (c) => c.cities.reduce((n, x) => n + x.maps.length, 0);

  function go(next, fly = true) {
    state = next;
    render();
    if (!fly) return;
    if (!state.country) map.flyTo({ ...WORLD, duration: 2500, padding: pad(), essential: true });
    else if (!state.city) map.flyTo({ center: country().coords, zoom: country().zoom, duration: 2500, padding: pad(), essential: true });
    else map.flyTo({ center: city().coords, zoom: city().zoom, duration: 2800, padding: pad(), essential: true });
    history.replaceState(null, '', '#' + [state.country, state.city].filter(Boolean).join('/'));
  }

  function render() {
    clearMarkers();
    const panel = $('panel'), tabs = $('tabs'), crumbs = $('crumbs');
    panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';

    // breadcrumbs
    const parts = [['World', () => go({ country: null, city: null })]];
    if (state.country) parts.push([country().name, () => go({ country: state.country, city: null })]);
    if (state.city) parts.push([city().name, null]);
    crumbs.innerHTML = '';
    parts.forEach(([t, fn], i) => {
      if (i) crumbs.insertAdjacentHTML('beforeend', '<i>//</i>');
      const b = document.createElement('button');
      b.textContent = t;
      if (!fn || i === parts.length - 1) b.className = 'cur'; else b.onclick = fn;
      crumbs.appendChild(b);
    });

    // region dock: World + every country, indexed
    tabs.innerHTML = '';
    [{ id: null, name: 'World' }, ...DATA].forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'tab' + (c.id === state.country ? ' on' : '');
      b.innerHTML = `<span class="n">${two(i)}</span>${c.name}`;
      b.onclick = () => go({ country: c.id, city: null });
      tabs.appendChild(b);
    });

    if (!state.country) {
      panel.innerHTML = `<header><span class="label mono">Map Ecosystem</span><h1>Our interactive<br>worlds</h1>
        <p class="sub">Select a country to explore the interactive maps built by Opet Studios.</p></header><div class="list" id="list"></div>`;
      DATA.forEach((c) => {
        addPin(c.coords, c.name, mapCount(c), () => go({ country: c.id, city: null }), c.flag, 'flag');
        listItem(c.name, `${c.cities.length} ${c.cities.length > 1 ? 'locations' : 'location'} · ${mapCount(c)} ${mapCount(c) > 1 ? 'maps' : 'map'}`, () => go({ country: c.id, city: null }));
      });
    } else if (!state.city) {
      const c = country();
      panel.innerHTML = `<header><span class="label mono">Country</span><h1>${c.name}</h1>
        <p class="sub">Choose a location to see its maps.</p></header><div class="list" id="list"></div>`;
      c.cities.forEach((ct) => {
        // lead with the project name(s); the city is the small location line
        const projects = ct.maps.map((m) => m.name).join(' / ');
        addPin(ct.coords, projects, null, () => go({ country: c.id, city: ct.id }), ct.maps.length === 1 ? ct.maps[0].logo : null);
        listItem(projects, `${ct.name}${ct.approx ? ' · <span class="approx">approx. position</span>' : ''}`, () => go({ country: c.id, city: ct.id }));
      });
    } else {
      const ct = city();
      panel.innerHTML = `<header><span class="label mono">${country().name}</span><h1>${ct.name}</h1>
        <p class="sub">${ct.approx ? '<span class="approx">Position is approximate.</span> ' : ''}Launch a map below.</p></header><div class="list" id="list"></div>`;
      ct.maps.forEach((m) => {
        addPin(ct.coords, m.name, null, () => openMap(m), m.logo);
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<span class="label mono">Interactive map</span><h2>${m.name}</h2><p>${m.desc || ''}</p>
          <button class="btn">Open map →</button><a class="btn ghost" href="${m.url}" target="_blank" rel="noopener">New tab ↗</a>`;
        div.querySelector('button').onclick = () => openMap(m);
        $('list').appendChild(div);
      });
    }
  }

  function listItem(title, sub, onClick) {
    const b = document.createElement('button');
    b.className = 'item';
    b.innerHTML = `<span><span class="n mono">${two($('list').children.length + 1)}</span><span><b>${title}</b><small class="mono">${sub}</small></span></span><span class="arr">→</span>`;
    b.onclick = onClick;
    $('list').appendChild(b);
  }

  function openMap(m) {
    if (m.embed === false) { window.open(m.url, '_blank', 'noopener'); return; }
    $('viewerTitle').textContent = m.name;
    $('viewerNew').href = m.url;
    $('frame').src = m.url;
    $('viewer').classList.add('open');
  }
  $('viewerClose').onclick = () => { $('viewer').classList.remove('open'); $('frame').src = 'about:blank'; };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('viewerClose').click(); });

  // restore from hash, e.g. #egypt/giza
  const [hc, hct] = location.hash.slice(1).split('/');
  const hf = DATA.find((x) => x.id === hc);
  if (hf) {
    const ok = hf.cities.some((x) => x.id === hct);
    state = { country: hf.id, city: ok ? hct : null };
    const t = ok ? city() : hf;
    map.jumpTo({ center: t.coords, zoom: t.zoom, padding: pad() });
  } else {
    map.jumpTo({ ...WORLD, padding: pad() }); // globe ignores constructor padding
  }

  render();

  // live HUD readout + clock
  const readout = $('readout');
  const fmt = (v, p, n) => Math.abs(v).toFixed(4) + '° ' + (v >= 0 ? p : n);
  function tick() {
    const c = map.getCenter();
    readout.innerHTML = `LAT <b>${fmt(c.lat, 'N', 'S')}</b><br>LNG <b>${fmt(c.lng, 'E', 'W')}</b><br>ZOOM <b>${map.getZoom().toFixed(2)}</b>`;
  }
  map.on('move', tick); tick();
  const clock = $('clock');
  const setClock = () => { clock.textContent = new Date().toISOString().slice(11, 19) + ' UTC'; };
  setClock(); setInterval(setClock, 1000);
})();
