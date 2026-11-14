import {normalizePatent} from '../dist/patents.js';

export function lensRecord(d){
 const url='https://www.lens.org/lens/patent/'+encodeURIComponent(d.lens_id||'');
 const pick=a=>(a?.find(x=>x.lang?.toLowerCase()==='en')||a?.[0]);
 const description=d.description?.text||'',claims=(pick(d.claims)?.claims||[]).flatMap(c=>c.claim_text||[]).join('\n');
 const status=d.legal_status?.patent_status||'UNKNOWN',date=new Date().toISOString().slice(0,10);
 return normalizePatent({id:[d.jurisdiction,d.doc_number,d.kind].join(''),title:pick(d.biblio?.invention_title)?.text||d.doc_key||'Untitled patent',description:pick(d.abstract)?.text||description.slice(0,3000),url,category:'Worldwide patent',jurisdiction:d.jurisdiction,retrievedAt:date,source:'Lens API',fullTextAvailable:!!description&&!!claims,fullTextURL:url,fullTextEvidence:description&&claims?'Description and claims returned by Lens; translations and drawings may require source review.':'',claimsExcerpt:claims.slice(0,6000),access:status==='EXPIRED'?'expired':'unknown',statusLabel:status,basisOrigin:'source-reported',accessURL:url,accessEvidence:'Lens calculated status: '+status+'. Confirm the official register and related family rights; calculated status can be inaccurate.',checkedAt:date});
}

export function nasaRecord(row){
 const clean=v=>String(v||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
 if(!Array.isArray(row)||!row[1]||!row[2])return null;
 const img=typeof row[10]==='string'&&row[10].startsWith('http')?row[10]:'';
 return normalizePatent({id:String(row[1]),title:clean(row[2]),description:clean(row[3]),category:clean(row[5]),jurisdiction:'US',url:'https://technology.nasa.gov/patent/'+encodeURIComponent(row[1]),source:'NASA Technology Transfer live API',retrievedAt:new Date().toISOString().slice(0,10),access:'unknown',statusLabel:'Licensing terms require review',fullTextAvailable:false,imageUrl:img});
}

export function googleRecord(p){
 if(!p||typeof p!=='object')return null;
 const pubNum=p.publication_number||(typeof p.id==='string'?p.id.replace(/^patent\//,'').replace(/\/.*$/,''):'')||'';
 if(!pubNum)return null;
 const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&hellip;/g,'...').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
 const title=clean(p.title)||pubNum;
 const snippet=clean(p.snippet);
 const jur=pubNum.slice(0,2).toUpperCase()||'US';
 const statusList=p.family_metadata?.aggregated?.country_status||[];
 const statusObj=statusList.find(s=>s.country_code===jur)||statusList[0];
 const state=statusObj?.best_patent_stage?.state||'UNKNOWN';
 const patentUrl='https://patents.google.com/patent/'+encodeURIComponent(pubNum)+'/en';
 const date=p.publication_date||new Date().toISOString().slice(0,10);
 const isExpired=state==='NOT_ACTIVE';
 return normalizePatent({
  id:pubNum,
  title,
  description:snippet||'Patent document '+pubNum+' retrieved from Google Patents.',
  url:patentUrl,
  category:'Worldwide patent',
  jurisdiction:jur,
  retrievedAt:new Date().toISOString().slice(0,10),
  source:'Google Patents',
  fullTextAvailable:true,
  fullTextURL:patentUrl,
  fullTextEvidence:`Full patent text, claims, and original PDF available on Google Patents for ${pubNum}.`,
  claimsExcerpt:snippet.slice(0,6000),
  access:isExpired?'expired':'unknown',
  statusLabel:state==='ACTIVE'?'Active / In Force':state==='NOT_ACTIVE'?'Not Active / Expired / Lapsed':'Status requires official register review',
  basisOrigin:'source-reported',
  accessURL:patentUrl,
  accessEvidence:`Google Patents legal status indicator: ${state}. Confirm official patent office register (${jur}) before commercial use.`,
  checkedAt:date
 });
}

export function bigqueryRecord(row){
 if(!row||typeof row!=='object')return null;
 const pubNum=row.publication_number||'';
 if(!pubNum)return null;
 const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&hellip;/g,'...').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
 const title=clean(row.title)||pubNum;
 const abstract=clean(row.abstract);
 const jur=row.country_code||pubNum.slice(0,2).toUpperCase()||'US';
 const url='https://patents.google.com/patent/'+encodeURIComponent(pubNum)+'/en';
 const date=row.publication_date?String(row.publication_date):new Date().toISOString().slice(0,10);
 return normalizePatent({
  id:pubNum,
  title,
  description:abstract||'Patent document '+pubNum+' from Google Patents Public BigQuery Dataset.',
  url,
  category:'Worldwide patent (BigQuery)',
  jurisdiction:jur,
  retrievedAt:new Date().toISOString().slice(0,10),
  source:'Google Patents Public Dataset (BigQuery)',
  fullTextAvailable:true,
  fullTextURL:url,
  fullTextEvidence:`Record retrieved from Google Patents BigQuery table patents-public-data.patents.publications (${pubNum}).`,
  claimsExcerpt:abstract.slice(0,6000),
  access:'unknown',
  statusLabel:'Status requires official register review',
  basisOrigin:'source-reported',
  accessURL:url,
  accessEvidence:`Google Patents BigQuery publication date: ${date}. Confirm official patent office register before use.`,
  checkedAt:date
 });
}

const patentBuckets=new Map();

const CONCEPT_MAP={
 tomato:['food','cooling','storage','agriculture'],
 spoilage:['food','cooling','storage','preservation'],
 crop:['agriculture','harvest','storage'],
 crops:['agriculture','harvest','storage'],
 farmer:['agriculture','irrigation','cooling'],
 farmers:['agriculture','irrigation','cooling'],
 cold:['cooling','thermal','refrigeration'],
 refrigeration:['cooling','thermal'],
 purification:['water','filtration','filter'],
 purifier:['water','filtration','filter'],
 clean:['water','filtration'],
 drinking:['water','filtration'],
 power:['energy','battery','solar'],
 electricity:['energy','power','solar'],
 electric:['energy','battery','motor'],
 solar:['energy','power','thermal'],
 waste:['recycling','plastic','biomass'],
 plastic:['recycling','waste','materials'],
 health:['medical','sensor','detection'],
 diagnostic:['medical','sensor','optical'],
 disease:['sensor','detection','medical'],
 packaging:['materials','container','barrier'],
 irrigation:['water','pump','agriculture'],
 heat:['thermal','cooling','insulation'],
 battery:['energy','power','storage'],
 drone:['uav','autonomous','aircraft'],
 school:['education','software','display'],
 vehicle:['transport','automotive','propulsion']
};

const BROWSER_HEADERS={
 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
 'Accept':'application/json, text/plain, */*',
 'Accept-Language':'en-US,en;q=0.9',
 'Sec-Fetch-Dest':'empty',
 'Sec-Fetch-Mode':'cors',
 'Sec-Fetch-Site':'same-origin'
};

export async function fetchNasaWithFallback(query, fetcher){
 let results=[];
 const seen=new Set();
 const addRows=rows=>{
  for(const row of (rows||[])){
   if(Array.isArray(row)&&row[1]&&!seen.has(row[1])){
    seen.add(row[1]);
    results.push(row);
   }
  }
 };
 try{
  const res=await fetcher('https://technology.nasa.gov/api/api/patent/'+encodeURIComponent(query.trim()),{headers:{'User-Agent':BROWSER_HEADERS['User-Agent'],'Accept':'application/json'},signal:AbortSignal.timeout(15000),redirect:'follow'});
  if(res.ok){
   const body=await res.json();
   addRows(body.results);
  }
 }catch{}

 if(results.length<20){
  const words=String(query).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2);
  const terms=[];
  for(const w of words){
   if(CONCEPT_MAP[w])terms.push(...CONCEPT_MAP[w]);
   else if(w.length>3)terms.push(w);
  }
  const uniqueTerms=[...new Set(terms)].slice(0,5);
  for(const term of uniqueTerms){
   try{
    const r=await fetcher('https://technology.nasa.gov/api/api/patent/'+encodeURIComponent(term),{headers:{'User-Agent':BROWSER_HEADERS['User-Agent'],'Accept':'application/json'},signal:AbortSignal.timeout(10000),redirect:'follow'});
    if(r.ok){
     const b=await r.json();
     addRows(b.results);
    }
   }catch{}
   if(results.length>=50)break;
  }
 }
 return results;
}

export async function handlePatents(request,env,fetcher=fetch){
 const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 const bqConfigured=!!(env.BIGQUERY_PROJECT_ID||env.BIGQUERY_API_KEY||env.GOOGLE_APPLICATION_CREDENTIALS||env.BIGQUERY_TOKEN);
 if(request.method==='GET')return respond({
  enabled:!!env.LENS_API_TOKEN,
  sources:[
   {id:'google',enabled:true,label:'Google Patents (Worldwide live search · Default)'},
   {id:'all',enabled:true,label:'All Available Sources (Google Patents + NASA)'},
   {id:'nasa',enabled:true,label:'NASA Technology Transfer (Live search)'},
   {id:'bigquery',enabled:bqConfigured,label:'Google Patents Public Datasets (BigQuery)'},
   {id:'lens',enabled:!!env.LENS_API_TOKEN,label:'Lens API'}
  ]
 });
 if(request.method!=='POST')return respond({error:'Use POST'},405);
 const origin=request.headers.get('Origin')||request.headers.get('origin');
 const reqUrl=new URL(request.url);
 const host=(request.headers.get('Host')||reqUrl.host).toLowerCase();
 let originMatches=false;
 if(origin){
  try{
   const originUrl=new URL(origin);
   originMatches=(origin===reqUrl.origin)||(originUrl.host.toLowerCase()===host);
  }catch{}
 }
 if(!originMatches)return respond({error:'Same-origin requests only'},403);
 const now=Date.now(),key=request.headers.get('CF-Connecting-IP')||'local';for(const [k,v]of patentBuckets)if(now-v.at>60000)patentBuckets.delete(k);const bucket=patentBuckets.get(key)||{at:now,n:0};if(bucket.n++>=30)return respond({error:'Please wait a minute before searching again.'},429);patentBuckets.set(key,bucket);
 try{
  const raw=await request.text();if(raw.length>8000)return respond({error:'Search is too long'},413);
  const {query,source='lens',apiKey,projectId}=JSON.parse(raw);
  if(typeof query!=='string'||!query.trim()||query.length>600)return respond({error:'Enter up to 600 characters of search terms'},400);
  if(!['google','all','bigquery','lens','nasa'].includes(source))return respond({error:'Choose an integrated search source or open the external source website.'},400);
  let response;
  if(source==='all'){
   const [googleRes,nasaRes]=await Promise.allSettled([
    (async()=>{
     try{
      const qUrl='https://patents.google.com/xhr/query?url='+encodeURIComponent('q='+query.trim()+'&num=30');
      const r=await fetcher(qUrl,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36','Accept':'application/json'},signal:AbortSignal.timeout(15000)});
      if(!r.ok)return [];
      const body=await r.json();
      return (body.results?.cluster||[]).flatMap(c=>c.result||[]).map(x=>x.patent).filter(Boolean).map(googleRecord).filter(Boolean);
     }catch{return [];}
    })(),
    (async()=>{
     try{
      const nasaRows=await fetchNasaWithFallback(query,fetcher);
      return nasaRows.slice(0,30).map(nasaRecord).filter(Boolean);
     }catch{return [];}
    })()
   ]);
   const gRecords=googleRes.status==='fulfilled'?googleRes.value:[];
   const nRecords=nasaRes.status==='fulfilled'?nasaRes.value:[];
   const seen=new Set();
   const records=[];
   const maxLen=Math.max(gRecords.length,nRecords.length);
   for(let i=0;i<maxLen;i++){
    if(i<gRecords.length&&!seen.has(gRecords[i].id)){seen.add(gRecords[i].id);records.push(gRecords[i]);}
    if(i<nRecords.length&&!seen.has(nRecords[i].id)){seen.add(nRecords[i].id);records.push(nRecords[i]);}
   }
   return respond({records:records.slice(0,60),scope:`Unified search across all available sources (Google Patents & NASA): ${records.length} leads retrieved.`,retrievedAt:new Date().toISOString()});
  }else if(source==='nasa'){
   const results=await fetchNasaWithFallback(query, fetcher);
   const records=results.slice(0,50).map(nasaRecord).filter(Boolean);
   return respond({records,scope:`Up to 50 live NASA technology transfer records (${records.length} matching leads).`,retrievedAt:new Date().toISOString()});
  }else if(source==='google'){
   let records=[],scope='',googleStatus=0,googleErr='';
   try{
    const qUrl='https://patents.google.com/xhr/query?url='+encodeURIComponent('q='+query.trim()+'&num=30');
    response=await fetcher(qUrl,{headers:BROWSER_HEADERS,signal:AbortSignal.timeout(15000),redirect:'follow'});
    googleStatus=response.status;
    if(response.ok){
     const body=await response.json();
     const clusters=body.results?.cluster||[];
     records=clusters.flatMap(c=>c.result||[]).map(r=>r.patent).filter(Boolean).map(googleRecord).filter(Boolean);
     if(records.length)scope='Up to 30 live Google Patents worldwide matches with full text and legal status indicators.';
    }
   }catch(e){googleErr=e.message;}
   if(!records.length){
    // Fall back to NASA live search with concept expansion
    const nasaResults=await fetchNasaWithFallback(query, fetcher);
    records=nasaResults.slice(0,50).map(nasaRecord).filter(Boolean);
    scope=records.length?`Retrieved from NASA Technology Transfer live API (Google: ${googleStatus||googleErr}).`:`Search returned 0 leads (Google: ${googleStatus||googleErr}). Try another term or open Google Patents directly.`;
   }
   return respond({records,scope,retrievedAt:new Date().toISOString()});
  }else if(source==='bigquery'){
   const bqProject=projectId||env.BIGQUERY_PROJECT_ID;
   const bqToken=apiKey||env.BIGQUERY_TOKEN||env.BIGQUERY_API_KEY;
   if(!bqProject)return respond({error:'BigQuery search requires a Google Cloud project ID. Enter your project ID in BigQuery settings or configure BIGQUERY_PROJECT_ID.'},503);
   const bqSql=`SELECT publication_number, country_code, (SELECT text FROM UNNEST(title_localized) WHERE language = 'en' LIMIT 1) as title, (SELECT text FROM UNNEST(abstract_localized) WHERE language = 'en' LIMIT 1) as abstract, publication_date FROM \`patents-public-data.patents.publications\` WHERE (LOWER((SELECT text FROM UNNEST(title_localized) WHERE language = 'en' LIMIT 1)) LIKE @term OR LOWER((SELECT text FROM UNNEST(abstract_localized) WHERE language = 'en' LIMIT 1)) LIKE @term) ORDER BY publication_date DESC LIMIT 30`;
   const bqUrl=`https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(bqProject)}/queries${bqToken&&!bqToken.startsWith('Bearer')&&!bqToken.includes('.')?'?key='+encodeURIComponent(bqToken):''}`;
   const bqHeaders={'Content-Type':'application/json'};
   if(bqToken&&(bqToken.startsWith('Bearer')||bqToken.includes('.')))bqHeaders.Authorization=bqToken.startsWith('Bearer')?bqToken:'Bearer '+bqToken;
   response=await fetcher(bqUrl,{method:'POST',headers:bqHeaders,body:JSON.stringify({query:bqSql,queryParameters:[{name:'term',parameterType:{type:'STRING'},parameterValue:{value:'%'+query.trim().toLowerCase()+'%'}}],useLegacySql:false}),signal:AbortSignal.timeout(30000)});
   if(!response.ok)return respond({error:'BigQuery provider returned HTTP '+response.status+'. Check GCP project, API access or quota.'},502);
   const body=await response.json();
   const rows=body.rows||[];
   const schema=body.schema?.fields?.map(f=>f.name)||['publication_number','country_code','title','abstract','publication_date'];
   const records=rows.map(r=>{const obj={};(r.f||[]).forEach((val,i)=>{obj[schema[i]]=val?.v;});return bigqueryRecord(obj);}).filter(Boolean);
   return respond({records,scope:'Google Patents Public Dataset records retrieved from BigQuery patents-public-data.patents.publications.',retrievedAt:new Date().toISOString()});
  }else{
   const token=typeof apiKey==='string'?apiKey.trim():env.LENS_API_TOKEN;
   if(!token)return respond({error:'Lens requires an approved API token. Enter yours in source settings or choose another source.'},503);
   if(token.length>4096||/[\r\n]/.test(token))return respond({error:'Invalid Lens token'},400);
   response=await fetcher('https://api.lens.org/patent/search',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query:{match:{full_text:query}},size:30}),signal:AbortSignal.timeout(30000),redirect:'error'});
   if(!response.ok)return respond({error:'Patent provider returned HTTP '+response.status+'. Check availability, API access or quota.'},502);
   const body=await response.json();
   const records=(body.data||[]).map(lensRecord).filter(Boolean);
   return respond({records,scope:'First 30 live Lens matches; coverage varies.',retrievedAt:new Date().toISOString()});
  }
 }catch{
  return respond({error:'Fresh source search could not complete. Retry or choose another source.'},502);
 }
}
