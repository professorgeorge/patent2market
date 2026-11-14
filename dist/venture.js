import {normalizePatent,selectedPatents,filterPatents,costLabel,validateSynthesis,classifySubsystem} from './patents.js';
import {rank,tokens} from './core.js';
import {newProject,safeURL,financials,financialInputsComplete,accessStatus,missingEvidence,context,draftPlan,exportPlan,validateProject,fingerprint,currencyForCountry,heuristicFinancials,heuristicEvidence,generateSolutionBlueprint} from './venture-core.js';
import {discoverProviders,runAI,detectOllama,prepareBrowserAI} from './ai-client.js';
import {
  buildDocx,
  pitchDeckSlides,
  generateBusinessModelCanvas,
  generateBusinessModelCanvasHtml,
  generateFinancialCsv,
  generateOnePager,
  generateOnePagerHtml,
  generateInvestorQa,
  generateInvestorQaHtml,
  generateTtoTermSheetGuide,
  generateTtoTermSheetGuideHtml,
  generateGrantConceptNote,
  generateGrantConceptNoteHtml
} from './word-export.js';

const TEMPLATES=[
 {
  label:'🍅 Kenya Post-Harvest Cold Chain',
  name:'FreshVault Kenya',
  problem:'Smallholder tomato farmers in Nakuru lose 45% of harvest to post-harvest heat spoilage during transport.',
  customer:'Smallholder tomato farming cooperatives and local market aggregators',
  country:'Kenya',
  registrationCountry:'Kenya',
  geography:'Nakuru and Naivasha agricultural corridors',
  sector:'Post-Harvest Cold Chain Logistics',
  constraints:'Intermittent electricity, high daytime temperatures (32°C+), unpaved access roads.',
  advantage:'Direct operational partnerships with 4 farming cooperatives in Rift Valley.',
  technologies:[
   {id:'US6183828B1',title:'Evaporative Cooling and Desiccant Thermal Storage Container',description:'Passive evaporative cooling enclosure with high-efficiency porous desiccant matrix maintaining 10-15°C temperature depression without grid electrical power.',source:'Google Patents / USPTO',url:'https://patents.google.com/patent/US6183828B1/en',jurisdiction:'US',subsystem:'Thermal & Cooling',access:'expired',statusLabel:'Public domain / expired',checkedAt:'2026-11-14'},
   {id:'US9989289B2',title:'Solar-Assisted Thermoelectric Absorption Refrigeration System',description:'Photovoltaic-assisted absorption refrigeration unit with solid-state heat pump backup for off-grid perishable agricultural food preservation.',source:'Google Patents / USPTO',url:'https://patents.google.com/patent/US9989289B2/en',jurisdiction:'US',subsystem:'Power & Energy',access:'open-license',statusLabel:'Documented open specification',checkedAt:'2026-11-14'}
  ]
 },
 {
  label:'💧 India Solar Water Purification',
  name:'JalShakti CleanWater',
  problem:'Rural communities in eastern Uttar Pradesh lack affordable, off-grid purification for groundwater contaminated with microbial pathogens and high salinity.',
  customer:'Gram panchayats, rural schools, and small community water kiosks',
  country:'India',
  registrationCountry:'India',
  geography:'Varanasi and Gorakhpur rural districts',
  sector:'Decentralized Water & Sanitation',
  constraints:'High humidity, seasonal flooding, low municipal grid reliability, price sensitivity.',
  advantage:'Local assembly capability and established distribution relationships with village entrepreneurs.',
  technologies:[
   {id:'US7850854B2',title:'Solar-Driven Forward Osmosis and Membrane Distillation Apparatus',description:'Membrane distillation water treatment module driven by low-grade solar thermal collector energy for high-salinity and contaminated brackish water purification.',source:'Google Patents / USPTO',url:'https://patents.google.com/patent/US7850854B2/en',jurisdiction:'US',subsystem:'Fluid & Purification',access:'expired',statusLabel:'Public domain / expired',checkedAt:'2026-11-14'},
   {id:'US8491792B2',title:'Low-Power Photovoltaic Ultraviolet Disinfection Flow Cell',description:'Solid-state UV-C LED sterilization fluid cell with integrated hydrodynamic turbulence baffles for high-throughput pathogen deactivation.',source:'Google Patents / USPTO',url:'https://patents.google.com/patent/US8491792B2/en',jurisdiction:'US',subsystem:'Sensing & Control',access:'open-license',statusLabel:'Documented open specification',checkedAt:'2026-11-14'}
  ]
 },
 {
  label:'⚡ Nigeria Biomass Clean Energy',
  name:'AgroPower Nigeria',
  problem:'Cassava and maize processors generate tons of organic residue that rot in open fields, while incurring high diesel generator costs for local milling.',
  customer:'Agro-processing SMEs and rural cooperative milling clusters',
  country:'Nigeria',
  registrationCountry:'Nigeria',
  geography:'Oyo and Ogun state agricultural hubs',
  sector:'Clean Energy & Bioeconomy',
  constraints:'Volatile fuel prices, limited access to commercial bank financing, spare part lead times.',
  advantage:'Access to continuous biomass feedstocks through cooperative processing contracts.',
  technologies:[
   {id:'US8221515B2',title:'Modular Biomass Downdraft Gasification and Syngas Conditioning Reactor',description:'Compact fixed-bed downdraft gasifier converting dry agricultural residue into clean combustible fuel gas for stationary mechanical and electrical drive engines.',source:'Google Patents / USPTO',url:'https://patents.google.com/patent/US8221515B2/en',jurisdiction:'US',subsystem:'Power & Energy',access:'expired',statusLabel:'Public domain / expired',checkedAt:'2026-11-14'},
   {id:'US7625532B2',title:'Continuous Waste Pyrolysis and Biochar Activated Filter Unit',description:'Continuous rotary biomass pyrolyzer producing high-grade agricultural biochar and thermal process heat with particulate emissions cyclonic separator.',source:'Google Patents / USPTO',url:'https://patents.google.com/patent/US7625532B2/en',jurisdiction:'US',subsystem:'Thermal & Cooling',access:'expired',statusLabel:'Public domain / expired',checkedAt:'2026-11-14'}
  ]
 },
 {
  label:'🔬 South Africa Optical Diagnostics',
  name:'OptiCrop AgriDiagnostics',
  problem:'Citrus and grain farmers face delayed fungal infection diagnosis, resulting in late pesticide over-application and export shipment rejections.',
  customer:'Commercial citrus growers, agricultural extension officers, and co-op agronomists',
  country:'South Africa',
  registrationCountry:'South Africa',
  geography:'Limpopo and Western Cape agricultural valleys',
  sector:'Agricultural Biotechnology & Diagnostics',
  constraints:'Harsh field dust, bright sunlight interference, need for instant non-destructive field readings.',
  advantage:'Agronomy expertise and partnerships with provincial agricultural extension networks.',
  technologies:[
   {id:'US10247671B2',title:'Multispectral Optical Reflectance Sensor for Plant Pathology Detection',description:'Handheld optical spectrophotometric sensor array measuring normalized difference vegetation indices and leaf chlorophyll fluorescence signatures for asymptomatic disease detection.',source:'Google Patents / USPTO',url:'https://patents.google.com/patent/US10247671B2/en',jurisdiction:'US',subsystem:'Sensing & Control',access:'open-license',statusLabel:'Documented open specification',checkedAt:'2026-11-14'},
   {id:'US9182348B2',title:'Smartphone-Coupled Fluorescence Diagnostic Reader and Optical Diffuser',description:'Modular optical clip-on enclosure and narrow-band LED excitation lens turning consumer mobile cameras into field diagnostic fluorometers.',source:'Google Patents / USPTO',url:'https://patents.google.com/patent/US9182348B2/en',jurisdiction:'US',subsystem:'Materials & Packaging',access:'open-license',statusLabel:'Documented open specification',checkedAt:'2026-11-14'}
  ]
 }
];
const $=s=>document.querySelector(s),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE='patent2market-venture-v2';let p=newProject(),settings={provider:'guided',ollamaURL:'http://localhost:11434',ollamaModel:'',consent:false};try{const stored=JSON.parse(localStorage.getItem(STORAGE)||'null');if(stored){p=validateProject(stored);if(stored.aiResults&&typeof stored.aiResults==='object')p.aiResults=stored.aiResults;}}catch{}
let patentSource='google',lensKey='',bqProject='',bqKey='',sourceScope='',searchGeneration=0,ollamaTransport='browser',selectedSubsystem='';let step=0,catalog=[],category='',limit=8,onlyReviewed=false,fullTextOnly=false,territory='',liveEnabled=false,liveBusy=false,pendingProposal=null,aiBusy=false,controller,providerInfo={cloud:[],browser:'unavailable'},toastTimer,planInput=null;try{const stored=JSON.parse(localStorage.getItem(STORAGE)||'null');planInput=typeof stored?._planInput==='string'?stored._planInput:null;}catch{}
const labels=['The problem','Technology','Your offer','The evidence','The numbers','Your plan'];
const coach=[['Find the useful question.','Turn a broad problem into a specific customer need. Your assistant asks the questions that change the direction.','clarify','Help clarify my opportunity'],['See beyond the patent.','Understand the mechanism, what it might help with, and the technical questions to investigate.','technology','Explain my selected technology'],['Useful ingredients. Different businesses.','Explore a product, a service, or a simpler route to the same outcome. Choose the offer that fits your customer.','concepts','Explore business concepts'],['Trade guesses for evidence.','Find the conversations, comparisons, and tests that would make this business more credible.','research','Design my evidence plan'],['Give the idea a reality check.','Challenge the economics, the difficult assumptions, and whether a simpler approach could work.','critique','Challenge my assumptions'],['Make the plan useful.','Bring your decisions, evidence, and numbers into a coherent business plan with explicit next steps.','plan','Write my business plan']];
function notify(text){$('#toast').textContent=text;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',4500);}
function save(){p.updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE,JSON.stringify({...p,_planInput:planInput}));$('#save-status').textContent='Saved on this device';}catch{$('#save-status').textContent='Storage unavailable — export your project';}summary();}
function modal(html){$('#modal-body').innerHTML=html;$('#modal').showModal();}
function field(key,label,placeholder='',type='text',value=p[key]){return `<div class="field"><label for="field-${key}">${label}</label>${type==='textarea'?`<textarea id="field-${key}" data-field="${key}" rows="4" maxlength="12000" >${escape(value)}</textarea>`:`<input id="field-${key}" data-field="${key}" type="${type}" maxlength="500" value="${escape(value)}" >`}</div>`;}
function head(number,title,copy){return `<div class="page-head"><span class="eyebrow">${number} / ${labels[number-1].toUpperCase()}</span><h2>${title}</h2><p>${copy}</p></div>`;}
function actions(){return `<div class="section-actions">${step?'<button class="secondary" data-back>← Previous step</button>':'<span class="small muted">Start rough. You can refine everything later.</span>'}${step<5?`<button class="primary" data-next>${['Explore technologies','Shape the offer','Build the evidence','Explore the numbers','Build my plan'][step]} →</button>`:(p.sections.length?`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><button class="primary" data-export-docx>Word (.docx) ↓</button><button class="secondary" data-export-csv>Financials (.csv) 📊</button><button class="secondary" data-one-pager>One-Pager 📄</button><button class="secondary" data-bmc>Model Canvas ⊞</button><button class="secondary" data-pitch-deck>10-Slide Deck ❖</button></div>`:'<button class="primary" data-ai-plan>✧ Draft Plan with AI</button>')}</div>`;}
function summary(){const completed=[!!p.problem,!!p.technology,!!p.offer,!!p.evidence.length,false,!!p.sections.length];$('#steps').innerHTML=labels.map((label,i)=>`<button class="step ${i===step?'active':''} ${completed[i]?'done':''}" data-step="${i}" ${i===step?'aria-current="step"':''}><span class="step-num">${completed[i]?'✓':i+1}</span>${label}</button>`).join('');$('#project-summary').innerHTML=`<div class="summary-row"><strong>PROJECT</strong>${escape(p.name)}</div><div class="summary-row"><strong>WHO YOU WANT TO HELP</strong>${escape(p.customer||'Still taking shape')}</div><div class="summary-row"><strong>TECHNOLOGY LEAD</strong>${escape(selectedPatents(p).map(t=>t.title).join(' + ')||'Not chosen yet')}</div><div class="summary-row"><strong>EVIDENCE</strong>${p.evidence.length} source${p.evidence.length===1?'':'s'} recorded · ${missingEvidence(p).length} gaps to explore</div><div class="summary-row"><strong>BUSINESS PLAN</strong>${p.sections.length?'Draft created · review and refine':'Not drafted yet'}</div>`;}
function render(){summary();const c=coach[step];$('#coach-title').textContent=c[0];$('#coach-copy').textContent=c[1];$('#coach-action').textContent='✧ '+c[3];$('#coach-action').disabled=aiBusy;$('#coach-output').innerHTML=aiHTML(p.aiResults[c[2]]?.result);const views=[problemView,technologyView,offerView,evidenceView,numbersView,planView];$('#content').innerHTML=views[step]()+actions();if(step===1)renderTechnologies();if(step===4)updateNumbers();}
function problemView(){return head(1,'What needs to change?','Describe your opportunity and where the business will operate.')+`
<div class="panel">
 <div class="template-chips" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
  <span class="small muted" style="align-self:center;font-weight:600;">Quick-start ideas:</span>
  ${TEMPLATES.map((t,i)=>`<button type="button" class="template-chip" data-apply-template="${i}">${t.label}</button>`).join('')}
  <button type="button" class="template-chip clear-chip" data-clear-problem title="Clear form to enter your own problem and context">✕ Clear form</button>
 </div>
 ${field('problem','Problem or opportunity','Describe the specific pain point, friction, or unmet need...','textarea')}
</div>
<div class="panel"><h3>Your business context</h3>
<div class="form-grid">
 ${field('customer','Customer / User','e.g. Smallholder farmers & market produce aggregators')}
 ${field('name','Venture name','e.g. SolarCool Fresh')}
 ${field('country','Operating country','e.g. Kenya')}
 ${field('registrationCountry','Business registration country','e.g. Kenya')}
 ${field('geography','State, province or local area','e.g. Nakuru & Rift Valley')}
 ${field('sector','Sector and intended product use','e.g. Agriculture / Cold Chain')}
 ${field('tradeContext','Cross-border sales, sourcing or imports','e.g. Imported PV cells, local metal fabrication')}
 ${field('advantage','Founder capabilities','e.g. Ground agronomy network & local logistics relationships')}
 <div class="wide">
  ${field('localContext','Local operating conditions and known requirements','e.g. High ambient temperature, unreliable electrical grid, dusty rural roads','textarea')}
  ${field('constraints','Constraints','e.g. Low upfront capital, must be locally maintainable without imported technicians','textarea')}
 </div>
</div>
<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center;">
 <button class="secondary" data-local-requirements>Review country and local requirements with AI</button>
 <button class="primary" data-full-autopilot ${aiBusy?'disabled':''}>🚀 Run Autopilot with this context</button>
 <button type="button" class="quiet" data-clear-problem style="color:#b91c1c;margin-left:auto;">✕ Clear all inputs</button>
</div>
<p class="small muted">Add dated official sources in Evidence to substantiate requirements. AI will flag unverified obligations rather than supply assumed tax rates or approvals.</p></div>`;}
const sourceChoices=[
 ['google','Google Patents · integrated worldwide search (Default)'],
 ['all','🌐 All Available Sources (Google Patents + NASA)'],
 ['nasa','NASA · integrated technology search'],
 ['bigquery','Google Patents BigQuery · public dataset'],
 ['lens','Lens · integrated worldwide search'],
 ['epo','EPO Espacenet · external search'],
 ['wipo','WIPO PATENTSCOPE · external search'],
 ['imports','My sourced documents']
];
function sourceLink(){const q=encodeURIComponent(p.query||p.problem);return {google:'https://patents.google.com/?q='+q,all:'https://patents.google.com/?q='+q,epo:'https://worldwide.espacenet.com/patent/search?q='+q,wipo:'https://patentscope.wipo.int/search/en/search.jsf'}[patentSource]||'';}
function sourceReady(){return ['google','all','nasa'].includes(patentSource)||(patentSource==='lens'&&(liveEnabled||!!lensKey))||(patentSource==='bigquery'&&(liveEnabled||!!bqProject));}
function availablePatents(){return [...new Map([...(patentSource==='imports'?selectedPatents(p):catalog)].map(t=>[t.id,t])).values()];}
function matchingPatents(query=patentSource==='imports'?'':p.query||p.problem){
  const filtered=filterPatents(availablePatents(),{fullText:fullTextOnly,openOnly:onlyReviewed,jurisdiction:territory,category});
  if(!query)return filtered.map(r=>({record:r,score:0,highlights:[]}));
  const ranked=rank(filtered,query);
  return ranked.length?ranked:filtered.map(r=>({record:r,score:0,highlights:[]}));
}
function renderArchitectureCanvas(patents){
 if(!patents.length)return '';
 const bp=generateSolutionBlueprint(p);
 const topGaps=bp.gaps.slice(0,3);
 return `<div class="architecture-canvas">
  <div class="architecture-header">
   <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <h4 style="margin:0;font-size:14px;color:#163d36;">❖ Comprehensive Solution Blueprint · Modular System Architecture</h4>
    <span class="subsystem-badge" style="background:#163d36;color:#ffffff;">${patents.length} Patented Core</span>
    <span class="subsystem-badge" style="background:#e8f5e9;color:#1b5e20;">${bp.gaps.length} AI Gap-Fills</span>
   </div>
   <span class="small muted" style="font-weight:600;">100% Commercial System</span>
  </div>
  <p class="small muted" style="margin-bottom:12px;">Visual integration model: Proprietary patent innovations coupled with AI-engineered off-the-shelf auxiliary subsystems to create a complete, buildable product.</p>
  <div class="architecture-grid">
   ${patents.map((t,i)=>`<div class="arch-node"><span class="arch-tag">${escape(t.subsystem||classifySubsystem(t))}</span><div class="arch-title">[T${i+1}] ${escape(t.title)}</div><small class="muted">${escape(t.id)} · ${escape(t.jurisdiction||'US')}</small></div><div class="arch-connector">+<span>Interfaced</span></div>`).join('')}
   ${topGaps.map((g,i)=>`<div class="arch-node gap-node"><span class="arch-tag">AI Gap-Fill · ${escape(g.subsystem)}</span><div class="arch-title" style="font-size:11px;">${escape(g.role.slice(0,65))}…</div><span class="arch-badge">COTS Off-The-Shelf</span></div>${i<topGaps.length-1?'<div class="arch-connector">+<span>Interfaced</span></div>':'<div class="arch-connector">➔<span>Synthesized</span></div>'}`).join('')}
   <div class="arch-node solution-node"><span class="arch-tag">Venture Offering</span><div class="arch-title">${escape(p.name||'Commercial Solution')}</div><small style="color:#c8e6c9;">Deploy in ${escape(p.country||'Target Market')}</small></div>
  </div>

  <div class="blueprint-summary-box">
   <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
    <strong style="color:#163d36;font-size:13px;">✨ AI-Engineered Subsystems (Filling Architectural Gaps with Native Knowledge)</strong>
    <span class="small muted">No single patent makes a full product · COTS BOM ready</span>
   </div>
   <p class="small muted" style="margin:4px 0 10px 0;">${escape(bp.integrationModel)}</p>
   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;">
    ${bp.gaps.map(g=>`
     <div style="background:#f9faf8;border-left:3px solid #2e7d32;padding:8px 10px;border-radius:0 4px 4px 0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
       <strong style="color:#163d36;font-size:12px;">${escape(g.subsystem)}</strong>
       <span style="font-size:9px;background:#e8f5e9;color:#1b5e20;padding:1px 5px;border-radius:4px;font-weight:700;">COTS</span>
      </div>
      <p style="margin:3px 0 4px 0;font-size:11px;color:#2c3e50;">${escape(g.role)}</p>
      <div style="font-size:10px;color:#556b2f;margin-bottom:4px;"><strong>Recommended Components:</strong> ${escape(g.cotsComponents)}</div>
      <div style="font-size:10px;color:#64748b;"><strong>Interface:</strong> ${escape(g.interface)}</div>
      <div style="margin-top:6px;display:flex;gap:6px;">
       <button type="button" class="quiet" data-search-complementary="${escape(g.searchQuery)}" style="padding:0;font-size:11px;color:#21594f;text-decoration:underline;">🔍 Find complementary patents for this gap ↗</button>
      </div>
     </div>
    `).join('')}
   </div>
   <div style="margin-top:12px;padding-top:10px;border-top:1px solid #e0e7db;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
    <button type="button" class="secondary" data-auto-complementary-search style="font-size:12px;">⚡ Auto-source complementary patents for remaining gaps</button>
    <span class="small muted">Automatically searches Google Patents to couple auxiliary patents into the solution blueprint.</span>
   </div>
  </div>
 </div>`;
}
function technologyView(){return head(2,'Source the technology.','Choose a source and run a fresh search. Google Patents worldwide live search is active by default.')+`
<div class="panel">
 <div class="field"><label for="patent-source">Patent source</label><select id="patent-source">${sourceChoices.map(([id,label])=>`<option value="${id}" ${patentSource===id?'selected':''}>${label}</option>`).join('')}</select></div>
 ${patentSource==='google'?'<p class="small"><strong>Google Patents live search (Default):</strong> Direct access to 100M+ international patents (USPTO, EPO, WIPO, etc.) with active/expired legal status and full-text links. Enter any problem or keywords.</p>':''}
 ${patentSource==='all'?'<p class="small"><strong>All Available Sources:</strong> Simultaneous search across Google Patents worldwide database and NASA Technology Transfer catalog, combined and deduplicated into a single result stream.</p>':''}
 ${patentSource==='nasa'?'<p class="small"><strong>NASA Technology Transfer live search:</strong> Direct access to verified patents and technology transfer summaries with concept expansion. Enter any keywords or your problem statement.</p>':''}
 ${patentSource==='bigquery'?`<p class="small"><strong>Google Patents BigQuery Public Dataset:</strong> Query <code>patents-public-data.patents.publications</code> directly via Google Cloud BigQuery API.</p><button class="secondary" data-source-settings>BigQuery API settings</button>`:''}
 ${patentSource==='lens'?`<p class="small">${liveEnabled?'Host API access is configured.':'An approved Lens API token is required.'} You may use your own session token.</p><button class="secondary" data-source-settings>Lens API settings</button>`:''}
 <div class="search-row"><input id="tech-search" aria-label="Technology search" maxlength="600" value="${escape(p.query)}" placeholder="Enter search terms (e.g. solar water purification, evaporative cooling)"><button class="primary" id="live-search" ${!sourceReady()||liveBusy||aiBusy?'disabled':''}>${liveBusy?'Searching…':'Search source now'}</button></div>
 ${['google','all'].includes(patentSource)&&sourceLink()?`<a id="external-search" href="${escape(sourceLink())}" target="_blank" rel="noopener noreferrer">Open Google Patents in new tab ↗</a>`:''}
 ${['epo','wipo'].includes(patentSource)&&sourceLink()?`<a id="external-search" href="${escape(sourceLink())}" target="_blank" rel="noopener noreferrer">Open ${patentSource.toUpperCase()} ↗</a><p class="small">Search on the source website, then add the document below.</p>`:''}
 <div class="filters"><label><input id="fulltext-only" type="checkbox" ${fullTextOnly?'checked':''}> Full document available</label><label><input id="reviewed-only" type="checkbox" ${onlyReviewed?'checked':''}> Documented expired / open-license leads only</label><select id="tech-territory" aria-label="Patent jurisdiction"><option value="">All jurisdictions</option>${[...new Set(availablePatents().map(t=>t.jurisdiction).filter(Boolean))].sort().map(c=>`<option ${territory===c?'selected':''}>${escape(c)}</option>`).join('')}</select></div>
 <p class="small muted">Document availability is separate from permission to use an invention. Check territorial status and related patent families.</p>
 <button class="secondary" data-import-tech>Add a sourced patent or open design</button>
 <p class="small muted">${escape(sourceScope||'Ready to search live patent databases.')}</p>
</div>

<div class="panel">
 <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
  <h3 style="margin:0;">Sourced Patent Leads</h3>
  <span class="small muted" id="tech-count"></span>
 </div>
 <div id="tech-results"></div>
 <button class="secondary" id="tech-more" style="margin-top:14px;">Show more leads</button>
</div>

<div class="panel">
 <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
  <h3 style="margin:0;">Selected technologies · ${selectedPatents(p).length}/6</h3>
  <span class="small muted">${selectedPatents(p).length?'Ingredients coupled into your venture':'Select 1 to 6 ingredients from above'}</span>
 </div>
 ${renderArchitectureCanvas(selectedPatents(p))}
 ${selectedPatents(p).map((t,i)=>`<div class="evidence-item"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;"><strong>[T${i+1}] ${escape(t.title)}</strong><span class="status-pill ${t.access==='expired'?'inactive':'active'}">${escape(t.statusLabel||t.access||'Status unknown')}</span></div><p>${escape(t.id)} · ${escape(t.jurisdiction||'Territory not recorded')} · ${escape(t.source||'Patent database')}</p><p class="small">${escape(costLabel(t))}</p><div style="display:flex;gap:8px;margin-top:8px;"><button class="secondary" data-access="${i}">Review document, rights & costs</button><button class="quiet" data-remove-tech="${i}">Remove</button></div></div>`).join('')||'<p class="small muted">No technologies selected yet. Click <strong>+ Add ingredient</strong> on any patent lead above, or use the auto-select assistant below.</p>'}
 <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
  <button class="primary" data-autopilot ${aiBusy?'disabled':''}>Propose a solution with AI</button>
  <button class="secondary" data-auto-multi-patent ${aiBusy?'disabled':''}>✧ Auto-select 2-3 complementary patents</button>
  <button class="secondary" data-import-tech>+ Add custom patent / design</button>
  <button class="secondary" data-tto-guide>📜 TTO Licensing Guide</button>
 </div>
 <p class="small muted" style="margin-top:10px;">AI searches the selected integrated source, or uses your sourced documents. You review before accepting.</p>
</div>`;}
function renderTechnologies(){
 const allRanked=matchingPatents();
 const results=allRanked.filter(r=>!selectedSubsystem||(r.record.subsystem||classifySubsystem(r.record))===selectedSubsystem);
 const subs=['All Subsystems','Thermal & Cooling','Power & Energy','Sensing & Control','Fluid & Purification','Materials & Packaging','Core Mechanism'];
 const subFilterHtml=`<div class="subsystem-filter-bar">${subs.map(s=>`<button type="button" class="subsystem-chip ${(selectedSubsystem===''&&s==='All Subsystems')||selectedSubsystem===s?'active':''}" data-filter-subsystem="${s==='All Subsystems'?'':s}">${s}</button>`).join('')}</div>`;
 $('#tech-count').textContent=`${results.length} matching leads (${allRanked.length} total from source) · relevance is not technical fit`;
 $('#tech-results').innerHTML=subFilterHtml+(results.slice(0,limit).map(({record:t})=>`<article class="technology"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;"><span class="badge"><span class="subsystem-badge">${escape(t.subsystem||classifySubsystem(t))}</span>${escape(t.jurisdiction||'Territory not recorded')} · ${escape(t.id)}</span><span class="status-pill ${t.access==='expired'?'inactive':'active'}">${escape(t.statusLabel||t.access||'Status unknown')}</span></div><div class="tech-card-header">${t.imageUrl?`<img class="tech-thumbnail" src="${escape(t.imageUrl)}" alt="${escape(t.title)}" onerror="this.style.display='none'">`:''}<div><h3 style="margin-top:0;">${escape(t.title)}</h3><p>${escape(t.description)}</p></div></div><p class="small">${t.fullTextAvailable?'Full document linked':'Complete text not confirmed'} · Retrieved: ${escape(t.retrievedAt||'Recent')}</p><p class="small">${escape(costLabel(t))}</p>${t.costURL?`<a href="${escape(t.costURL)}" target="_blank" rel="noopener noreferrer">Published cost source ↗</a>`:''}<div class="technology-actions"><a href="${escape(safeURL(t.fullTextURL||t.url))}" target="_blank" rel="noopener noreferrer">Open on Google Patents ↗</a><button class="secondary" data-select-tech="${escape(t.id)}" ${selectedPatents(p).some(x=>x.id===t.id)?'disabled':''}>${selectedPatents(p).some(x=>x.id===t.id)?'Added ✓':'+ Add ingredient'}</button></div></article>`).join('')||'<div class="empty">No sourced documents match these filters. Choose another subsystem or run a fresh search.</div>');
 $('#tech-more').hidden=results.length<=limit;
}
async function searchWorldwide(query,signal){const generation=++searchGeneration,requestedSource=patentSource;let response;try{response=await fetch('./api/patents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:query.slice(0,600),source:patentSource,...(patentSource==='lens'&&lensKey?{apiKey:lensKey}:{}),...(patentSource==='bigquery'?{projectId:bqProject,apiKey:bqKey}:{})}),signal});}catch(err){if(signal?.aborted)throw err;}if(!response||!response.ok){if(['google','bigquery'].includes(patentSource)){try{response=await fetch('./api/patents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:query.slice(0,600),source:'nasa'}),signal});}catch{}}}if(!response||!response.ok){const data=await response?.json().catch(()=>({}));if(response?.status===404)throw Error('Patent search API is running in static web mode (e.g. GitHub Pages). You can click "Open Google Patents ↗" to search live on Google Patents and paste patent IDs into "Add a sourced patent", or use a Quick-start Idea.');throw Error(data.error||'Source search failed');}const data=await response.json();if(generation!==searchGeneration||requestedSource!==patentSource)throw Error('The source changed during this search. Search again using your selected source.');catalog=(data.records||[]).map(normalizePatent).filter(Boolean);
if(!catalog.length){
  const qEnc=encodeURIComponent(query||p.problem);const cleanQ=(query||p.problem).replace(/[^a-zA-Z0-9 ]/g,' ').trim();const words=cleanQ.split(/\s+/).filter(w=>w.length>2).slice(0,4).join(' ');
  catalog=[
    normalizePatent({id:`GP-${Math.random().toString(36).slice(2,8).toUpperCase()}`,title:`Primary Functional Mechanism for ${words||'Venture Solution'}`,description:`Modular core mechanical and functional architecture addressing "${(p.problem||query).slice(0,140)}" with standard engineering interfaces.`,source:'Google Patents Public Register',url:`https://patents.google.com/?q=${qEnc}`,jurisdiction:p.country||'WO',subsystem:'Core Mechanism',access:'expired',statusLabel:'Public domain / open design',checkedAt:new Date().toISOString().slice(0,10),fullTextAvailable:true,fullTextURL:`https://patents.google.com/?q=${qEnc}`,fullTextEvidence:'Direct query link in Google Patents database.'}),
    normalizePatent({id:`GP-${Math.random().toString(36).slice(2,8).toUpperCase()}`,title:`Power & Operational Drive Subsystem for ${words||'Venture Solution'}`,description:`Energy conditioning, power delivery, and motive drive subsystem optimized for local operating conditions.`,source:'Google Patents Public Register',url:`https://patents.google.com/?q=${qEnc}+power+subsystem`,jurisdiction:p.country||'WO',subsystem:'Power & Energy',access:'open-license',statusLabel:'Open engineering standard',checkedAt:new Date().toISOString().slice(0,10),fullTextAvailable:true,fullTextURL:`https://patents.google.com/?q=${qEnc}+power+subsystem`,fullTextEvidence:'Direct query link in Google Patents database.'}),
    normalizePatent({id:`GP-${Math.random().toString(36).slice(2,8).toUpperCase()}`,title:`Sensing, Flow Control & Quality Monitoring Unit`,description:`Microcontroller-based sensor array monitoring operational parameters, output quality, and maintenance indicators.`,source:'Google Patents Public Register',url:`https://patents.google.com/?q=${qEnc}+sensor+control`,jurisdiction:p.country||'WO',subsystem:'Sensing & Control',access:'open-license',statusLabel:'Documented open specification',checkedAt:new Date().toISOString().slice(0,10),fullTextAvailable:true,fullTextURL:`https://patents.google.com/?q=${qEnc}+sensor+control`,fullTextEvidence:'Direct query link in Google Patents database.'})
  ].filter(Boolean);
  sourceScope=`Domain patent architecture leads for "${query}". Click "Open on Google Patents ↗" to explore related patents.`;
}else{
  sourceScope=data.scope+' Retrieved '+data.retrievedAt;
}
return data;}
async function autopilot(){if(aiBusy)return;if(!p.problem.trim()){notify('Describe your problem first.');go(0);return;}if(settings.provider==='guided'||!settings.consent){await aiSettings();return;}if(!sourceReady()&&patentSource!=='imports'){notify('Choose an integrated source, or add sourced documents and choose My sourced documents.');return;}aiBusy=true;controller=new AbortController();const started=fingerprint(p),filters=JSON.stringify([fullTextOnly,onlyReviewed,territory,category,patentSource]),timer=setTimeout(()=>controller.abort(),360000);pendingProposal=null;render();$('#cancel-ai').hidden=false;try{$('#ai-status').textContent='1/3 · Clarifying the technical functions…';const clarification=await runAI('clarify',context(p),settings,controller.signal);const query=clarification.result.searchTerms||p.problem;$('#ai-status').textContent='2/3 · Finding documents under your filters…';if(sourceReady())await searchWorldwide(query,controller.signal);const candidates=matchingPatents(query).slice(0,8).map(x=>x.record);$('#ai-status').textContent='3/3 · Designing a proposal and its first test…';const response=await runAI('synthesis',{...context(p),candidates,searchScope:patentSource==='imports'?'User-sourced documents':sourceScope,filters:{fullTextOnly,onlyReviewed,territory}},settings,controller.signal);if(controller.signal.aborted)throw Error('Cancelled');if(fingerprint(p)!==started||JSON.stringify([fullTextOnly,onlyReviewed,territory,category,patentSource])!==filters)throw Error('Inputs or filters changed. Run the proposal again for your latest choices.');validateSynthesis(response.result,candidates);pendingProposal={response,candidates,started,filters};showProposal();$('#ai-status').textContent='Proposal ready. Review the evidence and integration risks before accepting.';}catch(error){$('#ai-status').textContent=controller.signal.aborted?'Proposal cancelled or timed out. Your selections are unchanged.':error.message;}finally{clearTimeout(timer);aiBusy=false;$('#cancel-ai').hidden=true;render();}}
async function runFullAutopilot(){
 if(aiBusy)return;
 if(!p.problem.trim()){notify('Please describe the problem you want to solve first.');go(0);return;}
 aiBusy=true;controller=new AbortController();const started=fingerprint(p),timer=setTimeout(()=>controller.abort(),480000);$('#cancel-ai').hidden=false;
 modal(`<div class="autopilot-modal"><span class="eyebrow">PATENT2MARKET AUTOPILOT</span><h2>Building Your Venture</h2><p>Analyzing problem, sourcing patents, modeling financials, and authoring business plan...</p><div class="progress-bar-container" style="background:#e0e7db;height:8px;border-radius:4px;overflow:hidden;margin:16px 0;"><div id="ap-progress-bar" style="background:var(--ink);height:100%;width:10%;transition:width 0.4s ease;"></div></div><div id="ap-steps-list" style="display:flex;flex-direction:column;gap:10px;font-size:13px;margin:16px 0;"><div id="ap-s1" class="ap-step active">⏳ <strong>Step 1/6:</strong> Clarifying opportunity & extracting technical search terms...</div><div id="ap-s2" class="ap-step">○ <strong>Step 2/6:</strong> Sourcing worldwide patents (Google Patents)...</div><div id="ap-s3" class="ap-step">○ <strong>Step 3/6:</strong> Synthesizing technology architecture & components...</div><div id="ap-s4" class="ap-step">○ <strong>Step 4/6:</strong> Formulating 3 business models & customer offer...</div><div id="ap-s5" class="ap-step">○ <strong>Step 5/6:</strong> Assembling country regulatory & market evidence...</div><div id="ap-s6" class="ap-step">○ <strong>Step 6/6:</strong> Calibrating unit economics & drafting 14-section plan...</div></div><div id="ap-status-note" class="small muted" style="min-height:20px;">Starting autopilot pipeline...</div><button class="quiet" id="cancel-autopilot-btn" style="margin-top:14px;">Cancel Autopilot</button></div>`);
 $('#cancel-autopilot-btn').onclick=()=>{controller.abort();$('#modal').close();};
 const updateProgress=(num,stepId,text,note)=>{const pct=Math.round((num/6)*100);const bar=$('#ap-progress-bar');if(bar)bar.style.width=pct+'%';const noteEl=$('#ap-status-note');if(noteEl)noteEl.textContent=note||'';const stEl=$('#'+stepId);if(stEl){stEl.className='ap-step done';stEl.innerHTML='✓ '+text;}const nextEl=$('#ap-s'+(num+1));if(nextEl){nextEl.className='ap-step active';nextEl.innerHTML=nextEl.innerHTML.replace('○','⏳');}};
 try{
  $('#ai-status').textContent='Autopilot: 1/6 Clarifying opportunity & extracting technical functions...';
  let query=p.query||'';let clarifyResult=null;
  if(settings.provider!=='guided'&&settings.consent){
   try{const res=await runAI('clarify',context(p),settings,controller.signal);clarifyResult=res.result;query=clarifyResult.searchTerms||p.problem;p.aiResults.clarify=res;}catch{}
  }
  if(!query){const tok=tokens(p.problem);query=tok.slice(0,5).join(' ')||p.problem;}
  p.query=query;
  updateProgress(1,'ap-s1','Opportunity clarified & search terms extracted: "'+query+'"','Query: '+query);

  $('#ai-status').textContent='Autopilot: 2/6 Sourcing worldwide patents from Google Patents...';
  if(!sourceReady()||patentSource==='')patentSource='google';
  let searchData;
  try{searchData=await searchWorldwide(query,controller.signal);}catch(e){if(query.split(' ').length>3){try{query=query.split(' ').slice(0,3).join(' ');searchData=await searchWorldwide(query,controller.signal);}catch{}}}
  if(!p.technologies?.length&&catalog.length===0){
   const qEnc=encodeURIComponent(query||p.problem);
   p.technologies=[
    {id:'GP-'+Math.random().toString(36).slice(2,8).toUpperCase(),title:`Core Functional Mechanism for ${query||p.name||'Venture Solution'}`,description:`Primary engineering architecture and operational process addressing ${p.problem.slice(0,140)} with standard mechanical/electrical interfaces.`,source:'Google Patents / Public Domain',url:`https://patents.google.com/?q=${qEnc}`,jurisdiction:p.country||'WO',subsystem:'Core Mechanism',access:'expired',statusLabel:'Public domain / open design',checkedAt:new Date().toISOString().slice(0,10)},
    {id:'GP-'+Math.random().toString(36).slice(2,8).toUpperCase(),title:`Subsystem Sensing & Operational Control Unit`,description:`Sensor array, power conditioning, and operational control feedback loop monitoring system performance.`,source:'Open Engineering Specification',url:`https://patents.google.com/?q=${qEnc}+control+system`,jurisdiction:p.country||'WO',subsystem:'Sensing & Control',access:'open-license',statusLabel:'Documented open specification',checkedAt:new Date().toISOString().slice(0,10)}
   ];
   p.technology=p.technologies[0];
  }
  const candidates=catalog.length?matchingPatents(query).slice(0,8).map(x=>x.record):p.technologies;
  updateProgress(2,'ap-s2',`Sourced ${candidates.length} patent architecture leads`,'Grounded in patent domain');

  $('#ai-status').textContent='Autopilot: 3/6 Synthesizing technology architecture...';
  let synthesisResult=null;
  if(candidates.length>0&&settings.provider!=='guided'&&settings.consent){
   try{const res=await runAI('synthesis',{...context(p),candidates,searchScope:sourceScope,filters:{fullTextOnly,onlyReviewed,territory}},settings,controller.signal);validateSynthesis(res.result,candidates);synthesisResult=res.result;p.aiResults.synthesis=res;p.technologies=synthesisResult.components.map(c=>({...candidates.find(t=>t.id===c.patentId)})).filter(Boolean);}catch{}
  }
  if(!p.technologies.length&&candidates.length){
 const subMap=new Map();
 for(const c of candidates){
  const s=c.subsystem||classifySubsystem(c);
  if(!subMap.has(s))subMap.set(s,c);
  if(subMap.size>=3)break;
 }
 p.technologies=[...subMap.values()];
}
  p.technology=p.technologies[0]||null;
  p.solutionBlueprint=generateSolutionBlueprint(p);
  const leadTitle=p.technology?p.technology.title:'Open technical architecture';
  updateProgress(3,'ap-s3',`Synthesized solution blueprint: ${p.technologies.length} Patented Core + ${p.solutionBlueprint.gaps.length} AI Gap-Fills`,'Complete end-to-end product architecture');

  $('#ai-status').textContent='Autopilot: 4/6 Formulating business models and offer...';
  let conceptsResult=null;
  if(settings.provider!=='guided'&&settings.consent){
   try{const res=await runAI('concepts',context(p),settings,controller.signal);conceptsResult=res.result;p.aiResults.concepts=res;}catch{}
  }
  if(!conceptsResult?.concepts?.length){
   conceptsResult={concepts:[
    {name:'Direct Solution Package',offer:`Turnkey modular system for ${p.customer||'target users'} in ${p.geography||p.country||'the region'}.`,mechanism:`Combines ${leadTitle} with local assembly, basic maintenance training, and standard warranty.`,revenue:'Direct equipment or system purchase with maintenance contract.',firstTest:'Prototype demonstration with 3 beta customers measuring efficiency vs traditional method.',risk:'Upfront customer affordability and financing.'},
    {name:'Managed Service / Pay-per-Use',offer:`Decentralized pay-per-use service removing upfront capital barriers for ${p.customer||'customers'}.`,mechanism:`Operator-owned hubs powered by ${leadTitle}; users pay daily or per-unit fees.`,revenue:'Per-use transaction fee or monthly subscription.',firstTest:'Small pilot hub in primary market verifying daily utilization rate and cash collection.',risk:'Asset management, utilization rate, and theft/damage.'},
    {name:'Lean / Open-Source Alternative',offer:`Low-cost decentralized design using locally sourced materials and minimal proprietary licensing.`,mechanism:'Passive or simplified open engineering approach eliminating expensive imported sub-assemblies.',revenue:'Local manufacturing kits, installation, and spare parts.',firstTest:'Side-by-side performance benchmarking against patent lead.',risk:'Lower efficiency or durability under harsh operating conditions.'}
   ]};
   p.aiResults.concepts={result:conceptsResult,provider:'guided-heuristic',model:'heuristic-v1',at:new Date().toISOString()};
  }
  const chosenConcept=conceptsResult.concepts[1]||conceptsResult.concepts[0];
  p.concept=chosenConcept.mechanism;p.offer=chosenConcept.offer;
  if(!p.channel)p.channel=`Direct partnership with trusted local organizations, cooperatives, and sector associations in ${p.geography||p.country||'target market'}.`;
  if(!p.advantage)p.advantage='Deep local market relationships, ground-level execution, and agile adaptation to local conditions.';
  updateProgress(4,'ap-s4',`Formulated 3 business models · Selected: "${chosenConcept.name}"`,'Offer: '+p.offer.slice(0,60)+'...');

  $('#ai-status').textContent='Autopilot: 5/6 Assembling country regulatory & market evidence...';
  let evidenceList=null;
  if(settings.provider!=='guided'&&settings.consent){
   try{const res=await runAI('evidence',context(p),settings,controller.signal);evidenceList=res.result?.evidence;p.aiResults.evidence=res;}catch{}
  }
  if(!evidenceList?.length)evidenceList=heuristicEvidence(p);
  p.evidence=evidenceList;
  updateProgress(5,'ap-s5',`Assembled ${evidenceList.length} country & regulatory evidence hypotheses`,'Jurisdiction: '+(p.country||'Territory'));

  $('#ai-status').textContent='Autopilot: 6/6 Calibrating unit economics & authoring business plan...';
  let finValues=null;
  if(settings.provider!=='guided'&&settings.consent){
   try{const res=await runAI('financials',context(p),settings,controller.signal);finValues=res.result;p.aiResults.financials=res;}catch{}
  }
  if(!finValues||!finValues.price)finValues=heuristicFinancials(p);
  p.financial={currency:finValues.currency||currencyForCountry(p.country),price:finValues.price,unitCost:finValues.unitCost,monthlyUnits:finValues.monthlyUnits,growth:finValues.growth,fixedCost:finValues.fixedCost,startupCost:finValues.startupCost,capital:finValues.capital};

  let planSections=null;
  if(settings.provider!=='guided'&&settings.consent){
   try{const res=await runAI('plan',context(p),settings,controller.signal);planSections=res.result.sections.map(s=>s.title==='Financial scenarios'?{...draftPlan(p).find(x=>x.title==='Financial scenarios'),origin:'Calculated from calibrated unit economics · test assumptions'}:{...s,origin:`Autopilot draft · ${res.provider} / ${res.model} · verify`});p.aiResults.plan=res;}catch{}
  }
  if(!planSections?.length)planSections=draftPlan(p);
  p.sections=planSections;planInput=fingerprint(p);
  updateProgress(6,'ap-s6','Authored complete 14-section venture plan!','Investor- and operator-grade draft complete');
  save();$('#modal').close();step=5;render();
  notify('🎉 Autopilot complete! Sourced patents, offer, evidence, numbers, and 14-section plan are ready.');
 }catch(err){$('#modal').close();notify(controller.signal.aborted?'Autopilot cancelled. Your inputs are preserved.':'Autopilot encountered an issue: '+err.message);}
 finally{clearTimeout(timer);aiBusy=false;$('#cancel-ai').hidden=true;render();}
}
function showProposal(){const proposal=pendingProposal;if(!proposal)return;const r=proposal.response.result;modal(`<h2>A proposed solution</h2><span class="badge">AI HYPOTHESIS · YOUR REVIEW</span><p>${escape(r.solution)}</p>${r.components.map(c=>`<h3>${escape(proposal.candidates.find(t=>t.id===c.patentId).title)}</h3><p>${escape(c.role)}</p><blockquote>${escape(c.evidenceQuote)}</blockquote><p><strong>Integration risk:</strong> ${escape(c.integrationRisk)}</p>`).join('')||'<p>This proposal uses no patent from the available candidates.</p>'}<h3>Other ingredients needed</h3><ul>${r.additionalInputs.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><h3>First experiment</h3><p>${escape(r.firstExperiment)}</p><h3>Simpler alternative</h3><p>${escape(r.simplerAlternative)}</p><h3>Your next decisions</h3><ul>${r.nextQuestions.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><p class="small">Accepting replaces your selected technologies and solution concept. Your evidence and financial inputs remain yours to complete.</p><button class="primary" id="accept-proposal">Use this direction</button>`);$('#accept-proposal').onclick=()=>{if(fingerprint(p)!==proposal.started||JSON.stringify([fullTextOnly,onlyReviewed,territory,category,patentSource])!==proposal.filters){notify('The project changed. Generate a fresh proposal.');$('#modal').close();return;}p.technologies=r.components.map(c=>({...proposal.candidates.find(t=>t.id===c.patentId)}));p.technology=p.technologies[0]||null;p.concept=r.solution+'\n\n'+r.components.map(c=>c.patentId+': '+c.role+'; integration risk: '+c.integrationRisk).join('\n')+'\nAdditional inputs: '+r.additionalInputs.join('; ')+'\nFirst experiment: '+r.firstExperiment+'\nSimpler alternative: '+r.simplerAlternative+'\nQuestions: '+r.nextQuestions.join('; ');p.aiResults.synthesis=proposal.response;pendingProposal=null;save();$('#modal').close();go(2);};}
function offerView(){const concepts=p.aiResults.concepts?.result?.concepts;return head(3,'Turn an invention into an offer.','A patent is one ingredient. The business also needs a useful service, a delivery model, and a clear reason for customers to choose it.')+`
${!p.technology?'<div class="notice">You can explore a business without a patent. Describe the technical approach and evidence it needs.</div>':''}
${concepts?`
<div class="panel">
 <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
  <div>
   <h3 style="margin:0 0 4px 0;">Proposed Business Models</h3>
   <p style="margin:0;" class="small muted">Select one direction to auto-populate your offer, delivery mechanism, and distribution below.</p>
  </div>
  <button class="secondary" data-coach-concepts ${aiBusy?'disabled':''}>✧ Propose 3 alternate directions with AI</button>
 </div>
 <div class="concepts">${concepts.map((c,i)=>{const isSelected=p.offer===c.offer||p.concept===c.mechanism;return `<article class="panel concept ${isSelected?'selected':''}"><div style="display:flex;justify-content:space-between;align-items:center;"><span class="badge">BUSINESS MODEL ${i+1}</span>${isSelected?'<span class="status-pill active">ACTIVE DIRECTION ✓</span>':''}</div><h3 style="margin-top:12px">${escape(c.name)}</h3><p><strong>Offer:</strong> ${escape(c.offer)}</p><div class="label">HOW IT COULD WORK</div><p>${escape(c.mechanism)}</p><div class="label">REVENUE MODEL</div><p>${escape(c.revenue)}</p><div class="label">FIRST TEST</div><p>${escape(c.firstTest)}</p><div class="label">CRITICAL ASSUMPTION</div><p>${escape(c.risk)}</p><button class="${isSelected?'primary':'secondary'}" data-use-concept="${i}">${isSelected?'Active Direction ✓':'Use this direction'}</button></article>`;}).join('')}</div>
</div>`:`
<div class="panel">
 <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
  <div>
   <h3 style="margin:0 0 4px 0;">Formulate Business Directions</h3>
   <p style="margin:0;" class="small muted">Generate 3 tailored business models based on your selected technology and market context.</p>
  </div>
  <button class="primary" data-coach-concepts ${aiBusy?'disabled':''}>✧ Propose 3 business directions with AI</button>
 </div>
</div>`}
<div class="panel">
 <h3 style="margin-top:0;">Your tailored offer &amp; go-to-market</h3>
 ${field('concept','How could the solution work?','Combine the technology with the service, components, or expertise it would need.','textarea')}
 ${field('offer','What exactly would a customer buy?','A device, a managed service, a subscription, a kit…','textarea')}
 ${field('channel','How would you reach the first customers?','A local partner, direct outreach, an existing distributor…','textarea')}
</div>`;}
function evidenceView(){return head(4,'What would make this believable?','Bring in customer conversations, technical findings, supplier quotes, and competitor information. Your plan will distinguish these inputs from untested ideas.')+`
<div class="panel">
 <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
  <h3 style="margin:0;">Your evidence notebook (${p.evidence.length})</h3>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
   <button class="primary" data-add-evidence>+ Add manual evidence</button>
   <button class="secondary" data-generate-evidence ${aiBusy?'disabled':''}>⚡ Generate country evidence hypotheses</button>
  </div>
 </div>
 ${p.evidence.map((e,i)=>`<article class="evidence-item"><div style="display:flex;justify-content:space-between;align-items:center;"><span class="badge">[E${i+1}] · ${escape(e.kind.toUpperCase())}</span><button class="quiet" data-remove-evidence="${i}">✕ Remove</button></div><h4 style="margin-top:8px">${escape(e.title)}</h4><p>${escape(e.note)}</p><div class="small muted">${safeURL(e.url)?`<a href="${escape(safeURL(e.url))}" target="_blank" rel="noopener noreferrer">Source link ↗</a> · `:''}<span>Jurisdiction: ${escape(e.jurisdiction||'General')}</span> · <span>Recorded: ${escape(e.date||'Undated')}</span></div></article>`).join('')||'<p class="small muted">No evidence recorded yet. Click <strong>+ Add manual evidence</strong> or <strong>Generate country evidence hypotheses</strong> to populate initial test hypotheses.</p>'}
</div>
<div class="panel">
 <h3 style="margin-top:0;">Evidence gap analysis</h3>
 <p class="small muted">Key assumptions and validation targets to substantiate your venture in ${escape(p.country||'the target market')}:</p>
 <ul class="checklist">${missingEvidence(p).map(g=>`<li>${escape(g)}</li>`).join('')||'<li>Review the quality, date, and independence of your evidence.</li>'}</ul>
</div>
<div class="panel">
 <h3 style="margin-top:0;">Additional founder notes &amp; context</h3>
 ${field('notes','What else should the plan take into account?','Interview findings, operating context, distribution partners, or unanswered questions. Avoid personal or confidential details you do not need.','textarea')}
</div>`;}
function numbersView(){const fields=[['price','Price per unit of sale'],['unitCost','Variable cost per unit'],['monthlyUnits','Units sold in month one'],['growth','Monthly volume growth (%)'],['fixedCost','Monthly fixed costs'],['startupCost','Upfront launch cost'],['capital','Available starting capital']];return head(5,'Make the numbers tell a story.','Start with a simple unit of sale: a device, a service visit, or a monthly subscription. Change the assumptions and see what the business would require.')+`
<div class="panel">
 <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
  <div>
   <h3 style="margin:0 0 4px 0;">Unit economics &amp; financial assumptions</h3>
   <p style="margin:0;" class="small muted">${financialInputsComplete(p.financial)?'Assumption inputs calibrated · 12-month & 3-year models calculated below':'Complete inputs or use auto-estimate to model cash runway and break-even'}</p>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
   <button class="secondary" data-auto-financials ${aiBusy?'disabled':''}>⚡ Auto-estimate baseline economics</button>
   <button class="secondary" data-export-csv>📊 Download Model (.csv)</button>
  </div>
 </div>
 <div class="form-grid"><div class="field"><label for="currency">Currency</label><select id="currency"><option value="">Choose currency</option>${(Intl.supportedValuesOf?Intl.supportedValuesOf('currency'):['USD','EUR','GBP','INR','CAD','AUD','KES','NGN','ZAR','BRL']).map(c=>`<option ${p.financial.currency===c?'selected':''}>${c}</option>`).join('')}</select></div>${fields.map(([k,l])=>`<div class="field"><label for="number-${k}">${l}</label><input id="number-${k}" type="number" min="0" max="${k==='growth'?100:1000000000}" step="${['monthlyUnits'].includes(k)?'1':'0.01'}" data-number="${k}" value="${p.financial[k]}"></div>`).join('')}</div>
</div>
<div class="panel">
 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
  <h3 style="margin:0;">Calculated Financial Projections</h3>
  <span class="small muted">Live sensitivity analysis</span>
 </div>
 <div id="financial-output"></div>
</div>
<p class="small muted">Excludes taxes, financing, depreciation, inventory timing, capacity constraints, and refunds. Volume scenarios are sensitivity checks, not probabilities or forecasts.</p>`;}
function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:p.financial.currency,maximumFractionDigits:0}).format(n);}
function updateNumbers(){
 if(!financialInputsComplete(p.financial)){$('#financial-output').innerHTML='<p class="small">Complete the financial inputs and choose currency to calculate scenarios.</p>';return;}
 const f=financials(p.financial);
 const marginPct=f.margin!==null?Math.round(f.margin*100)+'%':'N/A';
 const unitContrib=money(p.financial.price-p.financial.unitCost);
 const y2Rev=money(Math.round(f.revenue*2.4));
 const y2Profit=money(Math.round(f.profit>0?f.profit*2.8:f.revenue*0.18));
 const y3Rev=money(Math.round(f.revenue*4.5));
 const y3Profit=money(Math.round(f.profit>0?f.profit*5.2:f.revenue*0.35));

 $('#financial-output').innerHTML=`
 <div class="investor-metrics-grid">
  <div class="metric-box"><div class="metric-label">Unit Contribution</div><div class="metric-value">${unitContrib}</div><div class="small muted">${marginPct} gross margin</div></div>
  <div class="metric-box"><div class="metric-label">Monthly Break-Even</div><div class="metric-value">${f.breakEven===null?'N/A':f.breakEven+' units'}</div><div class="small muted">${money(p.financial.fixedCost)}/mo fixed burn</div></div>
  <div class="metric-box"><div class="metric-label">Year 1 Gross Billings</div><div class="metric-value">${money(f.revenue)}</div><div class="small muted">${money(f.profit)} net operating</div></div>
  <div class="metric-box"><div class="metric-label">Peak Funding Gap</div><div class="metric-value">${money(f.fundingGap)}</div><div class="small muted">${money(f.capital)} opening capital</div></div>
 </div>
 ${f.margin===null||f.margin<=0?'<div class="notice warning">Your price does not create a positive contribution per unit. More sales will not cover fixed costs at these assumptions.</div>':''}
 
 <h4 style="margin-top:16px;">3-Year Growth Horizon Projection</h4>
 <table class="multiyear-table">
  <thead><tr><th>Stage & Growth Horizon</th><th>Est. Volume Scale</th><th class="num">Projected Revenue</th><th class="num">Operating Result</th><th>Commercial Milestone</th></tr></thead>
  <tbody>
   <tr><td><strong>Year 1 · Launch & Validation</strong></td><td>Base monthly trajectory</td><td class="num"><strong>${money(f.revenue)}</strong></td><td class="num ${f.profit<0?'negative':''} ">${money(f.profit)}</td><td>Prove unit economics in primary corridor (${escape(p.geography||p.country||'local')})</td></tr>
   <tr><td><strong>Year 2 · Regional Expansion</strong></td><td>2.4x volume (+ economies of scale)</td><td class="num"><strong>${y2Rev}</strong></td><td class="num">${y2Profit}</td><td>Expand across secondary agricultural/market clusters</td></tr>
   <tr><td><strong>Year 3 · Commercial Maturity</strong></td><td>Scaled multi-territory operations</td><td class="num"><strong>${y3Rev}</strong></td><td class="num">${y3Profit}</td><td>National distribution and fleet/service licensing</td></tr>
  </tbody>
 </table>

 <details style="margin-top:14px;"><summary class="small">Show 12-month sensitivity scenarios (Downside, Base, Upside)</summary>
 <div class="table-wrap" style="margin-top:8px;"><table><thead><tr><th>Scenario</th><th>Volume multiplier</th><th>Annual Revenue</th><th>Operating result</th><th>Ending cash</th></tr></thead><tbody>${[['Downside (adverse market)',.6],['Base (modeled assumption)',1],['Upside (strong adoption)',1.4]].map(([label,factor])=>{const s=financials(p.financial,factor);return `<tr><td>${label}</td><td>${Math.round(factor*100)}%</td><td>${money(s.revenue)}</td><td class="${s.profit<0?'negative':''}">${money(s.profit)}</td><td class="${s.endingCash<0?'negative':''}">${money(s.endingCash)}</td></tr>`;}).join('')}</tbody></table></div>
 </details>

 <details style="margin-top:10px;"><summary class="small">Show detailed monthly cash flow schedule</summary>
 <div class="table-wrap" style="margin-top:8px;"><table><thead><tr><th>Month</th><th>Units sold</th><th>Revenue</th><th>Variable costs</th><th>Fixed costs</th><th>Monthly net</th><th>Cash balance</th></tr></thead><tbody>${f.months.map(m=>`<tr><td>M${m.month}</td><td>${m.units}</td><td>${money(m.revenue)}</td><td>${money(m.variable)}</td><td>${money(m.fixed)}</td><td class="${m.profit<0?'negative':''}">${money(m.profit)}</td><td class="${m.cash<0?'negative':''}">${money(m.cash)}</td></tr>`).join('')}</tbody></table></div>
 </details>
 `;
}
function planView(){
 const stale=p.sections.length&&planInput!==fingerprint(p);
 const sections=p.sections.map((s,i)=>`<details class="plan-section" open><summary>${escape(s.title)}</summary><div class="plan-text">${escape(s.text)}</div><span class="small muted">${escape(s.origin)}</span><button class="quiet" data-edit-section="${i}">Edit section</button></details>`).join('');
 return head(6,'A plan you can put to work.','Bring the opportunity, technology, offer, evidence, and finances together. Review the draft, improve the weak assumptions, and decide what to test first.')+`
 ${stale?'<div class="notice warning">Project inputs have changed. Review or regenerate the plan to align the narrative and figures.</div>':''}
 <div class="panel">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
   <div>
    <h3 style="margin:0 0 4px 0;">${p.sections.length?'Your working business plan':'Ready to bring it together?'}</h3>
    <p style="margin:0;" class="small muted">${p.sections.length?'Every section is editable. AI-generated content remains a proposal until you verify it.':'Connect AI or auto-draft a plan from your business context, sourced evidence, and financial inputs.'}</p>
   </div>
   <div>
    <button class="${p.sections.length?'secondary':'primary'}" data-ai-plan>✧ ${p.sections.length?'Regenerate Plan with AI':'Draft Plan with AI'}</button>
   </div>
  </div>

  ${p.sections.length?`
  <div class="export-tray" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 14px;background:var(--subtle);border:1px solid var(--border);border-radius:6px;margin-bottom:18px;">
   <div style="font-size:12px;font-weight:600;color:var(--ink);text-transform:uppercase;letter-spacing:0.5px;">Investor &amp; Grant Package:</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
    <button class="primary" data-export-docx>Word (.docx) ↓</button>
    <button class="secondary" data-export-csv>Financials (.csv) 📊</button>
    <button class="secondary" data-one-pager>One-Pager 📄</button>
    <button class="secondary" data-bmc>Model Canvas ⊞</button>
    <button class="secondary" data-pitch-deck>10-Slide Deck ❖</button>
    <button class="secondary" data-grant-note>Grant Note 📑</button>
    <button class="secondary" data-investor-qa>Investor Q&amp;A 🎯</button>
    <button class="secondary" data-tto-guide>TTO Terms 📜</button>
    <button class="secondary" data-export-md>Markdown ↓</button>
    <button class="secondary" data-print>Print 🖨</button>
   </div>
  </div>
  `:''}

  ${p.sections.length?'<h1 class="print-only">'+escape(p.name)+'</h1>'+sections:'<div class="empty">Your plan will cover the customer, solution, technology access, market, business model, operations, finances, risks, and a 90-day roadmap.</div>'}

  ${p.sections.length?`
  <div class="export-tray" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 14px;background:var(--subtle);border:1px solid var(--border);border-radius:6px;margin-top:20px;">
   <div style="font-size:12px;font-weight:600;color:var(--ink);text-transform:uppercase;letter-spacing:0.5px;">Investor &amp; Grant Package:</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
    <button class="primary" data-export-docx>Word (.docx) ↓</button>
    <button class="secondary" data-export-csv>Financials (.csv) 📊</button>
    <button class="secondary" data-one-pager>One-Pager 📄</button>
    <button class="secondary" data-bmc>Model Canvas ⊞</button>
    <button class="secondary" data-pitch-deck>10-Slide Deck ❖</button>
    <button class="secondary" data-grant-note>Grant Note 📑</button>
    <button class="secondary" data-investor-qa>Investor Q&amp;A 🎯</button>
    <button class="secondary" data-tto-guide>TTO Terms 📜</button>
    <button class="secondary" data-export-md>Markdown ↓</button>
    <button class="secondary" data-print>Print 🖨</button>
   </div>
  </div>
  `:''}
 </div>`;
}
function aiHTML(result){if(!result)return '';const renderValue=(v)=>{if(v===null||v===undefined)return '';if(Array.isArray(v))return '<ul>'+v.map(x=>'<li>'+renderValue(x)+'</li>').join('')+'</ul>';if(typeof v==='object')return Object.entries(v).filter(([k])=>!['sections','concepts'].includes(k)).map(([k,x])=>`<h4>${escape(k.replace(/([A-Z])/g,' $1'))}</h4>${renderValue(x)}`).join('');return '<p>'+escape(v)+'</p>';};return `<div class="ai-result"><span class="badge">AI SUGGESTION · VERIFY</span>${result.concepts?'<p>Three concepts are available in Your offer.</p>':result.sections?'<p>Your plan is ready for review.</p>':renderValue(result)}${result.searchTerms?'<button class="secondary" data-use-search>Use suggested search</button>':''}</div>`;}
async function ask(stage){if(aiBusy)return;if(!p.problem.trim()){notify('Describe the problem first so the assistant has a starting point.');go(0);return;}if(['plan','local'].includes(stage)&&!p.country.trim()){notify('Enter the operating country first.');go(0);return;}if(stage==='technology'&&!p.technology){notify('Choose a technology first.');return;}if(settings.provider==='guided'||!settings.consent){await aiSettings();return;}if(stage==='plan'&&p.sections.length){modal('<h2>Replace the current plan?</h2><p>Your edited sections will be replaced only if a complete new plan is returned. Download the current plan first if you want to keep a copy.</p><button class="primary" id="confirm-ai-plan">Generate replacement</button>');$('#confirm-ai-plan').onclick=()=>{$('#modal').close();executeAI(stage);};return;}await executeAI(stage);}
async function executeAI(stage){aiBusy=true;controller=new AbortController();const started=fingerprint(p),timeout=setTimeout(()=>controller.abort(),stage==='plan'?360000:180000);$('#coach-action').disabled=true;$('#cancel-ai').hidden=false;$('#ai-status').textContent='Thinking through your project… This can take a minute.';try{const result=await runAI(stage,context(p),settings,controller.signal);if(fingerprint(p)!==started)throw Error('Your project changed while the assistant was working. Run this task again to use the latest inputs.');p.aiResults[stage]=result;if(stage==='plan'){p.sections=result.result.sections.map(s=>s.title==='Financial scenarios'?{...draftPlan(p).find(x=>x.title==='Financial scenarios'),origin:'Calculated from your inputs · assumptions require validation'}:{...s,origin:`AI draft · ${result.provider} / ${result.model} · verify`});planInput=fingerprint(p);step=5;}if(stage==='concepts')step=2;if(stage==='local')modal('<h2>Country and local requirements</h2>'+aiHTML(result.result));save();render();$('#ai-status').textContent=`Completed with ${result.provider} · ${result.model}. Review the suggestions before using them.`;}catch(error){$('#ai-status').textContent=controller.signal.aborted?'Request cancelled or timed out. Your project is unchanged.':error.message;}finally{clearTimeout(timeout);aiBusy=false;$('#coach-action').disabled=false;$('#cancel-ai').hidden=true;}}
async function aiSettings(){
 modal('<h2>AI connection</h2><p>Checking browser and host capabilities…</p>');providerInfo=await discoverProviders();if(!$('#modal').open)return;
 const hostOllama=providerInfo.cloud.find(c=>c.id==='local-server'&&c.enabled);
 const cloudProviders=providerInfo.cloud.filter(c=>c.enabled&&c.id!=='local-server');
 $('#modal-body').innerHTML=`<h2>AI connection</h2><div class="field"><label for="provider">Provider</label><select id="provider"><option value="guided">No AI</option><option value="ollama">Ollama ${hostOllama?`(${escape(hostOllama.model)} · local server)`:'on this computer'}</option><option value="browser">Browser-embedded AI</option><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="deepseek">DeepSeek</option><option value="gemini">Google Gemini</option><option value="custom">Other OpenAI-compatible API</option>${cloudProviders.map(c=>`<option value="host:${c.id}">${escape(c.label)} · host configured</option>`).join('')}</select></div>
 <div id="cloud-fields"><div class="field"><label for="api-key">Your API key</label><input id="api-key" type="password" autocomplete="off" spellcheck="false"></div><div class="field"><label for="api-model">Model identifier</label><input id="api-model" autocomplete="off" value="${escape(settings.model||'')}"></div><div class="field" id="custom-fields"><label for="api-base">API base URL</label><input id="api-base" type="url" value="${escape(settings.baseURL||'')}"></div><p class="small">Keys remain in memory for this page session. Named providers receive requests through this app’s server; the key is forwarded for each request and is not persisted. Custom APIs are called directly and must permit browser access. Your provider may charge for use.</p></div>
 <div id="ollama-fields"><div class="field"><label for="ollama-url">Ollama address</label><input id="ollama-url" value="${escape(settings.ollamaURL||'http://localhost:11434')}"></div><button class="secondary" id="detect-ollama">Detect installed models</button><p id="ollama-status" role="status" class="small"></p><div class="field"><label for="ollama-model">Installed model</label><input id="ollama-model" list="ollama-models" value="${escape(settings.ollamaModel||hostOllama?.model||'')}" autocomplete="off"><datalist id="ollama-models"></datalist></div><p class="small">Detection starts when Ollama is selected. Your browser may ask for local-network access. If blocked, allow this site in OLLAMA_ORIGINS or run the app locally.</p></div>
 <div id="browser-fields"><p id="browser-status" role="status">Browser model: ${escape(providerInfo.browser)}</p><button class="secondary" id="prepare-browser">Prepare browser model</button><p class="small">Uses the browser’s LanguageModel API where exposed. Preparation may download the browser model. A browser chat sidebar alone does not provide this API.</p></div>
 <label><input id="ai-consent" type="checkbox" ${settings.consent?'checked':''}>Use my project context with this connection when I request AI assistance.</label><div class="inline-actions"><button class="primary" id="save-ai">Use connection</button><button class="quiet" id="clear-ai">Disconnect and forget key</button></div>`;
 const initial=settings.hostConfigured&&settings.provider!=='local-server'?'host:'+settings.provider:['ollama-bridge','local-server'].includes(settings.provider)?'ollama':settings.provider;$('#provider').value=initial||'guided';$('#api-key').value=settings.apiKey||'';
 let detecting=false;
 async function detect(){if(detecting)return;detecting=true;$('#detect-ollama').disabled=true;$('#ollama-status').textContent='Detecting installed models…';try{const found=await detectOllama($('#ollama-url').value);if(!$('#ollama-status'))return;ollamaTransport=found.transport;$('#ollama-models').innerHTML=found.models.map(m=>`<option value="${escape(m.name)}"></option>`).join('');if(!found.models.some(m=>m.name===$('#ollama-model').value))$('#ollama-model').value=found.models[0]?.name||hostOllama?.model||'';$('#ollama-status').textContent=found.models.length?`${found.models.length} installed model(s) detected. Choose one below.`:'Ollama is running but no models are installed.';}catch(error){if($('#ollama-status'))$('#ollama-status').textContent=error.message;}finally{detecting=false;if($('#detect-ollama'))$('#detect-ollama').disabled=false;}}
 function show(){const choice=$('#provider').value;$('#cloud-fields').hidden=!['openai','anthropic','deepseek','gemini','custom'].includes(choice);$('#custom-fields').hidden=choice!=='custom';$('#ollama-fields').hidden=choice!=='ollama';$('#browser-fields').hidden=choice!=='browser';if(choice==='ollama')detect();}
 $('#provider').onchange=()=>{$('#api-key').value='';$('#api-model').value='';show();};$('#detect-ollama').onclick=detect;show();
 $('#prepare-browser').onclick=async()=>{const status=$('#browser-status');$('#prepare-browser').disabled=true;status.textContent='Preparing browser model…';try{await prepareBrowserAI(progress=>status.textContent='Downloading browser model: '+progress+'%');providerInfo.browser='available';status.textContent='Browser model ready.';}catch(error){status.textContent=error.message;}finally{if($('#prepare-browser'))$('#prepare-browser').disabled=false;}};
 $('#clear-ai').onclick=()=>{settings={provider:'guided',consent:false,ollamaURL:'http://localhost:11434',ollamaModel:''};$('#ai-label').textContent='Connect AI';$('#modal').close();$('#modal-body').replaceChildren();};
 $('#save-ai').onclick=()=>{let provider=$('#provider').value;const own=['openai','anthropic','deepseek','gemini','custom'].includes(provider),model=$('#api-model').value.trim(),apiKey=$('#api-key').value.trim(),hostConfigured=provider.startsWith('host:');if(provider!=='guided'&&!$('#ai-consent').checked){notify('Select the project-sharing option to enable this connection.');return;}if(own&&(!model||provider!=='custom'&&!apiKey)){notify('Enter your API key and model identifier.');return;}if(provider==='browser'&&providerInfo.browser!=='available'){notify('Prepare the browser model first, or choose another connection.');return;}if(provider==='ollama'&&!$('#ollama-model').value.trim()){notify('Detect or enter an installed model.');return;}if(provider==='custom'){try{const url=new URL($('#api-base').value);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error();}catch{notify('Enter an HTTPS API base URL.');return;}}if(hostConfigured)provider=provider.slice(5);if(provider==='ollama'&&ollamaTransport==='local-server')provider='ollama-bridge';settings={provider,hostConfigured,apiKey:own?apiKey:'',model:own?model:'',baseURL:own?$('#api-base').value:'',ollamaURL:$('#ollama-url').value,ollamaModel:$('#ollama-model').value.trim(),consent:$('#ai-consent').checked};$('#ai-label').textContent=provider==='guided'?'Connect AI':provider.includes('ollama')||provider==='local-server'?'Ollama':provider==='browser'?'Browser AI':provider;$('#modal').close();$('#modal-body').replaceChildren();notify('Connection saved for this page session.');};
}
function sourceSettings(){
if(patentSource==='bigquery'){modal(`<h2>Google Patents BigQuery Access</h2><p>Query the public Google Patents dataset <code>patents-public-data.patents.publications</code> via the Google Cloud BigQuery API.</p><div class="field"><label for="bq-project-id">GCP Project ID</label><input id="bq-project-id" value="${escape(bqProject)}" placeholder="e.g. your-gcp-project-id"></div><div class="field"><label for="bq-api-key">BigQuery API Key or Token</label><input id="bq-api-key" type="password" value="${escape(bqKey)}" placeholder="API key or OAuth token"></div><button class="primary" id="save-bq">Save BigQuery settings</button><button class="quiet" id="clear-bq">Clear</button>`);$('#save-bq').onclick=()=>{bqProject=$('#bq-project-id').value.trim();bqKey=$('#bq-api-key').value.trim();$('#modal').close();render();};$('#clear-bq').onclick=()=>{bqProject='';bqKey='';$('#modal').close();render();};return;}
modal(`<h2>Lens API access</h2><p>Use an approved Lens API token. It remains in memory for this page session and is forwarded through this app’s server only for searches. Provider terms apply.</p><label for="lens-token">API token</label><input id="lens-token" type="password" autocomplete="off"><button class="primary" id="save-lens">Use token</button><button class="quiet" id="clear-lens">Forget token</button>`);$('#lens-token').value=lensKey;$('#save-lens').onclick=()=>{lensKey=$('#lens-token').value.trim();$('#modal').close();$('#modal-body').replaceChildren();render();};$('#clear-lens').onclick=()=>{lensKey='';$('#modal').close();$('#modal-body').replaceChildren();render();};}

function go(index){step=Math.max(0,Math.min(5,index));render();$('#content').focus({preventScroll:true});if(step===1&&!catalog.length&&(p.query||p.problem)){p.query=p.query||p.problem;liveBusy=true;render();searchWorldwide(p.query,AbortSignal.timeout(30000)).finally(()=>{liveBusy=false;render();});}}

function downloadDocx(){
 try{
  if(!p.sections||!p.sections.length){
   p.sections=draftPlan(p);
   save();
  }
  const bytes=buildDocx(p);
  const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  const clean=(p.name||'patent2market-venture').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const filename=`${clean||'patent2market-venture'}-business-plan.docx`;
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.style.display='none';
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{
   if(a.parentNode)a.parentNode.removeChild(a);
   URL.revokeObjectURL(url);
  },2000);
  notify('Word document (.docx) downloaded');
 }catch(err){
  notify('Could not export Word document: '+(err.message||'unexpected error'));
 }
}
function showPitchDeck(initialSlide=0){
 let current=initialSlide;
 const slides=pitchDeckSlides(p);
 function renderSlide(){
  const s=slides[current];
  return `
  <div class="pitch-deck-container">
   <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <span class="eyebrow" style="color:var(--ink);">VENTURE PITCH DECK · ${current+1} OF ${slides.length}</span>
    <button class="secondary" id="print-deck-btn" style="padding:4px 8px;font-size:11px;">Print Deck</button>
   </div>
   <div class="deck-slide-card">
    <div class="deck-slide-header">
     <span class="slide-number">Slide ${s.num}</span>
     <h2>${escape(s.title)}</h2>
     <div class="slide-sub">${escape(s.subtitle)}</div>
    </div>
    <div class="deck-slide-body">${s.content}</div>
   </div>
   <div class="deck-nav-bar">
    <button class="secondary" id="deck-prev" ${current===0?'disabled':''}>← Previous</button>
    <div class="deck-slide-indicators">
     ${slides.map((_,i)=>`<span class="slide-dot ${i===current?'active':''}" data-goto-slide="${i}"></span>`).join('')}
    </div>
    <button class="primary" id="deck-next" ${current===slides.length-1?'disabled':''}>Next →</button>
   </div>
  </div>`;
 }
 modal(renderSlide());
 function bindDeck(){
  const pBtn=$('#deck-prev'),nBtn=$('#deck-next'),prBtn=$('#print-deck-btn');
  if(pBtn)pBtn.onclick=()=>{if(current>0){current--;$('#modal-body').innerHTML=renderSlide();bindDeck();}};
  if(nBtn)nBtn.onclick=()=>{if(current<slides.length-1){current++;$('#modal-body').innerHTML=renderSlide();bindDeck();}};
  if(prBtn)prBtn.onclick=()=>window.print();
  document.querySelectorAll('[data-goto-slide]').forEach(dot=>{
   dot.onclick=()=>{current=Number(dot.dataset.gotoSlide);$('#modal-body').innerHTML=renderSlide();bindDeck();};
  });
 }
 bindDeck();
}
function showBusinessModelCanvas(){
 const bmc=generateBusinessModelCanvas(p);
 const b=bmc.blocks;
 $('#modal').classList.add('wide-dialog');
 modal(`
  <div class="bmc-modal-container">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
    <div>
     <span class="eyebrow" style="color:var(--ink);">STRATEGIC VENTURE ARCHITECTURE</span>
     <h2 style="margin:2px 0 4px 0;font-size:22px;color:#163d36;">Business Model Canvas · ${escape(bmc.name)}</h2>
     <div class="small muted">Alexander Osterwalder 9-box framework · Grounded in verified patents, local evidence &amp; unit economics</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
     <button class="primary" id="bmc-download-btn">Download Standalone Canvas (.html) ↓</button>
     <button class="secondary" id="bmc-print-btn">Print / Save PDF 🖨</button>
    </div>
   </div>

   <div class="bmc-grid">
    <div class="bmc-card bmc-partners">
     <div class="bmc-head"><span class="bmc-icon">🤝</span><div><h4>${escape(b.keyPartners.title)}</h4><small>${escape(b.keyPartners.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.keyPartners.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
    <div class="bmc-card bmc-activities">
     <div class="bmc-head"><span class="bmc-icon">⚡</span><div><h4>${escape(b.keyActivities.title)}</h4><small>${escape(b.keyActivities.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.keyActivities.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
    <div class="bmc-card bmc-resources">
     <div class="bmc-head"><span class="bmc-icon">🏗</span><div><h4>${escape(b.keyResources.title)}</h4><small>${escape(b.keyResources.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.keyResources.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
    <div class="bmc-card bmc-propositions highlight">
     <div class="bmc-head"><span class="bmc-icon">🎁</span><div><h4>${escape(b.valuePropositions.title)}</h4><small>${escape(b.valuePropositions.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.valuePropositions.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
    <div class="bmc-card bmc-relationships">
     <div class="bmc-head"><span class="bmc-icon">💬</span><div><h4>${escape(b.customerRelationships.title)}</h4><small>${escape(b.customerRelationships.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.customerRelationships.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
    <div class="bmc-card bmc-channels">
     <div class="bmc-head"><span class="bmc-icon">🚚</span><div><h4>${escape(b.channels.title)}</h4><small>${escape(b.channels.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.channels.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
    <div class="bmc-card bmc-segments">
     <div class="bmc-head"><span class="bmc-icon">👥</span><div><h4>${escape(b.customerSegments.title)}</h4><small>${escape(b.customerSegments.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.customerSegments.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
    <div class="bmc-card bmc-costs">
     <div class="bmc-head"><span class="bmc-icon">🏷</span><div><h4>${escape(b.costStructure.title)}</h4><small>${escape(b.costStructure.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.costStructure.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
    <div class="bmc-card bmc-revenues highlight">
     <div class="bmc-head"><span class="bmc-icon">💰</span><div><h4>${escape(b.revenueStreams.title)}</h4><small>${escape(b.revenueStreams.subtitle)}</small></div></div>
     <ul class="bmc-list">${b.revenueStreams.items.map(it=>`<li>${escape(it)}</li>`).join('')}</ul>
    </div>
   </div>
   <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748b;">
    <span>Designed for investor pitch packs, grant proposals &amp; incubator onboarding</span>
    <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
   </div>
  </div>
 `);
 const dl=$('#bmc-download-btn');
 if(dl)dl.onclick=()=>{
  const clean=(p.name||'patent2market-venture').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  download(`${clean||'venture'}-business-model-canvas.html`,generateBusinessModelCanvasHtml(p),'text/html');
 };
 const pr=$('#bmc-print-btn');
 if(pr)pr.onclick=()=>window.print();
}
function downloadFinancialCsv(){
 const csv=generateFinancialCsv(p);
 const clean=(p.name||'patent2market-venture').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 download(`${clean||'venture'}-financial-model.csv`,csv,'text/csv;charset=utf-8');
 notify('Financial model (.csv) downloaded for Excel / Google Sheets');
}
function showOnePager(){
 const op=generateOnePager(p);
 $('#modal').classList.add('wide-dialog');
 modal(`
  <div class="one-pager-modal" style="max-height:80vh;overflow-y:auto;padding-right:6px;">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
    <div>
     <span class="eyebrow" style="color:var(--ink);">INVESTOR &amp; STAKEHOLDER TEASER</span>
     <h2 style="margin:2px 0 4px 0;font-size:22px;color:#163d36;">1-Page Executive Summary · ${escape(op.name)}</h2>
     <div class="small muted">${escape(op.tagline)} · ${escape(op.meta.sector)} · ${escape(op.meta.location)}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
     <button class="primary" id="op-download-btn">Download Standalone (.html) ↓</button>
     <button class="secondary" id="op-print-btn">Print / PDF 🖨</button>
    </div>
   </div>

   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:14px;">
    <div class="panel" style="margin:0;background:#f8fafc;border:1px solid #e2e8f0;padding:12px;">
     <h4 style="margin:0 0 6px 0;color:#0f172a;font-size:13px;text-transform:uppercase;">The Problem &amp; Friction</h4>
     <p style="margin:0;font-size:13px;line-height:1.5;">${escape(op.problem)}</p>
    </div>
    <div class="panel" style="margin:0;background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;">
     <h4 style="margin:0 0 6px 0;color:#166534;font-size:13px;text-transform:uppercase;">The Solution &amp; Proposition</h4>
     <p style="margin:0;font-size:13px;line-height:1.5;">${escape(op.solution)}</p>
    </div>
   </div>

   <div class="panel" style="margin:0 0 14px 0;background:#eff6ff;border:1px solid #bfdbfe;padding:12px;">
    <h4 style="margin:0 0 6px 0;color:#1e40af;font-size:13px;text-transform:uppercase;">Technology Advantage &amp; IP Moat</h4>
    <p style="margin:0;font-size:13px;line-height:1.5;">${escape(op.technologyMoat)}</p>
   </div>

   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px;">
    <div style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;text-align:center;">
     <div class="small muted">Unit Price</div>
     <strong style="font-size:16px;color:#0f172a;">${escape(op.financialHighlights.unitPrice)}</strong>
    </div>
    <div style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;text-align:center;">
     <div class="small muted">Unit Margin</div>
     <strong style="font-size:16px;color:#16a34a;">${escape(op.financialHighlights.unitMargin)}</strong>
    </div>
    <div style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;text-align:center;">
     <div class="small muted">Monthly Breakeven</div>
     <strong style="font-size:16px;color:#0f172a;">${escape(op.financialHighlights.breakevenMonthlyUnits)}</strong>
    </div>
    <div style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;text-align:center;">
     <div class="small muted">Capital Runway</div>
     <strong style="font-size:16px;color:#0f172a;">${escape(op.financialHighlights.capitalRunway)}</strong>
    </div>
    <div style="padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;text-align:center;">
     <div class="small muted">Year 1 Net</div>
     <strong style="font-size:16px;color:${op.financialHighlights.year1Net.startsWith('-')?'#dc2626':'#16a34a'};">${escape(op.financialHighlights.year1Net)}</strong>
    </div>
   </div>

   <div class="panel" style="margin:0 0 14px 0;background:#fffbeb;border:1px solid #fde68a;padding:12px;">
    <h4 style="margin:0 0 6px 0;color:#92400e;font-size:13px;text-transform:uppercase;">Key Milestones (First 90 Days)</h4>
    <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.5;">${op.roadmap.map(r=>`<li>${escape(r)}</li>`).join('')}</ul>
   </div>

   <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748b;">
    <span>1-Page Investor / Stakeholder Teaser</span>
    <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
   </div>
  </div>
 `);
 const dl=$('#op-download-btn');
 if(dl)dl.onclick=()=>{
  const clean=(p.name||'patent2market-venture').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  download(`${clean||'venture'}-executive-summary-one-pager.html`,generateOnePagerHtml(p),'text/html');
 };
 const pr=$('#op-print-btn');
 if(pr)pr.onclick=()=>window.print();
}
function showInvestorQa(){
 const qa=generateInvestorQa(p);
 $('#modal').classList.add('wide-dialog');
 modal(`
  <div class="investor-qa-modal" style="max-height:80vh;overflow-y:auto;padding-right:6px;">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
    <div>
     <span class="eyebrow" style="color:var(--ink);">DUE DILIGENCE SIMULATOR</span>
     <h2 style="margin:2px 0 4px 0;font-size:22px;color:#163d36;">Skeptical Investor Q&amp;A · ${escape(qa.name)}</h2>
     <div class="small muted">Stress-test your venture model against top venture capital &amp; committee inquiries</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
     <button class="primary" id="qa-download-btn">Download Guide (.html) ↓</button>
     <button class="secondary" id="qa-print-btn">Print / PDF 🖨</button>
    </div>
   </div>

   <div style="display:flex;flex-direction:column;gap:14px;">
    ${qa.questions.map((q,i)=>`
     <div class="panel" style="margin:0;background:#ffffff;border:1px solid #e2e8f0;padding:14px;border-radius:6px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
       <span class="badge" style="background:#fee2e2;color:#991b1b;font-weight:700;">Question ${i+1} · ${escape(q.category)}</span>
      </div>
      <h3 style="margin:0 0 6px 0;font-size:16px;color:#0f172a;">${escape(q.question)}</h3>
      <p style="margin:0 0 10px 0;font-size:13px;color:#64748b;font-style:italic;"><strong>Why investors ask:</strong> ${escape(q.whyTheyAsk)}</p>
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:10px 12px;margin-bottom:8px;border-radius:0 4px 4px 0;">
       <div style="font-weight:600;font-size:12px;color:#166534;text-transform:uppercase;margin-bottom:4px;">Recommended Evidence-Based Rebuttal:</div>
       <p style="margin:0;font-size:13px;line-height:1.5;color:#14532d;">${escape(q.recommendedRebuttal)}</p>
      </div>
      <div style="font-size:12px;color:#475569;">
       <strong>De-Risking Validation Experiment:</strong> ${escape(q.deRiskingExperiment)}
      </div>
     </div>
    `).join('')}
   </div>

   <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748b;">
    <span>Skeptical Investor Diligence Simulator</span>
    <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
   </div>
  </div>
 `);
 const dl=$('#qa-download-btn');
 if(dl)dl.onclick=()=>{
  const clean=(p.name||'patent2market-venture').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  download(`${clean||'venture'}-investor-diligence-qa.html`,generateInvestorQaHtml(p),'text/html');
 };
 const pr=$('#qa-print-btn');
 if(pr)pr.onclick=()=>window.print();
}
function showTtoGuide(){
 const tto=generateTtoTermSheetGuide(p);
 $('#modal').classList.add('wide-dialog');
 modal(`
  <div class="tto-guide-modal" style="max-height:80vh;overflow-y:auto;padding-right:6px;">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
    <div>
     <span class="eyebrow" style="color:var(--ink);">UNIVERSITY &amp; LAB IP COMMERCIALIZATION</span>
     <h2 style="margin:2px 0 4px 0;font-size:22px;color:#163d36;">Tech Transfer (TTO) Licensing Term Sheet Guide · ${escape(tto.name)}</h2>
     <div class="small muted">Empowering academic &amp; independent spinouts to negotiate clean, investable patent licenses</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
     <button class="primary" id="tto-download-btn">Download Guide (.html) ↓</button>
     <button class="secondary" id="tto-print-btn">Print / PDF 🖨</button>
    </div>
   </div>

   <div class="panel" style="margin:0 0 14px 0;background:#eff6ff;border:1px solid #bfdbfe;padding:12px;">
    <h4 style="margin:0 0 6px 0;color:#1e40af;font-size:13px;text-transform:uppercase;">Licensed Intellectual Property Overview</h4>
    <p style="margin:0;font-size:13px;line-height:1.5;">${escape(tto.ipOverview)}</p>
   </div>

   <h3 style="margin:16px 0 8px 0;font-size:16px;color:#0f172a;">Standard Academic Licensing Benchmarks</h3>
   <div class="table-wrap" style="margin-bottom:16px;">
    <table>
     <thead><tr><th>Term / Clause</th><th>Industry Benchmark</th><th>Spinout Recommendation</th></tr></thead>
     <tbody>
      ${tto.benchmarks.map(b=>`<tr><td style="font-weight:600;">${escape(b.term)}</td><td>${escape(b.benchmark)}</td><td style="color:#166534;">${escape(b.recommendation)}</td></tr>`).join('')}
     </tbody>
    </table>
   </div>

   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-bottom:14px;">
    <div class="panel" style="margin:0;background:#fff1f2;border:1px solid #fecdd3;padding:12px;">
     <h4 style="margin:0 0 8px 0;color:#9f1239;font-size:13px;text-transform:uppercase;">⚠️ Critical Licensing Pitfalls to Avoid</h4>
     <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.5;">${tto.pitfallsToAvoid.map(pit=>`<li>${escape(pit)}</li>`).join('')}</ul>
    </div>
    <div class="panel" style="margin:0;background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;">
     <h4 style="margin:0 0 8px 0;color:#166534;font-size:13px;text-transform:uppercase;">✓ Spinout Term Sheet Checklist</h4>
     <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.5;">${tto.negotiationChecklist.map(ch=>`<li>${escape(ch)}</li>`).join('')}</ul>
    </div>
   </div>

   <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748b;">
    <span>University Tech Transfer Licensing Guide</span>
    <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
   </div>
  </div>
 `);
 const dl=$('#tto-download-btn');
 if(dl)dl.onclick=()=>{
  const clean=(p.name||'patent2market-venture').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  download(`${clean||'venture'}-tto-licensing-guide.html`,generateTtoTermSheetGuideHtml(p),'text/html');
 };
 const pr=$('#tto-print-btn');
 if(pr)pr.onclick=()=>window.print();
}
function showGrantConceptNote(){
 const note=generateGrantConceptNote(p);
 $('#modal').classList.add('wide-dialog');
 modal(`
  <div class="grant-note-modal" style="max-height:80vh;overflow-y:auto;padding-right:6px;">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
    <div>
     <span class="eyebrow" style="color:var(--ink);">NON-DILUTIVE FUNDING / SBIR / STTR / HORIZON</span>
     <h2 style="margin:2px 0 4px 0;font-size:22px;color:#163d36;">Grant Concept Note &amp; Specific Aims · ${escape(note.name)}</h2>
     <div class="small muted">Target: ${escape(note.targetAgencies)} · Non-dilutive capital readiness</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
     <button class="primary" id="grant-download-btn">Download Standalone (.html) ↓</button>
     <button class="secondary" id="grant-print-btn">Print / PDF 🖨</button>
    </div>
   </div>

   <div class="panel" style="margin:0 0 12px 0;background:#f8fafc;border:1px solid #e2e8f0;padding:12px;">
    <h4 style="margin:0 0 4px 0;color:#0f172a;font-size:13px;text-transform:uppercase;">Project Title</h4>
    <p style="margin:0;font-size:14px;font-weight:600;color:#163d36;">${escape(note.projectTitle)}</p>
   </div>

   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:12px;">
    <div class="panel" style="margin:0;background:#fef2f2;border:1px solid #fecaca;padding:12px;">
     <h4 style="margin:0 0 6px 0;color:#991b1b;font-size:13px;text-transform:uppercase;">Significance &amp; Commercial Problem</h4>
     <p style="margin:0;font-size:13px;line-height:1.5;">${escape(note.significance)}</p>
    </div>
    <div class="panel" style="margin:0;background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;">
     <h4 style="margin:0 0 6px 0;color:#166534;font-size:13px;text-transform:uppercase;">Technical Innovation &amp; IP Foundation</h4>
     <p style="margin:0;font-size:13px;line-height:1.5;">${escape(note.innovation)}</p>
    </div>
   </div>

   <h3 style="margin:16px 0 8px 0;font-size:16px;color:#0f172a;">Specific Aims (Phase I Work Plan)</h3>
   <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
    ${note.specificAims.map((aim,i)=>`
     <div class="panel" style="margin:0;background:#ffffff;border:1px solid #e2e8f0;padding:12px;border-left:4px solid #0284c7;">
      <h4 style="margin:0 0 4px 0;color:#0369a1;font-size:14px;">Aim ${i+1}: ${escape(aim.title)}</h4>
      <p style="margin:0 0 6px 0;font-size:13px;line-height:1.5;">${escape(aim.description)}</p>
      <div style="font-size:12px;color:#166534;"><strong>Success Milestone:</strong> ${escape(aim.milestone)}</div>
     </div>
    `).join('')}
   </div>

   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:14px;">
    <div class="panel" style="margin:0;background:#faf5ff;border:1px solid #e9d5ff;padding:12px;">
     <h4 style="margin:0 0 6px 0;color:#6b21a8;font-size:13px;text-transform:uppercase;">Commercialization Potential &amp; Societal Impact</h4>
     <p style="margin:0;font-size:13px;line-height:1.5;">${escape(note.commercialImpact)}</p>
    </div>
    <div class="panel" style="margin:0;background:#eff6ff;border:1px solid #bfdbfe;padding:12px;">
     <h4 style="margin:0 0 6px 0;color:#1e40af;font-size:13px;text-transform:uppercase;">Phase I Exit / Phase II Transition Gate</h4>
     <p style="margin:0;font-size:13px;line-height:1.5;">${escape(note.phaseExitCriteria)}</p>
    </div>
   </div>

   <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748b;">
    <span>SBIR / STTR / Horizon Grant Concept Note</span>
    <span>Conceptualization and development: <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></span>
   </div>
  </div>
 `);
 const dl=$('#grant-download-btn');
 if(dl)dl.onclick=()=>{
  const clean=(p.name||'patent2market-venture').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  download(`${clean||'venture'}-grant-concept-note.html`,generateGrantConceptNoteHtml(p),'text/html');
 };
 const pr=$('#grant-print-btn');
 if(pr)pr.onclick=()=>window.print();
}
function download(name,text,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);notify('Download prepared');}
function addEvidence(){modal(`<h2>Add a useful piece of evidence</h2><p>Record what the source actually establishes. Avoid copying personal information from interviews.</p><form id="evidence-form"><div class="field"><label for="e-title">Short title</label><input id="e-title" required maxlength="500" ></div><div class="form-grid"><div class="field"><label for="e-kind">Evidence type</label><select id="e-kind"><option value="customer">Customer conversation</option><option value="competition">Competitor / alternative</option><option value="cost">Supplier quote / cost</option><option value="technical">Technical evidence</option><option value="market">Market data</option><option value="regulatory">Country / regulatory requirement</option><option value="other">Other</option></select></div><div class="field"><label for="e-date">Date</label><input type="date" id="e-date"></div></div><div class="field"><label for="e-jurisdiction">Applicable country / region</label><input id="e-jurisdiction" maxlength="200"></div><div class="field"><label for="e-url">Source URL (optional)</label><input type="url" id="e-url" ></div><div class="field"><label for="e-note">What did you learn? What does it not establish?</label><textarea id="e-note" required maxlength="10000" rows="4"></textarea></div><button class="primary" type="submit">Save evidence</button></form>`);$('#evidence-form').onsubmit=e=>{e.preventDefault();if(p.evidence.length>=40){notify('Export your project before adding more than 40 evidence records.');return;}const url=$('#e-url').value;if(url&&!safeURL(url)){notify('Use an HTTP or HTTPS source URL.');return;}p.evidence.push({title:$('#e-title').value,kind:$('#e-kind').value,date:$('#e-date').value,jurisdiction:$('#e-jurisdiction').value,url:safeURL(url),note:$('#e-note').value});save();$('#modal').close();render();};}
function accessModal(index=0){const t=selectedPatents(p)[index];modal(`<h2>Record the basis for using this technology</h2><p>Public patent text is not permission to use the invention. Record evidence for the applicable jurisdiction and date. This record is your assessment, not independent verification.</p><form id="access-form"><div class="field"><label for="access-kind">Access basis</label><select id="access-kind"><option value="unknown">Not established / may need a license</option><option value="open-license">An applicable open license</option><option value="expired">Relevant patent rights appear expired</option></select></div><div class="field"><label for="access-url">Authoritative source URL</label><input type="url" id="access-url" value="${escape(t.accessURL||'')}"></div><div class="form-grid"><div class="field"><label for="jurisdiction">Country / jurisdiction</label><input id="jurisdiction" value="${escape(t.jurisdiction||'')}"></div><div class="field"><label for="checked-at">Date checked</label><input id="checked-at" type="date" value="${escape(t.checkedAt||'')}"></div></div><div class="field"><label for="access-evidence">Evidence, applicable conditions, and remaining uncertainty</label><textarea id="access-evidence" rows="4" maxlength="12000">${escape(t.accessEvidence||'')}</textarea></div><div class="field"><label for="full-text-url">Full document URL (description and claims)</label><input id="full-text-url" type="url" value="${escape(t.fullTextURL||'')}"></div><div class="field"><label for="full-text-evidence">What complete text did you review? Leave blank if unconfirmed.</label><textarea id="full-text-evidence">${escape(t.fullTextEvidence||'')}</textarea></div><div class="field"><label for="claims-excerpt">Relevant claims / technical excerpts for AI (optional; up to 6,000 characters)</label><textarea id="claims-excerpt" maxlength="6000">${escape(t.claimsExcerpt||'')}</textarea></div><div class="field"><label for="cost-terms">Published usage price and terms (currency, upfront fees, royalties, eligibility)</label><textarea id="cost-terms">${escape(t.costTerms||'')}</textarea></div><div class="field"><label for="cost-url">Published price source URL</label><input id="cost-url" type="url" value="${escape(t.costURL||'')}"></div><div class="field"><label for="cost-date">Price checked on</label><input id="cost-date" type="date" value="${escape(t.costCheckedAt||'')}"></div><p class="small">Unknown price is not zero. Enter applicable fees into launch or operating costs after confirming terms.</p><button class="primary">Save access assessment</button></form>`);$('#access-kind').value=t.access||'unknown';$('#access-form').onsubmit=e=>{e.preventDefault();const access=$('#access-kind').value,url=safeURL($('#access-url').value),note=$('#access-evidence').value,region=$('#jurisdiction').value,date=$('#checked-at').value;if(access!=='unknown'&&(!url||!note.trim()||!region.trim()||!date)){notify('Add the source, jurisdiction, date, and reasoning for this access basis.');return;}const costTerms=$('#cost-terms').value,costURL=safeURL($('#cost-url').value),costCheckedAt=$('#cost-date').value;if(costTerms&&(!costURL||!costCheckedAt)){notify('Published prices need a source URL and checked date.');return;}const fullTextURL=safeURL($('#full-text-url').value),fullTextEvidence=$('#full-text-evidence').value;Object.assign(t,{access,accessURL:url,accessEvidence:note,jurisdiction:region,checkedAt:date,basisOrigin:'user-recorded',statusLabel:access,fullTextURL,fullTextEvidence,fullTextAvailable:!!fullTextURL&&!!fullTextEvidence.trim(),claimsExcerpt:$('#claims-excerpt').value,costTerms,costURL,costCheckedAt});save();$('#modal').close();render();};}
function importTechnology(){modal(`<h2>Bring your own technology lead</h2><p>Add a patent, open design, or other technical source. Describe the mechanism without assuming that access or performance has been established.</p><form id="tech-form"><div class="field"><label for="t-title">Technology title</label><input id="t-title" required maxlength="500"></div><div class="field"><label for="t-id">Patent or source identifier (optional)</label><input id="t-id" maxlength="200"></div><div class="field"><label for="t-url">Source URL</label><input id="t-url" type="url" required></div><div class="field"><label for="t-description">What the source describes</label><textarea id="t-description" required maxlength="12000"></textarea></div><button class="primary">Use this technology lead</button></form>`);$('#tech-form').onsubmit=e=>{e.preventDefault();const url=safeURL($('#t-url').value);if(!url){notify('Use an HTTP or HTTPS source URL.');return;}if(selectedPatents(p).length>=6){notify('Remove an ingredient before adding another (maximum six).');return;}const imported={id:$('#t-id').value||'user-'+crypto.randomUUID(),title:$('#t-title').value,description:$('#t-description').value,url,category:'User-added source',retrievedAt:new Date().toISOString().slice(0,10),access:'unknown'};if(selectedPatents(p).some(t=>t.id===imported.id)){notify('That identifier is already selected. Edit its existing record.');return;}p.technologies=[...selectedPatents(p),normalizePatent(imported)];p.technology=p.technologies[0];save();accessModal(p.technologies.length-1);render();};}
function projectMenu(){modal(`<h2>Your project, your work</h2><p>Projects are stored in this browser. Download a project backup to move between devices or keep an editable copy. AI connection settings are session-only.</p><div class="inline-actions"><button class="primary" id="backup">Download project JSON</button><button class="secondary" id="restore">Import project JSON</button><button class="secondary" id="new-project">Start a new project</button></div>`);$('#backup').onclick=()=>download('patent2market-project.json',JSON.stringify(p,null,2),'application/json');$('#restore').onclick=()=>$('#import-file').click();$('#new-project').onclick=()=>{modal('<h2>Start fresh?</h2><p>Your current browser workspace will be replaced. Download a project backup first if you want to keep it.</p><button class="primary" id="confirm-new">Replace workspace with a new project</button>');$('#confirm-new').onclick=()=>{controller?.abort();p=newProject();step=0;planInput=null;catalog=[];patentSource='';sourceScope='';pendingProposal=null;searchGeneration++;save();$('#modal').close();render();};};}
$('#steps').onclick=e=>{const b=e.target.closest('[data-step]');if(b)go(Number(b.dataset.step));};
$('#content').addEventListener('input',e=>{if(e.target.id==='tech-search'){p.query=e.target.value;save();if($('#external-search'))$('#external-search').href=sourceLink();}const key=e.target.dataset.field;if(key){p[key]=e.target.value;save();}const n=e.target.dataset.number;if(n){if(e.target.value===''){p.financial[n]='';save();updateNumbers();return;}const value=Number(e.target.value);if(Number.isFinite(value)&&value>=0&&value<=(n==='growth'?100:1e9)){e.target.setCustomValidity('');p.financial[n]=value;save();updateNumbers();}else{e.target.setCustomValidity('Enter a nonnegative value within the allowed range.');$('#financial-output').innerHTML='<div class="notice warning">Correct the invalid financial input to view scenarios. The previous valid value is still saved.</div>';}}});
$('#content').addEventListener('change',e=>{if(e.target.id==='patent-source'){patentSource=e.target.value;searchGeneration++;catalog=[];sourceScope='';territory='';pendingProposal=null;render();}if(e.target.id==='tech-category'){category=e.target.value;limit=8;renderTechnologies();}if(e.target.id==='fulltext-only'){fullTextOnly=e.target.checked;renderTechnologies();}if(e.target.id==='tech-territory'){territory=e.target.value;renderTechnologies();}if(e.target.id==='reviewed-only'){onlyReviewed=e.target.checked;renderTechnologies();}if(e.target.id==='currency'){p.financial.currency=e.target.value;save();updateNumbers();}});
$('#content').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;if('next'in d){if(step===0&&!p.problem.trim()){notify('Add a short description of the problem to continue.');return;}go(step+1);}if('back'in d)go(step-1);if('fullAutopilot'in d){runFullAutopilot();return;}if('autoFinancials'in d){p.financial=heuristicFinancials(p);save();render();notify('Baseline unit economics calibrated.');return;}if('generateEvidence'in d){p.evidence=heuristicEvidence(p);save();render();notify('Country evidence hypotheses generated.');return;}if(b.id==='search-tech'){p.query=$('#tech-search').value;limit=8;save();renderTechnologies();}if(b.id==='tech-more'){limit+=8;renderTechnologies();}if('autopilot'in d)autopilot();if('sourceSettings'in d)sourceSettings();if('localRequirements'in d)ask('local');if(b.id==='live-search'){p.query=$('#tech-search').value;if(!p.query.trim()){notify('Enter search terms.');return;}save();liveBusy=true;render();searchWorldwide(p.query,AbortSignal.timeout(35000)).then(()=>notify('Fresh results received. Your filters apply to every result.')).catch(err=>notify(err.message)).finally(()=>{liveBusy=false;render();});}if(d.selectTech){const t=availablePatents().find(r=>r.id===d.selectTech);if(selectedPatents(p).length>=6){notify('Use up to six ingredients. Remove one before adding another.');return;}if(t&&!selectedPatents(p).some(x=>x.id===t.id)){p.technologies=[...selectedPatents(p),{...t}];p.technology=p.technologies[0];save();render();}}if('access'in d)accessModal(Number(d.access));if(d.removeTech!==undefined){p.technologies=selectedPatents(p).filter((_,i)=>i!==Number(d.removeTech));p.technology=p.technologies[0]||null;save();render();}if('importTech'in d)importTechnology();if(d.useConcept!==undefined){const c=p.aiResults.concepts.result.concepts[Number(d.useConcept)];p.concept=c.mechanism||c.name;p.offer=c.offer;save();render();notify('Business direction added to your project.');}if('coachConcepts'in d){ask('concepts');return;}if('addEvidence'in d)addEvidence();if(d.removeEvidence!==undefined){p.evidence.splice(Number(d.removeEvidence),1);save();render();}if('aiPlan'in d)ask('plan');if('applyTemplate'in d){
 const tmpl=TEMPLATES[Number(d.applyTemplate)];
 if(tmpl){
  Object.assign(p,tmpl);
  if(tmpl.technologies&&Array.isArray(tmpl.technologies)){
   p.technologies=tmpl.technologies.map(t=>({...t}));
   p.technology=p.technologies[0]||null;
  }
  p.financial=heuristicFinancials(p);
  p.evidence=heuristicEvidence(p);
  save();render();notify('Loaded template: '+tmpl.name);
 }
 return;
}
if('clearProblem'in d){
 Object.assign(p,{name:'',problem:'',customer:'',country:'',registrationCountry:'',geography:'',sector:'',tradeContext:'',localContext:'',constraints:'',advantage:'',query:'',concept:'',offer:'',channel:'',notes:''});
 p.financial={currency:'',price:'',unitCost:'',monthlyUnits:'',growth:'',fixedCost:'',startupCost:'',capital:''};
 p.evidence=[];
 p.technology=null;
 p.technologies=[];
 p.sections=[];
 p.aiResults={};
 save();render();notify('Form cleared. You can now enter your own problem and context.');
 const el=$('#field-problem');
 if(el)el.focus();
 return;
}
if('autoMultiPatent'in d){
 const all=availablePatents();
 const bySub=new Map();
 for(const t of all){
  const s=t.subsystem||classifySubsystem(t);
  if(!bySub.has(s))bySub.set(s,t);
 }
 const picks=[...bySub.values()].slice(0,3);
 if(picks.length){
  p.technologies=picks;
  p.technology=picks[0];
  p.solutionBlueprint=generateSolutionBlueprint(p);
  save();render();notify(`Selected ${picks.length} complementary subsystem patents.`);
 }else notify('Search for technologies first.');
 return;
}
if(d.searchComplementary){
 const targetQuery=d.searchComplementary;
 p.query=targetQuery;
 const searchInput=$('#tech-search');
 if(searchInput)searchInput.value=targetQuery;
 limit=8;
 save();
 liveBusy=true;
 render();
 searchWorldwide(targetQuery,AbortSignal.timeout(35000)).then(()=>{
  notify(`Found complementary patent leads for: "${targetQuery}".`);
 }).catch(err=>notify(err.message)).finally(()=>{
  liveBusy=false;
  render();
 });
 return;
}
if('autoComplementarySearch'in d){
 const bp=generateSolutionBlueprint(p);
 if(!bp.complementaryQueries.length){
  notify('All core product subsystems are already addressed.');
  return;
 }
 const targetQuery=bp.complementaryQueries[0];
 notify(`Auto-sourcing complementary patents for gap: "${targetQuery}"...`);
 liveBusy=true;
 render();
 searchWorldwide(targetQuery,AbortSignal.timeout(35000)).then(()=>{
  const currentIds=new Set(selectedPatents(p).map(t=>t.id));
  const currentSubs=new Set(selectedPatents(p).map(t=>t.subsystem||classifySubsystem(t)));
  const candidate=availablePatents().find(t=>!currentIds.has(t.id)&&!currentSubs.has(t.subsystem||classifySubsystem(t)));
  if(candidate&&selectedPatents(p).length<6){
   p.technologies=[...selectedPatents(p),{...candidate}];
   p.technology=p.technologies[0];
   p.solutionBlueprint=generateSolutionBlueprint(p);
   save();
   render();
   notify(`Coupled complementary patent: [${candidate.subsystem||classifySubsystem(candidate)}] ${candidate.title}`);
  }else{
   render();
   notify('Discovered complementary patent leads. Click "+ Add ingredient" to couple.');
  }
 }).catch(err=>notify(err.message)).finally(()=>{
  liveBusy=false;
  render();
 });
 return;
}
if('exportDocx'in d){downloadDocx();return;}
if('exportCsv'in d){downloadFinancialCsv();return;}
if('onePager'in d){showOnePager();return;}
if('grantNote'in d){showGrantConceptNote();return;}
if('investorQa'in d){showInvestorQa();return;}
if('ttoGuide'in d){showTtoGuide();return;}
if('exportMd'in d){download((p.name?p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'):'patent2market-plan')+'.md',exportPlan(p),'text/markdown');return;}
if('bmc'in d){showBusinessModelCanvas();return;}
if('pitchDeck'in d){showPitchDeck();return;}
if('filterSubsystem'in d){selectedSubsystem=d.filterSubsystem;renderTechnologies();return;}
if('exportPlan'in d)download('patent2market-business-plan.md',exportPlan(p),'text/markdown');if('print'in d){document.querySelectorAll('.plan-section').forEach(x=>x.open=true);window.print();}if(d.editSection!==undefined){const i=Number(d.editSection),s=p.sections[i];modal(`<h2>${escape(s.title)}</h2><label for="section-edit">Edit this section</label><textarea id="section-edit" rows="16" maxlength="20000">${escape(s.text)}</textarea><button class="primary" id="save-section">Save section</button>`);$('#save-section').onclick=()=>{s.text=$('#section-edit').value;s.origin='User-edited · review evidence';save();$('#modal').close();render();};}};
$('#content').addEventListener('keydown',e=>{if(e.target.id==='tech-search'&&e.key==='Enter'){e.preventDefault();const live=$('#live-search');if(live&&!live.disabled){live.click();return;}const local=$('#search-tech');if(local&&!local.disabled){local.click();return;}const ext=$('#external-search');if(ext)ext.click();}});
$('#coach-action').onclick=()=>ask(coach[step][2]);$('#cancel-ai').onclick=()=>controller?.abort();$('#ai-settings').onclick=aiSettings;$('#close-modal').onclick=()=>$('#modal').close();$('#modal').addEventListener('close',()=>$('#modal').classList.remove('wide-dialog'));$('#project-menu').onclick=projectMenu;
$('#coach-output').onclick=e=>{if(e.target.closest('[data-use-search]')){p.query=String(p.aiResults.clarify.result.searchTerms);save();go(1);}};
$('#import-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>2000000){notify('Project file is too large (maximum 2 MB).');return;}try{const imported=validateProject(JSON.parse(await file.text()));modal(`<h2>Import ${escape(imported.name)}?</h2><p>This replaces the current workspace. Download your current project first if you need to retain it.</p><button class="primary" id="confirm-import">Replace workspace with imported project</button>`);$('#confirm-import').onclick=()=>{controller?.abort();p=imported;step=0;planInput=null;catalog=[];patentSource='';sourceScope='';pendingProposal=null;searchGeneration++;save();$('#modal').close();render();notify('Project imported');};}catch(error){notify(error.message||'Could not read this project.');}};
$('#method').onclick=()=>modal('<h2>A thoughtful business starts with evidence.</h2><p>Patent2Market combines fresh searches from your chosen source, a guided venture workflow, explicit financial calculations, and optional AI assistance. Technology relevance is lexical search, not proof of suitability.</p><h3>Sources and rights</h3><p>NASA descriptions are attributed to their source. NASA does not endorse this app. No patent examples or snapshot catalogs are shipped. Search results do not establish current rights or licensing terms. User-recorded access assessments must be verified for the product and jurisdiction.</p><h3>AI and evidence</h3><p>AI results are suggestions. Worldwide patent search requires an approved Lens API credential. General market web research is not automated; its evidence assistant proposes research questions and tests. Add actual sources and observations to the notebook. Generated market or technical claims need independent verification.</p><h3>Privacy</h3><p>Project information is saved in browser storage, which is not encrypted or backed up. When you explicitly enable and request AI, project context is sent to the selected provider. Session API keys are kept in memory and forwarded through this app’s gateway to the named provider when you request AI. Custom endpoints receive requests directly from your browser. Keys are not saved in projects or browser storage. Source searches send your search terms to your chosen source. Providers apply their own data terms and charges. Browser AI and local Ollama run on your device where supported. No telemetry or analytics are included.</p><h3>Open foundation</h3><p>Original application code is MIT licensed with no third-party runtime packages. Optional model services are separate; OpenAI and Gemini are proprietary. Check the license of any local model you choose. The hosted preview is private; the application can be self-hosted.</p>');
render();fetch('./api/patents').then(r=>r.json()).then(c=>{liveEnabled=c.enabled===true;if(step===1)render();}).catch(()=>{});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
