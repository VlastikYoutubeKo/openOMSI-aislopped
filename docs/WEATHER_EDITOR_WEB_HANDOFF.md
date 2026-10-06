# Website handoff / prompt for Claude

The implementation contract is [WEATHER_REGIONS.md](WEATHER_REGIONS.md).
The working static editor is under `tools/weather-regions/`. Its helper functions
are exported from `editor.js` for Node tests; preserve their format and validation.
The public package contains city-centre coordinates, not a copy of map 400.

Copy the following prompt into the website task:

---

Připrav komunitní rozcestník na **openomsi.mxnticek.eu** a nástroj pro skupiny
počasí na **/weather/**. Doménu právě připravuješ; publikaci nech na mně.
Nevydávej web za oficiální web projektu openOMSI.

Vycházej z hotového editoru `tools/weather-regions/editor.html`, `editor.js`,
`map400-preset.js` a dokumentace `docs/WEATHER_REGIONS.md`. Dodám ti tyto soubory.
Nezměň formát exportu jen kvůli designu. Podpora hry je zatím v draft PR;
web nesmí tvrdit, že ji už obsahují všechna běžná vydání.

## Rozcestník a vzhled

- Český, přístupný a responzivní web. Klidný tmavě modrý nebo světlý základ,
  jeden modrý akcent, čitelné písmo, jasné stavy a ovladatelnost klávesnicí.
  Respektuj současný vizuální styl domény. Použij vlastní nebo povolené logo.
- Úvodní stránka má stručné vysvětlení, kartu „Editor počasí“, kartu „Jak začít“
  a odkazy na upstream projekt, jeho vydání a dokumentaci. Žádné smyšlené nástroje.
- Editor jako tři kroky: **1. Načti mapu → 2. Zkontroluj oblasti → 3. Exportuj**.
  Velká oblast pro výběr/přetažení global.cfg; nahoře název mapy, počet spawnpointů,
  přiřazených/nepřiřazených bodů a počet skutečných API lokalit.
- Vyhledávání a hromadný výběr spawnpointů; kompaktní skupiny s názvem, GPS a
  počtem bodů. Detaily otevři po výběru skupiny. Export a validace mají být vidět
  bez procházení dlouhého seznamu karet. Mobil nesmí vyžadovat horizontální scroll.
- Chyby vysvětli u konkrétního pole; nedokončené skupiny viditelně označ.

## Automatické přiřazení a případné hledání GPS

- Při výslovném zaškrtnutí „Spawnpointy používají skutečné názvy míst“ nabídni
  rozdělení podle části názvu před první čárkou. Zachovej diakritiku pro zobrazení,
  při párování ignoruj velikost písmen/diakritiku. Dovol opravit název místa ručně.
- Hotová předvolba mapy 400 má 14 oblastí a přibližná centra měst z GeoNames.
  Načti spawnpointy z uživatelova souboru; nepřibaluj původní global.cfg/mapové
  soubory. Předvolbu nepoužívej na jinou mapu jen kvůli podobným názvům.
- Generické mapy se nyní automaticky seskupí, ale jejich GPS zůstanou prázdné.
  Nenahrazuj neznámé polohy nulami ani odhadem z herních X/Y.
- Pokud přidáš vyhledávání GPS, nabídni zemi/region a **samostatný souhlas s
  odesláním názvů míst geokodéru**. Vysvětli, co odchází. Odešli jen unikátní
  názvy míst a zvolenou zemi, nikoli celý global.cfg, object ID, herní souřadnice
  ani jakýkoli API klíč. Bez souhlasu musí plně fungovat ruční/offline režim.
- Použij poskytovatele, který aktuálně povoluje zamýšlené webové a dávkové použití.
  Ověř pravidla, limity, atribuci a CORS; veřejný Nominatim nepoužívej jako
  automatické doplňování nebo neomezený dávkový backend. Cache stejné dotazy.
- U „Doksy“, „Chlum“ apod. nabídni možné výsledky se zemí/regionem. Jednoznačnost
  se nesmí předstírat: uživatel musí vybrat a potvrdit správné místo.
  Zobraz zdroj GPS, přibližnou přesnost a dovol více míst spojit do jedné oblasti.

## Soukromí, formát a tutoriál

- Zpracování global.cfg a export běží v prohlížeči. Bez uploadu mapy, analytiky
  nad jejími daty a bez formuláře pro Tomorrow.io klíč. Žádná API volání počasí
  z editoru. Nevyžaduj účet ani instalaci.
- Zachovej UTF-16LE/BE, UTF-8 a Windows-1250, načtení existujícího cfg, unikátní
  přiřazení bodů a stabilní identitu `(tile, object_id)`.
- Exportuj UTF-8 JSON jako `openomsi_weather.cfg`, `version: 1`, s
  `refresh_minutes` v rozsahu 15–1440 a `groups` obsahujícími `name`, `latitude`,
  `longitude`, `spawnpoints: [{object_id, tile: [x,y], name}]`. Nepřidávej metadata
  ani klíče do tohoto JSON: hra neznámá pole odmítá. Nikdy neměň global.cfg.
- Tutoriál ukaž pro autora mapy i hráče: kde najít global.cfg; jak seskupit body,
  ověřit GPS, řešit více měst stejného názvu a snížit počet API lokalit; kam uložit
  cfg vedle global.cfg; proč ho běžné OMSI ignoruje; jak hráč soukromě nastaví
  vlastní klíč a zvolí Tomorrow.io v podporované sestavě. Používej pouze placeholder
  klíče. Po úpravě cfg je třeba mapu znovu načíst.
- Vysvětli výběr nejbližší skupiny během jízdy, 200m toleranci přepnutí, sdílenou
  15min cache a že se nestahují všechny oblasti předem. Více skupin samo o sobě
  neznamená více API požadavků každých 15 minut.
- Uveď GeoNames / CC BY 4.0 a případného dalšího poskytovatele GPS. Přibližné
  centrum města není přesná GPS každého spawnpointu.

Ověř import/export, chybné souřadnice, duplicity, nezařazené body, oba druhy
automatického přiřazení, nejednoznačná místa a mobil/klávesnici. Spusť existující
Node testy. Dodej náhled obrazovek, soubory k nahrání a krátké pokyny pro hosting.
Kanonic­ká adresa editoru má být `https://openomsi.mxnticek.eu/weather/`, aby fungoval
odkaz v dokumentaci PR. Když se cesta musí změnit, sděl ji před dokončením.
