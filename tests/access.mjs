import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import assert from 'node:assert/strict';
let row={data:JSON.stringify({name:'Gala',tasks:[{id:'one'}],volunteers:[{name:'Private'}]}),revision:46};
let writes=0;
globalThis.testDB = {
 prepare(sql) {
  return { bind(...values) {
   return {
    async first() { return row; },
    async run() {
     writes++;
     if(sql.startsWith('INSERT') || values[2]!==row.revision) return {meta:{changes:0}};
     row={data:values[0],revision:row.revision+1};
     return {meta:{changes:1}};
    }
   };
  }};
 }
};
const source=readFileSync(new URL('../app/api/state/route.ts',import.meta.url),'utf8').replace("import { env } from 'cloudflare:workers';",'const env={DB:globalThis.testDB};');
const {GET,PUT}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
function req(email,revision=46,origin='https://gala.test'){return new Request('https://gala.test/api/state',{method:'PUT',headers:{...(email?{'oai-authenticated-user-id':'test-user','oai-authenticated-user-email':email}:{}),origin,'content-type':'application/json'},body:JSON.stringify({data:{name:'Gala',tasks:[{id:'two'}],volunteers:[]},revision})})}
let publicData=await (await GET(new Request('https://gala.test/api/state'))).json();assert.equal(publicData.canEdit,false);assert.equal(publicData.data.tasks.length,1);assert.deepEqual(publicData.data.volunteers,[]);
assert.equal((await PUT(req(null))).status,401);assert.equal((await PUT(req('stranger@example.com'))).status,403);assert.equal((await PUT(req('kemie.stv@gmail.com',46,'https://evil.test'))).status,403);assert.equal(writes,0);
for(const email of ['justine.stv@gmail.com','kemie.stv@gmail.com']){const access=await(await GET(req(email))).json();assert.equal(access.canEdit,true);assert.equal((await PUT(req(email,row.revision))).status,200)}
assert.equal((await PUT(req('justine.stv@gmail.com',46))).status,409);assert.equal((await PUT(req('kemie.stv@gmail.com',0))).status,409);assert.equal(row.revision,48);
console.log('PASS: public reading; two editors; unauthorized and cross-origin writes blocked; stale edits rejected.');
