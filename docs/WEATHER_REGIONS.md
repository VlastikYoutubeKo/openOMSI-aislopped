# Tomorrow.io map weather groups

Choose **Tomorrow.io** on the launcher's weather card or pass `--weather tomorrow`.
This is opt-in: other weather modes are unchanged. The map contains only locations;
every player supplies their own API key. Do not distribute a key with a map.

## Players: enable real weather

1. Get a Tomorrow.io key for your own account. Save it as plain text in
   `~/.openomsi/tomorrow-api-key.txt` (on Windows: `%USERPROFILE%/.openomsi/`).
   Keep the key out of your map/config exports. Environment overrides are below.
2. Install a map's `openomsi_weather.cfg` beside its global.cfg, or create one with
   the editor. Ordinary OMSI ignores this additional file.
3. In an openOMSI build containing this feature, choose **Tomorrow.io** on the
   launcher's weather card, select the map/entrypoint and start. Missing config/key
   preserves fallback weather and displays a message. This draft is not a claim
   that the feature is already available in every published release.

## Map authors: create groups

The planned community-hosted editor is
[openomsi.mxnticek.eu/weather/](https://openomsi.mxnticek.eu/weather/). Hosting is
pending; the editor is also included in the source tree and works offline now.

Open `tools/weather-regions/editor.html` (or `Start-Editor.cmd`) locally in a browser.
Select the map's `global.cfg`, add a group, enter `latitude;longitude`, select one or
more spawnpoints and assign them to that group. Export `openomsi_weather.cfg` beside
`global.cfg`. Existing configs can be imported and edited. The editor reads UTF-16,
UTF-8 and Windows-1250 and does not make network requests or modify the original map.

### Grouping real place names

Opt in to **Spawnpointy používají skutečné názvy míst**, then choose
**Rozdělit podle míst**. For example, `Praha,Ládví` and `Praha,Prosek` form one
group. Generic maps are grouped by the prefix before the first comma; GPS remains
unresolved until the author enters it. Case/diacritics are ignored for grouping.
There is no automatic online geocoding and no location data is sent to a server.

After loading map 400 v1.5.2, **Přiřadit města mapy 400** supplies 14 approximate
town-centre areas covering the known place names, including nearby villages. The
map's own file supplies its anchors; no game/map files are bundled with the editor.
Coordinates come from [GeoNames CZ](https://download.geonames.org/export/dump/CZ.zip),
[CC BY 4.0](https://www.geonames.org/export/). Doksy is the town near Lake Mácha.
Review the assignments, particularly when using a different map version.

Places such as Doksy or Chlum are not uniquely identified by their name. Do not
copy this map's coordinates into another map solely because its names match.
Game X/Y cannot be treated as lat/lon. More than one place may share a larger area
if approximate regional weather is sufficient; identical coordinates share cache.
Empty GPS and duplicate assignments prevent export. Keep unassigned spawnpoints
visible during review; they do not become weather anchors automatically.

### Configuration format

The additional `.cfg` is UTF-8 JSON, version 1. It is not referenced by `global.cfg`,
so ordinary OMSI continues to load the map. A content-root override under the same
relative `maps/<map>/openomsi_weather.cfg` path also works. Example structure (replace
the synthetic object/tile identifiers with those exported for your map):

```json
{
  "version": 1,
  "refresh_minutes": 15,
  "groups": [
    {
      "name": "City centre",
      "latitude": 50.0755,
      "longitude": 14.4378,
      "spawnpoints": [{"object_id": 7, "tile": [0, 0], "name": "Example"}]
    }
  ]
}
```

Spawnpoints are identified by object id and tile coordinates rather than an array
index or translated name. The game resolves their positions with the existing map
entrypoint logic. It picks the nearest group's closest spawnpoint while driving;
the current group is retained within a 200 m boundary tolerance. One spawnpoint
cannot belong to multiple groups. Unassigned spawnpoints are not weather anchors.

Set `OMSI_TOMORROW_API_KEY`, or `OMSI_TOMORROW_KEY_FILE` to a private text file. The
default file is `~/.openomsi/tomorrow-api-key.txt`. Credentials are sent only to
Tomorrow.io, in the `apikey` header. No credential is included in map configs,
weather announcements, cache files or error messages. Requests have an 8 s timeout
and do not follow redirects. Weather downloads run outside the rendering thread.

Only the active location is fetched. Normalized lat/lon (six decimal places) share
a cache across groups, maps and game restarts. A location's response stays fresh
for `refresh_minutes` (15â€“1440). Cache and quota bookkeeping live in the player's
private `~/.openomsi/weather-cache` folder, separated by a key fingerprint. A file
lock coordinates requests from concurrent game instances. Corrupt bookkeeping
fails closed rather than resetting the quota and sending more requests.

The local budget counts successful and failed attempts, with at least 180 s between
new requests and maxima of 20/rolling hour and 450/rolling day. The
[Tomorrow.io free plan](https://support.tomorrow.io/hc/en-us/articles/20273728362644-Free-API-Plan-Rate-Limits)
has its own limits, which may change; check the allowance for your account. Consumption by other applications
using the same key is outside this game's bookkeeping. HTTP 429 and rejected
credentials suspend requests for one hour. Failed requests preserve current weather.

The [Realtime endpoint](https://docs.tomorrow.io/reference/realtime-weather) uses
metric values: temperature, humidity, wind, visibility, cloud cover/base and
precipitation codes/intensity. Precipitation strength is an approximation for
OMSI's 0â€“255 scale, not a millimetre-accurate simulation. Snow cover is not inferred
from current snowfall. Transitions blend over 60 simulation seconds. This mode
takes precedence over METAR sync; a LAN client follows the host without fetching.
LAN-host startup behaviour has not been integration-tested.

Missing or invalid map config/key shows a message and leaves fallback weather in
force. Editing a map config requires reloading the map. Editing custom weather
switches out of the Tomorrow.io mode using the existing weather controls.

## Website integration

The [website handoff](WEATHER_EDITOR_WEB_HANDOFF.md) describes a clearer guided UI,
a community landing page, tutorials and an optional consent-based geocoding flow.
These hosted-site enhancements are a separate deployment, not implemented game
features in this draft. The offline editor and cfg format remain usable without them.
