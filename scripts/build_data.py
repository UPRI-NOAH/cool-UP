#!/usr/bin/env python3
"""Convert an Overpass JSON response into data/heat-relief.js for Cool UP.

Usage:
    bash scripts/fetch_overpass.sh /tmp/raw.json
    python3 scripts/build_data.py /tmp/raw.json data/heat-relief.js

Each OSM feature is assigned a provisional `cool_up:type` (see TAGS.md).
"""
import json
import sys
from datetime import date

# Campus bounding boxes [south, west, north, east]; keep in sync with js/config.js
CAMPUSES = {
    "diliman":  (14.643, 121.050, 14.668, 121.078),
    "losbanos": (14.145, 121.220, 14.180, 121.270),
    "manila":   (14.574, 120.981, 14.583, 120.990),
    "miagao":   (10.630, 122.215, 10.660, 122.245),
    "iloilo":   (10.693, 122.558, 10.702, 122.568),
    "tacloban": (11.236, 124.998, 11.246, 125.008),
    "mindanao": (7.078, 125.478, 7.097, 125.498),
    "baguio":   (16.400, 120.593, 16.410, 120.604),
    "cebu":     (10.316, 123.894, 10.326, 123.904),
}

# (osm key, osm value) -> (cool_up:type, human-readable kind). First match wins.
RULES = [
    (("amenity", "drinking_water"),   ("water",  "Drinking water")),
    (("amenity", "fountain"),         ("water",  "Fountain")),
    (("leisure", "swimming_pool"),    ("water",  "Swimming pool")),
    (("natural", "water"),            ("water",  "Pond / lake")),
    (("amenity", "library"),          ("indoor", "Library")),
    (("building", "library"),         ("indoor", "Library")),
    (("tourism", "museum"),           ("indoor", "Museum")),
    (("shop", "mall"),                ("indoor", "Mall")),
    (("amenity", "community_centre"), ("indoor", "Community centre")),
    (("amenity", "arts_centre"),      ("indoor", "Arts centre")),
    (("amenity", "cafe"),             ("food",   "Café")),
    (("amenity", "food_court"),       ("food",   "Food court")),
    (("amenity", "canteen"),          ("food",   "Canteen")),
    (("leisure", "park"),             ("green",  "Park")),
    (("leisure", "garden"),           ("green",  "Garden")),
    (("leisure", "nature_reserve"),   ("green",  "Nature reserve")),
    (("landuse", "forest"),           ("green",  "Forest")),
    (("natural", "wood"),             ("green",  "Wooded area")),
    (("landuse", "recreation_ground"), ("green", "Recreation ground")),
    (("landuse", "village_green"),    ("green",  "Open green")),
    (("natural", "tree_row"),         ("green",  "Tree-lined path")),
    (("amenity", "shelter"),          ("shade",  "Shelter")),
    (("amenity", "place_of_worship"), ("shade",  "Chapel / place of worship")),
    (("leisure", "sports_centre"),    ("shade",  "Sports centre")),
    (("leisure", "sports_hall"),      ("shade",  "Sports hall")),
]

# Unnamed features of these kinds are too noisy to be useful pins.
DROP_IF_UNNAMED = {("natural", "tree_row"), ("natural", "wood"), ("landuse", "forest"),
                   ("leisure", "swimming_pool"), ("natural", "water")}


def classify(tags):
    for (k, v), result in RULES:
        if tags.get(k) == v:
            return (k, v), result
    return None, None


def campus_for(lat, lng):
    for cid, (s, w, n, e) in CAMPUSES.items():
        if s <= lat <= n and w <= lng <= e:
            return cid
    # Large areas (forests, parks) can intersect a box while their centre lies
    # just outside it, so fall back to the nearest box.
    def dist(b):
        s, w, n, e = b
        return max(s - lat, 0, lat - n) ** 2 + max(w - lng, 0, lng - e) ** 2
    return min(CAMPUSES, key=lambda cid: dist(CAMPUSES[cid]))


def main(src, dst):
    raw = json.load(open(src, encoding="utf-8"))
    out, seen = [], set()
    for el in raw["elements"]:
        tags = el.get("tags", {})
        lat = el.get("lat", el.get("center", {}).get("lat"))
        lng = el.get("lon", el.get("center", {}).get("lon"))
        if lat is None or lng is None:
            continue
        match, result = classify(tags)
        if not result:
            continue
        if tags.get("access") in ("private", "no"):
            continue
        name = tags.get("name:en") or tags.get("name") or ""
        if not name and match in DROP_IF_UNNAMED:
            continue
        osm_id = f"{el['type']}/{el['id']}"
        if osm_id in seen:
            continue
        seen.add(osm_id)
        keep = {k: tags[k] for k in ("opening_hours", "air_conditioning", "drinking_water",
                                     "access", "website") if k in tags}
        out.append({
            "id": osm_id,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "name": name,
            "type": result[0],          # provisional cool_up:type
            "kind": result[1],
            "match": f"{match[0]}={match[1]}",
            "campus": campus_for(lat, lng),
            "tags": keep,
        })

    out.sort(key=lambda f: (f["campus"] or "", f["type"], f["name"]))
    payload = {
        "generated": date.today().isoformat(),
        "source": "© OpenStreetMap contributors (ODbL), via Overpass API",
        "features": out,
    }
    with open(dst, "w", encoding="utf-8") as f:
        f.write("/* Generated by scripts/build_data.py. Do not edit by hand. */\n")
        f.write("window.COOL_UP_DATA = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    from collections import Counter
    print(f"{len(out)} features written to {dst}")
    print("by type:  ", dict(Counter(f["type"] for f in out)))
    print("by campus:", dict(Counter(f["campus"] for f in out)))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
