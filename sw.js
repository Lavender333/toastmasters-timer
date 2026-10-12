'use strict';
const CACHE='toasty-timer-app-v1';
const FILES=['./','index.html','about.html','thanks.html','style.css','app.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-180.png','assets/antoinette.jpg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('toasty-timer-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok&&response.type==='basic'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}return response}).catch(async()=>{const cached=await caches.match(event.request,{ignoreSearch:true});if(cached)return cached;return new Response('This page is unavailable offline. Open the timer while online first.',{status:503,headers:{'Content-Type':'text/plain'}})}));
});
