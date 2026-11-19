#!/bin/bash
# Fetch heat-relief features around UP campuses from Overpass, with backoff.
OUT="$1"
read -r -d '' FILTERS <<'EOF'
  nwr["leisure"~"^(park|garden|nature_reserve|swimming_pool|sports_centre)$"](BBOX);
  nwr["amenity"~"^(library|drinking_water|shelter|place_of_worship|cafe|food_court|canteen|community_centre|arts_centre)$"](BBOX);
  nwr["landuse"~"^(forest|recreation_ground|village_green)$"](BBOX);
  nwr["natural"~"^(wood|water|tree_row)$"](BBOX);
  nwr["shop"="mall"](BBOX);
  nwr["tourism"="museum"](BBOX);
  nwr["building"="library"](BBOX);
EOF
BBOXES=(
  "14.643,121.050,14.668,121.078"   # Diliman
  "14.145,121.220,14.180,121.270"   # Los Banos (+ Open University)
  "14.574,120.981,14.583,120.990"   # Manila
  "10.630,122.215,10.660,122.245"   # Visayas Miagao
  "10.693,122.558,10.702,122.568"   # Visayas Iloilo City
  "11.236,124.998,11.246,125.008"   # Tacloban
  "7.078,125.478,7.097,125.498"     # Mindanao
  "16.400,120.593,16.410,120.604"   # Baguio
  "10.316,123.894,10.326,123.904"   # Cebu
)
Q="[out:json][timeout:120];("
for b in "${BBOXES[@]}"; do
  b="${b%%#*}"; b="${b// /}"
  Q+="${FILTERS//BBOX/$b}"
done
Q+=");out tags center;"
wait=15
for i in 1 2 3 4 5 6 7; do
  for u in https://overpass-api.de/api/interpreter https://overpass.private.coffee/api/interpreter https://overpass.kumi.systems/api/interpreter; do
    code=$(curl -s -m 150 -A "Mozilla/5.0 CoolUP-map/0.1" -o "$OUT" -w "%{http_code}" "$u" --data-urlencode "data=$Q")
    echo "try $i $u -> $code"
    if [ "$code" = "200" ] && head -c 50 "$OUT" | grep -q '{'; then echo OK; exit 0; fi
  done
  sleep $wait; wait=$((wait*2))
done
exit 1
