// importScripts
// （'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js' ）;
if (workbox) {
	console.log(`Yay! Workbox is loaded 🎉`);
} else {
	console.log(`Boo! Workbox didn't load 😬`);
}



// a 定义cache名称
const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

// func_1 定义资源，用于手动缓存
const FILES_TO_CACHE = [
	'/offline.html'
];

// func_2 workbox管理资源缓存
// Workbox中注册一条路由，该路由将匹配.js所请求的任何文件
workbox.routing.registerRoute(
	new RegExp('.+(?<!.html)$'), new workbox.strategies.NetworkFirst({
	    // Use a custom cache name.
	    cacheName: DATA_CACHE_NAME,
	  }) 
);
workbox.routing.registerRoute(
	  new RegExp('.html$'),
	  new workbox.strategies.NetworkFirst({cacheName: CACHE_NAME,})
);

// 修改 install 事件以告知 Service Worker 预先缓存离线页面
self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  // CODELAB: Precache static resources here.
  evt.waitUntil(
	    caches.open(CACHE_NAME).then((cache) => {
	      console.log('[ServiceWorker] Pre-caching offline page');
	      return cache.addAll(FILES_TO_CACHE);
	    })
	);
  self.skipWaiting();
});

// cache清除
self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // CODELAB: Remove previous cached data from disk.
  evt.waitUntil(
	    caches.keys().then((keyList) => {
	      return Promise.all(keyList.map((key) => {
	        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
	          console.log('[ServiceWorker] Removing old cache', key);
	          return caches.delete(key);
	        }
	      }));
	    })
	);
  self.clients.claim();
});

// request 监听请求事件并处理
self.addEventListener('fetch', (evt) => {
	console.log("地址："+evt.request.url);
	var re = /.+(?<!.html)$/;
	// step1:过滤非html资源请求
	if (re.test(evt.request.url)) {
		  console.log('[Service Worker] Fetch (data)', evt.request.url);
		  evt.respondWith(
		      caches.open(DATA_CACHE_NAME).then((cache) => {
		        return fetch(evt.request)
		            .then((response) => {
		              // If the response was good, clone it and store it in
						// the cache.
		              if (response.status === 200) {
		                cache.put(evt.request.url, response.clone());
		              }
		              return response;
		            }).catch((err) => {
		              // Network request failed, try to get it from the cache.
		              return cache.match(evt.request);
		            });
		      }));
		  return;
		}
	// setp2: 过滤html请求
	evt.respondWith(
	    caches.open(CACHE_NAME).then((cache) => {
	      return cache.match(evt.request)
	          .then((response) => {
	            return response || fetch(evt.request);
	          });
	    })
	);
});


