import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function load(entry, mocks) {
  const result = await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',plugins:[{
    name:'test-dependencies',setup(builder) {
      builder.onResolve({filter:/.*/},args=> {
        const key = Object.keys(mocks).find(key=>args.path.endsWith(key));
        if (key) return {path:key,namespace:'mock'};
      });
      builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path]}));
    },
  }]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

let session, profile, failure, sent, settings;
globalThis.cloudTestDb = {
  auth: {
    async getSession() { return {data:{session}}; },
    async getUser() { return {data:{user:session?.user},error:failure}; },
    async signInWithPassword(credentials) { sent=credentials; return {error:failure}; },
    async signOut() { session=null; return {error:failure}; },
  },
  from(table) {
    if (table === 'app_profiles') return {
      select() { return {eq:(_,id)=>({single:async()=>({data:profile?.id===id ? profile:null,error:failure})})}; },
      update(row) { sent=row; return {eq:()=>({select:()=>({single:async()=>({data:profile,error:failure})})})}; },
    };
    assert.equal(table,'site_settings');
    return {
      upsert(rows) {
        sent=rows;
        if (!failure) for (const row of Array.isArray(rows)?rows:[rows]) settings.set(row.key,row.value);
        return {select:async()=>({data:failure?null:[rows],error:failure})};
      },
      select() { return {
        eq:(_,key)=>({single:async()=>({data:{value:settings.get(key)},error:failure})}),
        then(resolve) { return Promise.resolve({data:[...settings].map(([key,value])=>({key,value})),error:failure}).then(resolve); },
      }; },
    };
  },
};
const mockDatabase = `export const database=()=>globalThis.cloudTestDb; export const checkError=e=>{if(e)throw new Error(e.message)}; export const readRows=async()=>[];`;
const {authService} = await load('src/services/authService.ts',{
  '/database':mockDatabase,
  '/mahasiswaService':'export const mahasiswaService={};',
  '/spkService':'export const spkService={};',
  '/smart':'export const jalankanSMARTMahasiswa=()=>({ranking:[]});',
});
const {contentService} = await load('src/services/contentService.ts',{'/database':mockDatabase});
beforeEach(async()=> {
  session=null; profile=null; failure=null; sent=null; settings=new Map();
  await authService.loadCurrentUser();
});

test('no saved role or demo identity grants admin access without an Auth session',async()=> {
  assert.equal((await authService.loadCurrentUser()).id,'guest');
});
test('requested Founder role cannot elevate a student account',async()=> {
  session={user:{id:'student-id'}}; profile={id:'student-id',role:'mahasiswa'};
  const user=await authService.signIn('student@example.test','password','super_admin');
  assert.equal(user.role,'mahasiswa');
});
test('Founder alias uses Auth; invalid password does not return a fake profile',async()=> {
  failure={message:'Invalid login credentials'};
  await assert.rejects(authService.signIn('founder','incorrect'),/Invalid login/);
  assert.equal(sent.email,'founder@seveninc.co.id');
  assert.equal(authService.getCurrentUser().id,'guest');
});
test('profile updates never submit role or email changes',async()=> {
  session={user:{id:'student-id'}}; profile={id:'student-id',role:'mahasiswa'};
  await authService.loadCurrentUser();
  await authService.updateProfile({...profile,role:'super_admin',nama:'Changed',email:'other@example.test'});
  assert.equal(sent.nama,'Changed'); assert.ok(!('role' in sent)); assert.ok(!('email' in sent));
});
test('CMS list replacement persists deletes and empty lists in the shared database',async()=> {
  await contentService.saveFaqList([{id:'1',pertanyaan:'Test',jawaban:'Answer',aktif:true,urutan:1}]);
  assert.equal((await contentService.getFaq()).length,1);
  await contentService.saveFaqList([]);
  assert.deepEqual(await contentService.getFaq(),[]);
});
test('CMS errors propagate instead of showing local success',async()=> {
  failure={message:'RLS denied'};
  await assert.rejects(contentService.saveFaqList([]),/RLS denied/);
  assert.equal(settings.size,0);
});
