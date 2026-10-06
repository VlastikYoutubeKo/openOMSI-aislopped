"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs");
const {decodeMap,parseGlobal,coordinates,makeConfig,importConfig} = require("./editor.js");
const fixture = "[name]\nTest\n[entrypoints]\n2\n0\n7\n0\n10\n5\n20\n0\n0\n0\n1\n0\nPrvní\n1\n8\n0\n30\n5\n40\n0\n0\n0\n1\n0\nDruhý\n[map]\n-1\n2\ntile.map\n";
const map = parseGlobal(fixture);
assert.equal(map.spawns.length,2);assert.deepEqual(map.spawns[0].tile,[-1,2]);assert.equal(map.spawns[0].y,20);assert.equal(map.spawns[0].z,5);
const cfg = makeConfig(map,[{name:"Sdílená",coords:"50.0755;14.4378",keys:new Set(map.spawns.map(s=>s.key))}],15);
assert.equal(cfg.groups.length,1);assert.equal(cfg.groups[0].spawnpoints.length,2);assert(!JSON.stringify(cfg).includes("apikey"));
assert.deepEqual(makeConfig(map,importConfig(map,cfg),15),cfg);
assert.throws(()=>coordinates("91;14"));assert.throws(()=>coordinates("50;181"));assert.throws(()=>coordinates(";14"));assert.throws(()=>coordinates("NaN;14"));
assert.throws(()=>parseGlobal(fixture.replace("[map]\n-1","[map]\nNaN")));
assert.throws(()=>makeConfig(map,[{name:"A",coords:"50;14",keys:new Set([map.spawns[0].key])},{name:"B",coords:"50;14",keys:new Set([map.spawns[0].key])}],15));
if (process.argv[2]) {
  const text=decodeMap(fs.readFileSync(process.argv[2]));
  const real=parseGlobal(text);assert.equal(real.spawns.length,82);assert.equal(real.spawns[0].name,"Chlum,hl.sil.");assert.deepEqual(real.spawns[0].tile,[42,12]);
  console.log(`PASS: real map: ${real.spawns.length} spawnpoints, correct entry tile and Unicode names`);
}
console.log("PASS: parsing, grouping, import/export roundtrip, coordinate bounds and duplicate assignments");
const {allocatePlaces,cityGroups}=require("./editor.js");
const preset=require("./map400-preset.js");
const placeMap={name:"Generic map",spawns:[{...map.spawns[0],name:"Praha,Ládví"},{...map.spawns[1],name:"PRAHA,Prosek"}]};
const allocated=allocatePlaces(placeMap,preset);assert.equal(allocated.length,1);assert.equal(allocated[0].keys.size,2);assert.equal(allocated[0].coords,"");assert.throws(()=>makeConfig(placeMap,allocated,15));
const known={name:"400 example",spawns:[{...map.spawns[0],name:"Chlum,hl.sil."},{...map.spawns[1],name:"Doksy,parkoviště"}]};
const matched=allocatePlaces(known,preset);assert.equal(matched.length,1);assert.equal(matched[0].coords,"50.56471;14.65553");assert.equal(matched[0].keys.size,2);
assert.throws(()=>cityGroups({spawns:[{name:"Neznámé město",key:"0,0:1"}]},preset));
assert(!("map" in preset));
console.log("PASS: opt-in place grouping, case folding, ambiguous locations left unresolved, map 400 aliases and no bundled map assets");
