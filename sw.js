const CACHE_NAME='mayer-distribution-v1.12';
const APP_FILES=[
 './','./index.html','./manifest.json','./favicon.ico',
 './icons/icon-192.png','./icons/icon-512.png',
 './icons/apple-touch-icon.png','./icons/favicon-32.png','./icons/favicon-48.png'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys
   .filter(key=>key==='program-transport-v1.1'||(key.startsWith('mayer-distribution-')&&key!==CACHE_NAME))
   .map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET') return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin) return;

 // Pentru navigari, verifica intai serverul ca versiunile noi sa fie preluate
 // fara refresh fortat. Daca nu exista conexiune, foloseste copia locala.
 if(request.mode==='navigate'){
   event.respondWith(fetch(request,{cache:'no-cache'}).then(response=>{
     if(response&&response.ok){
       const copy=response.clone();
       caches.open(CACHE_NAME).then(async cache=>{
         await cache.put(request,copy.clone());
         await cache.put('./index.html',copy);
       });
     }
     return response;
   }).catch(async()=>{
     return await caches.match(request)||await caches.match('./index.html')||Response.error();
   }));
   return;
 }

 // Resursele statice raman cache-first pentru performanta si utilizare offline.
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
   if(response&&response.ok) { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)); }
   return response;
 }).catch(()=>caches.match('./index.html'))));
});
