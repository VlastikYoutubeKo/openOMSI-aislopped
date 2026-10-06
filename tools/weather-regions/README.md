# Map weather editor

Open `editor.html` locally, or run `Start-Editor.cmd` on Windows. No installation,
weather API calls, keys or map upload are needed.

1. Select your map's `global.cfg` (UTF-16, UTF-8 or Windows-1250).
2. Add groups and enter verified `latitude;longitude`; select spawnpoints and assign them.
   If names identify real places, opt in to **Rozdělit podle míst**: names before the
   first comma are grouped automatically, case/diacritics ignored. Generic maps still
   need manually verified GPS: place names can be ambiguous.
3. Map 400 v1.5.2 can use **Přiřadit města mapy 400** after loading its own global.cfg.
   It groups nearby villages into 14 areas with approximate town-centre coordinates.
   No original map data is bundled. Doksy refers to the town near Lake Mácha.
4. Review locations and assignments. Export `openomsi_weather.cfg` beside global.cfg.
   Import an existing cfg after loading the same map to edit it.

The game chooses the nearest group while driving and shares its weather cache across
identical GPS coordinates. More spawnpoints in one area do not create more API requests.
See [player and map-author tutorial](../../docs/WEATHER_REGIONS.md) for enabling
Tomorrow.io, private credentials, limits, configuration format and failure handling.

Planned hosted editor: [openomsi.mxnticek.eu/weather/](https://openomsi.mxnticek.eu/weather/).
Deployment is pending; the local HTML is the working fallback.
Website design/tutorial brief: [WEATHER_EDITOR_WEB_HANDOFF.md](../../docs/WEATHER_EDITOR_WEB_HANDOFF.md).

GPS source: [GeoNames CZ](https://download.geonames.org/export/dump/CZ.zip),
[CC BY 4.0](https://www.geonames.org/export/). Town centres approximate an area's weather;
game X/Y are not geographic coordinates.

Validation: `node tools/weather-regions/test_editor.js [path/to/global.cfg]`.
