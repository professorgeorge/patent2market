import {normalizePatent} from '../dist/patents.js';
export function lensRecord(d){
 const url='https://www.lens.org/lens/patent/'+encodeURIComponent(d.lens_id||'');
 const pick=a=>(a?.find(x=>x.lang?.toLowerCase()==='en')||a?.[0]);
 const description=d.description?.text||'',claims=(pick(d.claims)?.claims||[]).flatMap(c=>c.claim_text||[]).join('\n');
 const status=d.legal_status?.patent_status||'UNKNOWN',date=new Date().toISOString().slice(0,10);
 return normalizePatent({id:[d.jurisdiction,d.doc_number,d.kind].join(''),title:pick(d.biblio?.invention_title)?.text||d.doc_key||'Untitled patent',description:pick(d.abstract)?.text||description.slice(0,3000),url,category:'Worldwide patent',jurisdiction:d.jurisdiction,retrievedAt:date,source:'Lens API',fullTextAvailable:!!description&&!!claims,fullTextURL:url,fullTextEvidence:description&&claims?'Description and claims returned by Lens; translations and drawings may require source review.':'',claimsExcerpt:claims.slice(0,6000),access:status==='EXPIRED'?'expired':'unknown',statusLabel:status,basisOrigin:'source-reported',accessURL:url,accessEvidence:'Lens calculated status: '+status+'. Confirm the official register and related family rights; calculated status can be inaccurate.',checkedAt:date});
}
const patentBuckets=new Map();
export async function handlePatents(request,env,fetcher=fetch){
 const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(request.method==='GET')return respond({enabled:!!env.LENS_API_TOKEN,provider:'Lens',scope:'Worldwide coverage varies by jurisdiction. An approved Lens API account is required; provider terms and charges apply.'});
 if(request.method!=='POST')return respond({error:'Use POST'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return respond({error:'Same-origin requests only'},403);
 if(!env.LENS_API_TOKEN)return respond({error:'Live worldwide search is not configured. Use the worldwide search links and import a document, or ask the host to configure an approved Lens API token.'},503);
 const now=Date.now(),key=request.headers.get('CF-Connecting-IP')||'local';for(const [k,v]of patentBuckets)if(now-v.at>60000)patentBuckets.delete(k);const bucket=patentBuckets.get(key)||{at:now,n:0};if(bucket.n++>=6)return respond({error:'Please wait a minute before searching again.'},429);patentBuckets.set(key,bucket);
 try{const raw=await request.text();if(raw.length>4000)return respond({error:'Search is too long'},413);const {query}=JSON.parse(raw);if(typeof query!=='string'||!query.trim()||query.length>600)return respond({error:'Enter up to 600 characters of search terms'},400);
 const response=await fetcher('https://api.lens.org/patent/search',{method:'POST',headers:{Authorization:'Bearer '+env.LENS_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query:{match:{full_text:query}},size:30}),signal:AbortSignal.timeout(30000),redirect:'error'});
 if(!response.ok)return respond({error:'Patent provider returned HTTP '+response.status+'. Check API access or quota.'},502);
 const body=await response.json();return respond({records:(body.data||[]).map(lensRecord).filter(Boolean),scope:'First 30 provider matches; local filters may exclude some. Not an exhaustive search.',retrievedAt:new Date().toISOString()});
 }catch{return respond({error:'Worldwide search could not complete. Retry or use the external search links.'},502);}
}
