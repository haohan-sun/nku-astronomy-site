// Run: node orbit-check.cjs. Independent JPL Horizons checkpoint: Sun-centered,
// geometric J2000 ecliptic state at JD 2461339.0 TDB, retrieved 2026-10-25.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const math=require('./assets/js/suyi-orbit.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(__dirname+'/assets/js/suyi-ephemeris.js','utf8'),context);
const rows=context.window.SuyiEphemeris.rows;
const raw=JSON.parse(fs.readFileSync(__dirname+'/suyi-sbdb.json','utf8'));
const el=Object.fromEntries(raw.orbit.elements.map(v=>[v.name,+v.value]));
assert(rows.length>3650);
for(let k=0;k<rows.length;k++){assert.equal(rows[k].length,7);assert(rows[k].every(Number.isFinite));if(k)assert.equal(rows[k][0]-rows[k-1][0],1);}
for(const row of [rows[0],rows[500],rows.at(-1)])assert.deepEqual(math.interpolate(rows,row[0]),Array.from(row.slice(1,4)));
assert.equal(math.interpolate(rows,rows[0][0]-1),null);
assert.equal(math.interpolate(rows,rows.at(-1)[0]+1),null);
const reference=[1.232047938048075,1.626441176523608,.2168132080803114];
const interpolated=math.interpolate(rows,2461339.0);
const errorKM=Math.hypot(...interpolated.map((v,i)=>v-reference[i]))*math.AU;
assert(errorKM<1,'Midday interpolation must agree with independently requested Horizons vector within 1 km');
for(const M of [-1000,-Math.PI,0,1,1000]){const E=math.solveKepler(M,el.e);let d=(E-el.e*Math.sin(E)-M)%(Math.PI*2);d=Math.min(Math.abs(d),Math.abs(Math.abs(d)-Math.PI*2));assert(d<1e-10);}
assert(Math.abs(Math.hypot(...math.positionAtE(el,0))-el.q)<1e-12);
assert(Math.abs(Math.hypot(...math.positionAtE(el,Math.PI))-el.ad)<1e-12);
const epoch=+raw.orbit.epoch;
assert(Math.hypot(...math.position(el,epoch,epoch).map((v,i)=>v-math.position(el,epoch+el.per,epoch)[i]))<1e-9);
console.log(JSON.stringify({samples:rows.length,independentMiddayErrorKM:errorKM,checks:'pass'}));
