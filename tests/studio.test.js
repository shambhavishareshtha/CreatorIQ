import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHooks } from '../server/services/hookGenerationService.js';
import { calculateExperimentResults } from '../server/controllers/experimentController.js';
import { PlannedContent } from '../server/models/PlannedContent.js';
import { ContentExperiment } from '../server/models/ContentExperiment.js';
import { createServer } from '../server/server.js';
import { digest } from '../server/services/authService.js';

async function withServer(models, run){const account={_id:'account-test',email:'studio@example.com'};const session={_id:'session-test',account:account._id,csrfHash:digest('csrf-test'),csrfToken:'csrf-test'};const secureModels={Account:{findById:async()=>account},Session:{findOne:async q=>q.tokenHash===digest('test-token')?session:null},...models};const {app}=createServer(secureModels);const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const original=globalThis.fetch;globalThis.fetch=(input,init={})=>{if(String(input).startsWith(`http://127.0.0.1:${server.address().port}`))init={...init,headers:{...(init.headers||{}),Cookie:'creatoriq_session=test-token','X-CSRF-Token':'csrf-test'}};return original(input,init)};try{return await run(`http://127.0.0.1:${server.address().port}`)}finally{globalThis.fetch=original;await new Promise(resolve=>server.close(resolve))}}

test('hook suggestions respond to inputs and regeneration seed',()=>{
 const a=generateHooks({platform:'X',niche:'ceramics',audience:'new makers',format:'Text post',objective:'Education',tone:'Bold'},{seed:1});
 const b=generateHooks({platform:'Instagram',niche:'home cooking',audience:'busy parents',format:'Short video',objective:'Reach',tone:'Playful'},{seed:2});
 assert.equal(a.suggestions.length,4);assert.notEqual(a.suggestions[0].hook,b.suggestions[0].hook);assert.match(a.suggestions[0].explanation,/text post/);assert.equal(a.exploratory,true);
});
test('hook deterministic generation uses evidence label only when evidence exists',()=>{
 const result=generateHooks({niche:'design',audience:'makers',platform:'Instagram',format:'Carousel',objective:'Engagement',tone:'Educational'},{evidence:'Carousels averaged 12 saves across 3 posts.'});
 assert.equal(result.source,'deterministic');assert.equal(result.exploratory,false);assert.match(result.suggestions[0].evidenceLabel,/directional/);
});
test('experiment results omit missing metrics and mark one-post comparisons preliminary',()=>{
 const result=calculateExperimentResults({variants:[{name:'Direct'},{name:'Story'}],postAssignments:[{variant:'Direct',post:{views:100,impressions:100,likes:5,comments:1,shares:0,saves:0}},{variant:'Story',post:{views:80,impressions:100,likes:3,comments:0,shares:0,saves:0}}]});
 assert.equal(result.variants[0].postCount,1);assert.equal(result.variants[0].metrics.engagementRate.average,6);assert.equal(result.variants[0].metrics.saves.observed,1);assert.equal(result.preliminary,true);assert.equal(result.comparison.validRelativeDifference,true);assert.match(result.comparison.interpretation,/does not establish causation/);
});
test('experiment metrics do not create engagement rates when required metrics or denominator are missing',()=>{
 const result=calculateExperimentResults({variants:[{name:'A'},{name:'B'}],postAssignments:[{variant:'A',post:{impressions:0,likes:0}},{variant:'B',post:{impressions:50,likes:4}}]});
 assert.equal(result.variants[0].metrics.engagementRate.average,null);assert.equal(result.variants[1].metrics.engagementRate.average,null);assert.ok(result.warnings.some(x=>x.includes('Missing metrics')));
});
test('planned content and experiment schemas enforce workflow fields and status',async()=>{
 const badPlan=new PlannedContent({platform:'TikTok',format:'Reel',hook:'Opening',objective:'Reach'});await assert.rejects(badPlan.validate(),{name:'ValidationError'});
 const exp=new ContentExperiment({creator:'507f1f77bcf86cd799439011',hypothesis:'A test',variable:'Hook',startsAt:'2026-10-20',endsAt:'2026-10-21',status:'invalid',variants:[{name:'A'},{name:'B'}]});await assert.rejects(exp.validate(),{name:'ValidationError'});
});
test('hook generation API works without MongoDB and rejects missing inputs',async()=>{
 const models={Profile:{db:{readyState:0}},Post:{db:{readyState:0}}};
 await withServer(models,async base=>{const payload={platform:'X',niche:'ceramics',audience:'new makers',format:'Text post',objective:'Education',tone:'Bold'};const ok=await fetch(`${base}/api/hooks/generate`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});assert.equal(ok.status,200);assert.equal((await ok.json()).data.suggestions.length,4);const bad=await fetch(`${base}/api/hooks/generate`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,niche:''})});assert.equal(bad.status,422)});
});
test('planned-content API reports unavailable persistence instead of false save success',async()=>{
 await withServer({Profile:{db:{readyState:0}}},async base=>{const response=await fetch(`${base}/api/planned-content`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({platform:'X',format:'Text',hook:'A first line',objective:'Reach'})});assert.equal(response.status,503);assert.equal((await response.json()).error.code,'DATABASE_UNAVAILABLE')});
});
test('planner API supports create, filtered listing, update, and delete with Mongo-backed model contract',async()=>{
 const profile={_id:'creator-1'};let records=[];const store={db:{readyState:1},find:filter=>({sort:async()=>records.filter(x=>(!filter.status||x.status===filter.status)&&(!filter.platform||x.platform===filter.platform))}),create:async value=>{const doc={_id:`plan-${records.length+1}`,...value,save:async function(){return this}};records.push(doc);return doc},findOne:async filter=>records.find(x=>x._id===filter._id&&x.creator===filter.creator)||null,findOneAndDelete:async filter=>{const i=records.findIndex(x=>x._id===filter._id&&x.creator===filter.creator);return i<0?null:records.splice(i,1)[0]}};
 const models={Profile:{db:{readyState:1},findOne:async()=>profile},PlannedContent:store};
 await withServer(models,async base=>{const payload={platform:'Instagram',topic:'design',format:'Carousel',hook:'A small room can feel spacious',objective:'Education'};const created=await fetch(`${base}/api/planned-content`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});assert.equal(created.status,201);const id=(await created.json()).data._id;const filtered=await fetch(`${base}/api/planned-content?platform=Instagram`).then(r=>r.json());assert.equal(filtered.data.length,1);const updated=await fetch(`${base}/api/planned-content/${id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:'ready'})});assert.equal(updated.status,200);const removed=await fetch(`${base}/api/planned-content/${id}`,{method:'DELETE'});assert.equal(removed.status,200);assert.equal((await removed.json()).data.deleted,true)});
});
test('experiment API rejects imported-post assignments outside the creator',async()=>{
 const experiment={_id:'experiment-1',creator:'creator-1',variants:[{name:'Direct'},{name:'Story'}],postAssignments:[],save:async function(){return this}};
 const models={Profile:{db:{readyState:1},findOne:async()=>({_id:'creator-1'})},Experiment:{db:{readyState:1},findOne:async()=>experiment},Post:{db:{readyState:1},find:async()=>[]}};
 await withServer(models,async base=>{const response=await fetch(`${base}/api/experiments/experiment-1`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({postAssignments:[{post:'507f1f77bcf86cd799439011',variant:'Direct'}]})});assert.equal(response.status,422);assert.equal((await response.json()).error.code,'INVALID_POST_REFERENCE')});
});
