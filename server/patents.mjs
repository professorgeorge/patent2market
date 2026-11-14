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
 return normalizePatent({id:String(row[1]),title:clean(row[2]),description:clean(row[3]),category:clean(row[5]),jurisdiction:'US',url:'https://technology.nasa.gov/patent/'+encodeURIComponent(row[1]),source:'NASA Technology Transfer live API',retrievedAt:new Date().toISOString().slice(0,10),access:'unknown',statusLabel:'Licensing terms require review',fullTextAvailable:false});
}
const patentBuckets=new Map();
export async function handlePatents(request,env,fetcher=fetch){
 const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(request.method==='GET')return respond({enabled:!!env.LENS_API_TOKEN,sources:[{id:'lens',enabled:!!env.LENS_API_TOKEN},{id:'nasa',enabled:true}]});
 if(request.method!=='POST')return respond({error:'Use POST'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return respond({error:'Same-origin requests only'},403);
 const now=Date.now(),key=request.headers.get('CF-Connecting-IP')||'local';for(const [k,v]of patentBuckets)if(now-v.at>60000)patentBuckets.delete(k);const bucket=patentBuckets.get(key)||{at:now,n:0};if(bucket.n++>=6)return respond({error:'Please wait a minute before searching again.'},429);patentBuckets.set(key,bucket);
 try{const raw=await request.text();if(raw.length>8000)return respond({error:'Search is too long'},413);const {query,source='lens',apiKey}=JSON.parse(raw);if(typeof query!=='string'||!query.trim()||query.length>600)return respond({error:'Enter up to 600 characters of search terms'},400);
 if(!['lens','nasa'].includes(source))return respond({error:'Choose an integrated search source or open the external source website.'},400);
 let response;
 if(source==='nasa')response=await fetcher('https://technology.nasa.gov/api/api/patent/'+encodeURIComponent(query),{signal:AbortSignal.timeout(30000),redirect:'error'});
 else{const token=typeof apiKey==='string'?apiKey.trim():env.LENS_API_TOKEN;if(!token)return respond({error:'Lens requires an approved API token. Enter yours in source settings or choose another source.'},503);if(token.length>4096||/[\r\n]/.test(token))return respond({error:'Invalid Lens token'},400);response=await fetcher('https://api.lens.org/patent/search',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query:{match:{full_text:query}},size:30}),signal:AbortSignal.timeout(30000),redirect:'error'});}
 if(!response.ok)return respond({error:'Patent provider returned HTTP '+response.status+'. Check availability, API access or quota.'},502);
 const body=await response.json();return respond({records:source==='nasa'?(body.results||[]).slice(0,50).map(nasaRecord).filter(Boolean):(body.data||[]).map(lensRecord).filter(Boolean),scope:source==='nasa'?'Up to 50 live NASA technology summaries. Full claims must be reviewed separately.':'First 30 live Lens matches; coverage varies.',retrievedAt:new Date().toISOString()});
 }catch{return respond({error:'Fresh source search could not complete. Retry or choose another source.'},502);}
}
