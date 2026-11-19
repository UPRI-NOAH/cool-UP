/* ================================================================
   Cool UP — Configuration
   No secrets here: this map is read-only and uses OpenStreetMap data
   baked into data/heat-relief.js by scripts/build_data.py.
================================================================ */

const CONFIG = Object.freeze({
  DEFAULT_CAMPUS: 'diliman',

  // Campus list drives the campus dropdown. `bbox` is [south, west, north, east]
  // and must match the boxes in scripts/fetch_overpass.sh.
  CAMPUSES: [
    { id: 'diliman',   name: 'UP Diliman',              center: [14.6549, 121.0645], zoom: 15, bbox: [14.643, 121.050, 14.668, 121.078] },
    { id: 'losbanos',  name: 'UP Los Baños',            center: [14.1650, 121.2420], zoom: 15, bbox: [14.145, 121.220, 14.180, 121.270] },
    { id: 'manila',    name: 'UP Manila',               center: [14.5785, 120.9855], zoom: 17, bbox: [14.574, 120.981, 14.583, 120.990] },
    { id: 'miagao',    name: 'UP Visayas (Miag-ao)',    center: [10.6440, 122.2300], zoom: 16, bbox: [10.630, 122.215, 10.660, 122.245] },
    { id: 'iloilo',    name: 'UP Visayas (Iloilo City)', center: [10.6975, 122.5630], zoom: 17, bbox: [10.693, 122.558, 10.702, 122.568] },
    { id: 'tacloban',  name: 'UP Tacloban',             center: [11.2410, 125.0030], zoom: 17, bbox: [11.236, 124.998, 11.246, 125.008] },
    { id: 'mindanao',  name: 'UP Mindanao',             center: [7.0875, 125.4880],  zoom: 16, bbox: [7.078, 125.478, 7.097, 125.498] },
    { id: 'baguio',    name: 'UP Baguio',               center: [16.4050, 120.5985], zoom: 17, bbox: [16.400, 120.593, 16.410, 120.604] },
    { id: 'cebu',      name: 'UP Cebu',                 center: [10.3210, 123.8990], zoom: 17, bbox: [10.316, 123.894, 10.326, 123.904] },
  ],

  // Provisional `cool_up:type` values. Order = chip order.
  CATEGORIES: {
    green:  { label: 'Green & shaded',  icon: '🌳', color: '#2d8a4e', blurb: 'Parks, gardens, groves and forests: natural shade and cooler air.' },
    indoor: { label: 'Indoor & cool',   icon: '📚', color: '#1f6fd1', blurb: 'Libraries, museums, malls and halls, often air-conditioned.' },
    water:  { label: 'Water',           icon: '💧', color: '#0aa2c0', blurb: 'Drinking fountains, pools and ponds to rehydrate or cool off.' },
    food:   { label: 'Food & drinks',   icon: '🥤', color: '#b26a00', blurb: 'Cafés and canteens for a cold drink and a seat out of the sun.' },
    shade:  { label: 'Shelter',         icon: '⛱️', color: '#7a5cc2', blurb: 'Covered shelters, chapels and sports halls with a roof overhead.' },
  },
});
