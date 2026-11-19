# Cool UP 🌳❄️

**Beat the heat this El Niño.** Cool UP maps heat-relief spaces in and around
University of the Philippines campuses: parks, gardens, libraries, museums,
drinking water, cafés and covered shelters.

An initiative of **UPRI** (UP Resilience Institute) and **UPRI YouthMappers** for
El Niño preparedness. Collaboration with UP campuses is ongoing.

## Features

- Read-only Leaflet map with clustered pins, colour-coded by category
- Category filter chips, campus jump menu, and search
- "Near me" button that finds the closest heat-relief spot
- Data from OpenStreetMap, with a provisional `cool_up:type` tag (see [TAGS.md](TAGS.md))

Crowd-sourced contributions are planned for a later release.

## Run locally

It's a static site with no build step:

```bash
python3 -m http.server 8765
# open http://localhost:8765/
```

## Refresh the data

```bash
bash scripts/fetch_overpass.sh /tmp/raw.json   # retries across Overpass mirrors
python3 scripts/build_data.py /tmp/raw.json data/heat-relief.js
```

To explore interactively, paste `scripts/overpass-turbo.overpassql` into
<https://overpass-turbo.eu>.

## Data licence

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors,
available under the Open Database License (ODbL).
