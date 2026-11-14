import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePatent,filterPatents,selectedPatents,costLabel,validateSynthesis} from '../dist/patents.js';
import {validateProject,draftPlan,newProject,context} from '../dist/venture-core.js';
import {lensRecord,googleRecord,bigqueryRecord,handlePatents} from '../server/patents.mjs';
const patent={id:'JP123B2',title:'Test mechanism',description:'An illustrative mechanism',jurisdiction:'JP',url:'https://example.org/patent',access:'expired',accessEvidence:'Status evidence for this territory only',accessURL:'https://example.org/status',checkedAt:'2026-11-14',fullTextAvailable:true,fullTextURL:'https://example.org/full',fullTextEvidence:'Description and claims reviewed'};
test('full text and documented access filters are independent and country neutral',()=>{const records=[normalizePatent(patent),normalizePatent({...patent,id:'CN1',jurisdiction:'CN',access:'unknown'}),normalizePatent({...patent,id:'US1',fullTextAvailable:false})];assert.equal(filterPatents(records).length,2);assert.equal(filterPatents(records,{openOnly:true}).length,1);assert.equal(filterPatents(records,{fullText:false,openOnly:true}).length,2);assert.equal(filterPatents(records,{jurisdiction:'CN'})[0].id,'CN1');});
test('incomplete evidence and unsafe full-text links cannot qualify',()=>{const t=normalizePatent({...patent,accessURL:'javascript:alert(1)',fullTextURL:'javascript:alert(1)'});assert.equal(t.fullTextAvailable,false);assert.equal(filterPatents([t],{fullText:false,openOnly:true}).length,0);});
test('unknown published price never becomes free and recorded costs retain source',()=>{assert.match(costLabel(patent),/unknown does not mean zero/);assert.match(costLabel({...patent,costTerms:'EUR 500 upfront; 2% royalty',costURL:'https://example.org/terms',costCheckedAt:'2026-11-14'}),/EUR 500/);});
test('old projects migrate and multi-patent projects preserve evidence through export/import',()=>{assert.equal(selectedPatents(validateProject({technology:patent})).length,1);const p=validateProject({technologies:[patent,{...patent,id:'EP2',title:'Complementary mechanism',costTerms:'USD 100',costURL:'https://example.org/cost',costCheckedAt:'2026-11-14'}]});assert.equal(p.technology.id,patent.id);assert.equal(p.technologies.length,2);assert.match(draftPlan(p)[3].text,/Complementary mechanism/);assert.match(draftPlan(p)[3].text,/USD 100/);assert.equal(context(p).technologies[1].sourceId,'T2');});
const proposal={solution:'Combine a mechanism with local service delivery',components:[{patentId:patent.id,role:'Core process',integrationRisk:'Power and flow must match',evidenceQuote:'illustrative mechanism'}],firstExperiment:'Measure output against baseline',simplerAlternative:'Test a manual method',additionalInputs:['An engineering partner'],nextQuestions:['Who pays?']};
test('synthesis rejects fabricated IDs, duplicate IDs, and missing integration detail',()=>{assert.equal(validateSynthesis(proposal,[patent]),proposal);assert.throws(()=>validateSynthesis({...proposal,components:[{...proposal.components[0],patentId:'invented'}]},[patent]),/unknown/);assert.throws(()=>validateSynthesis({...proposal,components:[...proposal.components,...proposal.components]},[patent]),/duplicate/);assert.throws(()=>validateSynthesis({...proposal,firstExperiment:''},[patent]),/incomplete/);assert.equal(validateSynthesis({...proposal,components:[]},[]).components.length,0);});
test('Lens requires actual claims and description before asserting full text',()=>{const raw={lens_id:'123',jurisdiction:'EP',doc_number:'123',kind:'B1',biblio:{invention_title:[{lang:'en',text:'Test patent'}]},abstract:[{text:'Abstract'}],description:{text:'Full description'},legal_status:{patent_status:'EXPIRED'}};assert.equal(lensRecord(raw).fullTextAvailable,false);const t=lensRecord({...raw,claims:[{claims:[{claim_text:['Claim one']}]}]});assert.equal(t.fullTextAvailable,true);assert.equal(t.access,'expired');assert.equal(t.basisOrigin,'source-reported');assert.equal(t.claimsExcerpt,'Claim one');assert.equal(lensRecord({...raw,legal_status:{patent_status:'ACTIVE'}}).access,'unknown');});
test('worldwide endpoint does not expose tokens or silently pretend search is configured',async()=>{const config=await handlePatents(new Request('https://app.test/api/patents'),{LENS_API_TOKEN:'secret'});assert.equal((await config.json()).enabled,true);const req=new Request('https://app.test/api/patents',{method:'POST',headers:{Origin:'https://app.test'},body:JSON.stringify({query:'water'})});assert.equal((await handlePatents(req,{})).status,503);});
test('worldwide gateway uses fixed host, bounded results and same-origin protection',async()=>{const req=()=>new Request('https://app.test/api/patents',{method:'POST',headers:{Origin:'https://app.test'},body:JSON.stringify({query:'water filter'})});let called=false;const response=await handlePatents(req(),{LENS_API_TOKEN:'secret'},async(url,options)=>{called=true;assert.equal(url,'https://api.lens.org/patent/search');assert.equal(JSON.parse(options.body).size,30);assert.equal(options.headers.Authorization,'Bearer secret');return Response.json({data:[{lens_id:'1',jurisdiction:'CN',doc_number:'123',kind:'B'}]});});assert.equal(response.status,200);assert.equal(called,true);assert.equal((await response.json()).records[0].jurisdiction,'CN');assert.equal((await handlePatents(new Request('https://app.test/api/patents',{method:'POST'}),{LENS_API_TOKEN:'secret'})).status,403);});

test('synthesis rejects evidence attributed to the wrong patent',()=>assert.throws(()=>validateSynthesis({...proposal,components:[{...proposal.components[0],evidenceQuote:'A solar drying invention'}]},[patent]),/ground/));

test('googleRecord maps Google Patents search result with full text and status',()=>{
 const raw={publication_number:'WO2019023649A1',title:'<b>Water</b> purification system',snippet:'A modular <b>filter</b> cartridge for unpurified water.',family_metadata:{aggregated:{country_status:[{country_code:'WO',best_patent_stage:{state:'NOT_ACTIVE'}}]}}};
 const rec=googleRecord(raw);
 assert.equal(rec.id,'WO2019023649A1');
 assert.equal(rec.title,'Water purification system');
 assert.equal(rec.jurisdiction,'WO');
 assert.equal(rec.fullTextAvailable,true);
 assert.equal(rec.access,'expired');
 assert.match(rec.url,/patents\.google\.com/);
 assert.match(rec.fullTextEvidence,/Google Patents/);
});

test('bigqueryRecord maps BigQuery public dataset row into normalized patent',()=>{
 const row={publication_number:'US10987654B2',title:'Solar water desalinator',abstract:'A solar thermal distillation apparatus.',country_code:'US',publication_date:'20240115'};
 const rec=bigqueryRecord(row);
 assert.equal(rec.id,'US10987654B2');
 assert.equal(rec.jurisdiction,'US');
 assert.equal(rec.fullTextAvailable,true);
 assert.match(rec.source,/BigQuery/);
});

test('Google Patents live search gateway processes search queries',async()=>{
 const req=new Request('https://app.test/api/patents',{method:'POST',headers:{Origin:'https://app.test'},body:JSON.stringify({query:'solar desalination',source:'google'})});
 let fetchedUrl='';
 const mockFetcher=async(url)=>{fetchedUrl=url;return Response.json({results:{cluster:[{result:[{patent:{publication_number:'US9876543B2',title:'Solar still',snippet:'Distillation device',family_metadata:{aggregated:{country_status:[{country_code:'US',best_patent_stage:{state:'ACTIVE'}}]}}}}]}]}});};
 const res=await handlePatents(req,{},mockFetcher);
 assert.equal(res.status,200);
 assert.match(fetchedUrl,/patents\.google\.com\/xhr\/query/);
 const body=await res.json();
 assert.equal(body.records.length,1);
 assert.equal(body.records[0].id,'US9876543B2');
 assert.equal(body.records[0].fullTextAvailable,true);
});

test('BigQuery gateway checks project configuration and parses query response',async()=>{
 const unconfReq=new Request('https://app.test/api/patents',{method:'POST',headers:{Origin:'https://app.test'},body:JSON.stringify({query:'water filter',source:'bigquery'})});
 assert.equal((await handlePatents(unconfReq,{})).status,503);
 const confReq=new Request('https://app.test/api/patents',{method:'POST',headers:{Origin:'https://app.test'},body:JSON.stringify({query:'water filter',source:'bigquery',projectId:'my-gcp-project',apiKey:'bq-key'})});
 const mockFetcher=async(url,options)=>{
  assert.match(url,/bigquery\.googleapis\.com/);
  assert.match(options.body,/patents-public-data\.patents\.publications/);
  return Response.json({schema:{fields:[{name:'publication_number'},{name:'country_code'},{name:'title'},{name:'abstract'},{name:'publication_date'}]},rows:[{f:[{v:'US8765432B1'},{v:'US'},{v:'Filtration method'},{v:'Desiccant and membrane'},{v:'20230501'}]}]});
 };
 const res=await handlePatents(confReq,{},mockFetcher);
 assert.equal(res.status,200);
 const data=await res.json();
 assert.equal(data.records[0].id,'US8765432B1');
 assert.equal(data.records[0].title,'Filtration method');
});

