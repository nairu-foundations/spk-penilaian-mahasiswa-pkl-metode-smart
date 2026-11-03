import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
const bundle=await build({entryPoints:['src/lib/mutationFeedback.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {notifyMutation}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('confirmed mutations request immediate shared-data refresh as well as success feedback',()=>{
 const previous=globalThis.window;const events=[];globalThis.window={dispatchEvent:event=>events.push(event)};
 try{notifyMutation('Data dipindahkan ke Tempat Sampah');assert.deepEqual(events.map(e=>e.type),['spk:mutation','spk:refresh']);assert.equal(events[0].detail.message,'Data dipindahkan ke Tempat Sampah');}finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
