/* Hana Buffet — cuốn menu lật trang (menu.html).
   Mỗi trang là một ảnh xuất từ PDF menu (npm run build:menu → assets/menu-pages/, data/menu-pages.js).
   Hiệu ứng lật: js/flipbook.js. Mục trên mục lục: data/data.js → menuBook.sections.

   Số trang trong code bắt đầu từ 0 (trang bìa = 0); số trang hiển thị cho khách bắt đầu từ 1. */
(function () {
  "use strict";

  var data = window.HANA_DATA;
  var pagesInfo = window.HANA_MENU_PAGES;
  var U = window.HanaUtil;
  var book = document.querySelector("[data-book]");
  if (!data || !pagesInfo || !U || !book || !window.HanaFlipbook) {
    if (book) book.innerHTML = '<p class="data-error">Không đọc được dữ liệu menu. Kiểm tra data/data.js và data/menu-pages.js (chạy lại npm run build:menu).</p>';
    return;
  }

  var esc = U.esc;
  var total = pagesInfo.count;
  var sections = ((data.menuBook || {}).sections || [])
    .filter(function (s) { return s.page >= 1 && s.page <= total; })
    .sort(function (a, b) { return a.page - b.page; });
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FLIP_TIME = reduceMotion ? 200 : 650;   // ms — một lần lật
  var PRELOAD_BEHIND = 2, PRELOAD_AHEAD = 6;

  U.fillBrand(data.brand || {});

  /* ---------- bảng điều hướng (nút nhỏ góc trái) ---------- */
  var panel = document.getElementById("menu-panel");
  var panelBtn = document.querySelector("[data-panel-open]");
  var backdrop = document.querySelector(".panel-backdrop");

  function setPanel(open) {
    panel.classList.toggle("is-open", open);
    backdrop.hidden = !open;
    panelBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      var current = panel.querySelector('.tab[aria-current="true"]') || panel.querySelector(".panel-close");
      setTimeout(function () { current.focus({ preventScroll: true }); current.scrollIntoView({ block: "nearest" }); }, 50);
    } else if (panel.contains(document.activeElement)) {
      panelBtn.focus();
    }
  }
  panelBtn.addEventListener("click", function () { setPanel(!panel.classList.contains("is-open")); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-panel-close]"), function (el) {
    el.addEventListener("click", function () { setPanel(false); });
  });

  /* ---------- mục lục ---------- */
  var jump = document.querySelector("[data-book-jump]");
  jump.innerHTML = sections.map(function (s) {
    return '<button type="button" class="tab" data-goto="' + (s.page - 1) + '" data-sec="' + esc(s.id) + '">' + esc(s.name) + "</button>";
  }).join("");

  function sectionById(id) {
    return sections.filter(function (s) { return s.id === id || (s.aliases || []).indexOf(id) > -1; })[0] || null;
  }
  function sectionAt(index) {
    var found = null;
    sections.forEach(function (s) { if (s.page - 1 <= index) found = s; });
    return found;
  }
  // #khai-vi → trang đầu của mục; #trang-12 → trang 12
  function pageFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var m = id.match(/^trang-(\d+)$/);
    if (m) return Math.min(total, Math.max(1, +m[1])) - 1;
    var s = sectionById(id);
    return s ? s.page - 1 : 0;
  }

  /* ---------- tiếng lật trang (âm thanh của menu cũ) ---------- */
  var SOUND_KEY = "hana-menu-sound";
  var soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== "off"; } catch (e) {}
  var flipAudio = new Audio("assets/sounds/flipsound.mp3");
  flipAudio.preload = "auto";
  function playFlipSound() {
    if (!soundOn) return;
    var a = flipAudio.paused ? flipAudio : flipAudio.cloneNode();   // lật liên tục thì tiếng chồng lên nhau
    a.volume = 0.5;
    a.currentTime = 0;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});   // trình duyệt chặn âm thanh trước khi khách chạm vào trang
  }
  var soundBtn = document.querySelector("[data-sound-toggle]");
  function renderSoundBtn() {
    soundBtn.setAttribute("aria-pressed", String(soundOn));
    soundBtn.textContent = soundOn ? "Tiếng lật trang: bật" : "Tiếng lật trang: tắt";
  }
  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      try { localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off"); } catch (e) {}
      renderSoundBtn();
    });
    renderSoundBtn();
  }

  /* ---------- cuốn menu ---------- */
  var counter = document.querySelector("[data-book-counter]");
  var prevBtn = document.querySelector("[data-book-prev]");
  var nextBtn = document.querySelector("[data-book-next]");
  var wanted = sectionById(decodeURIComponent(location.hash.slice(1)));   // mục khách vừa chọn

  var srcs = [];
  for (var i = 0; i < total; i++) srcs.push(pagesInfo.dir + String(i + 1).padStart(2, "0") + pagesInfo.ext);

  var fb = new window.HanaFlipbook(book, {
    pages: srcs,
    pageWidth: pagesInfo.width,
    pageHeight: pagesInfo.height,
    startPage: pageFromHash(),
    flipTime: FLIP_TIME,
    onFlip: playFlipSound,
    onChange: update
  });
  preloadAll();

  // Tải trước ảnh quanh trang đang xem để khi lật không bị trắng trang
  function loadAround(f, index) {
    for (var k = Math.max(0, index - PRELOAD_BEHIND); k <= Math.min(total - 1, index + PRELOAD_AHEAD); k++) f.load(k);
  }
  // Sau khi mở xong, tải dần các trang còn lại lúc rảnh
  function preloadAll() {
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 200); };
    var start = fb.visible()[0], order = [];
    for (var k = 0; k < total; k++) order.push((start + k) % total);
    (function step() {
      var p = order.shift();
      if (p == null) return;
      var img = fb.imgs[p];
      if (!img || !img.dataset.src) { step(); return; }
      fb.load(p);
      img.addEventListener("load", function () { idle(step); }, { once: true });
      img.addEventListener("error", function () { idle(step); }, { once: true });
    })();
  }

  function update(f) {
    var visible = f.visible();
    var first = visible[0], lastShown = visible[visible.length - 1];
    loadAround(f, first);

    counter.textContent = "Trang " + (first + 1) + (visible.length > 1 ? "–" + (lastShown + 1) : "") + " / " + total;
    prevBtn.disabled = !f.canPrev();
    nextBtn.disabled = !f.canNext();

    var sec = wanted && visible.indexOf(wanted.page - 1) > -1 ? wanted : sectionAt(lastShown);
    Array.prototype.forEach.call(jump.querySelectorAll(".tab"), function (t) {
      var active = !!sec && t.getAttribute("data-sec") === sec.id;
      t.setAttribute("aria-current", active ? "true" : "false");
    });
    var hash = sec ? "#" + sec.id : "";
    if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname);
  }

  prevBtn.addEventListener("click", function () { fb.prev(); });
  nextBtn.addEventListener("click", function () { fb.next(); });

  jump.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-goto]");
    if (!btn) return;
    wanted = sectionById(btn.getAttribute("data-sec"));
    setPanel(false);
    fb.goTo(+btn.getAttribute("data-goto"), reduceMotion);
    update(fb);   // mục đã nằm trên trang đang mở thì goTo không đổi gì
  });

  // Đổi #muc trên cùng trang (vd bấm link menu.html#lau khi đang xem menu) → lật tới đó
  window.addEventListener("hashchange", function () {
    wanted = sectionById(decodeURIComponent(location.hash.slice(1)));
    fb.goTo(pageFromHash(), reduceMotion);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) { setPanel(false); return; }
    if (e.target.closest("input, textarea, select, summary") || panel.classList.contains("is-open")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") fb.next();
    if (e.key === "ArrowLeft" || e.key === "PageUp") fb.prev();
  });

  /* ---------- lăn chuột: lật trang, không cuộn trang web ----------
     Mỗi nấc chuột = 1 lần lật. Bàn di chuột bắn nhiều sự kiện nhỏ → cộng dồn đủ quãng mới lật,
     và mỗi lần lật cách nhau ít nhất WHEEL_GAP ms để một lần vuốt không lật cả chục trang. */
  var WHEEL_STEP = 80, WHEEL_GAP = 200;
  var wheelSum = 0, wheelLastEvent = 0, wheelLastFlip = 0;
  document.addEventListener("wheel", function (e) {
    if (e.target.closest && e.target.closest(".menu-panel")) return;   // trong bảng điều hướng vẫn cuộn bình thường
    e.preventDefault();
    if (panel.classList.contains("is-open")) return;
    var now = Date.now();
    if (now - wheelLastEvent > 200) wheelSum = 0;
    wheelLastEvent = now;
    wheelSum += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(wheelSum) >= WHEEL_STEP && now - wheelLastFlip >= WHEEL_GAP) {
      if (wheelSum > 0) fb.next(); else fb.prev();
      wheelSum = 0;
      wheelLastFlip = now;
    }
  }, { passive: false });
})();
