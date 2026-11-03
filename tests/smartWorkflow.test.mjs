import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['src/utils/smartWorkflow.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {prosesSMART,signatureSMART}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const kriteria=[30,20,50].map((bobot_awal,i)=>({id:`k${i}`,kode:`C${i+1}`,aktif:true,tipe:'benefit',bobot_awal,urutan:i}));
const mahasiswa=(id,periode='Oktober 2026')=>({id,nama:id,email:`${id}@example.test`,kode_alternatif:id,periode,status:'Aktif',nilai_kriteria:{C1:90,C2:80,C3:100}});
const periode='Oktober 2026';

test('Excel process waits for cloud persistence and calculates canonical cloud rows after save',async()=>{
  const events=[];let release;const wait=new Promise(resolve=>release=resolve);
  const pending=prosesSMART({imported:[mahasiswa('draft')],replace:true,periode,kriteria,save:async(rows,replace)=>{events.push('save');assert.equal(replace,true);await wait;events.push('saved');},read:async()=>{events.push('read');return [mahasiswa('cloud')];}});
  await Promise.resolve();assert.deepEqual(events,['save']);release();
  const {rows,result}=await pending;assert.deepEqual(events,['save','saved','read']);assert.equal(rows[0].id,'cloud');assert.equal(result.ranking[0].id,'cloud');assert.equal(result.ranking[0].skor_akhir,.93);
});
test('cloud save failure never reads or returns a successful calculation',async()=>{
  let read=false;
  await assert.rejects(prosesSMART({imported:[mahasiswa('draft')],replace:false,periode,kriteria,save:async()=>{throw Error('Cloud write rejected');},read:async()=>{read=true;return [];}}),/Cloud write rejected/);
  assert.equal(read,false);
});
test('process existing data performs no import and isolates selected period',async()=>{
  const {result}=await prosesSMART({imported:null,replace:false,periode,kriteria,save:async()=>assert.fail('must not write'),read:async()=>[mahasiswa('a'),mahasiswa('old','Januari 2025')]});
  assert.deepEqual(result.ranking.map(r=>r.id),['a']);
});
test('invalid criteria and mismatched Excel periods fail before persistence',async()=>{
  const args={imported:[mahasiswa('a')],replace:false,periode,kriteria,save:async()=>assert.fail('must not write'),read:async()=>assert.fail('must not read')};
  await assert.rejects(prosesSMART({...args,kriteria:[]}),/kriteria aktif/);
  await assert.rejects(prosesSMART({...args,imported:[mahasiswa('a','2025')]}),/periode PKL/);
});
test('polling does not invalidate a result, while changed scores, weights, or period do',()=>{
  const a=mahasiswa('a'),b=mahasiswa('b');const signature=signatureSMART([a,b],kriteria,periode);
  assert.equal(signatureSMART([b,a],JSON.parse(JSON.stringify(kriteria)),periode),signature);
  assert.notEqual(signatureSMART([{...a,nilai_kriteria:{C1:0,C2:80,C3:100}},b],kriteria,periode),signature);
  assert.notEqual(signatureSMART([a,b],kriteria.map(k=>({...k,bobot_awal:1})),periode),signature);
  assert.notEqual(signatureSMART([a,b],kriteria,'Januari 2025'),signature);
});
test('empty or incomplete cloud data produces no displayed ranking',async()=>{
 const args={imported:null,replace:false,periode,kriteria,save:async()=>assert.fail('must not write')};
 await assert.rejects(prosesSMART({...args,read:async()=>[]}),/Belum ada mahasiswa/);
 await assert.rejects(prosesSMART({...args,read:async()=>[{...mahasiswa('a'),nilai_kriteria:{C1:90}}]}),/nilai lengkap/);
});
