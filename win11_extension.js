// ============================================================
//  Windows 11 Simulator - TurboWarp Custom Extension
//  フル機能のWindows 11デスクトップ環境をDOM上で再現
//  
//  使い方: TurboWarp > 拡張機能 > カスタム拡張機能を読み込む
//          このファイルを選択またはURLを入力
// ============================================================

(function (Scratch) {
  "use strict";

  // ===== STATE =====
  let initialized = false;
  let startMenuOpen = false;
  let topZ = 200;
  let activeWindows = {};
  let taskbarPinned = [];
  let darkMode = true;
  let calcDisplay = "0";
  let calcPrev = null;
  let calcOp = null;
  let calcNewNum = true;
  let notepadText = "";
  let selectedFile = "";
  let isDragging = false;
  let dragWin = null;
  let dragOX = 0;
  let dragOY = 0;
  let searchOpen = false;

  // ===== DOM REFS =====
  let overlay = null;
  let taskbarEl = null;
  let startMenuEl = null;
  let clockEl = null;
  let dateEl = null;
  let searchPanel = null;

  // ===== SVG ICONS =====
  const IC = {
    win: `<svg viewBox="0 0 88 88" width="18" height="18"><path fill="currentColor" d="M0 12.4L35.7 7.6V42.4H0zM39.7 7L87.4 0V42.4H39.7zM0 45.7H35.7V80.5L0 75.7zM39.7 45.7H87.4V88L39.7 81z"/></svg>`,
    search: `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    edge: `<svg viewBox="0 0 24 24" width="24" height="24"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0078D4"/><stop offset="100%" stop-color="#50E6FF"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#eg)"/><path d="M8 16c0-3 2-5.5 5-6 2-.3 3.5.5 4 2-2-2-5-1.5-6.5.5s-1 4.5 1 6c-2-.5-3.5-1.5-3.5-2.5z" fill="#fff" opacity="0.6"/></svg>`,
    folder: `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M2 6c0-1.1.9-2 2-2h5l2 2h9c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6z" fill="#FFB900"/><path d="M2 10h20v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-8z" fill="#FFC83D"/></svg>`,
    notepad: `<svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="2" width="16" height="20" rx="2" fill="#E8F5E9"/><rect x="4" y="2" width="16" height="20" rx="2" fill="none" stroke="#4CAF50" stroke-width="1"/><line x1="8" y1="8" x2="16" y2="8" stroke="#9E9E9E" stroke-width="0.8"/><line x1="8" y1="11" x2="16" y2="11" stroke="#9E9E9E" stroke-width="0.8"/><line x1="8" y1="14" x2="14" y2="14" stroke="#9E9E9E" stroke-width="0.8"/></svg>`,
    calc: `<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="1" width="18" height="22" rx="3" fill="#1a1a2e"/><rect x="5.5" y="3.5" width="13" height="4" rx="1.5" fill="#16213e" stroke="#0f3460" stroke-width="0.5"/><text x="12" y="6.8" text-anchor="middle" fill="#e2e8f0" font-size="3.5" font-family="monospace">0</text><circle cx="7.5" cy="11" r="1.3" fill="#334155"/><circle cx="12" cy="11" r="1.3" fill="#334155"/><circle cx="16.5" cy="11" r="1.3" fill="#0078D4"/><circle cx="7.5" cy="15" r="1.3" fill="#334155"/><circle cx="12" cy="15" r="1.3" fill="#334155"/><circle cx="16.5" cy="15" r="1.3" fill="#0078D4"/><circle cx="7.5" cy="19" r="1.3" fill="#334155"/><circle cx="12" cy="19" r="1.3" fill="#334155"/><circle cx="16.5" cy="19" r="1.3" fill="#0078D4"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.14 12.94a7.42 7.42 0 0 0 0-1.88l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.63-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58a7.58 7.58 0 0 0 0 1.88l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="32" height="32"><path d="M5 7l1 13c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2l1-13" fill="none" stroke="#888" stroke-width="1.5"/><path d="M9 3h6c.6 0 1 .4 1 1v1H8V4c0-.6.4-1 1-1z" fill="none" stroke="#888" stroke-width="1.5"/><line x1="3" y1="7" x2="21" y2="7" stroke="#888" stroke-width="1.5" stroke-linecap="round"/><line x1="10" y1="10" x2="10" y2="18" stroke="#888" stroke-width="1" opacity="0.5"/><line x1="14" y1="10" x2="14" y2="18" stroke="#888" stroke-width="1" opacity="0.5"/></svg>`,
    terminal: `<svg viewBox="0 0 24 24" width="24" height="24"><rect x="2" y="3" width="20" height="18" rx="2" fill="#0C0C0C"/><polyline points="6,9 10,12 6,15" fill="none" stroke="#CCC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="15" x2="18" y2="15" stroke="#CCC" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    store: `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 4h16l-1.5 6H5.5z" fill="#0078D4"/><rect x="5" y="12" width="14" height="8" rx="1" fill="#0078D4" opacity="0.7"/><circle cx="9" cy="22" r="1.5" fill="#0078D4"/><circle cx="15" cy="22" r="1.5" fill="#0078D4"/></svg>`,
    close: `<svg viewBox="0 0 12 12" width="10" height="10"><line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.2"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.2"/></svg>`,
    max: `<svg viewBox="0 0 12 12" width="10" height="10"><rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`,
    min: `<svg viewBox="0 0 12 12" width="10" height="10"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="1.2"/></svg>`,
    back: `<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="15,4 7,12 15,20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    forward: `<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="9,4 17,12 9,20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 12a8 8 0 0 1 14-5.3V4M20 12a8 8 0 0 1-14 5.3V20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    home: `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 12l9-8 9 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 12v7c0 .6.4 1 1 1h4v-5h4v5h4c.6 0 1-.4 1-1v-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    photos: `<svg viewBox="0 0 24 24" width="24" height="24"><rect x="2" y="4" width="20" height="16" rx="2" fill="#2196F3"/><circle cx="8" cy="10" r="2" fill="#FFF" opacity="0.8"/><path d="M2 16l5-4 3 3 4-5 8 6v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-2z" fill="#1565C0"/></svg>`,
    music: `<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="7" cy="18" r="3" fill="#E91E63"/><circle cx="17" cy="16" r="3" fill="#E91E63"/><path d="M10 18V5l10-3v14" fill="none" stroke="#E91E63" stroke-width="2"/></svg>`,
  };

  // ===== CSS =====
  const CSS = `
    #win11-overlay {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 50; overflow: hidden;
      font-family: 'Segoe UI', 'Yu Gothic UI', 'Meiryo', system-ui, sans-serif;
      user-select: none; -webkit-user-select: none;
      cursor: default;
    }
    #win11-overlay * { box-sizing: border-box; margin: 0; padding: 0; }
    #win11-overlay.dark { --bg-taskbar: rgba(26,26,26,0.85); --bg-menu: rgba(44,44,44,0.96);
      --bg-window: #202020; --bg-titlebar: #2d2d2d; --bg-content: #1e1e1e;
      --text: #fff; --text-secondary: #999; --border: rgba(255,255,255,0.08);
      --hover: rgba(255,255,255,0.06); --hover-strong: rgba(255,255,255,0.1);
      --accent: #60CDFF; --accent-bg: #0078D4; --close-hover: #c42b1c;
      --shadow: 0 8px 32px rgba(0,0,0,0.5); --input-bg: rgba(255,255,255,0.06);
    }
    #win11-overlay.light { --bg-taskbar: rgba(243,243,243,0.85); --bg-menu: rgba(255,255,255,0.96);
      --bg-window: #f3f3f3; --bg-titlebar: #ffffff; --bg-content: #fafafa;
      --text: #1a1a1a; --text-secondary: #666; --border: rgba(0,0,0,0.06);
      --hover: rgba(0,0,0,0.03); --hover-strong: rgba(0,0,0,0.06);
      --accent: #005fb8; --accent-bg: #0078D4; --close-hover: #c42b1c;
      --shadow: 0 8px 32px rgba(0,0,0,0.15); --input-bg: rgba(0,0,0,0.03);
    }
    /* TASKBAR */
    .w11-taskbar {
      position: absolute; bottom: 0; left: 0; width: 100%; height: 44px;
      background: var(--bg-taskbar); backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center; z-index: 300;
    }
    .w11-taskbar-center { display: flex; align-items: center; gap: 2px; height: 100%; }
    .w11-taskbar-btn {
      width: 40px; height: 36px; border: none; background: transparent;
      border-radius: 4px; display: flex; align-items: center; justify-content: center;
      color: var(--text); cursor: pointer; position: relative; transition: background 0.15s;
    }
    .w11-taskbar-btn:hover { background: var(--hover-strong); }
    .w11-taskbar-btn.active::after {
      content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
      width: 16px; height: 3px; background: var(--accent); border-radius: 2px;
    }
    .w11-taskbar-btn.start-btn { width: 44px; }
    .w11-taskbar-right {
      position: absolute; right: 8px; top: 0; height: 100%;
      display: flex; align-items: center; gap: 2px; color: var(--text);
    }
    .w11-tray-btn {
      height: 36px; padding: 0 8px; border: none; background: transparent;
      border-radius: 4px; display: flex; align-items: center; gap: 6px;
      color: var(--text); cursor: pointer; font-size: 11px; transition: background 0.15s;
    }
    .w11-tray-btn:hover { background: var(--hover-strong); }
    .w11-clock { text-align: center; line-height: 1.3; }
    .w11-clock-time { font-size: 11px; font-weight: 400; }
    .w11-clock-date { font-size: 10px; font-weight: 400; opacity: 0.8; }
    /* START MENU */
    .w11-startmenu {
      position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%);
      width: 560px; max-width: 90%; background: var(--bg-menu);
      backdrop-filter: blur(40px) saturate(200%);
      -webkit-backdrop-filter: blur(40px) saturate(200%);
      border: 1px solid var(--border); border-radius: 8px;
      box-shadow: var(--shadow); z-index: 400; padding: 28px 32px 16px;
      display: none; animation: w11-slideUp 0.2s ease;
    }
    .w11-startmenu.show { display: block; }
    @keyframes w11-slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    .w11-search-box {
      width: 100%; height: 34px; border-radius: 17px;
      background: var(--input-bg); border: 1px solid var(--border);
      display: flex; align-items: center; padding: 0 14px; gap: 8px; margin-bottom: 20px;
    }
    .w11-search-box input {
      flex: 1; background: none; border: none; outline: none;
      color: var(--text); font-size: 13px; font-family: inherit;
    }
    .w11-search-box input::placeholder { color: var(--text-secondary); }
    .w11-start-section-title {
      font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px;
    }
    .w11-start-apps {
      display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; margin-bottom: 20px;
    }
    .w11-start-app {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 8px 4px; border-radius: 4px; cursor: pointer;
      border: none; background: transparent; color: var(--text); transition: background 0.15s;
    }
    .w11-start-app:hover { background: var(--hover-strong); }
    .w11-start-app-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
    .w11-start-app-name { font-size: 10px; text-align: center; line-height: 1.2; max-width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .w11-start-bottom {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 12px; border-top: 1px solid var(--border);
    }
    .w11-user-info { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
    .w11-user-info:hover { background: var(--hover-strong); }
    .w11-user-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 13px; font-weight: 600;
    }
    .w11-user-name { font-size: 12px; color: var(--text); }
    .w11-power-btn {
      width: 32px; height: 32px; border: none; background: transparent;
      border-radius: 4px; display: flex; align-items: center; justify-content: center;
      color: var(--text); cursor: pointer; transition: background 0.15s;
    }
    .w11-power-btn:hover { background: var(--hover-strong); }
    /* DESKTOP ICONS */
    .w11-desktop-icons { position: absolute; top: 8px; left: 8px; z-index: 50; }
    .w11-desktop-icon {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 6px 8px; border-radius: 4px; cursor: pointer;
      width: 72px; margin-bottom: 4px; border: 1px solid transparent;
      transition: background 0.15s;
    }
    .w11-desktop-icon:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
    .w11-desktop-icon.selected { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
    .w11-desktop-icon-img { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
    .w11-desktop-icon-name {
      font-size: 10px; color: #fff; text-align: center;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8); line-height: 1.2;
      max-width: 68px; word-wrap: break-word;
    }
    /* WINDOWS */
    .w11-window {
      position: absolute; background: var(--bg-window); border-radius: 8px;
      box-shadow: var(--shadow); border: 1px solid var(--border);
      display: flex; flex-direction: column; overflow: hidden;
      animation: w11-winOpen 0.2s ease;
    }
    @keyframes w11-winOpen { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .w11-window.closing { animation: w11-winClose 0.15s ease forwards; }
    @keyframes w11-winClose { to { opacity: 0; transform: scale(0.95); } }
    .w11-window.maximized { top: 0 !important; left: 0 !important; width: 100% !important; height: calc(100% - 44px) !important; border-radius: 0; }
    .w11-win-titlebar {
      height: 32px; min-height: 32px; background: var(--bg-titlebar);
      display: flex; align-items: center; padding: 0 4px 0 12px;
      cursor: default; gap: 8px;
    }
    .w11-win-titlebar-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; }
    .w11-win-titlebar-icon svg { width: 16px; height: 16px; }
    .w11-win-title { flex: 1; font-size: 12px; color: var(--text); opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .w11-win-controls { display: flex; height: 100%; }
    .w11-win-ctrl-btn {
      width: 46px; height: 100%; border: none; background: transparent;
      display: flex; align-items: center; justify-content: center;
      color: var(--text); cursor: pointer; transition: background 0.15s;
    }
    .w11-win-ctrl-btn:hover { background: var(--hover-strong); }
    .w11-win-ctrl-btn.close-btn:hover { background: var(--close-hover); color: #fff; }
    .w11-win-content { flex: 1; overflow: auto; background: var(--bg-content); }
    /* CONTEXT MENU */
    .w11-contextmenu {
      position: absolute; background: var(--bg-menu);
      backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
      border: 1px solid var(--border); border-radius: 8px;
      box-shadow: var(--shadow); z-index: 500; min-width: 200px;
      padding: 4px; display: none; animation: w11-fadeIn 0.12s ease;
    }
    .w11-contextmenu.show { display: block; }
    @keyframes w11-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .w11-ctx-item {
      display: flex; align-items: center; gap: 10px; padding: 7px 16px 7px 12px;
      border-radius: 4px; cursor: pointer; font-size: 12px; color: var(--text);
      border: none; background: transparent; width: 100%; text-align: left; transition: background 0.1s;
    }
    .w11-ctx-item:hover { background: var(--hover-strong); }
    .w11-ctx-sep { height: 1px; background: var(--border); margin: 3px 8px; }
    /* EDGE BROWSER */
    .w11-edge-toolbar {
      display: flex; align-items: center; gap: 4px; padding: 6px 8px;
      background: var(--bg-titlebar); border-bottom: 1px solid var(--border);
    }
    .w11-edge-nav-btn {
      width: 28px; height: 28px; border: none; background: transparent;
      border-radius: 4px; display: flex; align-items: center; justify-content: center;
      color: var(--text); cursor: pointer; opacity: 0.7; transition: all 0.15s;
    }
    .w11-edge-nav-btn:hover { background: var(--hover-strong); opacity: 1; }
    .w11-edge-url {
      flex: 1; height: 30px; border-radius: 15px; background: var(--input-bg);
      border: 1px solid var(--border); padding: 0 14px;
      color: var(--text); font-size: 12px; font-family: inherit; outline: none;
      transition: border-color 0.2s;
    }
    .w11-edge-url:focus { border-color: var(--accent-bg); }
    .w11-edge-tabs {
      display: flex; align-items: center; background: var(--bg-titlebar);
      padding: 4px 4px 0; gap: 2px;
    }
    .w11-edge-tab {
      display: flex; align-items: center; gap: 6px; padding: 6px 12px;
      background: var(--bg-content); border-radius: 8px 8px 0 0;
      font-size: 11px; color: var(--text); cursor: pointer; max-width: 180px;
      border: none;
    }
    .w11-edge-iframe {
      width: 100%; flex: 1; border: none; background: #fff;
    }
    /* CALCULATOR */
    .w11-calc { display: flex; flex-direction: column; height: 100%; background: var(--bg-content); }
    .w11-calc-display {
      padding: 12px 16px; text-align: right; font-size: 32px; font-weight: 300;
      color: var(--text); min-height: 60px; display: flex; align-items: flex-end;
      justify-content: flex-end; word-break: break-all;
    }
    .w11-calc-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; padding: 4px; flex: 1; }
    .w11-calc-btn {
      border: none; border-radius: 4px; font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text); transition: background 0.1s; font-family: inherit;
    }
    .w11-calc-btn.num { background: var(--hover-strong); }
    .w11-calc-btn.op { background: var(--hover); }
    .w11-calc-btn.eq { background: var(--accent-bg); color: #fff; }
    .w11-calc-btn:hover { filter: brightness(1.2); }
    /* NOTEPAD */
    .w11-notepad { display: flex; flex-direction: column; height: 100%; }
    .w11-notepad-menu {
      display: flex; gap: 0; padding: 2px 8px; background: var(--bg-titlebar);
      border-bottom: 1px solid var(--border);
    }
    .w11-notepad-menu-item {
      padding: 3px 10px; font-size: 11px; color: var(--text); cursor: pointer;
      border: none; background: transparent; border-radius: 4px; transition: background 0.15s;
    }
    .w11-notepad-menu-item:hover { background: var(--hover-strong); }
    .w11-notepad-textarea {
      flex: 1; resize: none; border: none; outline: none; padding: 8px 12px;
      background: var(--bg-content); color: var(--text);
      font-family: 'Consolas', 'MS Gothic', monospace; font-size: 13px; line-height: 1.5;
    }
    /* FILE EXPLORER */
    .w11-explorer { display: flex; flex-direction: column; height: 100%; }
    .w11-explorer-toolbar {
      display: flex; align-items: center; gap: 4px; padding: 4px 8px;
      background: var(--bg-titlebar); border-bottom: 1px solid var(--border);
    }
    .w11-explorer-address {
      flex: 1; height: 26px; border-radius: 4px;
      background: var(--input-bg); border: 1px solid var(--border);
      padding: 0 10px; color: var(--text); font-size: 12px; font-family: inherit; outline: none;
    }
    .w11-explorer-body { display: flex; flex: 1; overflow: hidden; }
    .w11-explorer-sidebar {
      width: 180px; background: var(--bg-titlebar); padding: 8px 4px;
      border-right: 1px solid var(--border); overflow-y: auto;
    }
    .w11-explorer-sidebar-item {
      display: flex; align-items: center; gap: 8px; padding: 5px 10px;
      border-radius: 4px; cursor: pointer; font-size: 12px; color: var(--text);
      border: none; background: transparent; width: 100%; text-align: left; transition: background 0.1s;
    }
    .w11-explorer-sidebar-item:hover { background: var(--hover-strong); }
    .w11-explorer-sidebar-item.active { background: var(--hover-strong); }
    .w11-explorer-main { flex: 1; padding: 8px; overflow-y: auto; }
    .w11-explorer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 4px; }
    .w11-explorer-file {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 8px 4px; border-radius: 4px; cursor: pointer;
      border: 1px solid transparent; transition: background 0.1s;
    }
    .w11-explorer-file:hover { background: var(--hover-strong); border-color: var(--border); }
    .w11-explorer-file-icon { font-size: 28px; }
    .w11-explorer-file-name { font-size: 10px; color: var(--text); text-align: center; line-height: 1.2; word-break: break-all; }
    /* SETTINGS */
    .w11-settings { display: flex; height: 100%; }
    .w11-settings-sidebar {
      width: 200px; background: var(--bg-titlebar); padding: 16px 8px;
      border-right: 1px solid var(--border);
    }
    .w11-settings-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 12px;
      border-radius: 4px; cursor: pointer; font-size: 12px; color: var(--text);
      border: none; background: transparent; width: 100%; text-align: left; transition: background 0.1s;
    }
    .w11-settings-item:hover { background: var(--hover-strong); }
    .w11-settings-item.active { background: var(--accent-bg); color: #fff; }
    .w11-settings-content { flex: 1; padding: 20px; overflow-y: auto; }
    .w11-settings-title { font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 16px; }
    .w11-settings-subtitle { font-size: 14px; font-weight: 600; color: var(--text); margin: 16px 0 8px; }
    .w11-settings-card {
      background: var(--hover); border-radius: 8px; padding: 14px 16px;
      margin-bottom: 8px; border: 1px solid var(--border);
    }
    .w11-settings-row { display: flex; align-items: center; justify-content: space-between; }
    .w11-settings-label { font-size: 13px; color: var(--text); }
    /* TOGGLE SWITCH */
    .w11-toggle {
      width: 40px; height: 20px; border-radius: 10px; cursor: pointer;
      background: #555; position: relative; transition: background 0.2s;
      border: none;
    }
    .w11-toggle.on { background: var(--accent-bg); }
    .w11-toggle::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 14px; height: 14px; border-radius: 50%; background: #fff;
      transition: left 0.2s;
    }
    .w11-toggle.on::after { left: 23px; }
    /* WALLPAPER THUMBNAILS */
    .w11-wp-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .w11-wp-thumb {
      width: 100px; height: 62px; border-radius: 6px; cursor: pointer;
      border: 2px solid transparent; transition: border-color 0.2s; overflow: hidden;
      background-size: cover; background-position: center;
    }
    .w11-wp-thumb.active { border-color: var(--accent-bg); }
    .w11-wp-thumb:hover { border-color: var(--accent); }
    /* SEARCH PANEL */
    .w11-search-panel {
      position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%);
      width: 560px; max-width: 90%; height: 450px; max-height: 70%;
      background: var(--bg-menu); backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid var(--border); border-radius: 8px;
      box-shadow: var(--shadow); z-index: 400; padding: 20px;
      display: none; animation: w11-slideUp 0.2s ease;
    }
    .w11-search-panel.show { display: flex; flex-direction: column; }
    .w11-search-results { flex: 1; overflow-y: auto; margin-top: 12px; }
    .w11-search-result-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 12px;
      border-radius: 4px; cursor: pointer; font-size: 13px; color: var(--text);
      border: none; background: transparent; width: 100%; text-align: left;
      transition: background 0.1s;
    }
    .w11-search-result-item:hover { background: var(--hover-strong); }
    /* NOTIFICATION/ACTION CENTER */
    .w11-action-center {
      position: absolute; bottom: 52px; right: 8px;
      width: 300px; background: var(--bg-menu);
      backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
      border: 1px solid var(--border); border-radius: 8px;
      box-shadow: var(--shadow); z-index: 400; padding: 16px;
      display: none; animation: w11-slideUp 0.2s ease;
    }
    .w11-action-center.show { display: block; }
    .w11-quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 8px; }
    .w11-quick-action {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 10px 6px; border-radius: 4px; cursor: pointer;
      font-size: 10px; color: var(--text); border: none;
      background: var(--hover); transition: background 0.15s;
    }
    .w11-quick-action.active { background: var(--accent-bg); color: #fff; }
    .w11-quick-action:hover { background: var(--hover-strong); }
    .w11-slider-container { margin-top: 12px; }
    .w11-slider-label { font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; }
    .w11-slider { width: 100%; height: 4px; -webkit-appearance: none; appearance: none;
      background: var(--border); border-radius: 2px; outline: none; }
    .w11-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px;
      border-radius: 50%; background: var(--accent-bg); cursor: pointer; }
  `;

  // ===== APPS CONFIG =====
  const DESKTOP_ICONS = [
    { id: "recycle", name: "ごみ箱", icon: IC.trash },
    { id: "edge", name: "Microsoft Edge", icon: IC.edge },
    { id: "explorer", name: "エクスプローラー", icon: IC.folder },
  ];

  const TASKBAR_APPS = [
    { id: "search", icon: IC.search, tip: "検索" },
    { id: "edge", icon: IC.edge, tip: "Microsoft Edge" },
    { id: "explorer", icon: IC.folder, tip: "エクスプローラー" },
    { id: "store", icon: IC.store, tip: "Microsoft Store" },
    { id: "terminal", icon: IC.terminal, tip: "ターミナル" },
  ];

  const START_APPS = [
    { id: "edge", name: "Edge", icon: IC.edge },
    { id: "explorer", name: "ファイル", icon: IC.folder },
    { id: "notepad", name: "メモ帳", icon: IC.notepad },
    { id: "calc", name: "電卓", icon: IC.calc },
    { id: "settings", name: "設定", icon: IC.settings },
    { id: "terminal", name: "ターミナル", icon: IC.terminal },
    { id: "photos", name: "フォト", icon: IC.photos },
    { id: "store", name: "Store", icon: IC.store },
    { id: "music", name: "メディア", icon: IC.music },
    { id: "paint", name: "ペイント", icon: `<span style="font-size:24px">🎨</span>` },
    { id: "weather", name: "天気", icon: `<span style="font-size:24px">⛅</span>` },
    { id: "clock", name: "時計", icon: `<span style="font-size:24px">⏰</span>` },
  ];

  const EXPLORER_FILES = [
    { name: "ドキュメント", icon: "📁", type: "folder" },
    { name: "ダウンロード", icon: "📁", type: "folder" },
    { name: "画像", icon: "📁", type: "folder" },
    { name: "ミュージック", icon: "📁", type: "folder" },
    { name: "ビデオ", icon: "📁", type: "folder" },
    { name: "デスクトップ", icon: "📁", type: "folder" },
    { name: "readme.txt", icon: "📄", type: "file" },
    { name: "project.exe", icon: "⚙️", type: "exe" },
    { name: "photo.png", icon: "🖼️", type: "file" },
    { name: "music.mp3", icon: "🎵", type: "file" },
    { name: "video.mp4", icon: "🎬", type: "file" },
    { name: "game.exe", icon: "🎮", type: "exe" },
  ];

  // ===== UTILITY =====
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function btn(cls, html, onclick) {
    const b = el("button", cls, html);
    if (onclick) b.addEventListener("click", onclick);
    return b;
  }

  function formatTime() {
    const d = new Date();
    return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
  }

  function formatDate() {
    const d = new Date();
    return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getDate().toString().padStart(2,"0")}`;
  }

  function formatDay() {
    return ["日","月","火","水","木","金","土"][new Date().getDay()];
  }

  // ===== FIND STAGE =====
  function findStage() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    let p = canvas.parentElement;
    return p;
  }

  // ===== CREATE DESKTOP =====
  function createDesktop() {
    const stage = findStage();
    if (!stage || overlay) return;
    stage.style.position = "relative";

    // Inject CSS
    if (!document.getElementById("win11-css")) {
      const s = document.createElement("style");
      s.id = "win11-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    // OVERLAY
    overlay = el("div");
    overlay.id = "win11-overlay";
    overlay.className = darkMode ? "dark" : "light";

    // Prevent right-click default on overlay
    overlay.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e.offsetX, e.offsetY);
    });

    // Click to close menus
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) {
        closeStartMenu();
        closeContextMenu();
        closeSearch();
        closeActionCenter();
      }
    });

    // DESKTOP ICONS
    const iconsContainer = el("div", "w11-desktop-icons");
    DESKTOP_ICONS.forEach((app) => {
      const icon = el("div", "w11-desktop-icon");
      icon.innerHTML = `<div class="w11-desktop-icon-img">${app.icon}</div><div class="w11-desktop-icon-name">${app.name}</div>`;
      icon.addEventListener("dblclick", () => openApp(app.id));
      icon.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".w11-desktop-icon").forEach(i => i.classList.remove("selected"));
        icon.classList.add("selected");
        closeContextMenu();
      });
      iconsContainer.appendChild(icon);
    });
    overlay.appendChild(iconsContainer);

    // WINDOW AREA (container for all windows)
    const winArea = el("div");
    winArea.id = "win11-winarea";
    winArea.style.cssText = "position:absolute;top:0;left:0;width:100%;height:calc(100% - 44px);z-index:100;pointer-events:none;";
    overlay.appendChild(winArea);

    // CONTEXT MENU
    contextMenuEl = el("div", "w11-contextmenu");
    overlay.appendChild(contextMenuEl);

    // CREATE TASKBAR
    createTaskbar();

    // CREATE START MENU
    createStartMenu();

    // CREATE SEARCH PANEL
    createSearchPanel();

    // CREATE ACTION CENTER
    createActionCenter();

    // Append overlay
    stage.appendChild(overlay);

    // Start clock
    updateClock();
    setInterval(updateClock, 10000);

    // Mouse move/up for drag
    overlay.addEventListener("mousemove", onMouseMove);
    overlay.addEventListener("mouseup", onMouseUp);
  }

  // ===== TASKBAR =====
  function createTaskbar() {
    taskbarEl = el("div", "w11-taskbar");

    // Center group
    const center = el("div", "w11-taskbar-center");

    // Start button
    const startBtn = btn("w11-taskbar-btn start-btn", IC.win, () => toggleStartMenu());
    startBtn.title = "スタート";
    center.appendChild(startBtn);

    // App buttons
    TASKBAR_APPS.forEach((app) => {
      const b = btn("w11-taskbar-btn", app.icon, () => {
        if (app.id === "search") {
          toggleSearch();
        } else {
          openApp(app.id);
        }
      });
      b.title = app.tip;
      b.dataset.appId = app.id;
      center.appendChild(b);
    });

    taskbarEl.appendChild(center);

    // Right tray
    const right = el("div", "w11-taskbar-right");

    // System icons
    const sysIcons = btn("w11-tray-btn", `
      <svg viewBox="0 0 24 24" width="14" height="14"><path d="M2 9c5.5-5 14.5-5 20 0M5 12.5c4-3.5 10-3.5 14 0M8.5 15.5c2-2 5-2 7 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <svg viewBox="0 0 24 24" width="14" height="14"><polygon points="6,9 2,9 2,15 6,15 11,19 11,5" fill="currentColor"/><path d="M15 8c1.5 1 2.5 2.5 2.5 4s-1 3-2.5 4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
      <svg viewBox="0 0 24 24" width="14" height="14"><rect x="2" y="7" width="18" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="9" width="12" height="6" fill="currentColor" opacity="0.4"/><rect x="20" y="10" width="2" height="4" fill="currentColor"/></svg>
    `, () => toggleActionCenter());
    right.appendChild(sysIcons);

    // Clock
    const clockBtn = btn("w11-tray-btn", "", () => {});
    clockEl = el("div", "w11-clock");
    clockEl.innerHTML = `<div class="w11-clock-time">${formatTime()}</div><div class="w11-clock-date">${formatDate()}</div>`;
    clockBtn.appendChild(clockEl);
    right.appendChild(clockBtn);

    taskbarEl.appendChild(right);
    overlay.appendChild(taskbarEl);
  }

  // ===== START MENU =====
  function createStartMenu() {
    startMenuEl = el("div", "w11-startmenu");

    // Search
    const searchBox = el("div", "w11-search-box");
    searchBox.innerHTML = `${IC.search}<input type="text" placeholder="検索するには、ここに入力してください">`;
    startMenuEl.appendChild(searchBox);

    // Pinned section
    const pinnedTitle = el("div", "w11-start-section-title", "ピン留め済み");
    startMenuEl.appendChild(pinnedTitle);

    const appsGrid = el("div", "w11-start-apps");
    START_APPS.forEach((app) => {
      const appBtn = btn("w11-start-app", `<div class="w11-start-app-icon">${app.icon}</div><div class="w11-start-app-name">${app.name}</div>`, () => {
        openApp(app.id);
        closeStartMenu();
      });
      appsGrid.appendChild(appBtn);
    });
    startMenuEl.appendChild(appsGrid);

    // Bottom
    const bottom = el("div", "w11-start-bottom");
    bottom.innerHTML = `
      <div class="w11-user-info"><div class="w11-user-avatar">U</div><div class="w11-user-name">ユーザー</div></div>
    `;
    const powerBtn = btn("w11-power-btn",
      `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3v9M18.36 6.64A9 9 0 1 1 5.64 6.64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
      () => {
        if (confirm("シャットダウンしますか？")) {
          overlay.style.transition = "opacity 1s";
          overlay.style.opacity = "0";
          setTimeout(() => { overlay.style.display = "none"; }, 1000);
        }
      }
    );
    bottom.appendChild(powerBtn);
    startMenuEl.appendChild(bottom);

    overlay.appendChild(startMenuEl);
  }

  // ===== SEARCH PANEL =====
  let searchPanelEl = null;
  function createSearchPanel() {
    searchPanelEl = el("div", "w11-search-panel");
    const searchBox = el("div", "w11-search-box");
    searchBox.innerHTML = `${IC.search}<input type="text" placeholder="アプリ、設定、ドキュメントの検索" id="win11-search-input">`;
    searchPanelEl.appendChild(searchBox);

    const results = el("div", "w11-search-results");
    results.id = "win11-search-results";

    // Default results
    const defaultApps = [
      { id: "edge", name: "Microsoft Edge", desc: "Webブラウザー", icon: IC.edge },
      { id: "notepad", name: "メモ帳", desc: "テキストエディター", icon: IC.notepad },
      { id: "calc", name: "電卓", desc: "計算ツール", icon: IC.calc },
      { id: "settings", name: "設定", desc: "システム設定", icon: IC.settings },
      { id: "explorer", name: "エクスプローラー", desc: "ファイル管理", icon: IC.folder },
      { id: "terminal", name: "ターミナル", desc: "コマンドライン", icon: IC.terminal },
    ];
    defaultApps.forEach(app => {
      const item = btn("w11-search-result-item",
        `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center">${app.icon}</div>
         <div><div style="font-size:13px">${app.name}</div><div style="font-size:10px;color:var(--text-secondary)">${app.desc}</div></div>`,
        () => { openApp(app.id); closeSearch(); }
      );
      results.appendChild(item);
    });

    searchPanelEl.appendChild(results);
    overlay.appendChild(searchPanelEl);
  }

  // ===== ACTION CENTER =====
  let actionCenterEl = null;
  function createActionCenter() {
    actionCenterEl = el("div", "w11-action-center");

    const quickActions = el("div", "w11-quick-actions");
    const actions = [
      { name: "Wi-Fi", icon: "📶", active: true },
      { name: "Bluetooth", icon: "🔵", active: false },
      { name: "機内モード", icon: "✈️", active: false },
      { name: "省電力", icon: "🔋", active: false },
      { name: "ダークモード", icon: "🌙", active: darkMode },
      { name: "画面回転", icon: "🔄", active: false },
    ];
    actions.forEach(a => {
      const b = btn("w11-quick-action" + (a.active ? " active" : ""),
        `<span style="font-size:16px">${a.icon}</span>${a.name}`,
        (e) => {
          if (a.name === "ダークモード") {
            darkMode = !darkMode;
            overlay.className = darkMode ? "dark" : "light";
            e.currentTarget.classList.toggle("active");
          } else {
            e.currentTarget.classList.toggle("active");
          }
        }
      );
      quickActions.appendChild(b);
    });
    actionCenterEl.appendChild(quickActions);

    // Brightness slider
    const brightnessDiv = el("div", "w11-slider-container");
    brightnessDiv.innerHTML = `<div class="w11-slider-label">☀️ 明るさ</div><input type="range" class="w11-slider" min="20" max="100" value="80">`;
    actionCenterEl.appendChild(brightnessDiv);

    // Volume slider
    const volumeDiv = el("div", "w11-slider-container");
    volumeDiv.innerHTML = `<div class="w11-slider-label">🔊 音量</div><input type="range" class="w11-slider" min="0" max="100" value="60">`;
    actionCenterEl.appendChild(volumeDiv);

    overlay.appendChild(actionCenterEl);
  }

  // ===== TOGGLE FUNCTIONS =====
  function toggleStartMenu() {
    startMenuOpen = !startMenuOpen;
    startMenuEl.classList.toggle("show", startMenuOpen);
    closeSearch();
    closeContextMenu();
    closeActionCenter();
  }

  function closeStartMenu() {
    startMenuOpen = false;
    if (startMenuEl) startMenuEl.classList.remove("show");
  }

  function toggleSearch() {
    searchOpen = !searchOpen;
    searchPanelEl.classList.toggle("show", searchOpen);
    closeStartMenu();
    closeContextMenu();
    closeActionCenter();
    if (searchOpen) {
      setTimeout(() => {
        const inp = document.getElementById("win11-search-input");
        if (inp) inp.focus();
      }, 100);
    }
  }

  function closeSearch() {
    searchOpen = false;
    if (searchPanelEl) searchPanelEl.classList.remove("show");
  }

  let actionCenterOpen = false;
  function toggleActionCenter() {
    actionCenterOpen = !actionCenterOpen;
    actionCenterEl.classList.toggle("show", actionCenterOpen);
    closeStartMenu();
    closeSearch();
    closeContextMenu();
  }

  function closeActionCenter() {
    actionCenterOpen = false;
    if (actionCenterEl) actionCenterEl.classList.remove("show");
  }

  // ===== CONTEXT MENU =====
  function showContextMenu(x, y) {
    closeStartMenu();
    closeSearch();
    closeActionCenter();

    const items = [
      { label: "表示", icon: "👁️", action: null },
      { label: "並べ替え", icon: "📊", action: null },
      { label: "最新の情報に更新", icon: "🔄", action: () => location.reload() },
      "---",
      { label: "新規作成", icon: "➕", action: () => openApp("notepad") },
      "---",
      { label: "ディスプレイ設定", icon: "🖥️", action: () => openApp("settings") },
      { label: "個人用設定", icon: "🎨", action: () => openApp("settings") },
      "---",
      { label: "ターミナルで開く", icon: "⬛", action: () => openApp("terminal") },
    ];

    contextMenuEl.innerHTML = "";
    items.forEach((item) => {
      if (item === "---") {
        contextMenuEl.appendChild(el("div", "w11-ctx-sep"));
      } else {
        const b = btn("w11-ctx-item", `<span style="width:18px;text-align:center">${item.icon}</span>${item.label}`, (e) => {
          e.stopPropagation();
          closeContextMenu();
          if (item.action) item.action();
        });
        contextMenuEl.appendChild(b);
      }
    });

    // Position
    const rect = overlay.getBoundingClientRect();
    let cx = x, cy = y;
    if (cx + 210 > rect.width) cx = rect.width - 210;
    if (cy + 280 > rect.height - 44) cy = rect.height - 44 - 280;
    contextMenuEl.style.left = cx + "px";
    contextMenuEl.style.top = cy + "px";
    contextMenuEl.classList.add("show");
  }

  function closeContextMenu() {
    if (contextMenuEl) contextMenuEl.classList.remove("show");
  }

  // ===== WINDOW MANAGER =====
  function createWindow(config) {
    const { id, title, icon, width, height, x, y, content, resizable } = config;

    // If already open, focus it
    if (activeWindows[id]) {
      focusWindow(id);
      if (activeWindows[id].minimized) {
        activeWindows[id].el.style.display = "flex";
        activeWindows[id].minimized = false;
      }
      return activeWindows[id].el;
    }

    const winArea = document.getElementById("win11-winarea");
    const win = el("div", "w11-window");
    win.dataset.winId = id;
    win.style.cssText = `width:${width}px;height:${height}px;left:${x}px;top:${y}px;z-index:${++topZ};pointer-events:all;`;

    // Title bar
    const titlebar = el("div", "w11-win-titlebar");
    titlebar.innerHTML = `<div class="w11-win-titlebar-icon">${icon || ""}</div><div class="w11-win-title">${title}</div>`;

    // Drag functionality
    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".w11-win-controls")) return;
      isDragging = true;
      dragWin = win;
      const rect = win.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      dragOX = e.clientX - rect.left + (rect.left - overlayRect.left) - win.offsetLeft;
      dragOY = e.clientY - rect.top + (rect.top - overlayRect.top) - win.offsetTop;
      // Simpler: just use offset from mouse to window position
      dragOX = e.clientX - win.offsetLeft;
      dragOY = e.clientY - win.offsetTop;
      focusWindow(id);
      e.preventDefault();
    });

    // Controls
    const controls = el("div", "w11-win-controls");
    controls.appendChild(btn("w11-win-ctrl-btn", IC.min, () => {
      win.style.display = "none";
      activeWindows[id].minimized = true;
    }));
    controls.appendChild(btn("w11-win-ctrl-btn", IC.max, () => {
      win.classList.toggle("maximized");
    }));
    controls.appendChild(btn("w11-win-ctrl-btn close-btn", IC.close, () => {
      closeWindow(id);
    }));
    titlebar.appendChild(controls);
    win.appendChild(titlebar);

    // Double-click titlebar to maximize
    titlebar.addEventListener("dblclick", () => {
      win.classList.toggle("maximized");
    });

    // Content
    const contentDiv = el("div", "w11-win-content");
    if (typeof content === "string") {
      contentDiv.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentDiv.appendChild(content);
    }
    win.appendChild(contentDiv);

    // Focus on click
    win.addEventListener("mousedown", () => focusWindow(id));

    winArea.appendChild(win);
    activeWindows[id] = { el: win, minimized: false, z: topZ };

    // Update taskbar
    updateTaskbarActive();

    return win;
  }

  function focusWindow(id) {
    if (!activeWindows[id]) return;
    activeWindows[id].el.style.zIndex = ++topZ;
    activeWindows[id].z = topZ;
    updateTaskbarActive();
  }

  function closeWindow(id) {
    if (!activeWindows[id]) return;
    const win = activeWindows[id].el;
    win.classList.add("closing");
    setTimeout(() => {
      win.remove();
      delete activeWindows[id];
      updateTaskbarActive();
    }, 150);
  }

  function updateTaskbarActive() {
    document.querySelectorAll(".w11-taskbar-btn[data-app-id]").forEach(b => {
      b.classList.toggle("active", !!activeWindows[b.dataset.appId]);
    });
  }

  // ===== DRAG HANDLING =====
  function onMouseMove(e) {
    if (!isDragging || !dragWin) return;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - dragOX;
    const y = e.clientY - dragOY;
    dragWin.style.left = x + "px";
    dragWin.style.top = Math.max(0, y) + "px";
    dragWin.classList.remove("maximized");
  }

  function onMouseUp() {
    isDragging = false;
    dragWin = null;
  }

  // ===== CLOCK =====
  function updateClock() {
    if (!clockEl) return;
    clockEl.innerHTML = `<div class="w11-clock-time">${formatTime()}</div><div class="w11-clock-date">${formatDate()}</div>`;
  }

  // ===== OPEN APP =====
  function openApp(id) {
    closeStartMenu();
    closeSearch();
    closeContextMenu();
    closeActionCenter();

    const area = document.getElementById("win11-winarea");
    if (!area) return;
    const aw = area.clientWidth || 450;
    const ah = area.clientHeight || 310;

    switch (id) {
      case "edge": openEdge(aw, ah); break;
      case "explorer": openExplorer(aw, ah); break;
      case "notepad": openNotepad(aw, ah); break;
      case "calc": openCalculator(aw, ah); break;
      case "settings": openSettings(aw, ah); break;
      case "terminal": openTerminal(aw, ah); break;
      case "store": openStore(aw, ah); break;
      default:
        createWindow({
          id, title: id, icon: `<span style="font-size:14px">📱</span>`,
          width: Math.min(350, aw - 20), height: Math.min(250, ah - 20),
          x: 30 + Math.random() * 50, y: 20 + Math.random() * 30,
          content: `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);font-size:14px">${id} - 準備中</div>`
        });
    }
  }

  // ===== EDGE BROWSER =====
  function openEdge(aw, ah) {
    const content = el("div");
    content.style.cssText = "display:flex;flex-direction:column;height:100%;";

    // Tabs
    const tabs = el("div", "w11-edge-tabs");
    tabs.innerHTML = `<div class="w11-edge-tab">${IC.edge}<span>新しいタブ</span></div>`;
    content.appendChild(tabs);

    // Toolbar
    const toolbar = el("div", "w11-edge-toolbar");
    const backBtn = btn("w11-edge-nav-btn", IC.back, () => {
      try { iframe.contentWindow.history.back(); } catch(e) {}
    });
    const fwdBtn = btn("w11-edge-nav-btn", IC.forward, () => {
      try { iframe.contentWindow.history.forward(); } catch(e) {}
    });
    const refBtn = btn("w11-edge-nav-btn", IC.refresh, () => {
      navigateTo(urlInput.value);
    });
    const homeBtn = btn("w11-edge-nav-btn", IC.home, () => {
      urlInput.value = "https://www.google.com";
      navigateTo("https://www.google.com");
    });

    const urlInput = document.createElement("input");
    urlInput.className = "w11-edge-url";
    urlInput.type = "text";
    urlInput.value = "https://www.google.com";
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        let url = urlInput.value.trim();
        if (!url.startsWith("http")) url = "https://" + url;
        navigateTo(url);
      }
    });
    urlInput.addEventListener("focus", () => urlInput.select());

    toolbar.appendChild(backBtn);
    toolbar.appendChild(fwdBtn);
    toolbar.appendChild(refBtn);
    toolbar.appendChild(homeBtn);
    toolbar.appendChild(urlInput);
    content.appendChild(toolbar);

    // Quick links bar
    const quickLinks = el("div");
    quickLinks.style.cssText = "display:flex;gap:4px;padding:4px 8px;background:var(--bg-titlebar);border-bottom:1px solid var(--border);";
    const links = [
      { name: "Google", url: "https://www.google.com" },
      { name: "YouTube", url: "https://www.youtube.com" },
      { name: "Wikipedia", url: "https://ja.wikipedia.org" },
      { name: "GitHub", url: "https://github.com" },
    ];
    links.forEach(l => {
      const lb = btn("w11-edge-nav-btn", "", () => {
        urlInput.value = l.url;
        navigateTo(l.url);
      });
      lb.style.cssText = "width:auto;padding:2px 8px;font-size:10px;opacity:1;";
      lb.textContent = l.name;
      quickLinks.appendChild(lb);
    });
    content.appendChild(quickLinks);

    // Iframe
    const iframe = document.createElement("iframe");
    iframe.className = "w11-edge-iframe";
    iframe.setAttribute("sandbox", "allow-same-origin allow-scripts allow-popups allow-forms allow-presentation");
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");

    // Error overlay
    const errorOverlay = el("div");
    errorOverlay.style.cssText = "display:none;position:absolute;top:0;left:0;width:100%;height:100%;background:var(--bg-content);flex-direction:column;align-items:center;justify-content:center;color:var(--text);padding:20px;text-align:center;";

    function navigateTo(url) {
      urlInput.value = url;
      errorOverlay.style.display = "none";
      iframe.style.display = "block";

      // YouTube URL conversion for embedding
      if (url.includes("youtube.com/watch")) {
        const vid = new URL(url).searchParams.get("v");
        if (vid) {
          iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
          return;
        }
      }
      if (url.includes("youtu.be/")) {
        const vid = url.split("youtu.be/")[1]?.split("?")[0];
        if (vid) {
          iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
          return;
        }
      }

      // For YouTube homepage, use embed playlist or search
      if (url === "https://www.youtube.com" || url === "https://www.youtube.com/") {
        // Show YouTube-like landing page
        iframe.src = "https://www.youtube.com/embed?listType=search&list=trending";
        return;
      }

      // For Google, use embedded search
      if (url === "https://www.google.com" || url === "https://www.google.com/") {
        showGoogleHome(iframe, errorOverlay);
        return;
      }

      // Google search query  
      if (url.includes("google.com/search")) {
        const q = new URL(url).searchParams.get("q");
        if (q) {
          iframe.src = `https://www.google.com/search?igu=1&q=${encodeURIComponent(q)}`;
          return;
        }
      }

      // Try loading directly
      iframe.src = url;

      // Handle load errors
      iframe.onerror = () => {
        showLoadError(url, errorOverlay, iframe);
      };
    }

    function showGoogleHome(iframe, errorOverlay) {
      iframe.style.display = "none";
      errorOverlay.style.display = "flex";
      errorOverlay.innerHTML = `
        <div style="max-width:400px;width:100%;">
          <div style="font-size:48px;font-weight:400;margin-bottom:20px;">
            <span style="color:#4285F4">G</span><span style="color:#EA4335">o</span><span style="color:#FBBC05">o</span><span style="color:#4285F4">g</span><span style="color:#34A853">l</span><span style="color:#EA4335">e</span>
          </div>
          <div style="display:flex;gap:8px;">
            <input type="text" id="win11-google-search" placeholder="Google で検索" style="flex:1;height:40px;border-radius:20px;border:1px solid var(--border);padding:0 16px;background:var(--input-bg);color:var(--text);font-size:14px;outline:none;font-family:inherit;">
            <button id="win11-google-btn" style="height:40px;padding:0 16px;border-radius:4px;border:none;background:var(--hover-strong);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit;">Google 検索</button>
          </div>
          <div style="margin-top:20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;"></div>
        </div>
      `;

      const doSearch = () => {
        const q = document.getElementById("win11-google-search").value.trim();
        if (q) {
          errorOverlay.style.display = "none";
          iframe.style.display = "block";
          urlInput.value = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
          iframe.src = `https://www.google.com/search?igu=1&q=${encodeURIComponent(q)}`;
        }
      };

      setTimeout(() => {
        const inp = document.getElementById("win11-google-search");
        const btn = document.getElementById("win11-google-btn");
        if (inp) {
          inp.addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
          inp.focus();
        }
        if (btn) btn.addEventListener("click", doSearch);
      }, 50);
    }

    function showLoadError(url, errorOverlay, iframe) {
      iframe.style.display = "none";
      errorOverlay.style.display = "flex";
      errorOverlay.innerHTML = `
        <div style="font-size:36px;margin-bottom:12px">🌐</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px">このサイトにアクセスできません</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px">${url}<br>接続がリセットされたか、iframeでの読み込みがブロックされています。</div>
        <button style="padding:8px 24px;border-radius:4px;background:var(--accent-bg);color:#fff;border:none;cursor:pointer;font-size:13px;font-family:inherit;" onclick="window.open('${url}','_blank')">新しいウィンドウで開く</button>
      `;
    }

    const iframeContainer = el("div");
    iframeContainer.style.cssText = "flex:1;position:relative;overflow:hidden;";
    iframeContainer.appendChild(iframe);
    iframeContainer.appendChild(errorOverlay);
    content.appendChild(iframeContainer);

    createWindow({
      id: "edge", title: "Microsoft Edge", icon: IC.edge,
      width: Math.min(aw - 10, 440), height: Math.min(ah - 10, 300),
      x: 5, y: 5, content
    });

    // Navigate to Google home
    setTimeout(() => navigateTo("https://www.google.com"), 100);
  }

  // ===== FILE EXPLORER =====
  function openExplorer(aw, ah) {
    const content = el("div", "w11-explorer");
    content.style.height = "100%";

    // Toolbar
    const toolbar = el("div", "w11-explorer-toolbar");
    toolbar.innerHTML = `
      <button class="w11-edge-nav-btn">${IC.back}</button>
      <button class="w11-edge-nav-btn">${IC.forward}</button>
      <input class="w11-explorer-address" value="C:\\Users\\ユーザー" readonly>
    `;
    content.appendChild(toolbar);

    // Body
    const body = el("div", "w11-explorer-body");

    // Sidebar
    const sidebar = el("div", "w11-explorer-sidebar");
    const sideItems = [
      { name: "クイックアクセス", icon: "⭐" },
      { name: "デスクトップ", icon: "🖥️" },
      { name: "ダウンロード", icon: "⬇️" },
      { name: "ドキュメント", icon: "📄" },
      { name: "画像", icon: "🖼️" },
      { name: "ミュージック", icon: "🎵" },
      { name: "ビデオ", icon: "🎬" },
      { name: "ローカルディスク(C:)", icon: "💿" },
    ];
    sideItems.forEach((item, i) => {
      const b = btn("w11-explorer-sidebar-item" + (i === 0 ? " active" : ""),
        `<span>${item.icon}</span>${item.name}`,
        (e) => {
          sidebar.querySelectorAll(".w11-explorer-sidebar-item").forEach(s => s.classList.remove("active"));
          e.currentTarget.classList.add("active");
        }
      );
      sidebar.appendChild(b);
    });
    body.appendChild(sidebar);

    // Main area
    const main = el("div", "w11-explorer-main");
    const grid = el("div", "w11-explorer-grid");
    EXPLORER_FILES.forEach(file => {
      const fileEl = el("div", "w11-explorer-file");
      fileEl.innerHTML = `<div class="w11-explorer-file-icon">${file.icon}</div><div class="w11-explorer-file-name">${file.name}</div>`;
      fileEl.addEventListener("dblclick", () => {
        if (file.type === "exe") {
          runExe(file.name);
        } else if (file.type === "folder") {
          // Just show a message
          const addr = content.querySelector(".w11-explorer-address");
          if (addr) addr.value = `C:\\Users\\ユーザー\\${file.name}`;
        }
      });
      grid.appendChild(fileEl);
    });
    main.appendChild(grid);
    body.appendChild(main);
    content.appendChild(body);

    createWindow({
      id: "explorer", title: "エクスプローラー", icon: IC.folder,
      width: Math.min(aw - 20, 420), height: Math.min(ah - 20, 280),
      x: 15, y: 10, content
    });
  }

  // ===== NOTEPAD =====
  function openNotepad(aw, ah) {
    const content = el("div", "w11-notepad");
    content.style.height = "100%";

    // Menu
    const menu = el("div", "w11-notepad-menu");
    ["ファイル", "編集", "書式", "表示", "ヘルプ"].forEach(name => {
      const item = btn("w11-notepad-menu-item", name, () => {
        if (name === "ファイル") {
          const fname = prompt("ファイル名を入力:", "untitled.txt");
          if (fname) {
            const blob = new Blob([textarea.value], { type: "text/plain" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = fname;
            a.click();
          }
        }
      });
      menu.appendChild(item);
    });
    content.appendChild(menu);

    // Textarea
    const textarea = document.createElement("textarea");
    textarea.className = "w11-notepad-textarea";
    textarea.placeholder = "ここにテキストを入力...";
    textarea.value = notepadText;
    textarea.addEventListener("input", () => { notepadText = textarea.value; });
    content.appendChild(textarea);

    createWindow({
      id: "notepad", title: "メモ帳 - 無題", icon: IC.notepad,
      width: Math.min(aw - 40, 360), height: Math.min(ah - 30, 260),
      x: 40, y: 15, content
    });
  }

  // ===== CALCULATOR =====
  function openCalculator(aw, ah) {
    const content = el("div", "w11-calc");
    content.style.height = "100%";

    // Display
    const display = el("div", "w11-calc-display", calcDisplay);
    display.id = "win11-calc-display";
    content.appendChild(display);

    // Buttons
    const btnsDiv = el("div", "w11-calc-buttons");
    const buttons = [
      { t: "%", cls: "op" }, { t: "CE", cls: "op" }, { t: "C", cls: "op" }, { t: "⌫", cls: "op" },
      { t: "¹/ₓ", cls: "op" }, { t: "x²", cls: "op" }, { t: "√", cls: "op" }, { t: "÷", cls: "op" },
      { t: "7", cls: "num" }, { t: "8", cls: "num" }, { t: "9", cls: "num" }, { t: "×", cls: "op" },
      { t: "4", cls: "num" }, { t: "5", cls: "num" }, { t: "6", cls: "num" }, { t: "−", cls: "op" },
      { t: "1", cls: "num" }, { t: "2", cls: "num" }, { t: "3", cls: "num" }, { t: "+", cls: "op" },
      { t: "±", cls: "num" }, { t: "0", cls: "num" }, { t: ".", cls: "num" }, { t: "=", cls: "eq" },
    ];

    buttons.forEach(b => {
      const button = btn(`w11-calc-btn ${b.cls}`, b.t, () => calcInput(b.t, display));
      btnsDiv.appendChild(button);
    });
    content.appendChild(btnsDiv);

    createWindow({
      id: "calc", title: "電卓", icon: IC.calc,
      width: Math.min(240, aw - 60), height: Math.min(300, ah - 20),
      x: aw - 260, y: 10, content
    });
  }

  function calcInput(key, display) {
    if (key >= "0" && key <= "9") {
      if (calcNewNum) { calcDisplay = key; calcNewNum = false; }
      else calcDisplay += key;
    } else if (key === ".") {
      if (!calcDisplay.includes(".")) calcDisplay += ".";
      calcNewNum = false;
    } else if (key === "C") {
      calcDisplay = "0"; calcPrev = null; calcOp = null; calcNewNum = true;
    } else if (key === "CE") {
      calcDisplay = "0"; calcNewNum = true;
    } else if (key === "⌫") {
      calcDisplay = calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : "0";
    } else if (key === "±") {
      calcDisplay = String(-parseFloat(calcDisplay));
    } else if (key === "x²") {
      calcDisplay = String(Math.pow(parseFloat(calcDisplay), 2));
      calcNewNum = true;
    } else if (key === "√") {
      calcDisplay = String(Math.sqrt(parseFloat(calcDisplay)));
      calcNewNum = true;
    } else if (key === "¹/ₓ") {
      calcDisplay = String(1 / parseFloat(calcDisplay));
      calcNewNum = true;
    } else if (key === "%") {
      calcDisplay = String(parseFloat(calcDisplay) / 100);
      calcNewNum = true;
    } else if (["+", "−", "×", "÷"].includes(key)) {
      if (calcPrev !== null && !calcNewNum) {
        calcDisplay = String(calcEval(calcPrev, parseFloat(calcDisplay), calcOp));
      }
      calcPrev = parseFloat(calcDisplay);
      calcOp = key;
      calcNewNum = true;
    } else if (key === "=") {
      if (calcPrev !== null) {
        calcDisplay = String(calcEval(calcPrev, parseFloat(calcDisplay), calcOp));
        calcPrev = null;
        calcOp = null;
        calcNewNum = true;
      }
    }
    // Update display
    display.textContent = calcDisplay;
  }

  function calcEval(a, b, op) {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : "Error";
      default: return b;
    }
  }

  // ===== SETTINGS =====
  function openSettings(aw, ah) {
    const content = el("div", "w11-settings");
    content.style.height = "100%";

    // Sidebar
    const sidebar = el("div", "w11-settings-sidebar");
    const categories = [
      { name: "システム", icon: "💻" },
      { name: "Bluetooth", icon: "🔵" },
      { name: "ネットワーク", icon: "🌐" },
      { name: "個人用設定", icon: "🎨", active: true },
      { name: "アプリ", icon: "📦" },
      { name: "アカウント", icon: "👤" },
      { name: "時刻と言語", icon: "🕐" },
      { name: "アクセシビリティ", icon: "♿" },
      { name: "プライバシー", icon: "🔒" },
      { name: "Windows Update", icon: "🔄" },
    ];
    categories.forEach(cat => {
      const item = btn("w11-settings-item" + (cat.active ? " active" : ""),
        `<span>${cat.icon}</span>${cat.name}`,
        (e) => {
          sidebar.querySelectorAll(".w11-settings-item").forEach(s => s.classList.remove("active"));
          e.currentTarget.classList.add("active");
        }
      );
      sidebar.appendChild(item);
    });
    content.appendChild(sidebar);

    // Content area - Personalization
    const main = el("div", "w11-settings-content");
    main.innerHTML = `
      <div class="w11-settings-title">個人用設定</div>
      <div class="w11-settings-subtitle">背景</div>
      <div class="w11-settings-card">
        <div class="w11-settings-label" style="margin-bottom:8px">壁紙を選択</div>
        <div class="w11-wp-grid" id="win11-wp-grid"></div>
      </div>
      <div class="w11-settings-subtitle">テーマ</div>
      <div class="w11-settings-card">
        <div class="w11-settings-row">
          <div class="w11-settings-label">ダークモード</div>
          <button class="w11-toggle ${darkMode ? 'on' : ''}" id="win11-darkmode-toggle"></button>
        </div>
      </div>
      <div class="w11-settings-subtitle">色</div>
      <div class="w11-settings-card">
        <div class="w11-settings-label" style="margin-bottom:8px">アクセントカラー</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <div style="width:28px;height:28px;border-radius:50%;background:#0078D4;cursor:pointer;border:2px solid var(--text)"></div>
          <div style="width:28px;height:28px;border-radius:50%;background:#744da9;cursor:pointer;"></div>
          <div style="width:28px;height:28px;border-radius:50%;background:#d13438;cursor:pointer;"></div>
          <div style="width:28px;height:28px;border-radius:50%;background:#00b7c3;cursor:pointer;"></div>
          <div style="width:28px;height:28px;border-radius:50%;background:#107c10;cursor:pointer;"></div>
          <div style="width:28px;height:28px;border-radius:50%;background:#ff8c00;cursor:pointer;"></div>
        </div>
      </div>
    `;
    content.appendChild(main);

    const win = createWindow({
      id: "settings", title: "設定", icon: IC.settings,
      width: Math.min(aw - 10, 440), height: Math.min(ah - 10, 290),
      x: 5, y: 5, content
    });

    // Setup wallpaper thumbnails
    setTimeout(() => {
      const wpGrid = document.getElementById("win11-wp-grid");
      if (wpGrid) {
        // Get stage backdrops
        const canvas = document.querySelector("canvas");
        const wpColors = [
          "linear-gradient(135deg, #0a0a1a, #1a0030, #2d0060)",
          "linear-gradient(135deg, #a8d4f0, #4a9ae0, #1a5fb4)",
          "linear-gradient(135deg, #0a1628, #1a3a5c, #0d2847)",
        ];
        const wpNames = ["ダーク抽象", "ライトブルーム", "ダークブルーム"];
        wpColors.forEach((bg, i) => {
          const thumb = el("div", "w11-wp-thumb" + (i === 0 ? " active" : ""));
          thumb.style.background = bg;
          thumb.title = wpNames[i];
          thumb.addEventListener("click", () => {
            wpGrid.querySelectorAll(".w11-wp-thumb").forEach(t => t.classList.remove("active"));
            thumb.classList.add("active");
            // Change backdrop via Scratch
            try {
              const vm = (window.vm || (window.Scratch && window.Scratch.vm));
              if (vm) {
                const stage = vm.runtime.getTargetForStage();
                if (stage && stage.setCostume) {
                  stage.setCostume(i);
                }
              }
            } catch(e) { console.log("Wallpaper change:", e); }
          });
          wpGrid.appendChild(thumb);
        });
      }

      // Dark mode toggle
      const toggle = document.getElementById("win11-darkmode-toggle");
      if (toggle) {
        toggle.addEventListener("click", () => {
          darkMode = !darkMode;
          toggle.classList.toggle("on", darkMode);
          overlay.className = darkMode ? "dark" : "light";
        });
      }
    }, 100);
  }

  // ===== TERMINAL =====
  function openTerminal(aw, ah) {
    const content = el("div");
    content.style.cssText = "height:100%;background:#0c0c0c;padding:8px;font-family:'Cascadia Code','Consolas','MS Gothic',monospace;font-size:12px;color:#cccccc;overflow-y:auto;";

    const outputDiv = el("div");
    outputDiv.innerHTML = `
      <div style="color:#569cd6">Windows PowerShell</div>
      <div style="color:#666">Copyright (C) Microsoft Corporation. All rights reserved.</div>
      <div style="margin-top:4px;color:#666">新機能と改善のために最新の PowerShell をインストールしてください</div>
      <div style="margin-top:8px"></div>
    `;
    content.appendChild(outputDiv);

    const prompt = el("div");
    prompt.style.cssText = "display:flex;gap:4px;align-items:center;margin-top:4px;";
    prompt.innerHTML = `<span style="color:#569cd6">PS C:\\Users\\ユーザー&gt;</span>`;
    const input = document.createElement("input");
    input.style.cssText = "flex:1;background:none;border:none;color:#cccccc;font-family:inherit;font-size:12px;outline:none;";
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim();
        input.value = "";
        const line = el("div");
        line.innerHTML = `<span style="color:#569cd6">PS C:\\Users\\ユーザー&gt;</span> ${cmd}`;
        outputDiv.appendChild(line);

        // Simple command processing
        let response = "";
        if (cmd === "dir" || cmd === "ls") {
          response = "ディレクトリ: C:\\Users\\ユーザー\n\n    ドキュメント\n    ダウンロード\n    画像\n    ミュージック\n    ビデオ\n    デスクトップ";
        } else if (cmd === "cls" || cmd === "clear") {
          outputDiv.innerHTML = "";
          return;
        } else if (cmd.startsWith("echo ")) {
          response = cmd.substring(5);
        } else if (cmd === "date") {
          response = new Date().toLocaleString("ja-JP");
        } else if (cmd === "whoami") {
          response = "WIN11-SIM\\ユーザー";
        } else if (cmd === "hostname") {
          response = "WIN11-SIMULATOR";
        } else if (cmd === "ipconfig") {
          response = "IPv4 アドレス: 192.168.1.100\nサブネットマスク: 255.255.255.0\nデフォルトゲートウェイ: 192.168.1.1";
        } else if (cmd === "ver") {
          response = "Microsoft Windows [Version 10.0.22631.4890]";
        } else if (cmd === "help") {
          response = "利用可能なコマンド:\n  dir/ls  - ファイル一覧\n  cls/clear - 画面クリア\n  echo - テキスト表示\n  date - 日時表示\n  whoami - ユーザー名\n  hostname - ホスト名\n  ipconfig - IP設定\n  ver - バージョン\n  calc - 電卓を開く\n  notepad - メモ帳を開く\n  explorer - エクスプローラーを開く";
        } else if (cmd === "calc") {
          openApp("calc"); response = "電卓を起動しています...";
        } else if (cmd === "notepad") {
          openApp("notepad"); response = "メモ帳を起動しています...";
        } else if (cmd === "explorer") {
          openApp("explorer"); response = "エクスプローラーを起動しています...";
        } else if (cmd.endsWith(".exe")) {
          runExe(cmd);
          response = `${cmd} を実行しています...`;
        } else if (cmd) {
          response = `'${cmd}' は、内部コマンドまたは外部コマンド、\n操作可能なプログラムまたはバッチ ファイルとして認識されていません。`;
        }

        if (response) {
          const resEl = el("div");
          resEl.style.cssText = "white-space:pre-wrap;margin:2px 0 4px;color:#cccccc;";
          resEl.textContent = response;
          outputDiv.appendChild(resEl);
        }

        content.scrollTop = content.scrollHeight;
      }
    });
    prompt.appendChild(input);
    content.appendChild(prompt);

    createWindow({
      id: "terminal", title: "Windows PowerShell", icon: IC.terminal,
      width: Math.min(aw - 20, 400), height: Math.min(ah - 20, 250),
      x: 20, y: 15, content
    });

    setTimeout(() => input.focus(), 100);
  }

  // ===== STORE =====
  function openStore(aw, ah) {
    const content = el("div");
    content.style.cssText = "height:100%;background:var(--bg-content);overflow-y:auto;padding:16px;";
    content.innerHTML = `
      <div style="font-size:20px;font-weight:600;color:var(--text);margin-bottom:16px">Microsoft Store</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[
          { name: "Spotify", icon: "🎵", color: "#1DB954" },
          { name: "Netflix", icon: "🎬", color: "#E50914" },
          { name: "Discord", icon: "💬", color: "#5865F2" },
          { name: "Slack", icon: "💼", color: "#4A154B" },
          { name: "WhatsApp", icon: "📱", color: "#25D366" },
          { name: "Zoom", icon: "📹", color: "#2D8CFF" },
        ].map(app => `
          <div style="background:var(--hover);border-radius:8px;padding:12px;text-align:center;cursor:pointer;border:1px solid var(--border);">
            <div style="font-size:28px;margin-bottom:6px">${app.icon}</div>
            <div style="font-size:11px;color:var(--text)">${app.name}</div>
            <div style="margin-top:6px;font-size:9px;padding:3px 8px;background:var(--accent-bg);color:#fff;border-radius:3px;display:inline-block">入手</div>
          </div>
        `).join("")}
      </div>
    `;

    createWindow({
      id: "store", title: "Microsoft Store", icon: IC.store,
      width: Math.min(aw - 20, 380), height: Math.min(ah - 20, 280),
      x: 25, y: 10, content
    });
  }

  // ===== EXE RUNNER =====
  function runExe(filename) {
    // Check if in TurboWarp Desktop (Electron)
    const isDesktop = typeof require !== "undefined";

    if (isDesktop) {
      try {
        const { exec } = require("child_process");
        // Show UAC-like dialog
        const proceed = confirm(`「${filename}」を実行しますか？\n\nこのアプリがデバイスに変更を加えることを許可しますか？`);
        if (proceed) {
          exec(filename, (error, stdout, stderr) => {
            if (error) {
              alert(`実行エラー: ${error.message}`);
            }
          });
        }
      } catch (e) {
        alert(`実行エラー: ${e.message}`);
      }
    } else {
      // Web mode - show dialog
      showExeDialog(filename);
    }
  }

  function showExeDialog(filename) {
    // Create a UAC-style dialog
    const dialogBg = el("div");
    dialogBg.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:600;display:flex;align-items:center;justify-content:center;";

    const dialog = el("div");
    dialog.style.cssText = `
      background: var(--bg-menu); border-radius: 8px; padding: 24px; width: 320px;
      box-shadow: var(--shadow); border: 1px solid var(--border); text-align: center;
    `;
    dialog.innerHTML = `
      <div style="font-size:32px;margin-bottom:12px">🛡️</div>
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px">ユーザーアカウント制御</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">このアプリがデバイスに変更を加えることを許可しますか？</div>
      <div style="font-size:13px;color:var(--text);margin-bottom:16px;font-weight:500">${filename}</div>
      <div style="font-size:10px;color:var(--text-secondary);margin-bottom:16px">
        ${typeof require !== "undefined" 
          ? "TurboWarp Desktopで実行されます" 
          : "⚠️ ブラウザ版ではファイルを選択して実行できます"}
      </div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button id="win11-exe-yes" style="padding:6px 20px;border-radius:4px;background:var(--accent-bg);color:#fff;border:none;cursor:pointer;font-size:12px;font-family:inherit;">はい</button>
        <button id="win11-exe-no" style="padding:6px 20px;border-radius:4px;background:var(--hover-strong);color:var(--text);border:1px solid var(--border);cursor:pointer;font-size:12px;font-family:inherit;">いいえ</button>
      </div>
    `;

    dialogBg.appendChild(dialog);
    overlay.appendChild(dialogBg);

    setTimeout(() => {
      document.getElementById("win11-exe-no")?.addEventListener("click", () => {
        dialogBg.remove();
      });
      document.getElementById("win11-exe-yes")?.addEventListener("click", () => {
        dialogBg.remove();
        if (typeof require !== "undefined") {
          try { require("child_process").exec(filename); } catch(e) { alert("エラー: " + e.message); }
        } else {
          // Try file picker
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".exe,.bat,.cmd,.msi";
          input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
              selectedFile = file.name;
              alert(`「${file.name}」が選択されました。\n\n.exeの実行はTurboWarp Desktop版でのみサポートされています。`);
            }
          });
          input.click();
        }
      });
    }, 50);
  }

  // ========================================================
  //  SCRATCH EXTENSION CLASS
  // ========================================================
  class Win11Extension {
    getInfo() {
      return {
        id: "win11",
        name: "🪟 Windows 11",
        color1: "#0078D4",
        color2: "#005A9E",
        color3: "#003D73",
        blocks: [
          {
            opcode: "initDesktop",
            blockType: Scratch.BlockType.COMMAND,
            text: "Windows 11 デスクトップを初期化",
          },
          "---",
          {
            opcode: "getTime",
            blockType: Scratch.BlockType.REPORTER,
            text: "現在時刻 (HH:MM)",
          },
          {
            opcode: "getDate",
            blockType: Scratch.BlockType.REPORTER,
            text: "現在日付",
          },
          {
            opcode: "getDayOfWeek",
            blockType: Scratch.BlockType.REPORTER,
            text: "曜日",
          },
          "---",
          {
            opcode: "openAppBlock",
            blockType: Scratch.BlockType.COMMAND,
            text: "[APP] を開く",
            arguments: {
              APP: {
                type: Scratch.ArgumentType.STRING,
                menu: "appMenu",
                defaultValue: "edge",
              },
            },
          },
          {
            opcode: "closeAppBlock",
            blockType: Scratch.BlockType.COMMAND,
            text: "[APP] を閉じる",
            arguments: {
              APP: {
                type: Scratch.ArgumentType.STRING,
                menu: "appMenu",
                defaultValue: "edge",
              },
            },
          },
          "---",
          {
            opcode: "openUrl",
            blockType: Scratch.BlockType.COMMAND,
            text: "Edgeで [URL] を開く",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://www.youtube.com",
              },
            },
          },
          "---",
          {
            opcode: "runExeBlock",
            blockType: Scratch.BlockType.COMMAND,
            text: ".exeを実行 [PATH]",
            arguments: {
              PATH: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad.exe",
              },
            },
          },
          {
            opcode: "getSelectedFile",
            blockType: Scratch.BlockType.REPORTER,
            text: "選択されたファイル",
          },
          "---",
          {
            opcode: "setDarkMode",
            blockType: Scratch.BlockType.COMMAND,
            text: "ダークモード [ONOFF]",
            arguments: {
              ONOFF: {
                type: Scratch.ArgumentType.STRING,
                menu: "onoffMenu",
                defaultValue: "ON",
              },
            },
          },
          {
            opcode: "isDarkMode",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "ダークモード？",
          },
          {
            opcode: "changeWallpaper",
            blockType: Scratch.BlockType.COMMAND,
            text: "壁紙を [NUM] に変更",
            arguments: {
              NUM: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
            },
          },
        ],
        menus: {
          appMenu: {
            acceptReporters: true,
            items: [
              "edge", "explorer", "notepad", "calc",
              "settings", "terminal", "store",
            ],
          },
          onoffMenu: {
            acceptReporters: false,
            items: ["ON", "OFF"],
          },
        },
      };
    }

    initDesktop() {
      if (!initialized) {
        // Small delay to let the stage render first
        setTimeout(() => {
          createDesktop();
          initialized = true;
        }, 500);
      }
    }

    getTime() { return formatTime(); }
    getDate() { return formatDate(); }
    getDayOfWeek() { return formatDay(); }

    openAppBlock({ APP }) { openApp(APP); }
    closeAppBlock({ APP }) { closeWindow(APP); }

    openUrl({ URL }) {
      openApp("edge");
      setTimeout(() => {
        const urlInput = overlay?.querySelector(".w11-edge-url");
        if (urlInput) {
          urlInput.value = URL;
          urlInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        }
      }, 300);
    }

    runExeBlock({ PATH }) { runExe(PATH); }
    getSelectedFile() { return selectedFile; }

    setDarkMode({ ONOFF }) {
      darkMode = ONOFF === "ON";
      if (overlay) overlay.className = darkMode ? "dark" : "light";
    }

    isDarkMode() { return darkMode; }

    changeWallpaper({ NUM }) {
      try {
        const vm = window.vm || (window.Scratch && window.Scratch.vm);
        if (vm) {
          const stage = vm.runtime.getTargetForStage();
          if (stage) stage.setCostume(Math.max(0, Math.floor(NUM) - 1));
        }
      } catch (e) { console.log("Wallpaper change error:", e); }
    }
  }

  Scratch.extensions.register(new Win11Extension());
})(Scratch);
