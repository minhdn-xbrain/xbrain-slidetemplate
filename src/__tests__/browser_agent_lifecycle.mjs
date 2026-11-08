// Cancellation, partial coverage, reproducible hashes, and private Console state.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
 const result=await page.evaluate(async()=>{
  const a=XB.agent;await a.ready();const marker='PrivateCandidateMarker_842711';
  const slides=Array.from({length:50},(_,i)=>({id:'s'+i,type:'composer',title:'Slide '+i,components:[{type:'text',text:marker}]}));
  const loaded=await a.setCandidate({baseRevision:null,document:{version:'1.0',slides}});
  const first=await a.render({revision:loaded.revision,slides:[0]});const second=await a.render({revision:loaded.revision,slides:[0]});
  const draft=await a.render({revision:loaded.revision,slides:[0],profile:'draft'});const draftExport=await a.exportArtifact({revision:loaded.revision,format:'static-html',qaRunId:draft.data.runId});
  const partial=await a.exportArtifact({revision:loaded.revision,format:'static-html',qaRunId:second.data.runId});
  const task=a.render({revision:loaded.revision});let state;
  for(let i=0;i<100;i++){state=(await a.getState()).data;if(state.activeRunId)break;await new Promise(resolve=>setTimeout(resolve,5));}
  const cancelled=await a.cancel({runId:state.activeRunId});const end=await task;
  const current=await a.getState();const completeCandidate=await a.getDeck({source:'candidate'});
  document.querySelector('[data-testid="xb-agent-deck-input"]').value=marker;
  document.querySelector('[data-testid="xb-agent-response-json"]').textContent=marker;
  document.querySelector('[data-testid="xb-agent-review-evidence"]').setAttribute('value',marker);
  const html=XB.exportHTML();
  return {first,second,draft,draftExport,partial,cancelled,end,current,completeCandidate,leaked:html.includes(marker)};
 });
 assert.equal(result.first.data.manifest.htmlHash,result.second.data.manifest.htmlHash);assert.equal(result.partial.error.code,'QA_NOT_MEASURED');
 assert.equal(result.draft.data.qa.passed,false);assert.equal(result.draftExport.error.code,'QA_STALE');
 assert.equal(result.cancelled.ok,true);assert.equal(result.end.data.status,'cancelled');assert.ok(result.end.data.qa.checkedSlides<50);assert.equal(result.end.data.qa.passed,false);
 assert.equal(result.current.data.candidateRevision,result.completeCandidate.revision);assert.equal(result.leaked,false);
 await context.close();console.log('Agent cancellation, coverage and privacy checks passed');
}finally{await browser.close();}
