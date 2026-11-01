// Project-area outline: the camera flies to the area and a glowing line traces around it.
// Shared by the drawing tool (draw.html) so the hub can use exactly the same animation.
window.HubBoundary = function (map) {
  const CYAN = '#00f3ff';
  const empty = { type: 'FeatureCollection', features: [] };
  let raf = 0;

  map.addSource('bd-fill', { type: 'geojson', data: empty });
  map.addSource('bd-line', { type: 'geojson', data: empty });
  map.addSource('bd-head', { type: 'geojson', data: empty });
  map.addLayer({ id: 'bd-fill', type: 'fill', source: 'bd-fill', paint: { 'fill-color': CYAN, 'fill-opacity': 0, 'fill-opacity-transition': { duration: 900 } } });
  map.addLayer({ id: 'bd-glow', type: 'line', source: 'bd-line', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': CYAN, 'line-width': 12, 'line-blur': 8, 'line-opacity': 0.55 } });
  map.addLayer({ id: 'bd-core', type: 'line', source: 'bd-line', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': CYAN, 'line-width': 2.5 } });
  map.addLayer({ id: 'bd-head-glow', type: 'circle', source: 'bd-head', paint: { 'circle-color': CYAN, 'circle-radius': 14, 'circle-blur': 1 } });
  map.addLayer({ id: 'bd-head', type: 'circle', source: 'bd-head', paint: { 'circle-color': '#fff', 'circle-radius': 3.5 } });

  const line = (c) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: c } });
  const set = (id, data) => map.getSource(id).setData(data);

  function clear() {
    cancelAnimationFrame(raf);
    set('bd-line', empty); set('bd-head', empty); set('bd-fill', empty);
    map.setPaintProperty('bd-fill', 'fill-opacity', 0);
  }

  // final state: full outline with the area softly lit
  function show(points) {
    cancelAnimationFrame(raf);
    const ring = [...points, points[0]];
    set('bd-line', line(ring)); set('bd-head', empty);
    set('bd-fill', { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } });
    map.setPaintProperty('bd-fill', 'fill-opacity', 0.14);
  }

  // trace the outline from the first point, in the order the points were drawn
  function draw(points, ms, done) {
    clear();
    const ring = [...points, points[0]];
    const k = Math.cos(points[0][1] * Math.PI / 180); // longitude degrees shrink with latitude
    const seg = ring.slice(1).map((p, i) => Math.hypot((p[0] - ring[i][0]) * k, p[1] - ring[i][1]));
    const total = seg.reduce((a, b) => a + b, 0);
    const start = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - start) / ms);
      let left = t * total, i = 0;
      while (i < seg.length - 1 && left > seg[i]) left -= seg[i++];
      const f = seg[i] ? Math.min(1, left / seg[i]) : 1;
      const head = [ring[i][0] + (ring[i + 1][0] - ring[i][0]) * f, ring[i][1] + (ring[i + 1][1] - ring[i][1]) * f];
      set('bd-line', line([...ring.slice(0, i + 1), head]));
      set('bd-head', { type: 'Feature', geometry: { type: 'Point', coordinates: head } });
      if (t < 1) raf = requestAnimationFrame(frame);
      else { show(points); if (done) done(); }
    })(start);
  }

  // camera target that fits the whole area, leaving room for the HUD
  function camera(points) {
    const b = new maplibregl.LngLatBounds(points[0], points[0]);
    points.forEach((p) => b.extend(p));
    const padding = innerWidth > 760 ? { top: 110, bottom: 130, left: 60, right: 90 } : { top: 90, bottom: 20, left: 30, right: 30 };
    return map.cameraForBounds(b, { padding });
  }

  return { clear, show, draw, camera };
};
