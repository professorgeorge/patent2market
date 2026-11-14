// Evidence fields describe a document and territory, never worldwide clearance.
export function normalizePatent(t){
 if(!t||typeof t!=='object'||typeof t.title!=='string')return null;
 const out={};for(const k of ['id','title','description','url','category','retrievedAt','access','accessEvidence','accessURL','jurisdiction','checkedAt','fullTextURL','fullTextEvidence','claimsExcerpt','costTerms','costURL','costCheckedAt','statusLabel','source','imageUrl','subsystem'])out[k]=typeof t[k]==='string'?t[k].slice(0,k==='claimsExcerpt'?6000:15000):'';
 for(const k of ['url','accessURL','fullTextURL','costURL','imageUrl']){try{const u=new URL(out[k]);out[k]=['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{out[k]='';}}
 out.id=out.id||out.url||out.title;out.fullTextAvailable=t.fullTextAvailable===true&&!!out.fullTextURL&&!!out.fullTextEvidence;
 out.basisOrigin=t.basisOrigin==='source-reported'?'source-reported':'user-recorded';
 if(!out.subsystem)out.subsystem=classifySubsystem(out);
 return out;
}
export function classifySubsystem(patent){
 if(!patent)return 'Core Mechanism';
 if(patent.subsystem&&patent.subsystem!=='Core Mechanism')return patent.subsystem;
 const text=((patent.title||'')+' '+(patent.description||'')+' '+(patent.category||'')).toLowerCase();
 if(/(cool|thermal|heat|refrigerat|cryo|evaporat|cold|ice|insulat)/i.test(text))return 'Thermal & Cooling';
 if(/(solar|power|battery|energy|stirling|photovoltaic|electric|fuel)/i.test(text))return 'Power & Energy';
 if(/(sensor|detect|monitor|optic|measure|diagnos|camera|spectr|track|gas)/i.test(text))return 'Sensing & Control';
 if(/(water|filtr|purif|membrane|desalin|fluid|pump|valve|waste)/i.test(text))return 'Fluid & Purification';
 if(/(packag|contain|barrier|material|coat|polymer|aerogel|structur)/i.test(text))return 'Materials & Packaging';
 if(/(software|algorithm|model|data|ai|network|communicat)/i.test(text))return 'Software & Digital';
 return 'Core Mechanism';
}
export function selectedPatents(p){return p.technologies?.length?p.technologies:p.technology?[p.technology]:[];}
export function documentedAccess(t){return ['expired','open-license'].includes(t.access)&&!!t.accessURL&&!!t.accessEvidence?.trim()&&!!t.jurisdiction?.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(t.checkedAt||'');}
export function filterPatents(records,{fullText=true,openOnly=false,jurisdiction='',category=''}={}){return records.filter(t=>(!fullText||t.fullTextAvailable)&&(!openOnly||documentedAccess(t))&&(!jurisdiction||t.jurisdiction===jurisdiction)&&(!category||t.category===category));}
export function costLabel(t){return t.costTerms&&t.costURL&&t.costCheckedAt?`Published terms (user-recorded): ${t.costTerms} · checked ${t.costCheckedAt}`:'Published usage cost not established — unknown does not mean zero';}
export function validateSynthesis(value,candidates){
 if(!value||typeof value.solution!=='string'||!value.solution.trim()||!Array.isArray(value.components)||value.components.length>6||typeof value.firstExperiment!=='string'||!value.firstExperiment.trim()||typeof value.simplerAlternative!=='string'||!value.simplerAlternative.trim())throw Error('The assistant returned an incomplete solution proposal. Please retry.');
 const allowed=new Set(candidates.map(t=>t.id)),seen=new Set();
 for(const c of value.components){if(!c||!allowed.has(c.patentId)||seen.has(c.patentId)||typeof c.role!=='string'||!c.role.trim()||typeof c.integrationRisk!=='string'||!c.integrationRisk.trim())throw Error('The proposal used an unknown or duplicate patent, or omitted its role and integration risk. No selections changed.');const candidate=candidates.find(t=>t.id===c.patentId);if(typeof c.evidenceQuote!=='string'||c.evidenceQuote.trim().length<12||![candidate.description,candidate.claimsExcerpt].some(text=>typeof text==='string'&&text.includes(c.evidenceQuote.trim())))throw Error('The proposal did not ground each component in its own supplied text. Retry or choose the ingredients yourself.');seen.add(c.patentId);}
 for(const k of ['additionalInputs','nextQuestions'])if(!Array.isArray(value[k])||value[k].some(x=>typeof x!=='string'))throw Error('The proposal omitted required inputs or follow-up questions.');
 return value;
}
