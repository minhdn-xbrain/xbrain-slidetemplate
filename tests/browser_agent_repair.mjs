// Repair proposals must preserve content, respect scope and require explicit acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'index.html')).href);
 const fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/recursive-pipeline.json'),'utf8'));
 const result=await page.evaluate(async fixture=>{
  const a=XB.agent;await a.ready();const items=Array.from({length:50},(_,i)=>'Item '+String(i).padStart(2,'0')+' preserve this exact text');
  const doc={version:'1.0',slides:[{id:'one',type:'composer',title:'List',components:[{type:'list',items}]}]};
  const created=await a.setCandidate({baseRevision:null,document:doc});
  const proposal=await a.proposeRepair({baseRevision:created.revision,scope:{slideId:'one',sourcePath:'/slides/0/components/0'}});
  const before=await a.getDeck({source:'candidate'});
  const blocked=await a.acceptRepair({baseRevision:created.revision,proposalId:proposal.data.proposalId});
  const accepted=await a.acceptRepair({baseRevision:created.revision,proposalId:proposal.data.proposalId,acceptScope:'deck'});
  const after=await a.getDeck({source:'candidate'});
  const table={version:'1.0',datasets:{rows:Array.from({length:40},(_,i)=>({label:'Row '+i,value:i}))},slides:[{id:'table',type:'composer',title:'Table',components:[{type:'table',dataRef:'rows',transform:{sortBy:'value',order:'desc'}}]}]};
  const staged=await a.setCandidate({baseRevision:accepted.revision,document:table}),tableProposal=await a.proposeRepair({baseRevision:staged.revision}),tableAccepted=await a.acceptRepair({baseRevision:staged.revision,proposalId:tableProposal.data.proposalId}),tableAfter=await a.getDeck({source:'candidate'});
  const uncertain={...table,slides:[{...table.slides[0],components:[...table.slides[0].components,{type:'table',dataRef:'totally_absent'}]}]};
  const uncertainDoc=await a.setCandidate({baseRevision:tableAccepted.revision,document:uncertain}),guarded=await a.proposeRepair({baseRevision:uncertainDoc.revision});
  const originalStatus=guarded.data.preservation.status;guarded.data.preservation.status='preserved';
  const tampered=await a.acceptRepair({baseRevision:uncertainDoc.revision,proposalId:guarded.data.proposalId});
  const dataset={version:'1.0',datasets:{rows:[{x:123,y:456}]},slides:[{id:'one',type:'composer',components:[{type:'text',text:'Content'}]}]};
  const base=await a.setCandidate({baseRevision:uncertainDoc.revision,document:dataset});const altered=await a.applyPatch({baseRevision:base.revision,operations:[{op:'replace',path:'/datasets/rows/0/x',value:999}]});const report=await a.getPreservationReport({fromRevision:base.revision,toRevision:altered.revision});
  const nestedDoc=await a.setCandidate({baseRevision:altered.revision,document:fixture}),nestedProposal=await a.proposeRepair({baseRevision:nestedDoc.revision}),nestedAccepted=await a.acceptRepair({baseRevision:nestedDoc.revision,proposalId:nestedProposal.data.proposalId}),nestedAfter=await a.getDeck({source:'candidate'});
  const stagnate=await a.proposeRepair({baseRevision:nestedAccepted.revision}),stagnated=await a.acceptRepair({baseRevision:nestedAccepted.revision,proposalId:stagnate.data.proposalId}),third=await a.proposeRepair({baseRevision:nestedAccepted.revision}),limit=await a.proposeRepair({baseRevision:nestedAccepted.revision});
  return {items,created,proposal,before,blocked,accepted,after,table,tableProposal,tableAccepted,tableAfter,guarded,originalStatus,tampered,report,nestedProposal,nestedAccepted,nestedAfter,stagnate,stagnated,third,limit};
 },fixture);
 assert.equal(result.proposal.ok,true,JSON.stringify(result.proposal));assert.equal(result.proposal.data.scopeEscalation,'deck');assert.equal(result.before.revision,result.created.revision);
 assert.equal(result.blocked.error.code,'REPAIR_SCOPE_ESCALATION');assert.equal(result.accepted.ok,true,JSON.stringify(result.accepted));
 assert.deepEqual(result.after.data.document.slides.flatMap(s=>(s.components||s.content.components).flatMap(c=>c.items||[])),result.items);
 assert.equal(result.tableProposal.data.preservation.status,'preserved',JSON.stringify(result.tableProposal.data.preservation));assert.equal(result.tableAccepted.ok,true,JSON.stringify(result.tableAccepted));
 assert.deepEqual(result.tableAfter.data.document.slides.flatMap(s=>(s.components||s.content.components).flatMap(c=>c.data||[])),[...result.table.datasets.rows].reverse());
 assert.equal(result.originalStatus,'unverified');assert.equal(result.tampered.error.code,'PRESERVATION_UNVERIFIED');
 assert.equal(result.report.data.status,'unverified');assert.ok(result.report.data.missingPaths.includes('/datasets/rows/0/x'));
 assert.equal(result.nestedProposal.data.preservation.tableAudit.status,'preserved');assert.equal(result.nestedAccepted.ok,true,JSON.stringify(result.nestedAccepted));
 const nestedRows=[];function collect(component){if(component.type==='table'&&Array.isArray(component.data))nestedRows.push(...component.data);for(const child of component.children||component.components||[])collect(child);}
 for(const slide of result.nestedAfter.data.document.slides.filter(s=>/^table(?:-\d+)?$/.test(s.id)))for(const component of slide.components||slide.content?.components||[])collect(component);
 assert.deepEqual(nestedRows,fixture.datasets.districts);
 assert.equal(result.stagnate.data.stagnated,true);assert.equal(result.stagnated.error.code,'REPAIR_STAGNATED');assert.equal(result.third.ok,true);assert.equal(result.limit.error.code,'REPAIR_LIMIT');
 await context.close();console.log('Agent scoped repair and preservation checks passed');
}finally{await browser.close();}
