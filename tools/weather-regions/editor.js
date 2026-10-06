"use strict";

function decodeMap(bytes) {
  const b = new Uint8Array(bytes);
  if (b[0] === 255 && b[1] === 254) return new TextDecoder("utf-16le").decode(b);
  if (b[0] === 254 && b[1] === 255) return new TextDecoder("utf-16be").decode(b);
  try {return new TextDecoder("utf-8",{fatal:true}).decode(b);} catch {return new TextDecoder("windows-1250").decode(b);}
}

function parseGlobal(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map(s => s.trim());
  const tiles = [], records = [];
  let name = "Mapa";
  const number = (s, integer = false) => {
    if (s === undefined || s === "") throw Error("Neúplná poloha spawnpointu.");
    const n = Number(s);
    if (!Number.isFinite(n) || (integer && !Number.isSafeInteger(n))) throw Error("Neplatné číslo v global.cfg.");
    return n;
  };
  for (let i = 0; i < lines.length; i++) {
    const tag = lines[i].toLowerCase();
    if (tag === "[name]") name = lines[i + 1] || name;
    if (tag === "[map]") tiles.push([number(lines[i + 1], true), number(lines[i + 2], true)]);
    if (tag === "[entrypoints]") {
      const count = number(lines[++i], true);
      if (count < 0 || count > 10000) throw Error("Neplatný počet spawnpointů.");
      for (let j = 0; j < count; j++) {
        const row = lines.slice(i + 1, i + 13);
        if (row.length !== 12) throw Error("Neúplný seznam spawnpointů.");
        records.push({index:number(row[0],true), object_id:number(row[1],true),
          x:number(row[3]), z:number(row[4]), y:number(row[5]),
          tileIndex:number(row[10],true), name:row[11] || `Spawnpoint ${j + 1}`});
        i += 12;
      }
    }
  }
  const spawns = records.map(r => {
    const tile = tiles[r.tileIndex];
    if (!tile) throw Error(`Spawnpoint „${r.name}“ odkazuje na neexistující tile ${r.tileIndex}.`);
    return {...r, tile, key:`${tile.join(",")}:${r.object_id}`};
  });
  if (!spawns.length) throw Error("Mapa neobsahuje žádné [entrypoints].");
  return {name, spawns};
}

function coordinates(text) {
  const parts = text.trim().split(/[;,]/).map(s => s.trim());
  if (parts.length !== 2 || parts.some(s => !s)) throw Error("Souřadnice musí být lat;lon, s desetinnou tečkou.");
  const [lat, lon] = parts.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw Error("Latitude musí být −90…90, longitude −180…180.");
  return [lat, lon];
}

function makeConfig(map, groups, refresh) {
  if (!map) throw Error("Nejprve načti mapu.");
  const exported = groups.filter(g => g.keys.size).map(g => {
    const [latitude, longitude] = coordinates(g.coords);
    if (!g.name.trim()) throw Error("Pojmenuj všechny použité skupiny.");
    return {name:g.name.trim(), latitude, longitude, spawnpoints:map.spawns.filter(s => g.keys.has(s.key)).map(s => ({object_id:s.object_id,tile:s.tile,name:s.name}))};
  });
  if (!exported.length) throw Error("Přiřaď alespoň jeden spawnpoint do skupiny.");
  const used = new Set();
  for (const g of exported) for (const s of g.spawnpoints) {
    const k = `${s.tile.join(",")}:${s.object_id}`;
    if (used.has(k)) throw Error("Jeden spawnpoint nesmí být v několika skupinách.");
    used.add(k);
  }
  if (!Number.isInteger(refresh) || refresh < 15 || refresh > 1440) throw Error("Interval musí být 15…1440 minut.");
  return {version:1,refresh_minutes:refresh,groups:exported};
}

function importConfig(map, cfg) {
  if (!map) throw Error("Nejprve načti stejnou mapu.");
  if (cfg.version !== 1 || !Array.isArray(cfg.groups)) throw Error("Neznámý formát cfg.");
  if (!Number.isInteger(cfg.refresh_minutes) || cfg.refresh_minutes < 15 || cfg.refresh_minutes > 1440) throw Error("Neplatný interval.");
  const known = new Set(map.spawns.map(s => s.key));
  const groups = cfg.groups.map(g => {
    coordinates(`${g.latitude};${g.longitude}`);
    if (!Array.isArray(g.spawnpoints) || typeof g.name !== "string") throw Error("Neplatná skupina.");
    const keys = new Set(g.spawnpoints.map(s => `${s.tile.join(",")}:${s.object_id}`));
    if ([...keys].some(k => !known.has(k))) throw Error("Cfg obsahuje spawnpointy jiné verze mapy.");
    return {name:g.name,coords:`${g.latitude};${g.longitude}`,keys};
  });
  makeConfig(map, groups, cfg.refresh_minutes);
  return groups;
}

function cityGroups(map, preset) {
  const groups = preset.regions.map(r => ({name:r.name, coords:`${r.latitude};${r.longitude}`, keys:new Set()}));
  for (const spawn of map.spawns) {
    const town = spawn.name.split(",")[0].trim();
    const index = preset.regions.findIndex(r => r.towns.includes(town));
    if (index < 0) throw Error(`Pro „${spawn.name}“ není v předvolbě přiřazené město.`);
    groups[index].keys.add(spawn.key);
  }
  return groups.filter(g => g.keys.size);
}

function placeName(name) { return name.split(",")[0].trim(); }
function placeKey(name) { return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase().replace(/\s+/g," ").trim(); }
function allocatePlaces(map, preset) {
  if (!map) throw Error("Nejprve načti global.cfg.");
  // Known map 400 aliases share a weather area. Generic maps are grouped by name only:
  // identical place names elsewhere are not enough to guess a geographic location.
  if (/\b400\b/.test(map.name) && map.spawns.every(s => preset.regions.some(r => r.towns.includes(placeName(s.name))))) return cityGroups(map,preset);
  const byName = new Map();
  for (const s of map.spawns) {
    const name = placeName(s.name), key = placeKey(name);
    if (!key) throw Error(`Spawnpoint „${s.name}“ nemá název místa před čárkou.`);
    if (!byName.has(key)) byName.set(key,{name,coords:"",keys:new Set()});
    byName.get(key).keys.add(s.key);
  }
  return [...byName.values()];
}

if (typeof module !== "undefined") module.exports = {decodeMap, parseGlobal, coordinates, makeConfig, importConfig, cityGroups, allocatePlaces};

if (typeof document !== "undefined") {
  let map = null, groups = [], selected = new Set();
  const el = id => document.getElementById(id);
  const message = (text, error = false) => {el("status").textContent = text;el("status").classList.toggle("error",error);};
  const guarded = fn => async () => {try {await fn();} catch(e) {message(e.message,true);}};
  const visible = () => (map?.spawns || []).filter(s => s.name.toLocaleLowerCase().includes(el("filter").value.toLocaleLowerCase()));
  function drawSpawns() {
    const tbody = el("spawns"); tbody.replaceChildren();
    for (const s of visible()) {
      const row = document.createElement("tr"), checkCell = document.createElement("td"), nameCell = document.createElement("td"), groupCell = document.createElement("td");
      const check = document.createElement("input"); check.type = "checkbox";check.checked = selected.has(s.key);check.setAttribute("aria-label",`Vybrat ${s.name}`);
      check.onchange = () => {check.checked ? selected.add(s.key) : selected.delete(s.key);drawCount();};
      checkCell.append(check); nameCell.textContent = s.name;
      const pos = document.createElement("small");pos.textContent = `Tile ${s.tile.join(", ")} · X ${s.x.toFixed(1)}, Y ${s.y.toFixed(1)} · ID ${s.object_id}`;nameCell.append(pos);
      groupCell.textContent = groups.find(g => g.keys.has(s.key))?.name || "—";
      row.append(checkCell,nameCell,groupCell);tbody.append(row);
    }
    drawCount(); el("export").disabled = !map;
    el("auto-groups").disabled = !map || !el("real-place-names").checked;
  }
  function drawCount() {el("selection-count").textContent = `${selected.size} vybráno`;}
  function drawGroups() {
    el("groups").replaceChildren();
    groups.forEach((g, i) => {
      const card = document.createElement("div");card.className = "group";
      const name = document.createElement("input");name.type = "text";name.value = g.name;name.placeholder = "Název skupiny";name.setAttribute("aria-label","Název skupiny");name.oninput = () => {g.name = name.value;drawSpawns();};
      const coords = document.createElement("input");coords.type = "text";coords.value = g.coords;coords.placeholder = "lat;lon";coords.setAttribute("aria-label","Souřadnice skupiny");coords.oninput = () => {g.coords = coords.value;};
      const bar = document.createElement("div");bar.className = "bar";
      const assign = document.createElement("button");assign.textContent = "Přiřadit vybrané";assign.onclick = () => {for (const k of selected) {for (const group of groups) group.keys.delete(k);g.keys.add(k);}selected.clear();drawSpawns();drawGroups();};
      const remove = document.createElement("button");remove.textContent = "Smazat";remove.onclick = () => {groups.splice(i,1);drawGroups();drawSpawns();};
      const count = document.createElement("span");count.className = "muted";count.textContent = `${g.keys.size} spawnpointů`;
      bar.append(assign,remove,count);card.append(name,coords,bar);el("groups").append(card);
    });
  }
  el("map-file").onchange = guarded(async () => {
    const file = el("map-file").files[0];if (!file) return;
    const text = decodeMap(await file.arrayBuffer());
    const loaded = parseGlobal(text);map = loaded;groups = [];selected.clear();
    el("map-title").textContent = `${map.name} · ${map.spawns.length} spawnpointů`;drawSpawns();drawGroups();
    message("Mapa načtená. Přidej skupinu a přiřaď jí vybrané spawnpointy.");
  });
  el("load-400").onclick = guarded(() => {
    if (!map) throw Error("Nejprve vyber global.cfg mapy 400 v1.5.2.");
    if (!/\b400\b/.test(map.name)) throw Error("Předvolba měst je určena pro mapu 400.");
    groups = cityGroups(map, MAP400_PRESET);selected.clear();
    el("config-file").value = "";el("filter").value = "";
    el("map-title").textContent = `${map.name} · ${map.spawns.length} spawnpointů`;
    drawSpawns();drawGroups();
    message(`Mapa 400 načtena: ${groups.length} oblastí, všech ${map.spawns.length} spawnpointů přiřazeno. GPS jsou přibližná centra měst; souřadnice i skupiny můžeš upravit.`);
  });
  el("real-place-names").onchange = drawSpawns;
  el("auto-groups").onclick = guarded(() => {
    if (!el("real-place-names").checked) throw Error("Nejprve potvrď, že názvy označují skutečná místa.");
    groups = allocatePlaces(map,MAP400_PRESET);selected.clear();drawSpawns();drawGroups();
    const unresolved = groups.filter(g=>!g.coords).length;
    message(`Vytvořeno ${groups.length} skupin podle názvů míst. ${unresolved ? `${unresolved} skupinám doplň ověřené GPS; samotný název není jednoznačná poloha.` : "Přibližná centra oblastí mapy 400 jsou předvyplněná; zkontroluj je před exportem."}`);
  });
  el("config-file").onchange = guarded(async () => {const file = el("config-file").files[0];if (!file) return;const cfg = JSON.parse((await file.text()).replace(/^\uFEFF/,""));groups = importConfig(map,cfg);el("refresh").value = String(cfg.refresh_minutes);if (!el("refresh").value) {const option = new Option(`${cfg.refresh_minutes} minut`,cfg.refresh_minutes);el("refresh").add(option);el("refresh").value = String(cfg.refresh_minutes);}selected.clear();drawSpawns();drawGroups();message("Skupiny načteny z cfg.");});
  el("filter").oninput = drawSpawns;
  el("select-visible").onclick = () => {visible().forEach(s => selected.add(s.key));drawSpawns();};
  el("clear-selection").onclick = () => {selected.clear();drawSpawns();};
  el("add-group").onclick = () => {groups.push({name:`Skupina ${groups.length + 1}`,coords:"",keys:new Set()});drawGroups();};
  el("export").onclick = guarded(() => {
    const cfg = makeConfig(map,groups,Number(el("refresh").value));
    const blob = new Blob([JSON.stringify(cfg,null,2) + "\n"],{type:"application/json;charset=utf-8"});const url = URL.createObjectURL(blob);
    const a = document.createElement("a");a.href = url;a.download = "openomsi_weather.cfg";a.click();setTimeout(() => URL.revokeObjectURL(url),1000);
    const sites = new Set(cfg.groups.map(g => `${g.latitude.toFixed(6)},${g.longitude.toFixed(6)}`));
    message(`Exportováno: ${cfg.groups.length} skupin, ${sites.size} různých lokalit. Soubor vlož vedle global.cfg. API klíč v něm není.`);
  });
}
