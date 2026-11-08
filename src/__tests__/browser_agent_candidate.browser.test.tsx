// Candidate data never enters the trusted Studio; patch batches are transactional.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import { test } from 'vitest';

test('browser agent candidate', async () => {
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try {
 const context=await browser.newContext();await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();
 await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
 const out=await page.evaluate(async()=>{
  const a=XB.agent;await a.ready();const initial=JSON.stringify(XB.getDeck());
  const doc={version:'1.0',slides:[{id:'s1',type:'composer',title:'First',components:[],content:{'a/b':{'~key':[1,2]}}}],helpers:{evil:'window.__injected = true'}};
  const created=await a.setCandidate({document:doc,baseRevision:null});const rev=created.revision;
  const ops=[{op:'test',path:'/slides/0/id',value:'s1'},{op:'add',path:'/slides/0/content/a~1b/~0key/1',value:9},{op:'remove',path:'/slides/0/content/a~1b/~0key/0'},{op:'replace',path:'/slides/0/title',value:'Changed'}];
  const preview=await a.previewPatch({baseRevision:rev,operations:ops});const afterPreview=await a.getDeck({source:'candidate'});
  const applied=await a.applyPatch({baseRevision:rev,operations:ops});const current=await a.getDeck({source:'candidate'});
  const stale=await a.applyPatch({baseRevision:rev,operations:ops});
  const atomic=await a.applyPatch({baseRevision:applied.revision,operations:[{op:'replace',path:'/slides/0/title',value:'unsafe'},{op:'test',path:'/slides/0/id',value:'wrong'}]});
  const badPointer=await a.applyPatch({baseRevision:applied.revision,operations:[{op:'add',path:'/__proto__/polluted',value:true}]});
  const badVersion=await a.setCandidate({baseRevision:applied.revision,document:{...doc,version:'2.0'}});
  const tooMany=await a.setCandidate({baseRevision:applied.revision,document:{version:'1.0',slides:Array(401).fill({type:'cover'})}});
  const scoped=await a.applyPatch({baseRevision:applied.revision,scope:{slideId:'s1',sourcePath:'/slides/0/content'},operations:[{op:'replace',path:'/slides/0/title',value:'outside'}]});
  const unsupported=await a.applyPatch({baseRevision:applied.revision,operations:[{op:'move',from:'/slides/0/title',path:'/slides/0/id'}]});
  const nonfinite=await a.setCandidate({baseRevision:applied.revision,document:{...doc,metadata:{value:NaN}}});
  const cycle: {version:string;slides:{type:string}[];self?:unknown}={version:'1.0',slides:[{type:'cover'}]};cycle.self=cycle;
  const cyclic=await a.setCandidate({baseRevision:applied.revision,document:cycle});
  const badBase=await a.applyPatch({baseRevision:cycle,operations:[]});const badRevision=await a.validate({revision:cycle});
  const brokenVersion=await a.applyPatch({baseRevision:applied.revision,operations:[{op:'remove',path:'/version'}]});
  const badIndex=await a.applyPatch({baseRevision:applied.revision,operations:[{op:'add',path:'/slides/01',value:{type:'cover'}}]});
  const final=await a.getDeck({source:'candidate'});const studio=JSON.stringify(XB.getDeck());
  XB.updateSlide(0,{source:'studio change'});const state=await a.getState();XB.undo();
  const reset=await a.resetCandidate({baseRevision:applied.revision});
  const oldEmpty=await a.setCandidate({baseRevision:null,document:doc});
  const duplicate=await a.setCandidate({baseRevision:reset.revision,document:{version:'1.0',slides:[{id:'same',type:'cover',content:{}},{id:'same',type:'cover',content:{}}]}});
  const concurrent=await Promise.all([a.applyPatch({baseRevision:duplicate.revision,operations:[{op:'add',path:'/metadata',value:{name:'one'}}]}),a.applyPatch({baseRevision:duplicate.revision,operations:[{op:'add',path:'/metadata',value:{name:'two'}}]})]);
  const beforeSync=await a.getState();const badSync=await a.syncFromStudio({baseRevision:beforeSync.data.candidateRevision,expectedStudioRevision:'stale'});
  const sync=await a.syncFromStudio({baseRevision:beforeSync.data.candidateRevision,expectedStudioRevision:beforeSync.data.studioRevision});
  const synced=await a.getDeck({source:'candidate'});
  return {created,preview,afterPreview,applied,current,stale,atomic,badPointer,badVersion,tooMany,scoped,unsupported,nonfinite,cyclic,badBase,badRevision,brokenVersion,badIndex,final,initial,studio,state,reset,oldEmpty,duplicate,concurrent,badSync,sync,synced,injected:!!window.__injected,polluted:({} as {polluted?:unknown}).polluted};
 });
 assert.equal(out.created.ok,true,JSON.stringify(out.created));assert.equal(out.preview.ok,true,JSON.stringify(out.preview));assert.equal(out.afterPreview.revision,out.created.revision);
 assert.equal(out.afterPreview.data.document.slides[0].title,'First');assert.equal(out.current.data.document.slides[0].title,'Changed');assert.deepEqual(out.current.data.document.slides[0].content['a/b']['~key'],[9,2]);
 for(const [name,code] of Object.entries({stale:'REVISION_CONFLICT',atomic:'PATCH_TEST_FAILED',badPointer:'PATCH_PATH_INVALID',badVersion:'VERSION_UNSUPPORTED',tooMany:'INPUT_TOO_LARGE',scoped:'PATCH_OUT_OF_SCOPE',unsupported:'PATCH_OP_UNSUPPORTED'}))assert.equal(out[name].error.code,code,JSON.stringify(out[name]));
 for(const [name,code] of Object.entries({nonfinite:'INVALID_ARGUMENT',cyclic:'INVALID_ARGUMENT',badBase:'INVALID_ARGUMENT',badRevision:'INVALID_ARGUMENT',brokenVersion:'VERSION_UNSUPPORTED',badIndex:'PATCH_PATH_INVALID'}))assert.equal(out[name].error.code,code,JSON.stringify(out[name]));
 assert.equal(out.oldEmpty.error.code,'REVISION_CONFLICT');assert.equal(out.duplicate.data.normalization[0].reason,'duplicate');assert.equal(out.concurrent.filter(r=>r.ok).length,1);assert.equal(out.concurrent.filter(r=>r.error?.code==='REVISION_CONFLICT').length,1);
 assert.equal(out.badSync.error.code,'REVISION_CONFLICT');assert.equal(out.sync.ok,true,JSON.stringify(out.sync));assert.deepEqual(out.synced.data.document,JSON.parse(out.initial));
 assert.deepEqual(out.current.data.document,out.final.data.document);assert.equal(out.initial,out.studio);assert.equal(out.injected,false);assert.equal(out.polluted,undefined);assert.equal(out.state.data.diverged,true);assert.equal(out.reset.ok,true);
 await context.close();console.log('Agent candidate and patch transaction checks passed');
} finally {await browser.close();}

});
