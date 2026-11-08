// Optional reproducible 12/50/100/400-slide offline timing and renderer-heap sample.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),html=process.argv[2]||path.join(root,'dist/index.html');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'src/__tests__/fixtures/qbr-deck.json'),'utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const results=[];
 for(const count of [12,50,100,400]){
  const context=await browser.newContext({viewport:{width:1366,height:768}});await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(html).href);
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const before=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  const result=await page.evaluate(async({fixture,count})=>{
   const doc={...fixture,slides:Array.from({length:count},(_,i)=>({...fixture.slides[i%fixture.slides.length],id:'bench-'+i}))};const start=performance.now();
   if(!XB.agent){const c=XB.compiler.compile(doc,{strict:true,trust:'trusted'});return {mode:'compiler-only',durationMs:Math.round(performance.now()-start),slides:c.slides.length,errors:c.summary.errors};}
   await XB.agent.ready();const loaded=await XB.agent.setCandidate({baseRevision:null,document:doc});if(!loaded.ok)return {count,error:loaded.error};
   const run=await XB.agent.render({revision:loaded.revision});return {mode:'agent-full-browser',durationMs:Math.round(performance.now()-start),slides:run.data?.qa?.checkedSlides,error:run.error||null,qaPassed:run.data?.qa?.passed};
  },{fixture,count});
  const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  results.push({requestedSlides:count,...result,rendererHeapBefore:before.JSHeapUsedSize,rendererHeapAfter:after.JSHeapUsedSize});await context.close();
 }
 console.log(JSON.stringify({browser:browser.version(),viewport:'1366x768',network:'external blocked',results},null,2));
}finally{await browser.close();}
