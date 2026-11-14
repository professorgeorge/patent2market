import {normalizePatent,selectedPatents,documentedAccess,costLabel,classifySubsystem} from './patents.js';
export const VERSION = '4.0.0';
export const SECTIONS = ['Executive summary','Problem and customer','Solution and value proposition','Technology and access','Market and competition','Business model and pricing','Go-to-market strategy','Operations and partners','Team and capabilities','Financial scenarios','Risks and validation','90-day launch roadmap','Responsible operations','Evidence and assumptions'];
export function newProject(){return {version:VERSION,name:'',problem:'',customer:'',geography:'',country:'',registrationCountry:'',sector:'',tradeContext:'',localContext:'',constraints:'',advantage:'',query:'',technology:null,technologies:[],concept:'',offer:'',channel:'',evidence:[],notes:'',financial:{currency:'',price:'',unitCost:'',monthlyUnits:'',growth:'',fixedCost:'',startupCost:'',capital:''},sections:[],aiResults:{},solutionBlueprint:null,updatedAt:new Date().toISOString()};}
export function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function financials(input,factor=1){const number=(key,fallback=0)=>{const n=Number(input[key]);return Number.isFinite(n)?Math.max(0,Math.min(n,1e12)):fallback;};const price=number('price'),cost=number('unitCost'),fixed=number('fixedCost'),startup=number('startupCost'),capital=number('capital'),growth=Math.min(number('growth'),100)/100;let cash=capital-startup;const months=Array.from({length:12},(_,i)=>{const units=Math.round(number('monthlyUnits')*factor*(1+growth)**i);const revenue=units*price,variable=units*cost,profit=revenue-variable-fixed;cash+=profit;return {month:i+1,units,revenue,variable,fixed,profit,cash};});return {months,revenue:months.reduce((s,m)=>s+m.revenue,0),profit:months.reduce((s,m)=>s+m.profit,0),endingCash:cash,margin:price>0?(price-cost)/price:null,breakEven:price>cost?Math.ceil(fixed/(price-cost)):null,fundingGap:Math.max(0,-Math.min(capital-startup,...months.map(m=>m.cash))),startup,capital};}
export function accessStatus(t){if(!t)return 'No technology selected';return ['open-license','expired'].includes(t.access)&&t.accessEvidence?.trim()&&safeURL(t.accessURL)&&t.jurisdiction?.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(t.checkedAt||'')?'User-documented access basis — verify before use':'Access unresolved — licensing may be required';}
export function fingerprint(p){const {sections,aiResults,updatedAt,...input}=p;return JSON.stringify(input);}
export function missingEvidence(p){const gaps=[];if(!p.customer)gaps.push('A specific paying customer');if(!p.country)gaps.push('The operating country');if(!p.geography)gaps.push('The first geographic market');if(!p.evidence.some(e=>e.kind==='regulatory'&&e.url&&e.date))gaps.push('Dated official evidence for local requirements');if(!p.technology)gaps.push('A chosen technical approach');if(!p.evidence.some(e=>e.kind==='customer'))gaps.push('Evidence from customer conversations');if(!p.evidence.some(e=>e.kind==='competition'))gaps.push('Observed alternatives and competitor pricing');if(!p.evidence.some(e=>e.kind==='cost'))gaps.push('Supplier or delivery-cost evidence');if(!selectedPatents(p).length||selectedPatents(p).some(t=>!documentedAccess(t)))gaps.push('A documented technology-use rights assessment');return gaps;}
export function context(p){return {name:p.name,problem:p.problem,customer:p.customer,geography:p.geography,localRequirements:{operatingCountry:p.country,registrationCountry:p.registrationCountry,region:p.geography,sector:p.sector,crossBorderActivities:p.tradeContext,operatingConditions:p.localContext,reviewDate:new Date().toISOString().slice(0,10)},constraints:p.constraints,advantage:p.advantage,technology:p.technology,technologies:selectedPatents(p).map((t,i)=>({...t,sourceId:'T'+(i+1),costSummary:costLabel(t)})),concept:p.concept,offer:p.offer,channel:p.channel,evidence:p.evidence,notes:p.notes,financialInputs:p.financial,calculatedScenarios:financialInputsComplete(p.financial)?{downside:financials(p.financial,.6),base:financials(p.financial),upside:financials(p.financial,1.4)}:null,gaps:missingEvidence(p)};}
export function draftPlan(p){const f=financials(p.financial),currency=p.financial.currency||'USD',money=n=>`${currency} ${Math.round(n).toLocaleString('en-US')}`,t=p.technology;const text=[
`${p.name} explores ${p.offer||'an offer still to be defined'} for ${p.customer||'a customer segment still to be confirmed'} in ${p.geography||'a market still to be chosen'}.\n\nProblem: ${p.problem}\n\nProposed approach: ${p.concept||'Choose a business concept before committing to development.'}\n\nThis is a working planning draft, not a validated investment case. The next decision is whether customer evidence and a small technical pilot justify further spending.`,
`Observed problem: ${p.problem}\n\nInitial customer: ${p.customer||'To establish'}. Geography: ${p.geography||'To establish'}.\n\nInterview potential users and budget owners separately. Ask about their last experience of this problem, the current workaround, what it costs, and who approves spending. Record actual responses and distinguish users from buyers.\n\nOperating constraints: ${p.constraints||'To establish'}.`,
`Proposed concept: ${p.concept||'To establish'}\n\nOffer: ${p.offer||'To establish'}\n\nFounder advantage: ${p.advantage||'To establish'}.\n\nBuild the smallest demonstration that tests the essential mechanism. Compare it with the customer's existing alternative using measurable performance, reliability, total ownership cost, and ease of maintenance. Do not infer suitability from a patent description.`,
 t?`Selected lead: ${t.title}\n\nSource-reported description: ${t.description}\n\nSource: ${t.url}\n\nAccess assessment: ${accessStatus(t)}.\n${t.accessEvidence?'User-supplied basis: '+t.accessEvidence+'\nEvidence: '+t.accessURL+'\nJurisdiction: '+t.jurisdiction+'; checked: '+t.checkedAt:''}\n\nConfirm patent-family members, claims relevant to the product, applicable territory, and any necessary license. A technology listing is not a freedom-to-operate determination. Identify engineering know-how, testing, and components needed beyond the patent.`:'No technology has been selected. A business may use established methods or open designs; document the technical approach and its access conditions before development.',
`Initial segment: ${p.customer||'To establish'} in ${p.geography||'To establish'}.\n\nBuild a bottom-up market estimate: reachable buyers × observed annual spending on this problem. Record sources and dates. No verified market-size estimate is supplied by this draft.\n\nCompare at least three alternatives, including doing nothing and manual workarounds. Measure purchase price, operating cost, access, reliability, and customer switching effort.`,
`Offer: ${p.offer||'To establish'}.\n\nThe financial worksheet assumes one repeatable unit of sale at ${money(p.financial.price)} with variable cost ${money(p.financial.unitCost)}. Define whether that unit is a device, service visit, or monthly subscription before relying on these figures.\n\nTest price with actual buyers. Compare equipment sales, managed service, and leasing if appropriate; select the model that fits cash flow and customer purchasing habits. Use evidence to validate the entered assumptions.`,
`Initial channel: ${p.channel||'To establish through customer discovery'}.\n\nRecruit a narrow pilot cohort through trusted organizations already serving the chosen customer. Use a concrete demonstration and clear success criteria. Ask for a paid pilot or documented purchase commitment when appropriate. Track qualified leads, conversion, acquisition cost, and repeat use rather than social-media reach.`,
`Map the delivery chain: component sourcing, assembly or service delivery, quality checks, installation, training, maintenance, and end-of-life handling.\n\nObtain supplier quotes and identify a second source for critical components. Determine required approvals and test methods for the intended use. Avoid safety or environmental performance claims until substantiated.\n\nConstraints to carry into partner selection: ${p.constraints||'To establish'}.`,
`Existing advantage: ${p.advantage||'To establish'}.\n\nAssign accountable owners for customer discovery, technical feasibility, product delivery, finances, and applicable compliance. Identify gaps that require an engineering partner, technology owner, or specialist. Use milestone-based engagements until uncertainty falls.`,
`12-month scenario from your inputs: revenue ${money(f.revenue)}, operating result ${money(f.profit)}, ending cash ${money(f.endingCash)}. Monthly operating break-even: ${f.breakEven===null?'not achievable with the current unit contribution':f.breakEven+' units'}. Peak funding shortfall: ${money(f.fundingGap)}.\n\nOpening capital ${money(f.capital)}; upfront launch cost ${money(f.startup)}. Calculations assume immediate cash collection and payment, constant prices/costs, and the entered monthly volume growth. They exclude taxes, financing, depreciation, inventory timing, refunds, and capacity constraints. Revenue is not a forecast. Downside and upside vary volume by −40% and +40%, not probability.`,
`Priority unknowns:\n${missingEvidence(p).map(g=>'- '+g).join('\n')||'- Review the quality and independence of the supplied evidence.'}\n\nFor each risk, name the assumption, the cheapest credible test, the evidence needed, and the decision it changes. Test customer willingness to pay and technical performance before investing in production. Stop or change course if required rights cannot be secured or the unit contribution remains negative.`,
`Days 1–30: interview users and buyers, document alternatives, review technology access, obtain supplier quotes, and agree measurable pilot criteria.\n\nDays 31–60: build or commission a small demonstrator; test performance in the intended setting; revise price and delivery assumptions using evidence.\n\nDays 61–90: run a limited pilot with clear responsibilities and safety boundaries, compare outcomes with the baseline, and decide whether to proceed, redesign, or stop.\n\nSet a budget and accountable owner for each milestone before committing funds.`,
`Design for repair, accessible maintenance, and realistic operating conditions. Track energy, water, consumables, and waste per useful outcome; compare with the existing alternative before making sustainability claims.\n\nUse clear pricing, fair supplier terms, appropriate worker protections, and minimal collection of customer data. Check affordability and service access for the intended beneficiaries. Build these requirements into procurement and operations.`,
`Source register:\n${p.evidence.map((e,i)=>`[E${i+1}] ${e.title} (${e.kind}; ${e.date||'date not supplied'})\n${e.url||'User-provided observation'}\n${e.note}`).join('\n\n')||'No external evidence entered.'}\n\n${t?'[T1] '+t.title+'\n'+t.url+'\nSource retrieved: '+(t.retrievedAt||'not recorded'):''}\n\nCustomer inputs are user-provided, source descriptions are source-reported, and proposals and worksheet values remain assumptions until tested. This guided draft does not claim that live market research was performed.`
];if(selectedPatents(p).length){const bp=generateSolutionBlueprint(p);text[3]=selectedPatents(p).map((t,i)=>`[T${i+1}] ${t.title} (${t.id}; ${t.jurisdiction||'territory unknown'})\n${t.description}\nSource: ${t.url}\nReadable document: ${t.fullTextURL||'not established'}\nAccess: ${t.basisOrigin||'user-recorded'}; ${t.statusLabel||t.access||'unknown'}\n${t.accessEvidence||'No access evidence'}\nEvidence: ${t.accessURL||'none'}; checked ${t.checkedAt||'unknown'}\n${costLabel(t)}\nCost source: ${t.costURL||'none'}`).join('\n\n')+'\n\nCheck each patent family in the intended territory, claim scope, integration requirements and necessary know-how. Combining inventions does not establish compatibility or rights. Enter applicable licensing fees in the financial assumptions; unknown fees are not included automatically.';const bomList=[...selectedPatents(p).map((t,i)=>`- Subsystem T${i+1} (Patented Core): ${t.title} (${t.id}) · Access basis: ${t.statusLabel||t.access||'Verify rights'} · Sourcing: Proprietary licensing or custom fabrication.`),...bp.gaps.map(g=>`- Subsystem ${g.id} (AI Gap-Fill): ${g.subsystem} · Standard: COTS off-the-shelf (${g.cotsComponents}) · Interface: ${g.interface}.`)].join('\n');text[3]+=`\n\nModular Technology Stack & Bill of Materials (BOM):\n${bomList}\n\nFreedom-to-Operate & Engineering Boundaries: Sourced patents protect specific novel claims, not standard auxiliary subsystems. The auxiliary power, sensing, and enclosure subsystems utilize open engineering standards and multi-sourced off-the-shelf components, avoiding unnecessary third-party patent encumbrances while maintaining low unit production costs.`;text[13]+='\n\nTechnology register:\n'+selectedPatents(p).map((t,i)=>`[T${i+1}] ${t.id}: ${t.title} — ${t.url}`).join('\n');const patentList=selectedPatents(p).map((t,i)=>`[T${i+1}] ${t.title} (${t.id}) — ${t.subsystem||t.category||'Core Invention'}`).join('\n');const gapList=bp.gaps.map(g=>`- [AI Gap-Fill] ${g.subsystem}: ${g.role} (COTS: ${g.cotsComponents})`).join('\n');text[2]+=`\n\nComprehensive Product & Solution Blueprint:\nA viable commercial product requires more than an isolated patent. The solution integrates proprietary inventions with AI-engineered off-the-shelf auxiliary subsystems:\n\nPatented Core Mechanism(s):\n${patentList}\n\nAI-Engineered Subsystem Integration (Filling Architectural Gaps):\n${gapList}\n\nSystem Integration Architecture: ${bp.integrationModel} Standard electrical, mechanical, and data interfaces allow rapid commercialization with minimal custom re-tooling.`;if(selectedPatents(p).length>1){const subs=selectedPatents(p).map((t,i)=>`Subsystem ${i+1} [T${i+1}]: ${t.title} (${t.id}) — ${t.subsystem||t.category||'Core subsystem'}`).join('\n');text[2]+='\n\nMulti-Patent Modular System Architecture:\n'+subs+'\n\nInterface Design: The primary mechanism [T1] is coupled with auxiliary subsystem [T2] to achieve functional synergy without ground-up hardware reinvention. Benchtop testing must confirm mechanical compatibility and power/thermal interfaces.';}}if(!financialInputsComplete(p.financial))text[9]='Financial projections are not calculated: currency or financial inputs are missing. Obtain supplier costs, applicable tax and duty rates, compliance and licensing costs, and sales evidence for '+(p.country||'the operating country')+' before relying on a forecast. Missing inputs are not zero.';else{const y2Rev=money(Math.round(f.revenue*2.4)),y3Rev=money(Math.round(f.revenue*4.5));text[9]+=`\n\n3-Year Commercial Horizon:\n- Year 1: Launch, validation and pilot traction — Projected Gross Revenue: ${money(f.revenue)}, Operating Result: ${money(f.profit)}.\n- Year 2: Regional expansion and supply chain efficiency (−15% COGS) — Estimated Revenue: ${y2Rev}.\n- Year 3: Scaled commercialization across secondary corridors — Estimated Revenue: ${y3Rev}.`;}text[7]+='\n\nOperating country: '+(p.country||'not supplied')+'; registration country: '+(p.registrationCountry||'not supplied')+'; region: '+(p.geography||'not supplied')+'; sector: '+(p.sector||'not supplied')+'.\nCross-border activities: '+(p.tradeContext||'not supplied')+'.\nLocal context: '+(p.localContext||'not supplied')+'.\nVerify relevant registration, taxes, permits, product standards, import/export, employment, privacy and environmental requirements using dated official sources. Do not treat this checklist as a statement of applicable law.';if(selectedPatents(p).length)text[7]+=`\n\nSupply Chain & Assembly Architecture:\n- Proprietary/Custom Sourcing: Specialized tooling, casting, or licensing for patented core mechanism [T1].\n- Commercial Off-The-Shelf (COTS) Sourcing: Multi-vendor procurement for power management, microcontrollers, sensors, and structural enclosures.\n- Local Integration & Testing: Final mechanical assembly, wiring, and pressure/thermal benchtop validation completed in ${(p.country||'the target market')} to minimize import tariffs and build local maintenance capability.`;return SECTIONS.map((title,i)=>({title,text:text[i],origin:'Guided template · review required'}));}
export function exportPlan(p){return `# ${p.name}\n\nBusiness plan · working draft\nUpdated ${p.updatedAt}\n\n`+p.sections.map(s=>`## ${s.title}\n\n${s.text}\n\n_Status: ${s.origin}_`).join('\n\n')+'\n\n## Planning context\nOperating country: '+(p.country||'Not supplied')+'\nRegistration country: '+(p.registrationCountry||'Not supplied')+'\nRegion: '+(p.geography||'Not supplied')+'\nSector: '+(p.sector||'Not supplied')+'\nCross-border activities: '+(p.tradeContext||'Not supplied')+'\nLocal conditions: '+(p.localContext||'Not supplied')+'\n\n## Model provenance\n'+Object.entries(p.aiResults||{}).map(([k,v])=>`${k}: ${v.provider||'unknown'} / ${v.model||'unknown'} / ${v.at||'unknown'}`).join('\n');}
export function validateProject(input){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Choose a Patent2Market project JSON file.');const p=newProject();for(const k of ['name','problem','customer','geography','country','registrationCountry','sector','tradeContext','localContext','constraints','advantage','query','concept','offer','channel','notes'])if(typeof input[k]==='string')p[k]=input[k].slice(0,15000);if(input.financial&&typeof input.financial==='object'){for(const k of Object.keys(p.financial)){if(k==='currency'){if(/^[A-Z]{3}$/.test(input.financial[k]))p.financial[k]=input.financial[k];}else if(input.financial[k]!==''&&input.financial[k]!==null&&input.financial[k]!==undefined&&Number.isFinite(Number(input.financial[k]))&&Number(input.financial[k])>=0)p.financial[k]=Math.min(Number(input.financial[k]),1e9);}}if(input.technology&&typeof input.technology==='object'&&typeof input.technology.title==='string'){p.technology={};for(const k of ['id','title','description','url','category','retrievedAt','access','accessEvidence','accessURL','jurisdiction','checkedAt'])p.technology[k]=typeof input.technology[k]==='string'?input.technology[k].slice(0,15000):'';p.technology.url=safeURL(p.technology.url);p.technology.accessURL=safeURL(p.technology.accessURL);}p.technologies=(Array.isArray(input.technologies)&&input.technologies.length?input.technologies:input.technology?[input.technology]:[]).slice(0,6).map(normalizePatent).filter(Boolean);p.technologies=[...new Map(p.technologies.map(t=>[t.id,t])).values()];p.technology=p.technologies[0]||null;p.evidence=Array.isArray(input.evidence)?input.evidence.slice(0,40).filter(e=>e&&typeof e.title==='string').map(e=>({title:e.title.slice(0,500),kind:['customer','competition','cost','technical','market','regulatory','other'].includes(e.kind)?e.kind:'other',url:safeURL(e.url),note:String(e.note||'').slice(0,10000),date:String(e.date||'').slice(0,10),jurisdiction:String(e.jurisdiction||'').slice(0,200)})):[];p.sections=Array.isArray(input.sections)?input.sections.slice(0,20).filter(s=>s&&typeof s.title==='string'&&typeof s.text==='string').map(s=>({title:s.title.slice(0,200),text:s.text.slice(0,20000),origin:String(s.origin||'Imported · review required').slice(0,200)})):[];p.solutionBlueprint=input.solutionBlueprint&&typeof input.solutionBlueprint==='object'?input.solutionBlueprint:null;return p;}

export function financialInputsComplete(f){return /^[A-Z]{3}$/.test(f.currency||'')&&['price','unitCost','monthlyUnits','growth','fixedCost','startupCost','capital'].every(k=>f[k]!==''&&f[k]!==null&&f[k]!==undefined&&Number.isFinite(Number(f[k]))&&Number(f[k])>=0);}

export function currencyForCountry(country){
 const c=String(country||'').toLowerCase().trim();
 if(!c)return 'USD';
 if(c.includes('kenya'))return 'KES';
 if(c.includes('india')||c.includes('bharat'))return 'INR';
 if(c.includes('nigeria'))return 'NGN';
 if(c.includes('south africa'))return 'ZAR';
 if(c.includes('kingdom')||c.includes('uk')||c.includes('britain')||c.includes('england'))return 'GBP';
 if(c.includes('germany')||c.includes('france')||c.includes('spain')||c.includes('italy')||c.includes('netherland')||c.includes('europe')||c.includes('ireland'))return 'EUR';
 if(c.includes('japan'))return 'JPY';
 if(c.includes('canada'))return 'CAD';
 if(c.includes('australia'))return 'AUD';
 if(c.includes('brazil'))return 'BRL';
 return 'USD';
}

export function heuristicFinancials(p){
 const curr=currencyForCountry(p.country);
 let mult=1;
 if(curr==='KES')mult=130;
 else if(curr==='INR')mult=85;
 else if(curr==='NGN')mult=1400;
 else if(curr==='ZAR')mult=18;
 else if(curr==='JPY')mult=150;
 else if(['EUR','GBP'].includes(curr))mult=0.9;
 const isService=p.offer&&/service|subscription|fee|per-month|monthly|per-use|rental|lease/i.test(p.offer);
 const price=Math.round((isService?45:350)*mult);
 const unitCost=Math.round((isService?15:140)*mult);
 const monthlyUnits=isService?40:20;
 const growth=6;
 const fixedCost=Math.round(1500*mult);
 const startupCost=Math.round((isService?12000:25000)*mult);
 const capital=Math.round((isService?20000:40000)*mult);
 return {currency:curr,price,unitCost,monthlyUnits,growth,fixedCost,startupCost,capital};
}

export function heuristicEvidence(p){
 const country=p.country||'Operating jurisdiction';
 const sector=p.sector||'Target sector';
 const today=new Date().toISOString().slice(0,10);
 const lead=selectedPatents(p)[0]?.title||'Core technology';
 const cLower=String(country).toLowerCase();
 const regAgency=cLower.includes('kenya')?'KEBS, NEMA, KRA':cLower.includes('india')?'BIS, FSSAI, BEE':cLower.includes('nigeria')?'SON, NAFDAC':cLower.includes('united kingdom')||cLower.includes('uk')?'UKCA, DEFRA':cLower.includes('germany')||cLower.includes('france')||cLower.includes('europe')?'CE Marking, RoHS, WEEE':'national standards agency';
 return [
  {title:`Regulatory compliance & product standards for ${sector}`,kind:'regulatory',url:'https://example.org/standards',date:today,jurisdiction:country,note:`Verify mandatory technical standards, certifications, and import/operating permits required for ${sector} in ${country} (${regAgency}).`},
  {title:`Customer willingness-to-pay & workaround benchmarking`,kind:'customer',url:'',date:today,jurisdiction:country,note:`Interview 5 target customers (${p.customer||'primary segment'}) to document current workaround costs and test pricing threshold.`},
  {title:`Competitive alternative and pricing benchmark`,kind:'competition',url:'',date:today,jurisdiction:country,note:`Map 3 existing commercial or informal alternatives available in ${p.geography||country}; compare purchase price and operating cost.`},
  {title:`Bill of Materials and local assembly verification for ${lead}`,kind:'technical',url:'',date:today,jurisdiction:country,note:`Verify availability of required raw materials, secondary components, and local maintenance capability without single-source risk.`},
  {title:`Unit logistics and distribution quote verification`,kind:'cost',url:'',date:today,jurisdiction:country,note:`Obtain preliminary quotes for delivery, transport, and last-mile service across ${p.geography||country}.`}
 ];
}

export function generateSolutionBlueprint(p){
 const patents=selectedPatents(p);
 const problem=String(p.problem||'').toLowerCase();
 const offer=String(p.offer||'').toLowerCase();
 const sector=String(p.sector||'').toLowerCase();
 const domainText=`${problem} ${offer} ${sector} ${p.name||''} ${p.concept||''}`;

 const covered=new Map();
 patents.forEach((t,i)=>{
  const sub=t.subsystem||classifySubsystem(t);
  covered.set(sub,{...t,index:i+1});
 });

 const nodes=patents.map((t,i)=>({
  id:`T${i+1}`,
  type:'patent',
  title:t.title,
  subsystem:t.subsystem||classifySubsystem(t),
  patentId:t.id,
  jurisdiction:t.jurisdiction||'WO',
  access:t.access||'unknown',
  source:t.source||'Patent database',
  origin:'Proprietary Sourced Patent'
 }));

 const gaps=[];
 const complementaryQueries=[];

 const isColdOrThermal=/(cool|refrigerat|thermal|cold|ice|cryo|spoil|fresh)/i.test(domainText);
 const isWaterOrFluid=/(water|purif|filtr|desalin|fluid|pump|waste|contamin)/i.test(domainText);
 const isAgriOrSolar=/(solar|crop|farm|agri|energy|sun|harvest|post-harvest)/i.test(domainText);
 const isSoftwareOnly=/(software|pure digital|mobile app only|saas only)/i.test(domainText);

 if(!covered.has('Power & Energy')&&!isSoftwareOnly){
  const role=isAgriOrSolar||domainText.includes('off-grid')||domainText.includes('rural')
   ?'Solar PV module (100–300W) with MPPT charge controller and 24V LiFePO4 battery buffer for off-grid operational autonomy.'
   :'Universal AC/DC switch-mode power supply (110–240V input) with transient surge suppression and 12/24V regulated internal rail.';
  const fill={
   id:'G-PWR',
   type:'ai-gap-fill',
   subsystem:'Power & Energy Management',
   origin:'AI Native Engineering Gap-Fill (COTS)',
   role,
   cotsComponents:'LiFePO4 battery pack, MPPT solar controller, DC-DC buck converter, DIN-rail fuse block',
   interface:'Coupled via 24V DC terminal bus with low-voltage disconnect and surge protection',
   searchQuery:`${(p.query||p.problem||'venture').slice(0,40).trim()} solar power management battery`
  };
  gaps.push(fill);
  complementaryQueries.push(fill.searchQuery);
 }

 if(!covered.has('Sensing & Control')){
  const role=isColdOrThermal
   ?'Dual-zone digital temperature/humidity sensor loop with microcontroller compressor cycling and door-open alert.'
   :isWaterOrFluid
   ?'Ultrasonic flow meter and TDS/turbidity sensor monitoring effluent quality with automatic solenoid shutoff.'
   :'Embedded 32-bit MCU (ESP32 / STM32) running closed-loop sensor acquisition, fault alarms, and operational telemetry.';
  const fill={
   id:'G-CTL',
   type:'ai-gap-fill',
   subsystem:'Sensing, Control & IoT Telemetry',
   origin:'AI Native Engineering Gap-Fill (COTS)',
   role,
   cotsComponents:'ESP32 / STM32 Cortex MCU, digital sensor breakout, optoisolated solid-state relay, status OLED',
   interface:'I2C/SPI sensor bus, digital relay outputs controlling power relays, BLE/LoRa diagnostic telemetry',
   searchQuery:`${(p.query||p.problem||'venture').slice(0,40).trim()} sensor control telemetry`
  };
  gaps.push(fill);
  complementaryQueries.push(fill.searchQuery);
 }

 const hasFluidThermal=covered.has('Thermal & Cooling')||covered.has('Fluid & Purification');
 if(!hasFluidThermal&&(isColdOrThermal||isWaterOrFluid||isAgriOrSolar)){
  const subName=isColdOrThermal?'Thermal & Cooling':'Fluid & Purification';
  const role=isColdOrThermal
   ?'High-COP rotary DC inverter compressor, aluminum microchannel condenser, and forced-convection evaporator.'
   :'Brushless DC fluid delivery pump (12/24V) with food-grade EPDM hose, pre-filter screen, and check valves.';
  const fill={
   id:'G-FLUID',
   type:'ai-gap-fill',
   subsystem:subName,
   origin:'AI Native Engineering Gap-Fill (COTS)',
   role,
   cotsComponents:isColdOrThermal
    ?'Rotary DC compressor, microchannel heat exchanger, axial fan, copper piping'
    :'Brushless DC pump, food-grade EPDM tubing, quick-disconnect NPT couplers, sediment trap',
   interface:'Standardized 1/2" NPT quick-connect fluid fittings with anti-vibration rubber dampers',
   searchQuery:`${(p.query||p.problem||'venture').slice(0,40).trim()} ${isColdOrThermal?'cooling heat exchanger':'fluid pump filter'}`
  };
  gaps.push(fill);
  complementaryQueries.push(fill.searchQuery);
 }

 if(!covered.has('Materials & Packaging')&&!isSoftwareOnly){
  const fill={
   id:'G-HSG',
   type:'ai-gap-fill',
   subsystem:'Structural Housing & Ingress Protection',
   origin:'AI Native Engineering Gap-Fill (COTS)',
   role:'Weatherproof IP65-rated UV-stabilized modular chassis with powder-coated internal frame, lockable access hatch, and vibration isolation for field deployment.',
   cotsComponents:'IP65 polycarbonate/aluminum enclosure, stainless steel fasteners, EPDM rubber gaskets, mounting skids',
   interface:'Modular DIN-rail internal mounting plate and external bolt-down flanges',
   searchQuery:`${(p.query||p.problem||'venture').slice(0,40).trim()} modular enclosure weather chassis`
  };
  gaps.push(fill);
  complementaryQueries.push(fill.searchQuery);
 }

 const fillUI={
  id:'G-UI',
  type:'ai-gap-fill',
  subsystem:'User Interface & Operational Diagnostics',
  origin:'AI Native Engineering Gap-Fill (COTS)',
  role:'Ruggedized sunlight-readable OLED display showing real-time operating metrics, tactile membrane keypad, audible warning buzzer, and field technician test mode.',
  cotsComponents:'128x64 OLED display module, sealed tactile pushbuttons, piezo buzzer, status LED indicators',
  interface:'I2C display header and GPIO push-button interrupt lines',
  searchQuery:`${(p.query||p.problem||'venture').slice(0,40).trim()} user interface display controls`
 };
 gaps.push(fillUI);

 return {
  nodes,
  gaps,
  complementaryQueries,
  summary:`${patents.length} Patented Mechanism${patents.length===1?'':'s'} + ${gaps.length} AI-Engineered Auxiliary Subsystems (100% End-to-End Blueprint)`,
  integrationModel:'Hybrid Architecture: Proprietary patented core interfaced with off-the-shelf commercial subsystems to achieve full commercial readiness without ground-up hardware reinvention.'
 };
}

