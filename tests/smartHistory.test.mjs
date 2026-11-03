import {test,beforeEach} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
let records,failed,user,seq,rpcCalls,rpcReply;
globalThis.historyTestDb={async rpc(name,args){rpcCalls.push({name,args});if(failed)return {error:{message:'database unavailable'}};if(!user)return {error:{message:'Hanya admin'}};if(args?.p_history_id==='missing')return {error:{message:'Riwayat SMART tidak ditemukan'}};return {data:rpcReply,error:null};},auth:{async getUser(){return {data:{user},error:null};}},from(table){assert.equal(table,'hasil_perhitungan');let mode='read',payload,id,prefix;
 const q={insert(row){mode='insert';payload=row;return q;},delete(){mode='delete';return q;},select(){return q;},like(_,value){prefix=value.replaceAll('\\','').slice(0,-1);return q;},eq(_,value){id=value;return q;},order(){return q;},single:async()=>{if(failed)return {error:{message:'write denied'}};const row={...JSON.parse(JSON.stringify(payload)),id:String(++seq),created_at:new Date(seq*1000).toISOString()};records.push(row);return {data:JSON.parse(JSON.stringify(row)),error:null};},then(resolve){if(failed)return Promise.resolve({error:{message:'database unavailable'}}).then(resolve);let matched=records.filter(r=>(!prefix||r.catatan.startsWith(prefix))&&(!id||r.id===id));if(mode==='delete')records=records.filter(r=>!matched.includes(r));else matched=matched.sort((a,b)=>b.created_at.localeCompare(a.created_at));return Promise.resolve({data:JSON.parse(JSON.stringify(matched)),error:null}).then(resolve);}};return q;}};
const compiled=await build({entryPoints:['src/services/smartHistoryService.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'cloud-mock',setup(b){b.onResolve({filter:/\/database$/},()=>({path:'db',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const database=()=>globalThis.historyTestDb;export const checkError=e=>{if(e)throw Error(e.message)};'}));}}]});
const {smartHistoryService,decodeSmartRun}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const input=()=>({periode:'Oktober 2026',source:'daily.xlsx',result:{bobotNormal:{C1:.3,C2:.2,C3:.5},kriteriaList:[{id:'k1',kode:'C1',bobot_awal:30}],ranking:[{id:'a',nama:'Student',skor_akhir:.9}],matriksKeputusan:[{id:'a',nilai_mentah:{C1:90}}]}});
beforeEach(()=>{records=[];failed=false;user={id:'verified-admin'};seq=0;rpcCalls=[];rpcReply={history:2,students:5,scores:15,cleared_all:true};});
test('saved snapshot survives a fresh list and preserves earlier inputs when a new run is saved',async()=>{
 const first=input();const saved=await smartHistoryService.save(first);first.result.matriksKeputusan[0].nilai_mentah.C1=0;
 const next=input();next.result.bobotNormal.C1=.5;next.result.ranking[0].skor_akhir=.5;await smartHistoryService.save(next);
 const loaded=await smartHistoryService.list();assert.equal(loaded.length,2);assert.equal(loaded[1].id,saved.id);assert.equal(loaded[1].result.matriksKeputusan[0].nilai_mentah.C1,90);assert.equal(loaded[1].result.bobotNormal.C1,.3);assert.equal(records[0].user_id,'verified-admin');
});
test('bulk clearing uses a single server transaction, including when history is already empty',async()=>{
 records=[];const result=await smartHistoryService.clearAll();assert.deepEqual(result,rpcReply);assert.deepEqual(rpcCalls,[{name:'clear_mahasiswa_smart_data',args:undefined}]);
});
test('individual removal delegates last-history cascade decisions to the locked server transaction',async()=>{
 rpcReply={history:1,students:0,scores:0,cleared_all:false};let result=await smartHistoryService.remove('one');assert.equal(result.cleared_all,false);
 rpcReply={history:1,students:5,scores:15,cleared_all:true};result=await smartHistoryService.remove('last');assert.equal(result.students,5);assert.equal(result.cleared_all,true);
 assert.deepEqual(rpcCalls.map(call=>call.args),[{p_history_id:'one'},{p_history_id:'last'}]);
});
test('missing or invalid server confirmations cannot produce successful bulk deletion',async()=>{
 rpcReply=null;await assert.rejects(smartHistoryService.clearAll(),/Supabase belum/);
 rpcReply={history:0,students:-1,scores:0,cleared_all:true};await assert.rejects(smartHistoryService.clearAll(),/Supabase belum/);
});
test('cloud failures are propagated and never reported as successful deletion or saving',async()=>{
 failed=true;await assert.rejects(smartHistoryService.save(input()),/write denied/);await assert.rejects(smartHistoryService.list(),/database unavailable/);await assert.rejects(smartHistoryService.clearAll(),/database unavailable/);assert.equal(records.length,0);
});
test('login is required and missing IDs cannot be reported deleted',async()=>{
 user=null;await assert.rejects(smartHistoryService.save(input()),/Login admin/);user={id:'verified-admin'};await assert.rejects(smartHistoryService.remove('missing'),/tidak ditemukan/);
});
test('invalid snapshot formats are rejected',()=>{
 assert.throws(()=>decodeSmartRun({id:'x',created_at:'now',catatan:'other'}),/tidak dikenali/);
 assert.throws(()=>decodeSmartRun({id:'x',created_at:'now',catatan:'SMART_MAHASISWA_V1:{}'}),/tidak lengkap/);
});
