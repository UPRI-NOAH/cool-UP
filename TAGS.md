# Cool UP: provisional tagging scheme

Cool UP shows **heat-relief spaces** around University of the Philippines
campuses. Pins come from existing OpenStreetMap tags. Each pin also gets a
**temporary** `cool_up:type` value so the map can group them while the
community settles on a tagging scheme.

> These tags are a draft. Don't bulk-add `cool_up:*` tags to OSM until the
> scheme has been discussed with the PH OSM community (talk-ph / OSM PH
> Telegram).

## `cool_up:type` values

| `cool_up:type` | Chip | Derived from OSM tags |
|---|---|---|
| `green`  | 🌳 Green & shaded | `leisure=park\|garden\|nature_reserve`, `landuse=forest\|recreation_ground\|village_green`, `natural=wood\|tree_row` |
| `indoor` | 📚 Indoor & cool  | `amenity=library\|community_centre\|arts_centre`, `building=library`, `tourism=museum`, `shop=mall` |
| `water`  | 💧 Water          | `amenity=drinking_water\|fountain`, `leisure=swimming_pool`, `natural=water` |
| `food`   | 🥤 Food & drinks  | `amenity=cafe\|food_court\|canteen` |
| `shade`  | ⛱️ Shelter        | `amenity=shelter\|place_of_worship`, `leisure=sports_centre\|sports_hall` |

If a feature matches more than one rule, the first match in this order wins:
water → indoor → food → green → shade (see `RULES` in `scripts/build_data.py`).

## Proposed attributes for crowd-sourcing (future)

| Tag | Values | Notes |
|---|---|---|
| `cool_up:type` | as above | Main category |
| `air_conditioning` | `yes` / `no` | Existing OSM key, shown in popups |
| `drinking_water` | `yes` / `no` | Existing OSM key |
| `cool_up:shade` | `full` / `partial` / `none` | How much of the space is shaded |
| `cool_up:seating` | `yes` / `no` | Somewhere to sit and rest |
| `cool_up:access` | `public` / `students` / `customers` | Who can use the space |
| `opening_hours` | OSM syntax | Existing OSM key |

## Filters applied

- Features tagged `access=private` or `access=no` are dropped.
- Unnamed tree rows, woods, forests, pools and water bodies are dropped
  because they add noise.
- The search areas are bounding boxes around each campus (see `js/config.js`),
  so nearby off-campus places are included on purpose.

## Refreshing the data

```bash
cd cool-up
bash scripts/fetch_overpass.sh /tmp/raw.json   # retries across Overpass mirrors
python3 scripts/build_data.py /tmp/raw.json data/heat-relief.js
```

To explore interactively, paste `scripts/overpass-turbo.overpassql` into
<https://overpass-turbo.eu>.
