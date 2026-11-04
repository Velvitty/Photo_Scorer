/* Velvitty PWA controls. No analytics; application files remain in the browser. */
(() => {
  'use strict';
  if (!/^https?:$/.test(location.protocol) || !('serviceWorker' in navigator)) return;
  const ownScript = document.currentScript;
  const base = new URL('./', ownScript.src);
  const english = () => document.documentElement.lang.startsWith('en');
  const words = (ko, en) => english() ? en : ko;
  let installEvent = null;
  let registration = null;
  let reloading = false;
  let ready = false;
  const CONNECTION_MESSAGE = "인터넷 연결 상태가 불안정하여 어플리케이션을 실행할 수 없습니다. 네트워크 환경을 확인해 주세요.";
  function connectionError() {
    if (document.querySelector('velvitty-pwa-connection-error')) return;
    const overlay = document.createElement('velvitty-pwa-connection-error');
    const root = overlay.attachShadow({mode: 'open'});
    root.innerHTML = "<style>:host{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;box-sizing:border-box;padding:28px;background:#181818;color:#fff;font:16px/1.7 system-ui,-apple-system,\"Noto Sans KR\",sans-serif;text-align:center;isolation:isolate}\n*{box-sizing:border-box}.app-backdrop{position:fixed;inset:-5px;z-index:-2;width:calc(100% + 10px);height:calc(100% + 10px);border:0;pointer-events:none;opacity:.7;filter:none;background:#181818}.scene{position:fixed;inset:0;z-index:-1;background:#0008;pointer-events:none}\n.glass{position:relative;width:min(620px,100%);padding:38px 42px 34px;border:1px solid #ffffff66;border-radius:30px;background:linear-gradient(135deg,#ffffff21,#ffffff08 48%,#ffffff16);backdrop-filter:blur(8px) saturate(110%);-webkit-backdrop-filter:blur(8px) saturate(110%);box-shadow:0 24px 65px #0004,inset 1px 1px 0 #ffffff80,inset -1px -1px 0 #ffffff1c;pointer-events:none;filter:none;opacity:1}.glass:before{content:\"\";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(118deg,#ffffff26,transparent 27%,transparent 69%,#ffffff08)}.brand{position:relative;margin:0 0 28px;color:#eee;font-size:13px;font-weight:500;letter-spacing:.04em;overflow-wrap:anywhere;text-shadow:0 1px 3px #0004}.symbol{position:relative;display:grid;place-items:center;width:72px;height:72px;margin:0 auto 26px;border:1px solid #ffffff48;border-radius:23px;background:#ffffff0c;box-shadow:inset 0 1px 0 #ffffff40;color:#fff}.symbol svg{width:32px;height:32px}.primary{position:relative;margin:0;font-size:clamp(18px,2.8vw,23px);line-height:1.75;font-weight:600;letter-spacing:-.04em;word-break:keep-all;overflow-wrap:anywhere;text-shadow:0 1px 5px #0005}.secondary{position:relative;margin:20px 0 29px;color:#eee;font-size:15px;line-height:1.75;word-break:keep-all;text-shadow:0 1px 4px #0004}.retry-note{position:relative;margin:27px 0 0;color:#ddd;font-size:12px;line-height:1.8;word-break:keep-all;letter-spacing:-.02em;text-shadow:0 1px 3px #0004}.retry-surface{position:fixed;inset:0;z-index:2;width:100%;height:100%;margin:0;padding:0;border:0;background:transparent;cursor:pointer;outline:none}.retry-surface:focus-visible~.glass{outline:3px solid #fff;outline-offset:6px}\n@media(max-width:540px){:host{padding:20px}.glass{padding:28px 23px;border-radius:25px}.brand{margin-bottom:25px}.symbol{width:64px;height:64px;margin-bottom:23px}.secondary{font-size:14px;margin-top:17px;margin-bottom:25px}}\n</style><iframe class=\"app-backdrop\" src=\"./pwa-ui.html\" title=\"\" sandbox=\"\" tabindex=\"-1\" inert aria-hidden=\"true\"></iframe><button class=\"retry-surface\" type=\"button\" aria-label=\"연결을 다시 시도하려면 화면을 아무 곳이나 누르세요.\"></button><div class=\"scene\" aria-hidden=\"true\"></div><main class=\"glass\" role=\"alert\" aria-live=\"assertive\" aria-labelledby=\"connection-message\" aria-describedby=\"connection-guide\"><h1 class=\"brand\"></h1><div class=\"symbol\"><svg viewBox=\"0 0 32 32\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 11a20 20 0 0 1 5-3m6-1a20 20 0 0 1 13 4M8 16a13 13 0 0 1 5-2m6 0a13 13 0 0 1 5 2M12 21a7 7 0 0 1 8 0M16 26h.01M4 4l24 24\"/></svg></div><p class=\"primary\" id=\"connection-message\"></p><p class=\"secondary\" id=\"connection-guide\"></p><p class=\"retry-note\">연결을 다시 시도하려면 화면을 아무 곳이나 누르세요.</p></main>";
    const split = CONNECTION_MESSAGE.indexOf(' 네트워크');
    root.querySelector('.brand').textContent = document.title;
    root.querySelector('.primary').textContent = CONNECTION_MESSAGE.slice(0, split);
    root.querySelector('.secondary').textContent = CONNECTION_MESSAGE.slice(split + 1);
    root.querySelector('button').addEventListener('click', () => location.reload());
    for (const element of document.body.children) element.inert = true;
    document.body.append(overlay);
    root.querySelector('button').focus();
  }
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const host = document.createElement('velvitty-pwa');
  const shadow = host.attachShadow({mode: 'open'});
  shadow.innerHTML = `<style>
    :host{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:10000;font:13px/1.55 system-ui,-apple-system,sans-serif;color:#f5f5f5;text-align:left;letter-spacing:normal}
    *{box-sizing:border-box}button{font:inherit;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #c5b5ff;outline-offset:3px}
    .open{border:1px solid #ffffff3d;border-radius:99px;padding:9px 13px;background:#222128;color:#fff;box-shadow:0 3px 16px #0002;min-height:40px}
    .panel{width:min(310px,calc(100vw - 24px));margin-bottom:8px;padding:18px;border:1px solid #ffffff38;border-radius:18px;background:#24232b;box-shadow:0 8px 40px #0004}
    [hidden]{display:none!important}h2{font-size:16px;margin:0 0 9px}p{margin:8px 0;color:#dddce5}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
    .action{border:1px solid #ffffff38;border-radius:9px;background:#eee9ff;color:#24202e;padding:8px 12px;min-height:40px}.close{background:transparent;color:#fff}.status{font-size:12px;color:#c4c1d0}
    @media print{:host{display:none}}
  </style><section class="panel" id="panel" aria-labelledby="title" hidden><h2 id="title"></h2><p id="message"></p><p class="status" id="status" role="status" aria-live="polite"></p><div class="actions"><button class="action" id="install" hidden></button><button class="action" id="update" hidden></button><button class="action close" id="close"></button></div></section><button class="open" id="open" aria-expanded="false" aria-controls="panel"></button>`;
  const $ = id => shadow.getElementById(id);
  function draw() {
    $('title').textContent = words('앱으로 사용하기', 'Use as an app');
    $('open').textContent = registration?.waiting ? words('새 버전 있음', 'Update available') : words('앱 설치', 'Install app');
    $('open').hidden = standalone() && !registration?.waiting;
    $('install').hidden = !installEvent || standalone();
    $('install').textContent = words('설치하기', 'Install');
    $('update').hidden = !registration?.waiting;
    $('update').textContent = words('저장 후 업데이트', 'Update after saving');
    $('close').textContent = words('닫기', 'Close');
    $('message').textContent = registration?.waiting
      ? words('새 버전이 준비되었습니다. 작업을 저장한 뒤 업데이트해 주세요. 화면이 새로고침됩니다.', 'A new version is ready. Save your work before updating; the page will reload.')
      : installEvent
        ? words('이 도구를 독립된 앱 창에서 열 수 있습니다.', 'Open this tool in its own app window.')
        : words('브라우저 메뉴의 앱 설치 또는 홈 화면에 추가를 이용해 주세요. iPhone·iPad에서는 공유 메뉴에서 홈 화면에 추가를 선택할 수 있습니다.', 'Use Install app or Add to Home Screen in your browser menu. On iPhone and iPad, use Share, then Add to Home Screen.');
    $('status').textContent = !navigator.onLine
      ? CONNECTION_MESSAGE
      : ready
        ? words('앱 설치 준비가 완료되었습니다. 실행하려면 인터넷 연결이 필요합니다.', 'The app is ready to install. An internet connection is required to launch it.')
        : words('앱 설치를 준비하고 있습니다.', 'Preparing app installation.');
  }
  function close() { $('panel').hidden = true; $('open').setAttribute('aria-expanded', 'false'); $('open').focus(); }
  $('open').addEventListener('click', () => { const open = $('panel').hidden; $('panel').hidden = !open; $('open').setAttribute('aria-expanded', String(open)); if(open) $('close').focus(); });
  $('close').addEventListener('click', close);
  shadow.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  $('install').addEventListener('click', async () => {
    if (!installEvent) return;
    const event = installEvent;
    installEvent = null;
    try { await event.prompt(); await event.userChoice; } catch (_) { /* Menu installation remains available. */ }
    draw();
  });
  $('update').addEventListener('click', () => { if (registration?.waiting) { reloading = true; registration.waiting.postMessage({type: 'SKIP_WAITING'}); } });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) { reloading = false; location.reload(); } });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installEvent = event; draw(); });
  window.addEventListener('appinstalled', () => { installEvent = null; $('panel').hidden = true; draw(); });
  window.addEventListener('online', draw);
  window.addEventListener('offline', draw);
  window.addEventListener('pageshow', event => { if (event.persisted && !navigator.onLine) connectionError(); });
  new MutationObserver(draw).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  matchMedia('(display-mode: standalone)').addEventListener?.('change', draw);
  async function start() {
    if (!navigator.onLine) { connectionError(); return; }
    if (document.querySelector('velvitty-pwa')) return;
    if (window.top === window) document.body.append(host);
    draw();
    try {
      registration = await navigator.serviceWorker.register(new URL('sw.js', base), {scope: base.href, updateViaCache: 'none'});
      draw();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') { if (!registration.waiting) ready = true; draw(); } });
      });
      const active = await navigator.serviceWorker.ready;
      if (active.scope === registration.scope) { ready = true; active.active?.postMessage({type: 'REFRESH_UI'}); draw(); }
    } catch (_) {
      $('status').textContent = words('앱 설치 준비를 마치지 못했습니다. 연결 상태에서 다시 열어 주세요.', 'App installation setup did not finish. Reopen while connected.');
    }
  }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, {once: true});
})();
