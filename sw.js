// 수술실 생존일기 - 오프라인용 서비스 워커
// 앱 파일을 저장해 두었다가 인터넷이 없어도 열리게 하고, 새 버전은 뒤에서 받아 둡니다.
// ⚠️ index.html 등 앱 파일을 고쳐서 올릴 때마다 아래 버전을 그날 날짜로 바꿔 주세요.
//    (같은 날 두 번 이상 올리면 뒤에 -2, -3 …을 붙이기. 예: "survival-diary-2026-11-25-3")
//    이 줄이 바뀌어야 설치된 앱이 새 버전을 알아채고 바로 바꿔 끼웁니다.
const CACHE = "survival-diary-2026-11-25-6";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // 파일 하나가 없어도 나머지는 저장되도록 하나씩 저장
    await Promise.all(FILES.map(async f => { try { await c.add(new Request(f, { cache: "reload" })); } catch (err) {} }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    let hit = await cache.match(req, { ignoreSearch: true });
    // 주소가 조금 달라도(주소 끝 / 유무 등) 앱 화면은 저장해 둔 index.html로 열기
    if (!hit && req.mode === "navigate") hit = (await cache.match("./index.html")) || (await cache.match("./"));
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    if (hit) { e.waitUntil(net); return hit; }
    return net;
  })());
});
