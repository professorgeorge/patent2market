const CACHE='patent2market-v5.1';
const ASSETS=['./','./index.html','./explorer.html','./core.js','./venture.js','./venture.css','./venture-core.js','./prompts.js','./ai-client.js','./patents.js','./word-export.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('patent2market-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 event.respondWith(
  fetch(event.request)
   .then(res=>{
    if(res.ok){
     const clone=res.clone();
     caches.open(CACHE).then(cache=>cache.put(event.request,clone));
    }
    return res;
   })
   .catch(()=>caches.match(event.request))
 );
});
