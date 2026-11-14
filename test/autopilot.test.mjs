import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject,validateProject,currencyForCountry,heuristicFinancials,heuristicEvidence,financialInputsComplete,draftPlan,exportPlan} from '../dist/venture-core.js';
import {parseAI,messages} from '../dist/prompts.js';
import {googleRecord,handlePatents} from '../server/patents.mjs';

test('currencyForCountry detects currency from operating country',()=>{
 assert.equal(currencyForCountry('Kenya'),'KES');
 assert.equal(currencyForCountry('India'),'INR');
 assert.equal(currencyForCountry('Nigeria'),'NGN');
 assert.equal(currencyForCountry('United Kingdom'),'GBP');
 assert.equal(currencyForCountry('Germany'),'EUR');
 assert.equal(currencyForCountry('United States'),'USD');
 assert.equal(currencyForCountry(''),'USD');
});

test('heuristicFinancials calculates realistic baseline unit economics',()=>{
 const p=newProject();
 p.country='Kenya';
 p.problem='Tomato cold storage';
 p.offer='Cold storage as a service';
 const fin=heuristicFinancials(p);
 assert.equal(fin.currency,'KES');
 assert.ok(fin.price>fin.unitCost);
 assert.ok(fin.price>1000);
 assert.ok(financialInputsComplete(fin));

 const usP=newProject();
 usP.country='United States';
 const usFin=heuristicFinancials(usP);
 assert.equal(usFin.currency,'USD');
 assert.ok(usFin.price>usFin.unitCost);
 assert.ok(financialInputsComplete(usFin));
});

test('heuristicEvidence generates 5 categorized country and sector evidence leads',()=>{
 const p=newProject();
 p.country='Kenya';
 p.sector='Agriculture';
 p.customer='Smallholder farmers';
 const ev=heuristicEvidence(p);
 assert.equal(ev.length,5);
 assert.ok(ev.some(e=>e.kind==='regulatory'&&e.jurisdiction==='Kenya'));
 assert.ok(ev.some(e=>e.kind==='customer'));
 assert.ok(ev.some(e=>e.kind==='competition'));
 assert.ok(ev.some(e=>e.kind==='technical'));
 assert.ok(ev.some(e=>e.kind==='cost'));
});

test('parseAI handles financials stage with validation and bounds',()=>{
 const raw=JSON.stringify({currency:'KES',price:45000,unitCost:18000,monthlyUnits:25,growth:8,fixedCost:150000,startupCost:1200000,capital:2000000});
 const fin=parseAI(raw,'financials');
 assert.equal(fin.currency,'KES');
 assert.equal(fin.price,45000);
 assert.equal(fin.unitCost,18000);
 assert.ok(fin.price>fin.unitCost);

 const invalid=JSON.stringify({currency:'INVALID',price:10,unitCost:50,monthlyUnits:0,growth:0,fixedCost:0,startupCost:0,capital:0});
 const repaired=parseAI(invalid,'financials');
 assert.equal(repaired.currency,'USD');
 assert.ok(repaired.price>repaired.unitCost);
 assert.ok(repaired.monthlyUnits>=1);
});

test('parseAI handles evidence stage with validation',()=>{
 const raw=JSON.stringify({evidence:[{title:'Standards test',kind:'regulatory',jurisdiction:'KE',note:'Test note',url:'https://example.org'}]});
 const res=parseAI(raw,'evidence');
 assert.equal(res.evidence.length,1);
 assert.equal(res.evidence[0].kind,'regulatory');
 assert.equal(res.evidence[0].jurisdiction,'KE');
 assert.throws(()=>parseAI('{"evidence":[]}','evidence'),/incomplete/i);
});

test('end-to-end venture plan integration with calibrated financials and evidence',()=>{
 const p=newProject();
 p.name='FreshVault Kenya';
 p.problem='Smallholder farmers lose 40% of their harvest without off-grid cooling';
 p.country='Kenya';
 p.customer='Tomato farming cooperatives';
 p.geography='Nakuru county';
 p.sector='Cold chain logistics';
 p.financial=heuristicFinancials(p);
 p.evidence=heuristicEvidence(p);
 p.concept='Decentralized solar-powered evaporative cold hub with pay-per-crate storage';
 p.offer='Cold storage as a service at KES 50 per crate per day';
 p.technology=googleRecord({publication_number:'US10987654B2',title:'Modular solar refrigeration unit',snippet:'A solar thermal cooling apparatus',family_metadata:{aggregated:{country_status:[{country_code:'US',best_patent_stage:{state:'ACTIVE'}}]}}});
 p.technologies=[p.technology];
 p.sections=draftPlan(p);

 assert.equal(p.sections.length,14);
 const exported=exportPlan(p);
 assert.match(exported,/FreshVault Kenya/);
 assert.match(exported,/Tomato farming cooperatives/);
 assert.match(exported,/KES/);
 assert.match(exported,/Modular solar refrigeration unit/);
 assert.match(exported,/Regulatory compliance/);
});
