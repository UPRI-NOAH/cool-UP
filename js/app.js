/* ================================================================
   Cool UP — App Logic (read-only map, no data input)
================================================================ */

'use strict';

let map, clusterLayer, meMarker = null;
const layersByType = new Map();   // cool_up:type → array of markers
const activeTypes  = new Set(Object.keys(CONFIG.CATEGORIES));
const places       = [];          // flattened features, for search
let toastTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadPlaces();
  setupUI();
  maybeShowAbout();
});

// ================================================================
//  MAP
// ================================================================

function initMap() {
  const campus = CONFIG.CAMPUSES.find((c) => c.id === CONFIG.DEFAULT_CAMPUS);
  map = L.map('map', { center: campus.center, zoom: campus.zoom, zoomControl: true });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  clusterLayer = L.markerClusterGroup({ maxClusterRadius: 40, showCoverageOnHover: false }).addTo(map);
}

function loadPlaces() {
  const data = window.COOL_UP_DATA;
  if (!data || !Array.isArray(data.features)) {
    showToast('Could not load heat-relief data.', 'error');
    return;
  }

  for (const t of Object.keys(CONFIG.CATEGORIES)) layersByType.set(t, []);

  data.features.forEach((f) => {
    const cat = CONFIG.CATEGORIES[f.type];
    if (!cat) return;
    const marker = L.marker([f.lat, f.lng], {
      icon: L.divIcon({
        html: `<div class="cool-pin" style="--pin-color:${cat.color}">${cat.icon}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
      }),
      title: f.name || cat.label,
    });
    marker.bindPopup(() => buildPopup(f, cat), { maxWidth: 280, className: 'cool-popup' });
    layersByType.get(f.type).push(marker);
    places.push({ ...f, marker });
  });

  refreshLayers();
  buildFilterChips();
}

function refreshLayers() {
  clusterLayer.clearLayers();
  const visible = [];
  activeTypes.forEach((t) => visible.push(...(layersByType.get(t) || [])));
  clusterLayer.addLayers(visible);
}

function buildPopup(f, cat) {
  const wrap = document.createElement('div');
  wrap.style.setProperty('--pin-color', cat.color);

  const band = document.createElement('div');
  band.className = 'popup-band';
  wrap.appendChild(band);

  const body = document.createElement('div');
  body.className = 'popup-body';

  const h3 = document.createElement('h3');
  h3.className = 'popup-name';
  h3.textContent = f.name || `Unnamed ${f.kind.toLowerCase()}`;
  body.appendChild(h3);

  const badgeRow = document.createElement('p');
  badgeRow.className = 'popup-row';
  const badge = document.createElement('span');
  badge.className = 'popup-badge';
  badge.textContent = `${cat.icon} ${cat.label}`;
  badgeRow.appendChild(badge);
  body.appendChild(badgeRow);

  addRow(body, '🏷', f.kind);
  addRow(body, '🎓', campusName(f.campus));
  if (f.tags.air_conditioning === 'yes') addRow(body, '❄️', 'Air-conditioned');
  if (f.tags.opening_hours) addRow(body, '🕒', f.tags.opening_hours);
  if (f.tags.drinking_water === 'yes' && f.type !== 'water') addRow(body, '💧', 'Drinking water available');

  const link = document.createElement('p');
  link.className = 'popup-row';
  const a = document.createElement('a');
  a.href = `https://www.openstreetmap.org/${f.id}`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = 'View / improve on OpenStreetMap';
  link.appendChild(document.createTextNode('🔗 '));
  link.appendChild(a);
  body.appendChild(link);

  const tags = document.createElement('p');
  tags.className = 'popup-tags';
  tags.textContent = `cool_up:type=${f.type} · ${f.match}`;
  body.appendChild(tags);

  wrap.appendChild(body);
  return wrap;
}

function addRow(parent, icon, text) {
  if (!text) return;
  const p = document.createElement('p');
  p.className = 'popup-row';
  p.textContent = `${icon} ${text}`;
  parent.appendChild(p);
}

function campusName(id) {
  const c = CONFIG.CAMPUSES.find((x) => x.id === id);
  return c ? c.name : '';
}

// ================================================================
//  UI
// ================================================================

function setupUI() {
  // Campus dropdown
  const sel = document.getElementById('campus-select');
  CONFIG.CAMPUSES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
  sel.value = CONFIG.DEFAULT_CAMPUS;
  sel.addEventListener('change', () => {
    const c = CONFIG.CAMPUSES.find((x) => x.id === sel.value);
    if (c) map.flyTo(c.center, c.zoom, { duration: 1.2 });
  });

  // About modal
  const list = document.getElementById('about-list');
  Object.values(CONFIG.CATEGORIES).forEach((cat) => {
    const li = document.createElement('li');
    li.style.setProperty('--chip-color', cat.color);
    li.innerHTML = `<strong>${cat.icon} ${escapeHtml(cat.label)}</strong><br>${escapeHtml(cat.blurb)}`;
    list.appendChild(li);
  });
  document.getElementById('btn-about').addEventListener('click', openAbout);
  document.getElementById('btn-about-close').addEventListener('click', closeAbout);
  document.getElementById('about-modal').addEventListener('click', (e) => {
    if (e.target.id === 'about-modal') closeAbout();
  });

  document.getElementById('btn-locate').addEventListener('click', locateMe);
  setupSearch();
}

function buildFilterChips() {
  const nav = document.getElementById('filters');
  Object.entries(CONFIG.CATEGORIES).forEach(([type, cat]) => {
    const count = (layersByType.get(type) || []).length;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.style.setProperty('--chip-color', cat.color);
    chip.setAttribute('aria-pressed', 'true');
    chip.innerHTML = `<span aria-hidden="true">${cat.icon}</span>${escapeHtml(cat.label)}<span class="count">${count}</span>`;
    chip.addEventListener('click', () => {
      const on = !activeTypes.has(type);
      if (on) activeTypes.add(type); else activeTypes.delete(type);
      chip.classList.toggle('off', !on);
      chip.setAttribute('aria-pressed', String(on));
      refreshLayers();
    });
    nav.appendChild(chip);
  });
}

function maybeShowAbout() {
  let seen = false;
  try { seen = localStorage.getItem('coolup-about-seen') === '1'; } catch (_) { /* ignore */ }
  if (!seen) openAbout();
}

function openAbout()  { document.getElementById('about-modal').classList.remove('hidden'); }
function closeAbout() {
  document.getElementById('about-modal').classList.add('hidden');
  try { localStorage.setItem('coolup-about-seen', '1'); } catch (_) { /* ignore */ }
}

// ---- Locate me: show position + nearest heat-relief spots ----

function locateMe() {
  if (!navigator.geolocation) {
    showToast('Location is not supported by your browser.', 'error');
    return;
  }
  const btn = document.getElementById('btn-locate');
  btn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.disabled = false;
      const here = L.latLng(pos.coords.latitude, pos.coords.longitude);
      if (meMarker) map.removeLayer(meMarker);
      meMarker = L.marker(here, {
        icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        interactive: false,
      }).addTo(map);

      const nearest = places
        .filter((p) => activeTypes.has(p.type))
        .map((p) => ({ p, d: here.distanceTo([p.lat, p.lng]) }))
        .sort((a, b) => a.d - b.d)[0];

      if (nearest && nearest.d < 3000) {
        map.fitBounds(L.latLngBounds([here, [nearest.p.lat, nearest.p.lng]]).pad(0.4), { maxZoom: 18 });
        clusterLayer.zoomToShowLayer(nearest.p.marker, () => nearest.p.marker.openPopup());
        showToast(`Nearest cool spot: ${Math.round(nearest.d)} m away`, 'success');
      } else {
        map.setView(here, 16);
        showToast('No mapped heat-relief spots within 3 km yet.', 'info');
      }
    },
    () => {
      btn.disabled = false;
      showToast('Could not get your location.', 'error');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

// ================================================================
//  SEARCH (client-side over loaded places)
// ================================================================

function setupSearch() {
  const toggle  = document.getElementById('btn-search-toggle');
  const bar     = document.getElementById('search-bar');
  const input   = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  function closeSearch() {
    input.value = '';
    results.classList.add('hidden');
    bar.classList.add('hidden');
  }

  toggle.addEventListener('click', () => {
    const isHidden = bar.classList.toggle('hidden');
    if (!isHidden) input.focus();
    else { input.value = ''; results.classList.add('hidden'); }
  });

  input.addEventListener('input', debounce(() => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.add('hidden'); return; }

    results.innerHTML = '';
    results.classList.remove('hidden');

    const matches = places.filter((p) =>
      [p.name, p.kind, CONFIG.CATEGORIES[p.type].label, campusName(p.campus)]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
    // Named places first
    matches.sort((a, b) => (b.name ? 1 : 0) - (a.name ? 1 : 0));

    if (matches.length === 0) {
      results.innerHTML = '<p class="search-no-results">No matching spaces yet.</p>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'search-section-header';
    header.textContent = `${matches.length} heat-relief space${matches.length === 1 ? '' : 's'}`;
    results.appendChild(header);

    matches.slice(0, 12).forEach((p) => {
      const cat = CONFIG.CATEGORIES[p.type];
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.setAttribute('role', 'option');
      item.innerHTML = `<strong>${cat.icon} ${escapeHtml(p.name || 'Unnamed ' + p.kind.toLowerCase())}</strong>` +
                       `<span>${escapeHtml(p.kind)} · ${escapeHtml(campusName(p.campus))}</span>`;
      item.addEventListener('click', () => {
        if (!activeTypes.has(p.type)) {
          // Re-enable the filter so the pin is actually visible
          const chip = [...document.querySelectorAll('.chip')][Object.keys(CONFIG.CATEGORIES).indexOf(p.type)];
          if (chip) chip.click();
        }
        clusterLayer.zoomToShowLayer(p.marker, () => p.marker.openPopup());
        closeSearch();
      });
      results.appendChild(item);
    });
  }, 200));

  document.addEventListener('click', (e) => {
    if (!bar.contains(e.target) && e.target !== toggle) results.classList.add('hidden');
  });
}

// ================================================================
//  HELPERS
// ================================================================

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast toast-${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast hidden'; }, 4500);
}
