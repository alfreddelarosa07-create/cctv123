/* ==========================================================
   SecureCampus Admin - SPCIHS CCTV Management
   NOTE: This is a front-end demo. Login and data are handled in
   the browser only. A real deployment needs a secure backend.
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const fmt = (d) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  const localDate = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    remove(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function downloadCSV(name, headers, rows) {
    const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const csv = [headers].concat(rows).map((r) => r.map(q).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }

  /* ---------- Data ---------- */
  const ADMIN = { user: "admin", pass: "admin123", name: "Administrator" };
  const SCHOOL = "San Pablo City Integrated High School";
const LOG_KEY = "cctv_logs_v5"; // bagong key para mawala ang mga lumang logs

  const cameras = [
  { id: 1, name: "1st Floor - Room 1", floor: "1st Floor", type: "Dome", ip: "10.10.10.11", sw: "SW-F1", vlan: 10, status: "online" },
  { id: 2, name: "1st Floor - Room 2", floor: "1st Floor", type: "Dome", ip: "10.10.10.12", sw: "SW-F1", vlan: 10, status: "online" },
  { id: 3, name: "1st Floor - Room 3", floor: "1st Floor", type: "Dome", ip: "10.10.10.13", sw: "SW-F1", vlan: 10, status: "online" },
  { id: 4, name: "1st Floor - Room 4", floor: "1st Floor", type: "Dome", ip: "10.10.10.14", sw: "SW-F1", vlan: 10, status: "offline" },
  { id: 5, name: "2nd Floor - Room 1", floor: "2nd Floor", type: "Dome", ip: "10.10.10.21", sw: "SW-F2", vlan: 10, status: "online" },
  { id: 6, name: "2nd Floor - Room 2", floor: "2nd Floor", type: "Dome", ip: "10.10.10.22", sw: "SW-F2", vlan: 10, status: "online" },
  { id: 7, name: "2nd Floor - Room 3", floor: "2nd Floor", type: "Dome", ip: "10.10.10.23", sw: "SW-F2", vlan: 10, status: "online" },
  { id: 8, name: "2nd Floor - Room 4", floor: "2nd Floor", type: "Dome", ip: "10.10.10.24", sw: "SW-F2", vlan: 10, status: "online" }
];
  const now0 = Date.now();
  cameras.forEach((c) => {
    c.latency = c.status === "online" ? rand(3, 22) : null;
    c.bw = c.status === "online" ? (rand(30, 60) / 10) : 0;
    c.checked = now0 - rand(1, 9) * 60000;
  });
  const camById = (id) => cameras.find((c) => c.id === Number(id));
  const online = () => cameras.filter((c) => c.status === "online");

  //* ---------- Logs ---------- */
store.remove("cctv_logs_v2");
store.remove("cctv_logs_v3");
store.remove("cctv_logs_v4"); // idagdag ito
let logs = store.get(LOG_KEY, null);
    function seedLogs() {
    return [];
  }
    return [
      mk(1, "Network", "High", "Floor 1 - Room 4", "Floor 1 - Room 4 (10.10.10.14) disconnected", "system", "—"),
      mk(3, "Incident", "Medium", "Floor 1 - Room 3", "Trespassing: Unidentified person near Floor 1 - Room 3 after class hours.", "Administrator", "Open"),
      mk(5, "System", "Info", "—", "Scheduled footage cleanup completed", "system", "—"),
      mk(26, "Network", "High", "Floor 2 - Room 2", "Floor 2 - Room 2 (10.10.10.22) disconnected", "system", "—"),
      mk(30, "Incident", "Low", "Floor 1 - Room 1", "Equipment issue: Camera angle adjusted after strong wind.", "Administrator", "Resolved"),
      mk(50, "Access", "Info", "—", "Administrator exported footage (approved by School Head)", "admin", "—"),
      mk(72, "Privacy", "Info", "—", "Retention period reviewed and confirmed at 30 days", "admin", "—"),
      mk(100, "Incident", "High", "Floor 1 - Room 2", "Vandalism: Bulletin board damaged near Floor 1 - Room 2.", "Administrator", "Resolved")
    ];
  }
  if (!Array.isArray(logs) || !logs.length) { logs = seedLogs(); store.set(LOG_KEY, logs); }

  let appReady = false;
  function addLog(type, severity, message, opts) {
    opts = opts || {};
    logs.unshift({
      id: Date.now() + "-" + rand(100, 999),
      time: new Date().toISOString(),
      type, severity, message,
      camera: opts.camera || "—",
      user: opts.user || (sessionStorage.getItem("cctv_session") ? ADMIN.user : "system"),
      status: opts.status || "—"
    });
    if (logs.length > 500) logs.length = 500;
    store.set(LOG_KEY, logs);
    if (appReady) { renderLogs(); renderRecent(); renderDashStats(); }
  }

  /* ---------- Privacy state ---------- */
  const ROLE_DEFAULTS = {
    "School Head": { live: 1, playback: 1, export: 1, del: 0 },
    "Data Protection Officer": { live: 1, playback: 1, export: 1, del: 1 },
    "Security Officer": { live: 1, playback: 0, export: 0, del: 0 },
    "IT Staff": { live: 1, playback: 0, export: 0, del: 0 },
    "Teacher": { live: 0, playback: 0, export: 0, del: 0 }
  };
  let users = store.get("cctv_users", null);
  if (!Array.isArray(users) || !users.length) {
    users = [
      { id: 1, name: "Administrator", role: "System Administrator", live: 1, playback: 1, export: 1, del: 1, active: 1, locked: 1 },
      { id: 2, name: "School Head", role: "School Head", live: 1, playback: 1, export: 1, del: 0, active: 1 },
      { id: 3, name: "Data Protection Officer", role: "Data Protection Officer", live: 1, playback: 1, export: 1, del: 1, active: 1 },
      { id: 4, name: "Security Officer 1", role: "Security Officer", live: 1, playback: 0, export: 0, del: 0, active: 1 }
    ];
    store.set("cctv_users", users);
  }
  let privacy = store.get("cctv_privacy", null) || { retention: 30, autoLogout: 15, encrypt: true, approval: true, masking: false, signage: true, privateAreas: true };

  /* ==========================================================
     1. LOGIN
     ========================================================== */
  const loginView = $("#loginView");
  const appView = $("#appView");
  let attempts = 0;
  let lockTimer = null;

  $("#togglePw").addEventListener("click", () => {
    const pw = $("#password");
    const show = pw.type === "password";
    pw.type = show ? "text" : "password";
    $("#togglePw").textContent = show ? "Hide" : "Show";
  });

  function lockLogin(seconds) {
    const btn = $("#loginBtn");
    const err = $("#loginError");
    let left = seconds;
    btn.disabled = true;
    clearInterval(lockTimer);
    lockTimer = setInterval(() => {
      err.textContent = "Too many failed attempts. Try again in " + left + "s.";
      if (left-- <= 0) {
        clearInterval(lockTimer);
        btn.disabled = false;
        attempts = 0;
        err.textContent = "";
      }
    }, 1000);
  }

  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const u = $("#username").value.trim();
    const p = $("#password").value;
    const err = $("#loginError");

    if (!u || !p) { err.textContent = "Please enter your username and password."; return; }

    if (u === ADMIN.user && p === ADMIN.pass) {
      attempts = 0;
      err.textContent = "";
      sessionStorage.setItem("cctv_session", "1");
      addLog("Access", "Info", "Administrator signed in", { user: ADMIN.user });
      showApp();
    } else {
      attempts++;
      addLog("Access", "Medium", "Failed sign-in attempt (" + attempts + ")", { user: u.slice(0, 20) || "unknown" });
      $(".login-card").classList.remove("shake");
      void $(".login-card").offsetWidth;
      $(".login-card").classList.add("shake");
      if (attempts >= 3) {
        addLog("Access", "High", "Sign-in locked for 30 seconds after repeated failures");
        lockLogin(30);
      } else {
        err.textContent = "Incorrect username or password. Attempts left: " + (3 - attempts);
      }
    }
  });

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    appReady = true;
    lastActivity = Date.now();
    renderAll();
    showView("dashboard");
  }

  function logout(reason) {
    addLog("Access", "Info", reason === "timeout" ? "Session ended due to inactivity" : "Administrator signed out", { user: ADMIN.user });
    sessionStorage.removeItem("cctv_session");
    appReady = false;
    appView.hidden = true;
    loginView.hidden = false;
    $("#password").value = "";
    $("#loginError").textContent = reason === "timeout" ? "You were signed out due to inactivity." : "";
    closeModals();
  }
  $("#logoutBtn").addEventListener("click", () => logout());

  /* Idle auto sign-out */
  let lastActivity = Date.now();
  ["mousemove", "keydown", "click", "touchstart"].forEach((ev) => document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (appReady && Date.now() - lastActivity > privacy.autoLogout * 60000) logout("timeout");
  }, 15000);

  /* ==========================================================
     NAVIGATION
     ========================================================== */
  const titles = { dashboard: "Dashboard", live: "Live Camera View", network: "Network Monitor", logs: "Incident & Event Log", reports: "Report Generator", privacy: "Data Privacy Settings" };

  function showView(name) {
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    $$("#sideNav .nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    $("#pageTitle").textContent = titles[name];
    closeMenu();
    window.scrollTo(0, 0);
  }
  $$("#sideNav .nav-btn").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));

  function closeMenu() { $("#sidebar").classList.remove("open"); $("#scrim").classList.remove("show"); }
  $("#menuBtn").addEventListener("click", () => { $("#sidebar").classList.add("open"); $("#scrim").classList.add("show"); });
  $("#scrim").addEventListener("click", closeMenu);

  function tickClock() {
    $("#topClock").textContent = new Date().toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ==========================================================
     2. DASHBOARD
     ========================================================== */
  let dashFloor = "All";

  function statusBadge(s) {
    return '<span class="badge ' + s + '">' + (s === "online" ? "Connected" : "Disconnected") + "</span>";
  }

  function renderDashStats() {
    const on = online().length, off = cameras.length - on;
    const open = logs.filter((l) => l.type === "Incident" && l.status === "Open").length;
    const pct = Math.round((on / cameras.length) * 100);
    $("#dashStats").innerHTML =
      '<div class="stat info"><small>Total cameras</small><strong>' + cameras.length + "</strong></div>" +
      '<div class="stat ok"><small>Online</small><strong>' + on + "</strong></div>" +
      '<div class="stat bad"><small>Offline</small><strong>' + off + "</strong></div>" +
      '<div class="stat warn"><small>Open incidents</small><strong>' + open + "</strong></div>" +
      '<div class="stat ok"><small>Availability</small><strong>' + pct + "%</strong></div>";

    const al = $("#offlineAlert");
    if (off > 0) {
      al.hidden = false;
      al.innerHTML = "&#9888; <b>" + off + " camera" + (off > 1 ? "s are" : " is") + " offline:</b> " + cameras.filter((c) => c.status !== "online").map((c) => esc(c.name)).join(", ") + ". Check the Network Monitor.";
    } else {
      al.hidden = true;
    }
  }

  function renderCamGrid() {
    const list = cameras.filter((c) => dashFloor === "All" || c.floor === dashFloor);
    $("#camGrid").innerHTML = list.map((c) =>
      '<button class="cam-card" data-id="' + c.id + '">' +
      '<canvas class="feed" data-cam="' + c.id + '" width="320" height="180"></canvas>' +
      '<div class="cam-meta"><div style="min-width:0"><b>' + esc(c.name) + "</b><small>" + c.floor + " &middot; " + c.type + "</small></div>" + statusBadge(c.status) + "</div></button>"
    ).join("");
  }
  $("#camGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".cam-card");
    if (card) openCam(card.dataset.id);
  });
  $("#floorFilter").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    dashFloor = b.dataset.floor;
    $$("#floorFilter .chip").forEach((c) => c.classList.toggle("active", c === b));
    renderCamGrid();
  });

  function renderFloorBars() {
  const floors = [

    
  ["1st Floor", "1st Floor"],
  ["2nd Floor", "2nd Floor"]
];
    $("#floorBars").innerHTML = floors.map((f) => {
      const all = cameras.filter((c) => c.floor === f[0]);
      const on = all.filter((c) => c.status === "online").length;
      const pct = all.length ? Math.round((on / all.length) * 100) : 0;
      const cls = pct === 100 ? "good" : pct >= 60 ? "" : "warn";
      return '<div class="bar-row"><div><span>' + f[1] + "</span><b>" + on + "/" + all.length + '</b></div><div class="meter"><div class="meter-bar ' + cls + '" style="width:' + pct + '%"></div></div></div>';
    }).join("");

    const used = Math.min(95, Math.round(cameras.length * privacy.retention * 0.17));
    $("#storageBar").style.width = used + "%";
    $("#storageBar").className = "meter-bar" + (used > 80 ? " warn" : "");
    $("#storageText").textContent = "About " + used + "% of storage used with " + privacy.retention + "-day retention (estimate only).";
  }

  function renderRecent() {
    $("#recentList").innerHTML = logs.slice(0, 6).map((l) =>
      "<li>" + esc(l.message) + "<small>" + fmt(l.time) + " &middot; " + esc(l.type) + "</small></li>"
    ).join("");
  }

  /* ==========================================================
     3. LIVE VIEW
     ========================================================== */
  let liveN = 2, livePage = 0;

 function renderLive() {
  const all = liveN === 0;                       // 0 = View All
  const slots = all ? cameras.length : liveN * liveN;
  const pages = all ? 1 : Math.max(1, Math.ceil(cameras.length / slots));
  if (livePage >= pages) livePage = pages - 1;
  const list = all ? cameras : cameras.slice(livePage * slots, livePage * slots + slots);
const cols = all ? Math.min(4, Math.ceil(cameras.length / 2)) : liveN;
  const w = all ? 320 : (slots >= 4 ? 480 : 960);
  const h = all ? 180 : (slots >= 4 ? 270 : 540);
  const grid = $("#liveGrid");
  grid.style.setProperty("--cols", cols);
  grid.innerHTML = list.map((c) =>
    '<div class="tile" data-id="' + c.id + '" style="cursor:pointer">' +
    '<canvas class="feed" data-cam="' + c.id + '" width="' + w + '" height="' + h + '"></canvas>' +
    '<div class="tile-bar"><b>' + esc(c.name) + "</b>" + statusBadge(c.status) + "</div></div>"
  ).join("");
  $("#livePage").textContent = all ? "All " + cameras.length + " cameras" : "Page " + (livePage + 1) + " of " + pages;
  $("#livePrev").disabled = livePage === 0;
  $("#liveNext").disabled = livePage >= pages - 1;
  $$("#layoutSeg button").forEach((b) => b.classList.toggle("active", Number(b.dataset.n) === liveN));
}
  $("#layoutSeg").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    liveN = Number(b.dataset.n); livePage = 0; renderLive();
  });
  $("#livePrev").addEventListener("click", () => { livePage--; renderLive(); });
  $("#liveNext").addEventListener("click", () => { livePage++; renderLive(); });
  $("#liveGrid").addEventListener("click", (e) => {
    const t = e.target.closest(".tile");
    if (t) openCam(t.dataset.id);
  });
  $("#fullscreenBtn").addEventListener("click", () => {
    const g = $("#liveGrid");
    if (document.fullscreenElement) document.exitFullscreen();
    else if (g.requestFullscreen) g.requestFullscreen();
    else toast("Fullscreen is not supported in this browser.");
  });

  /* Camera modal */
  function openCam(id) {
    const c = camById(id);
    if (!c) return;
    const cv = $("#modalFeed");
    cv.dataset.cam = c.id;
    $("#zoomRange").value = 1;
    cv.style.transform = "scale(1)";
    $("#modalTitle").textContent = "CAM " + pad(c.id) + " \u2022 " + c.name;
    $("#modalInfo").innerHTML =
      "<div><dt>Status</dt><dd>" + (c.status === "online" ? "Connected" : "Disconnected") + "</dd></div>" +
      "<div><dt>Floor</dt><dd>" + c.floor + "</dd></div>" +
      "<div><dt>Type</dt><dd>" + c.type + "</dd></div>" +
      "<div><dt>IP address</dt><dd>" + c.ip + "</dd></div>" +
      "<div><dt>Switch</dt><dd>" + c.sw + "</dd></div>";
    $("#camModal").hidden = false;
    addLog("Access", "Info", "Live view opened: " + c.name, { camera: c.name });
  }
  $("#zoomRange").addEventListener("input", (e) => { $("#modalFeed").style.transform = "scale(" + e.target.value + ")"; });
  $("#snapBtn").addEventListener("click", () => {
    const cv = $("#modalFeed");
    const c = camById(cv.dataset.cam);
    if (!c || c.status !== "online") { toast("Cannot take a snapshot: camera is offline."); return; }
    if (privacy.approval) toast("Snapshot saved. Exports require approval under your privacy settings.");
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = "snapshot_cam" + pad(c.id) + "_" + Date.now() + ".png";
    a.click();
    addLog("Access", "Low", "Snapshot captured from " + c.name, { camera: c.name });
  });

  /* ---------- Simulated feed renderer ---------- */
  function drawFeed(cv, cam, t) {
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height;
    const fs = Math.max(10, Math.round(h * 0.055));
    const label = "CAM " + pad(cam.id) + " \u2022 " + cam.name;

    if (cam.status !== "online") {
      ctx.fillStyle = "#070b14"; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle = "rgba(255,255,255," + (Math.random() * 0.22).toFixed(2) + ")";
        ctx.fillRect(Math.random() * w, Math.random() * h, w / 50, h / 80);
      }
      ctx.textAlign = "center"; ctx.fillStyle = "#ef4444"; ctx.font = "bold " + fs * 1.5 + "px sans-serif";
      ctx.fillText("NO SIGNAL", w / 2, h / 2);
      ctx.font = fs * 0.8 + "px sans-serif"; ctx.fillStyle = "#94a3b8";
      ctx.fillText("Camera disconnected", w / 2, h / 2 + fs * 1.3);
      ctx.textAlign = "left"; ctx.font = "bold " + fs + "px sans-serif"; ctx.fillStyle = "#e2e8f0";
      ctx.fillText(label, w * 0.03, h * 0.09);
      return;
    }

    const hue = 190 + (cam.id * 11) % 40;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "hsl(" + hue + ",28%,17%)");
    g.addColorStop(1, "hsl(" + hue + ",32%,6%)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // perspective floor lines
    const vx = w / 2, vy = h * 0.42;
    ctx.strokeStyle = "rgba(180,220,240,0.12)"; ctx.lineWidth = 1;
    for (let k = -7; k <= 7; k++) { ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + k * w * 0.2, h); ctx.stroke(); }
    for (let r = 1; r <= 6; r++) { const y = vy + (h - vy) * Math.pow(r / 6, 2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // moving figures
    for (let j = 0; j < 3; j++) {
      const speed = 0.000025 * (1 + j) * (1 + (cam.id % 4) * 0.35);
      const x = (((t * speed + cam.id * 0.17 + j * 0.31) % 1) * (w + 80)) - 40;
      const y = h * (0.56 + 0.1 * j);
      const s = h * (0.06 + 0.035 * j);
      ctx.fillStyle = "rgba(210,232,244," + (0.22 + 0.08 * j) + ")";
      ctx.beginPath(); ctx.arc(x, y - s * 1.6, s * 0.38, 0, 6.283); ctx.fill();
      ctx.fillRect(x - s * 0.35, y - s * 1.2, s * 0.7, s * 1.6);
    }

    // grain + scan sweep
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (Math.random() * 0.07).toFixed(2) + ")";
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    const sy = (t / 18) % (h * 1.3) - h * 0.15;
    const sg = ctx.createLinearGradient(0, sy - 20, 0, sy + 20);
    sg.addColorStop(0, "rgba(34,211,238,0)"); sg.addColorStop(0.5, "rgba(34,211,238,0.10)"); sg.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, sy - 20, w, 40);

    // privacy masking indicator (Room 4 on each floor)
    if (privacy.masking && cam.name.indexOf("Room 4") > -1) {
      ctx.fillStyle = "rgba(15,23,42,0.88)"; ctx.fillRect(w * 0.62, h * 0.18, w * 0.3, h * 0.3);
      ctx.fillStyle = "#94a3b8"; ctx.font = fs * 0.7 + "px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("MASKED ZONE", w * 0.77, h * 0.34); ctx.textAlign = "left";
    }

    // overlay text
    ctx.font = "bold " + fs + "px sans-serif"; ctx.fillStyle = "#e2e8f0"; ctx.textAlign = "left";
    ctx.fillText(label, w * 0.03, h * 0.09);
    const d = new Date();
    ctx.font = fs * 0.85 + "px monospace"; ctx.fillStyle = "#cbd5e1";
    ctx.fillText(d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour12: false }), w * 0.03, h * 0.96);
    if (Math.floor(t / 600) % 2 === 0) { ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(w * 0.93, h * 0.07, fs * 0.28, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = "#fca5a5"; ctx.font = "bold " + fs * 0.8 + "px sans-serif"; ctx.textAlign = "right";
    ctx.fillText("REC", w * 0.9, h * 0.095); ctx.textAlign = "left";
  }

  let lastFrame = 0;
  function loop(ts) {
    if (ts - lastFrame > 100) {
      lastFrame = ts;
      if (appReady) {
        $$("canvas.feed").forEach((cv) => {
          if (!cv.getClientRects().length) return;
          const cam = camById(cv.dataset.cam);
          if (cam) drawFeed(cv, cam, ts);
        });
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ==========================================================
     4. NETWORK MONITOR
     ========================================================== */
  function renderNetwork() {
    const on = online();
    const avg = on.length ? Math.round(on.reduce((s, c) => s + c.latency, 0) / on.length) : 0;
    const bw = on.reduce((s, c) => s + c.bw, 0).toFixed(1);
    $("#netStats").innerHTML =
      '<div class="stat ok"><small>Connected</small><strong>' + on.length + "</strong></div>" +
      '<div class="stat bad"><small>Disconnected</small><strong>' + (cameras.length - on.length) + "</strong></div>" +
      '<div class="stat info"><small>Avg. latency</small><strong>' + avg + " ms</strong></div>" +
      '<div class="stat warn"><small>Total bandwidth</small><strong>' + bw + " Mbps</strong></div>";

    $("#netBody").innerHTML = cameras.map((c) =>
      "<tr><td><b>" + esc(c.name) + "</b></td><td>" + c.ip + "</td><td>" + c.sw + " / VLAN " + c.vlan + "</td><td>" + statusBadge(c.status) + "</td>" +
      "<td>" + (c.status === "online" ? c.latency + " ms" : "&mdash;") + "</td>" +
      "<td>" + (c.status === "online" ? c.bw.toFixed(1) + " Mbps" : "&mdash;") + "</td>" +
      '<td class="nowrap">' + new Date(c.checked).toLocaleTimeString("en-GB", { hour12: false }) + "</td>" +
      '<td><button class="btn tiny" data-id="' + c.id + '">' + (c.status === "online" ? "Simulate fault" : "Reconnect") + "</button></td></tr>"
    ).join("");
  }

  function setStatus(id, status) {
    const c = camById(id);
    if (!c || c.status === status) return;
    c.status = status; c.checked = Date.now();
    if (status === "offline") {
      c.latency = null; c.bw = 0;
      addLog("Network", "High", c.name + " (" + c.ip + ") disconnected", { camera: c.name });
      toast(c.name + " is now disconnected.");
    } else {
      c.latency = rand(3, 25); c.bw = rand(30, 60) / 10;
      addLog("Network", "Info", c.name + " (" + c.ip + ") reconnected", { camera: c.name });
      toast(c.name + " reconnected.");
    }
    renderAll();
  }
  $("#netBody").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    const c = camById(b.dataset.id);
    setStatus(c.id, c.status === "online" ? "offline" : "online");
  });

  $("#runCheck").addEventListener("click", () => {
    const btn = $("#runCheck");
    btn.disabled = true; btn.textContent = "Checking...";
    setTimeout(() => {
      const t = Date.now();
      cameras.forEach((c) => { c.checked = t; if (c.status === "online") { c.latency = rand(2, 28); c.bw = rand(30, 60) / 10; } });
      btn.disabled = false; btn.textContent = "Run connectivity check";
      addLog("Network", "Info", "Connectivity check: " + online().length + " connected, " + (cameras.length - online().length) + " disconnected");
      renderNetwork();
      toast("Connectivity check complete.");
    }, 1200);
  });

  let autoTimer = null;
  $("#autoRefresh").addEventListener("change", (e) => {
    clearInterval(autoTimer);
    if (e.target.checked) {
      autoTimer = setInterval(() => {
        cameras.forEach((c) => { if (c.status === "online") { c.latency = Math.max(1, c.latency + rand(-3, 3)); c.checked = Date.now(); } });
        renderNetwork();
      }, 5000);
    }
  });

  /* ==========================================================
     5. INCIDENT & EVENT LOG
     ========================================================== */
  function renderLogs() {
    const q = $("#logSearch").value.trim().toLowerCase();
    const type = $("#logType").value, sev = $("#logSeverity").value;
    const list = logs.filter((l) =>
      (!type || l.type === type) && (!sev || l.severity === sev) &&
      (!q || (l.message + " " + l.camera + " " + l.user).toLowerCase().indexOf(q) > -1)
    );
    $("#logBody").innerHTML = list.length ? list.slice(0, 100).map((l) =>
      '<tr><td class="nowrap">' + fmt(l.time) + '</td><td><span class="tag">' + esc(l.type) + '</span></td>' +
      '<td class="sev-' + esc(l.severity) + '"><b>' + esc(l.severity) + "</b></td><td>" + esc(l.camera) + "</td><td>" + esc(l.message) + "</td><td>" + esc(l.user) + "</td>" +
      "<td>" + (l.type === "Incident"
        ? '<span class="st-' + esc(l.status) + '"><b>' + esc(l.status) + "</b></span>" + (l.status === "Open" ? ' <button class="btn tiny" data-resolve="' + esc(l.id) + '">Resolve</button>' : "")
        : "&mdash;") + "</td></tr>"
    ).join("") : '<tr class="empty-row"><td colspan="7">No matching records.</td></tr>';
    $("#logCount").textContent = "Showing " + Math.min(list.length, 100) + " of " + list.length + " matching records (" + logs.length + " total). Audit records cannot be deleted.";
  }
  ["logSearch", "logType", "logSeverity"].forEach((id) => $("#" + id).addEventListener("input", renderLogs));

  $("#logBody").addEventListener("click", (e) => {
    const b = e.target.closest("[data-resolve]");
    if (!b) return;
    const l = logs.find((x) => x.id === b.dataset.resolve);
    if (l) {
      l.status = "Resolved";
      store.set(LOG_KEY, logs);
      addLog("System", "Info", "Incident marked resolved: " + l.message.slice(0, 60), { camera: l.camera });
      renderAll();
    }
  });

    $("#exportLogs").addEventListener("click", () => {
    downloadCSV("event_log_" + localDate(new Date()) + ".csv",
      ["Date & Time", "Type", "Severity", "Camera", "Details", "By", "Status"],
      logs.map((l) => [fmt(l.time), l.type, l.severity, l.camera, l.message, l.user, l.status]));
    addLog("Access", "Low", "Event log exported to CSV");
  });

    let clearArmed = false, clearTimer = null;
  $("#clearLogs").addEventListener("click", function () {
    const btn = this;
    if (!clearArmed) {
      clearArmed = true;
      btn.textContent = "Click again to confirm";
      clearTimer = setTimeout(() => {
        clearArmed = false;
        btn.textContent = "Clear all logs";
      }, 4000);
      return;
    }
    clearTimeout(clearTimer);
    clearArmed = false;
    btn.textContent = "Clear all logs";
    logs.length = 0;
    store.set(LOG_KEY, logs);
    renderAll();
    toast("Lahat ng logs ay nabura.");
  });

  let clearArmed = false, clearTimer = null;
  $("#clearLogs").addEventListener("click", function () {
    const btn = this;
    if (!clearArmed) {
      clearArmed = true;
      btn.textContent = "Click again to confirm";
      clearTimer = setTimeout(() => {
        clearArmed = false;
        btn.textContent = "Clear all logs";
      }, 4000);
      return;
    }
    clearTimeout(clearTimer);
    clearArmed = false;
    btn.textContent = "Clear all logs";
    logs.length = 0;
    store.set(LOG_KEY, logs);
    renderAll();
    toast("Lahat ng logs ay nabura.");
  });

  /* Incident modal */
  $("#newIncident").addEventListener("click", () => {
    $("#incCamera").innerHTML = '<option value="">General / No specific camera</option>' + cameras.map((c) => '<option value="' + c.id + '">' + esc(c.name) + "</option>").join("");
    $("#incidentForm").reset();
    $("#incidentModal").hidden = false;
  });
  $("#incidentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const cam = camById($("#incCamera").value);
    const desc = $("#incDesc").value.trim();
    if (!desc) return;
    addLog("Incident", $("#incSeverity").value, $("#incCategory").value + ": " + desc, { camera: cam ? cam.name : "—", status: "Open", user: ADMIN.name });
    $("#incidentModal").hidden = true;
    toast("Incident recorded.");
  });

  /* ==========================================================
     6. REPORT GENERATOR
     ========================================================== */
  let lastReport = null;
  const today = new Date();
  $("#repTo").value = localDate(today);
  $("#repFrom").value = localDate(new Date(today.getTime() - 7 * 86400000));

  $("#reportForm").addEventListener("submit", (e) => { e.preventDefault(); generateReport(); });

  function table(headers, rows) {
    return '<div class="table-scroll"><table><thead><tr>' + headers.map((h) => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
      (rows.length ? rows.map((r) => "<tr>" + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") : '<tr><td colspan="' + headers.length + '" style="text-align:center;color:#64748b">No records for this period.</td></tr>') +
      "</tbody></table></div>";
  }
  function sum(items) { return '<div class="sum">' + items.map((i) => "<div><small>" + esc(i[0]) + "</small><b>" + esc(i[1]) + "</b></div>").join("") + "</div>"; }

  function generateReport() {
    const type = $("#repType").value;
    const from = $("#repFrom").value, to = $("#repTo").value;
    const by = $("#repBy").value.trim() || "Administrator";
    if (!from || !to || from > to) { toast("Please choose a valid date range."); return; }
    const fromD = new Date(from + "T00:00:00"), toD = new Date(to + "T23:59:59");
    const inRange = logs.filter((l) => { const t = new Date(l.time); return t >= fromD && t <= toD; });

    let title, body = "", headers, rows;
    const on = online().length, off = cameras.length - on;

    if (type === "status") {
      title = "CCTV Status Report";
      headers = ["Camera", "Floor", "Type", "IP Address", "Status", "Latency"];
      rows = cameras.map((c) => [c.name, c.floor, c.type, c.ip, c.status === "online" ? "Connected" : "Disconnected", c.status === "online" ? c.latency + " ms" : "—"]);
      body = sum([["Total cameras", cameras.length], ["Connected", on], ["Disconnected", off], ["Availability", Math.round(on / cameras.length * 100) + "%"]]) +
        "<h3>Camera status</h3>" + table(headers, rows);
    } else if (type === "activity") {
      title = "System Activity Report";
      const act = inRange.filter((l) => l.type !== "Incident");
      headers = ["Date & Time", "Type", "Severity", "Camera", "Event", "User"];
      rows = act.map((l) => [fmt(l.time), l.type, l.severity, l.camera, l.message, l.user]);
      const cnt = (t) => act.filter((l) => l.type === t).length;
      body = sum([["Total events", act.length], ["Access", cnt("Access")], ["Network", cnt("Network")], ["System", cnt("System")], ["Privacy", cnt("Privacy")]]) +
        "<h3>Activity log</h3>" + table(headers, rows);
    } else if (type === "incident") {
      title = "Incident Summary Report";
      const inc = inRange.filter((l) => l.type === "Incident");
      headers = ["Date & Time", "Camera", "Severity", "Description", "Reported by", "Status"];
      rows = inc.map((l) => [fmt(l.time), l.camera, l.severity, l.message, l.user, l.status]);
      body = sum([["Total incidents", inc.length], ["Open", inc.filter((l) => l.status === "Open").length], ["Resolved", inc.filter((l) => l.status === "Resolved").length],
        ["High / Critical", inc.filter((l) => l.severity === "High" || l.severity === "Critical").length]]) +
        "<h3>Incident records</h3>" + table(headers, rows);
    } else {
      title = "Network Connectivity Report";
      const faults = inRange.filter((l) => l.type === "Network" && l.message.indexOf("disconnected") > -1 && l.message.indexOf("Connectivity") !== 0);
      headers = ["Camera", "IP Address", "Switch / VLAN", "Status", "Latency", "Bandwidth"];
      rows = cameras.map((c) => [c.name, c.ip, c.sw + " / VLAN " + c.vlan, c.status === "online" ? "Connected" : "Disconnected", c.status === "online" ? c.latency + " ms" : "—", c.status === "online" ? c.bw.toFixed(1) + " Mbps" : "—"]);
      body = sum([["Connected", on], ["Disconnected", off], ["Disconnection events", faults.length]]) +
        "<h3>Current connectivity</h3>" + table(headers, rows) +
        "<h3>Disconnection events in period</h3>" + table(["Date & Time", "Details"], faults.map((l) => [fmt(l.time), l.message]));
    }

    $("#reportPreview").className = "paper";
    $("#reportPreview").innerHTML =
      '<div class="rep-head"><p>' + esc(SCHOOL) + " &middot; Senior High School Building</p><h1>" + esc(title) + "</h1>" +
      "<p>Period: " + esc(from) + " to " + esc(to) + " &nbsp;|&nbsp; Generated: " + fmt(new Date()) + " &nbsp;|&nbsp; Prepared by: " + esc(by) + "</p></div>" +
      body +
      '<div class="sign"><div>Prepared by<br><b>' + esc(by) + '</b></div><div>Noted by<br><b>School Head</b></div><div>Data Protection Officer</div></div>' +
      '<p class="foot">CONFIDENTIAL. This report contains CCTV system information and may include personal data. Handle and store it according to the Data Privacy Act of 2012 (RA 10173).</p>';

    lastReport = { title, from, to, headers, rows };
    $("#printReport").disabled = false;
    $("#csvReport").disabled = false;
    addLog("System", "Info", "Report generated: " + title);
    toast("Report generated.");
  }

  $("#printReport").addEventListener("click", () => window.print());
  $("#csvReport").addEventListener("click", () => {
    if (!lastReport) return;
    downloadCSV(lastReport.title.replace(/\s+/g, "_").toLowerCase() + "_" + lastReport.from + "_to_" + lastReport.to + ".csv", lastReport.headers, lastReport.rows);
  });

  /* ==========================================================
     7. DATA PRIVACY SETTINGS
     ========================================================== */
  const PERMS = [["live", "Live view"], ["playback", "Playback"], ["export", "Export"], ["del", "Delete"]];

  function renderUsers() {
    $("#newUserRole").innerHTML = Object.keys(ROLE_DEFAULTS).map((r) => "<option>" + r + "</option>").join("");
    $("#userBody").innerHTML = users.map((u) =>
      "<tr><td><b>" + esc(u.name) + "</b></td><td>" + esc(u.role) + "</td>" +
      PERMS.map((p) => '<td><input type="checkbox" data-id="' + u.id + '" data-perm="' + p[0] + '" aria-label="' + p[1] + " for " + esc(u.name) + '" ' + (u[p[0]] ? "checked" : "") + (u.locked ? " disabled" : "") + "></td>").join("") +
      '<td><input type="checkbox" data-id="' + u.id + '" data-perm="active" aria-label="Active" ' + (u.active ? "checked" : "") + (u.locked ? " disabled" : "") + "></td>" +
      "<td>" + (u.locked ? "" : '<button class="btn tiny" data-remove="' + u.id + '">Remove</button>') + "</td></tr>"
    ).join("");
  }

  $("#userBody").addEventListener("change", (e) => {
    const cb = e.target.closest("input[data-perm]");
    if (!cb) return;
    const u = users.find((x) => x.id === Number(cb.dataset.id));
    if (!u) return;
    u[cb.dataset.perm] = cb.checked ? 1 : 0;
    store.set("cctv_users", users);
    const label = cb.dataset.perm === "active" ? "account status" : (PERMS.find((p) => p[0] === cb.dataset.perm) || [0, cb.dataset.perm])[1] + " permission";
    addLog("Privacy", "Medium", "Changed " + label + " for " + u.name + ": " + (cb.checked ? "enabled" : "disabled"));
    toast("Permission updated and logged.");
  });
  $("#userBody").addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    const u = users.find((x) => x.id === Number(b.dataset.remove));
    if (!u || !confirm("Remove " + u.name + "?")) return;
    users = users.filter((x) => x.id !== u.id);
    store.set("cctv_users", users);
    addLog("Privacy", "Medium", "User removed: " + u.name);
    renderUsers();
  });
  $("#userForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#newUserName").value.trim();
    if (!name) return;
    const role = $("#newUserRole").value;
    const d = ROLE_DEFAULTS[role];
    users.push({ id: Date.now(), name, role, live: d.live, playback: d.playback, export: d.export, del: d.del, active: 1 });
    store.set("cctv_users", users);
    addLog("Privacy", "Medium", "User added: " + name + " (" + role + ")");
    $("#userForm").reset();
    renderUsers();
    toast("User added with default " + role + " permissions.");
  });

  const SETTING_FIELDS = [["setEncrypt", "encrypt"], ["setApproval", "approval"], ["setMasking", "masking"], ["setSignage", "signage"], ["setPrivateAreas", "privateAreas"]];

  function loadSettings() {
    $("#setRetention").value = String(privacy.retention);
    $("#setLogout").value = String(privacy.autoLogout);
    SETTING_FIELDS.forEach((f) => { $("#" + f[0]).checked = !!privacy[f[1]]; });
    updateScore();
  }
  function updateScore() {
    const total = SETTING_FIELDS.length + 1; // +1 for always-on audit logging
    const on = SETTING_FIELDS.filter((f) => $("#" + f[0]).checked).length + 1;
    $("#scoreText").textContent = on + " / " + total;
    $("#scoreBar").style.width = (on / total * 100) + "%";
    $("#scoreBar").className = "meter-bar" + (on === total ? " good" : on < 4 ? " warn" : "");
  }
  $("#settingsForm").addEventListener("change", updateScore);
  $("#settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    privacy.retention = Number($("#setRetention").value);
    privacy.autoLogout = Number($("#setLogout").value);
    SETTING_FIELDS.forEach((f) => { privacy[f[1]] = $("#" + f[0]).checked; });
    store.set("cctv_privacy", privacy);
    addLog("Privacy", "Medium", "Privacy settings updated (retention " + privacy.retention + " days, auto sign-out " + privacy.autoLogout + " min)");
    renderFloorBars();
    toast("Privacy settings saved.");
  });

  /* ==========================================================
     MODALS
     ========================================================== */
  function closeModals() { $$(".modal").forEach((m) => { m.hidden = true; }); }
  $$(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m || e.target.hasAttribute("data-close")) m.hidden = true; }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

  /* ==========================================================
     RENDER ALL + INIT
     ========================================================== */
  function renderAll() {
    renderDashStats();
    renderCamGrid();
    renderFloorBars();
    renderRecent();
    renderLive();
    renderNetwork();
    renderLogs();
    renderUsers();
    loadSettings();
  }

  if (sessionStorage.getItem("cctv_session") === "1") showApp();
})();
