import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['src/utils/criterionStatistics.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {statistikKriteria}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const student=(id,value)=>({id,nama:id,nilai_kriteria:{C3:value}});

test('five-student monthly task data produces accurate mean, median, range and population deviation',()=>{
 const stats=statistikKriteria([100,100,100,75,50].map((v,i)=>student(String(i),v)),'C3');
 assert.equal(stats.mean,85);assert.equal(stats.median,100);assert.equal(stats.min,50);assert.equal(stats.max,100);assert.equal(stats.deviation,20);assert.equal(stats.count,5);
 assert.deepEqual(stats.bins.map(bin=>bin.count),[0,0,1,1,3]);
 assert.equal(stats.bins.reduce((total,bin)=>total+bin.percent,0),100);
});
test('zero remains valid while missing, nonnumeric and out-of-range grades are excluded',()=>{
 const stats=statistikKriteria([0,100,null,undefined,'90',NaN,Infinity,-1,101].map((v,i)=>student(String(i),v)),'C3');
 assert.equal(stats.count,2);assert.equal(stats.missing,7);assert.equal(stats.mean,50);assert.equal(stats.median,50);assert.equal(stats.deviation,50);
});
test('histogram boundaries count every valid value exactly once, including 100',()=>{
 const stats=statistikKriteria([0,19.9999,20,40,60,80,100].map((v,i)=>student(String(i),v)),'C3');
 assert.deepEqual(stats.bins.map(bin=>bin.count),[2,1,1,1,2]);assert.equal(stats.bins.reduce((n,b)=>n+b.count,0),7);
});
test('empty and single-student datasets have honest statistics',()=>{
 const empty=statistikKriteria([],'C1');assert.equal(empty.mean,null);assert.equal(empty.median,null);assert.equal(empty.min,null);assert.equal(empty.max,null);assert.equal(empty.deviation,null);assert.equal(empty.bins.reduce((s,b)=>s+b.count,0),0);
 const single=statistikKriteria([student('only',75)],'C3');assert.equal(single.deviation,0);assert.equal(single.mean,75);assert.equal(single.median,75);
});
test('student detail is descending by grade and stable without mutating source data',()=>{
 const rows=[student('low',20),student('high',100),student('middle',50)];
 const result=statistikKriteria(rows,'C3');assert.deepEqual(result.entries.map(r=>r.name),['high','middle','low']);assert.equal(rows[0].id,'low');
});
