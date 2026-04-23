// ============================================================
//  Windows 11 Simulator - Stealth Stealth Edition (Antigravity)
// ============================================================
(function(Scratch) {
  const API_BASE = 'https://web-production-18337.up.railway.app';
  let currentUser = localStorage.getItem('win11_user') || null;
  let virtualFS = [];

  const IC = {
    start: "🪟", folder: "📁", edge: "🌐", notepad: "📝", calc: "🧮", settings: "⚙️",
    yt: "📺", ghost: "👻", lock: "🔒", user: "👤", power: "⏻"
  };

  let initialized = false;
  let windows = [];
  let zIndexBase = 1000;
  let overlay, startMenu;

  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  // --- API ---
  async function apiRequest(endpoint, method = 'GET', body = null) {
    try {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${API_BASE}${endpoint}`, opts);
      return res.json();
    } catch(e) { return { status: 'error' }; }
  }

  // --- UI Core ---
  function createDesktop() {
    if (document.getElementById('w11-overlay')) return;
    const canvas = Scratch.vm.runtime.renderer.canvas;
    const stageParent = canvas.parentElement;

    overlay = el("div", "w11-overlay");
    overlay.id = 'w11-overlay';
    overlay.style.cssText = `position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:100; font-family:'Segoe UI Variable',sans-serif;`;

    const style = el("style");
    style.innerHTML = `
      .w11-overlay * { box-sizing: border-box; pointer-events: auto; }
      .w11-taskbar { position:absolute; bottom:0; width:100%; height:48px; background:rgba(20,20,20,0.6); backdrop-filter:blur(20px); border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:center; align-items:center; z-index:9999; }
      .tb-btn { width:40px; height:40px; border:none; background:none; border-radius:4px; font-size:20px; cursor:pointer; color:white; }
      .tb-btn:hover { background:rgba(255,255,255,0.1); }
      .w11-window { position:absolute; background:rgba(30,30,30,0.85); backdrop-filter:blur(30px); border-radius:8px; border:1px solid rgba(255,255,255,0.15); box-shadow: 0 10px 40px rgba(0,0,0,0.5); display:flex; flex-direction:column; overflow:hidden; animation: w11-fade 0.2s ease-out; }
      @keyframes w11-fade { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
      .win-title { height:32px; padding:0 12px; display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.2); color:white; font-size:12px; cursor:default; }
      .win-close:hover { background:#e81123 !important; }
      .start-menu { position:absolute; bottom:58px; left:50%; transform:translateX(-50%) translateY(20px); width:500px; height:580px; background:rgba(25,25,25,0.8); backdrop-filter:blur(40px); border:1px solid rgba(255,255,255,0.1); border-radius:12px; visibility:hidden; opacity:0; transition:0.2s; z-index:9998; padding:30px; color:white; }
      .start-menu.open { visibility:visible; opacity:1; transform:translateX(-50%) translateY(0); }
    `;

    const taskbar = el("div", "w11-taskbar");
    const apps = [
      { id:'start', icon: IC.start }, { id:'explorer', icon: IC.folder },
      { id:'edge', icon: IC.edge }, { id:'yt', icon: IC.yt },
      { id:'settings', icon: IC.settings }
    ];
    apps.forEach(a => {
      const b = el("button", "tb-btn");
      b.innerHTML = a.icon;
      b.onclick = () => a.id === 'start' ? toggleStart() : openApp(a.id);
      taskbar.appendChild(b);
    });

    startMenu = el("div", "start-menu");
    startMenu.innerHTML = `
      <div style="flex:1">
        <h4 style="margin:0 0 20px 0; font-weight:400; opacity:0.8;">ピン留め済み</h4>
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:20px; text-align:center;">
          ${apps.slice(1).map(a => `<div onclick="openApp('${a.id}')" style="cursor:pointer;"><div style="font-size:32px;margin-bottom:5px;">${a.icon}</div><div style="font-size:11px;">${a.id.toUpperCase()}</div></div>`).join('')}
        </div>
      </div>
    `;

    stageParent.appendChild(style);
    overlay.appendChild(taskbar);
    overlay.appendChild(startMenu);
    stageParent.appendChild(overlay);
  }

  function toggleStart() { startMenu.classList.toggle("open"); }

  function openApp(id) {
    startMenu.classList.remove("open");
    if (id === 'edge') openEdge();
    else if (id === 'yt') openYouTube();
    else if (id === 'explorer') openExplorer();
    else if (id === 'settings') openSettings();
  }

  function createWindow({ title, icon, content, width=700, height=500 }) {
    const win = el("div", "w11-window");
    win.style.width = width + "px"; win.style.height = height + "px";
    win.style.left = (50 + windows.length * 20) + "px";
    win.style.top = (30 + windows.length * 20) + "px";
    win.style.zIndex = zIndexBase++;

    const t = el("div", "win-title");
    t.innerHTML = `<span>${icon} ${title}</span><div style="display:flex;height:100%"><button class="win-btn" style="width:46px;background:none;border:none;color:white;">－</button><button class="win-btn win-close" style="width:46px;background:none;border:none;color:white;">✕</button></div>`;
    t.querySelector('.win-close').onclick = () => { win.remove(); windows = windows.filter(w => w !== win); };

    let isDrag = false, sx, sy;
    t.onmousedown = (e) => { isDrag = true; sx = e.clientX - win.offsetLeft; sy = e.clientY - win.offsetTop; win.style.zIndex = zIndexBase++; };
    window.addEventListener("mousemove", (e) => { if(!isDrag) return; win.style.left = (e.clientX - sx) + "px"; win.style.top = (e.clientY - sy) + "px"; });
    window.addEventListener("mouseup", () => isDrag = false);

    const b = el("div"); b.style.flex = "1"; b.style.overflow = "hidden"; b.appendChild(content);
    win.appendChild(t); win.appendChild(b);
    overlay.appendChild(win); windows.push(win);
  }

  // --- Browser (Stealth Mode) ---
  function openEdge(url = "https://www.google.com/search?igu=1") {
    const c = el("div"); c.style.cssText = "height:100%; display:flex; flex-direction:column; background:#f9f9f9;";
    const tb = el("div"); tb.style.cssText = "height:40px; background:#eee; display:flex; align-items:center; padding:0 10px; gap:10px; border-bottom:1px solid #ccc;";
    let proxyMode = true; // デフォルトでプロキシ(Stealth)有効
    
    tb.innerHTML = `
      <div id="proxy-indicator" style="padding:2px 8px; background:#0078d4; color:white; font-size:10px; border-radius:10px; cursor:pointer;">VPN ON</div>
      <input id="url" value="${url}" style="flex:1; padding:4px 10px; border-radius:20px; border:1px solid #ccc; outline:none; font-size:12px;">
    `;
    const f = el("iframe"); f.style.cssText = "flex:1; border:none;";
    
    const load = (u) => {
      let finalUrl = u;
      if (!u.startsWith('http')) finalUrl = 'https://www.google.com/search?igu=1&q=' + encodeURIComponent(u);
      
      if (proxyMode) {
        // 全サイトにプロキシを適用（暗号化URL中継）
        f.src = "https://www.google.com/search?igu=1&q=" + encodeURIComponent(u); // フォールバック
        // 強力なプロキシ中継器を使用 (CroxyProxy または 独自)
        f.src = `https://api.allorigins.win/get?url=${encodeURIComponent(finalUrl)}`; // シンプルな中継例
        // 実際にはiframe対応プロキシURLを使う
        f.src = "https://www.croxyproxy.com/_jp/proxysite/go?url=" + btoa(finalUrl);
      } else {
        f.src = finalUrl;
      }
    };
    
    tb.querySelector('#url').onkeydown = (e) => { if(e.key === 'Enter') load(e.target.value); };
    tb.querySelector('#proxy-indicator').onclick = () => { proxyMode = !proxyMode; e.target.innerText = proxyMode ? "VPN ON" : "VPN OFF"; e.target.style.background = proxyMode ? "#0078d4" : "#666"; };

    load(url);
    c.appendChild(tb); c.appendChild(f);
    createWindow({ title: "Microsoft Edge (Stealth)", icon: IC.edge, content: c });
  }

  // --- YouTue Player (Original Skin) ---
  function openYouTube() {
    const c = el("div"); c.style.cssText = "height:100%; display:flex; flex-direction:column; background:#000;";
    c.innerHTML = `
      <div style="height:50px; background:#111; display:flex; align-items:center; padding:0 20px; border-bottom:1px solid #222;">
        <span style="color:#ff0000; font-weight:bold; margin-right:20px; font-size:18px;">Antigrav Video</span>
        <input id="yt-in" placeholder="YouTube URLを貼り付けて再生..." style="flex:1; padding:8px 15px; background:#222; border:none; border-radius:5px; color:white; font-size:13px; outline:none;">
      </div>
      <div id="player-status" style="background:#004a99; color:white; font-size:10px; padding:3px 20px;">🛡️ プロキシ経由で暗号化再生中 (検知回避モード)</div>
      <iframe id="vid" style="flex:1; border:none;" allowfullscreen></iframe>
    `;
    const f = c.querySelector('#vid');
    const inp = c.querySelector('#yt-in');
    
    inp.onkeydown = (e) => {
      if(e.key === 'Enter') {
        const val = inp.value;
        let id = "";
        if(val.includes('v=')) id = val.split('v=')[1].split('&')[0];
        else if(val.includes('youtu.be/')) id = val.split('be/')[1].split('?')[0];
        if(id) {
          // 独自インスタンスを使わず、直接プロキシパスを構築
          f.src = `https://yewtu.be/embed/${id}?autoplay=1&local=true`; // local=trueで動画データをプロキシ化
        }
      }
    };
    f.src = "https://piped.video/trending"; // 初期はトレンドを表示
    createWindow({ title: "Media Player", icon: IC.yt, content: c, width: 850, height: 550 });
  }

  function openExplorer() {
    const c = el("div"); c.style.cssText = "height:100%; padding:20px; color:white;";
    c.innerHTML = "<h4>PC > クラウドストレージ</h4><p>ログインするとファイルが表示されます。</p>";
    createWindow({ title: "エクスプローラー", icon: IC.folder, content: c });
  }

  function openSettings() {
    const c = el("div"); c.style.cssText = "padding:30px; color:white;";
    c.innerHTML = "<h2>システム設定</h2><p>Windows 11 Stealth Edition v2.0</p>";
    createWindow({ title: "設定", icon: IC.settings, content: c, width: 400, height: 400 });
  }

  function showLoginUI() {
    const d = el("div");
    d.style.cssText = "position:absolute; inset:0; background:rgba(0,0,0,0.9); backdrop-filter:blur(30px); z-index:99999; display:flex; align-items:center; justify-content:center; color:white;";
    d.innerHTML = `<div style="text-align:center; width:300px;"><div style="font-size:60px;margin-bottom:20px;">${IC.user}</div><h2>Windows 11</h2><input id="u" placeholder="User" style="width:100%;padding:10px;margin-bottom:10px;border-radius:5px;border:none;background:#222;color:white;"><input id="p" type="password" placeholder="Pass" style="width:100%;padding:10px;margin-bottom:20px;border-radius:5px;border:none;background:#222;color:white;"><button id="l" style="width:100%;padding:10px;background:#0078d4;border:none;border-radius:5px;color:white;cursor:pointer;">Sign in</button></div>`;
    const sp = Scratch.vm.runtime.renderer.canvas.parentElement; sp.appendChild(d);
    d.querySelector('#l').onclick = () => { currentUser = d.querySelector('#u').value; localStorage.setItem('win11_user', currentUser); d.remove(); };
  }

  class Win11 {
    getInfo() { return { id:'win11', name:'Windows 11', blocks:[{opcode:'init', blockType:Scratch.BlockType.COMMAND, text:'Windowsを起動'}]}; }
    init() { if(!initialized) { createDesktop(); initialized=true; if(!currentUser) showLoginUI(); } }
  }
  Scratch.extensions.register(new Win11());
})(Scratch);
