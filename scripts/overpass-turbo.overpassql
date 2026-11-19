/*
  Cool UP — heat-relief spaces
  Paste into https://overpass-turbo.eu, pan to a campus, and click Run.
  {{bbox}} = current map view. Categories are listed in ../TAGS.md.
*/
[out:json][timeout:60];
(
  // 🌳 green & shaded
  nwr["leisure"~"^(park|garden|nature_reserve)$"]({{bbox}});
  nwr["landuse"~"^(forest|recreation_ground|village_green)$"]({{bbox}});
  nwr["natural"~"^(wood|tree_row)$"]({{bbox}});
  // 📚 indoor & cool
  nwr["amenity"~"^(library|community_centre|arts_centre)$"]({{bbox}});
  nwr["building"="library"]({{bbox}});
  nwr["tourism"="museum"]({{bbox}});
  nwr["shop"="mall"]({{bbox}});
  // 💧 water
  nwr["amenity"~"^(drinking_water|fountain)$"]({{bbox}});
  nwr["leisure"="swimming_pool"]({{bbox}});
  nwr["natural"="water"]({{bbox}});
  // 🥤 food & drinks
  nwr["amenity"~"^(cafe|food_court|canteen)$"]({{bbox}});
  // ⛱️ shelter
  nwr["amenity"~"^(shelter|place_of_worship)$"]({{bbox}});
  nwr["leisure"~"^(sports_centre|sports_hall)$"]({{bbox}});
  // Already tagged with the provisional Cool UP scheme
  nwr["cool_up:type"]({{bbox}});
);
out tags center;
