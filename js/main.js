/* Hana Buffet — đọc window.HANA_DATA (data/data.js) và dựng nội dung trang.
   Nội dung cần sửa nằm trong data/data.js, không phải file này. */
(function () {
  "use strict";

  var data = window.HANA_DATA;
  if (!data) {
    document.querySelector("main").insertAdjacentHTML(
      "afterbegin",
      '<p class="data-error">Không đọc được dữ liệu. Kiểm tra lại file data/data.js (thường do thiếu dấu phẩy hoặc dấu nháy).</p>'
    );
    return;
  }

  var brand = data.brand || {};
  var U = window.HanaUtil;
  var esc = U.esc, money = U.money, telHref = U.telHref;

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function fill(sel, html) {
    $all(sel).forEach(function (el) { el.innerHTML = html; });
  }

  // Icon nét mảnh cho thông tin chi nhánh
  var ICONS = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>'
  };

  /* ---------- thông tin chung ---------- */
  function renderBrand() {
    U.fillBrand(brand);
    if (brand.headline) fill("[data-brand-headline]", esc(brand.headline));
    fill("[data-brand-tagline]", esc(brand.tagline));

    var socials = [
      { key: "facebook", label: "Facebook" },
      { key: "zalo", label: "Zalo" },
      { key: "instagram", label: "Instagram" },
      { key: "tiktok", label: "TikTok" }
    ].filter(function (s) { return brand[s.key]; });

    fill("[data-socials]", socials.map(function (s) {
      return '<a href="' + esc(brand[s.key]) + '" target="_blank" rel="noopener">' + s.label + "</a>";
    }).join(""));
  }

  /* ---------- giới thiệu ---------- */
  function renderAbout() {
    var about = data.about || {};
    if (about.title) fill("[data-about-title]", esc(about.title));
    fill("[data-about-paragraphs]", (about.paragraphs || []).map(function (p) {
      return "<p>" + esc(p) + "</p>";
    }).join(""));
    fill("[data-about-highlights]", (about.highlights || []).map(function (h, i) {
      return '<li class="feature">' + FEATURE_ICONS[i % FEATURE_ICONS.length] +
        "<strong>" + esc(h.title) + "</strong><span>" + esc(h.text) + "</span></li>";
    }).join(""));
  }

  // Icon nét mảnh cho 4 điểm nổi bật (theo thứ tự trong data.about.highlights)
  var FEATURE_ICONS = [
    // thịt bò
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 22c6-10 26-12 36-4 8 6 6 18-2 24-9 7-27 8-34 0-5-6-5-13 0-20z"/><path d="M22 28c5-4 14-5 20-1M20 36c7 3 17 3 24-2"/><circle cx="42" cy="22" r="3"/></svg>',
    // lửa trên vỉ nướng
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8c3 8 10 11 10 20a10 10 0 0 1-20 0c0-5 3-7 4-11 2 4 4 5 6 5-2-5-2-9 0-14z"/><path d="M10 44h44M14 50h36M20 44v12M44 44v12"/></svg>',
    // nồi lẩu
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 30h44v6a18 18 0 0 1-18 18h-8a18 18 0 0 1-18-18z"/><path d="M6 30h52M26 22c-2-3 2-5 0-9M34 22c-2-3 2-5 0-9M42 22c-2-3 2-5 0-9"/></svg>',
    // pizza
    '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 10 8 52c16 6 32 6 48 0z"/><path d="M13 44c12 4 26 4 38 0"/><circle cx="30" cy="30" r="3"/><circle cx="38" cy="40" r="3"/><circle cx="25" cy="42" r="2.5"/></svg>'
  ];

  /* ---------- bảng giá ---------- */
  // Trả về gói giá đang áp dụng theo giờ máy người xem (ngày lễ không nhận biết được).
  function currentPackage(packages) {
    var now = new Date();
    var day = now.getDay(); // 0 = CN, 6 = T7
    var isWeekend = day === 0 || day === 6;
    var hour = now.getHours() + now.getMinutes() / 60;
    for (var i = 0; i < packages.length; i++) {
      var m = packages[i].match;
      if (!m) continue;
      var dayOk = m.days === "weekend" ? isWeekend : m.days === "weekday" ? !isWeekend : true;
      if (dayOk && hour >= m.from && hour < m.to) return packages[i];
    }
    return null;
  }

  function renderPricing() {
    var pricing = data.pricing || {};
    var packages = pricing.packages || [];
    var active = currentPackage(packages);

    if (pricing.title) fill("[data-pricing-title]", esc(pricing.title));

    fill("[data-pricing-cards]", packages.map(function (p) {
      var isActive = p === active;
      return '<article class="price-card' + (isActive ? " is-now" : "") + '">' +
        (isActive ? '<p class="now-label">Đang áp dụng</p>' : "") +
        "<h3>" + esc(p.name) + "</h3>" +
        '<p class="price-time">' + esc(p.schedule) + "</p>" +
        '<dl class="price-rows">' +
          (p.adult != null ? "<div><dt>Người lớn</dt><dd>" + money(p.adult) + "</dd></div>" : "") +
          (p.child != null ? "<div><dt>Trẻ em</dt><dd>" + money(p.child) + "</dd></div>" : "") +
        "</dl>" +
        "</article>";
    }).join(""));

    fill("[data-pricing-notes]", (pricing.notes || []).map(function (n) {
      return "<li>" + esc(n) + "</li>";
    }).join(""));

    // Dòng giá trên ảnh đầu trang: giá đang áp dụng, hoặc giá thấp nhất khi ngoài giờ
    var lowest = packages.reduce(function (min, p) {
      return p.adult != null && (min == null || p.adult < min) ? p.adult : min;
    }, null);
    fill("[data-hero-price]", active && active.adult != null
      ? esc(active.name) + " hôm nay <strong>" + money(active.adult) + "</strong> / người lớn"
      : lowest != null ? "Chỉ từ <strong>" + money(lowest) + "</strong> / người lớn" : "");
  }

  /* ---------- con số: tính từ dữ liệu ---------- */
  // Các nhóm món của menu (mục có ảnh trong data.menuBook.sections)
  function dishSections() {
    return ((data.menuBook || {}).sections || []).filter(function (s) { return s.image; });
  }

  function renderStats() {
    var branches = (data.branches || []).filter(function (b) { return b.active !== false; }).length;
    var stats = [
      [branches, "Chi nhánh"],
      [data.dishCount || "50+", "Món ăn"],
      [dishSections().length, "Nhóm món"],
      ["3", "Phong cách Nhật – Hàn – Âu"]
    ];
    fill("[data-stats]", stats.map(function (s) {
      return '<li><strong>' + esc(s[0]) + "</strong><span>" + esc(s[1]) + "</span></li>";
    }).join(""));
  }

  /* ---------- menu (trang chủ chỉ giới thiệu, menu đầy đủ ở menu.html) ---------- */
  function renderMenuTeaser() {
    fill("[data-menu-intro]", esc(data.menuIntro || ""));
    fill("[data-menu-cats]", dishSections().map(function (s) {
      return '<li><a class="menu-card" href="menu.html#' + esc(s.id) + '">' +
        '<img src="' + esc(U.MENU_IMG_DIR + s.image) + '" alt="' + esc(s.name) + '" loading="lazy" width="720" height="720">' +
        '<span class="menu-card-name">' + esc(s.name) + "</span>" +
        '<span class="menu-card-meta">Menu trang ' + s.page + "</span>" +
        "</a></li>";
    }).join(""));
  }

  /* ---------- ảnh trượt đầu trang ---------- */
  function initSlider() {
    var slides = $all("[data-slides] .slide");
    var dots = $("[data-slide-dots]");
    if (slides.length < 2 || !dots) return;

    var current = 0;
    var timer = null;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    dots.innerHTML = slides.map(function (s, i) {
      return '<button type="button" aria-label="Ảnh ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : "") + "></button>";
    }).join("");
    var dotBtns = $all("[data-slide-dots] button");

    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === current); });
      dotBtns.forEach(function (d, k) { d.setAttribute("aria-current", String(k === current)); });
    }
    function start() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(function () { show(current + 1); }, 6000);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    $("[data-slide-prev]").addEventListener("click", function () { show(current - 1); start(); });
    $("[data-slide-next]").addEventListener("click", function () { show(current + 1); start(); });
    dotBtns.forEach(function (d, k) { d.addEventListener("click", function () { show(k); start(); }); });

    // Dừng tự chuyển khi khách đang rê chuột / thao tác bàn phím trong khu ảnh
    var hero = $(".hero");
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    hero.addEventListener("focusin", stop);
    hero.addEventListener("focusout", start);
    start();
  }

  /* ---------- chi nhánh ---------- */
  function mapLink(b) {
    if (b.mapUrl) return b.mapUrl;
    return "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("Hana Buffet " + b.address + ", " + b.city);
  }

  function hasCoords(b) {
    return typeof b.lat === "number" && typeof b.lng === "number";
  }

  // Khoảng cách đường chim bay (km) — công thức Haversine
  function distanceKm(lat1, lng1, lat2, lng2) {
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  var km1 = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
  function formatDistance(km) {
    if (km < 1) return Math.round(km * 1000 / 10) * 10 + " m";
    return (km < 10 ? km1.format(km) : Math.round(km)) + " km";
  }

  // b._distance / b._nearest được gán khi đã có vị trí người xem
  function branchHtml(b) {
    var phoneText = b.phone || brand.hotlineDisplay || brand.hotline;
    return '<article class="branch' + (b._nearest ? " is-nearest" : "") + '">' +
      (b.image ? '<img class="branch-img" src="' + esc(U.IMG_DIR + b.image) + '" alt="Hana Buffet ' + esc(b.name) + '" loading="lazy">' : "") +
      (b._nearest ? '<p class="nearest-label">Gần bạn nhất</p>' : "") +
      '<div class="branch-title">' +
        "<h3>Hana " + esc(b.name) + "</h3>" +
        (b._distance != null ? '<span class="branch-distance">' + formatDistance(b._distance) + "</span>" : "") +
      "</div>" +
      '<ul class="branch-info">' +
        "<li>" + ICONS.pin + "<span>" + esc(b.address) + (b.city ? ", " + esc(b.city) : "") + "</span></li>" +
        "<li>" + ICONS.clock + "<span>" + esc(b.hours || brand.openingHours) + "</span></li>" +
        "<li>" + ICONS.phone + "<span>" + esc(phoneText) + "</span></li>" +
      "</ul>" +
      '<div class="branch-actions">' +
        '<a class="btn btn-fire btn-sm" href="' + telHref(b.phone || brand.hotline) + '">Gọi đặt bàn</a>' +
        '<a class="btn btn-line btn-sm" href="' + esc(mapLink(b)) + '" target="_blank" rel="noopener">Chỉ đường</a>' +
      "</div>" +
      "</article>";
  }

  function renderBranches() {
    var branches = (data.branches || []).filter(function (b) { return b.active !== false; });
    var list = $("[data-branch-list]");
    var filter = $("[data-branch-filter]");
    if (!list) return;

    var cities = [];
    branches.forEach(function (b) {
      if (cities.indexOf(b.city) === -1) cities.push(b.city);
    });

    var sortedByDistance = false;

    function show(city) {
      var shown = city === "all" ? branches : branches.filter(function (b) { return b.city === city; });
      if (sortedByDistance) {
        // Chi nhánh không có tọa độ xếp cuối
        shown = shown.slice().sort(function (a, b) {
          var da = a._distance == null ? Infinity : a._distance;
          var db = b._distance == null ? Infinity : b._distance;
          return da - db;
        });
      }
      list.innerHTML = shown.map(branchHtml).join("");
      $all("[data-branch-filter] .tab").forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.getAttribute("data-city") === city));
      });
    }

    initNearest(branches, function () {
      sortedByDistance = true;
      show("all");
      var nearestCard = list.querySelector(".is-nearest");
      if (nearestCard) nearestCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // Chỉ hiện bộ lọc khi có từ 2 thành phố trở lên
    if (filter && cities.length > 1) {
      filter.innerHTML = ["all"].concat(cities).map(function (c) {
        var count = c === "all" ? branches.length : branches.filter(function (b) { return b.city === c; }).length;
        return '<button type="button" class="tab" data-city="' + esc(c) + '">' +
          esc(c === "all" ? "Tất cả" : c) + ' <span class="tab-count">' + count + "</span></button>";
      }).join("");
      filter.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-city]");
        if (btn) show(btn.getAttribute("data-city"));
      });
    }

    show("all");
  }

  /* ---------- tìm chi nhánh gần nhất ----------
     Chỉ hỏi quyền vị trí khi khách bấm nút; vị trí không được lưu hay gửi đi đâu. */
  function initNearest(branches, onLocated) {
    var btn = $("[data-near-me]");
    var status = $("[data-near-status]");
    if (!btn || !status) return;

    var withCoords = branches.filter(hasCoords);
    var supported = "geolocation" in navigator && window.isSecureContext !== false;
    if (data.nearestBranch === false || !withCoords.length || !supported) return;

    btn.hidden = false;
    var label = btn.textContent;

    function setStatus(html, isError) {
      status.innerHTML = html;
      status.classList.toggle("is-error", !!isError);
      status.hidden = false;
    }

    btn.addEventListener("click", function () {
      btn.disabled = true;
      btn.textContent = "Đang xác định vị trí…";
      status.hidden = true;

      navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var nearest = null;

        branches.forEach(function (b) {
          b._nearest = false;
          b._distance = hasCoords(b) ? distanceKm(lat, lng, b.lat, b.lng) : null;
          if (b._distance != null && (!nearest || b._distance < nearest._distance)) nearest = b;
        });
        nearest._nearest = true;

        setStatus("Chi nhánh gần bạn nhất: <strong>Hana " + esc(nearest.name) + "</strong> — khoảng " +
          formatDistance(nearest._distance) + ".");
        btn.disabled = false;
        btn.textContent = "Cập nhật vị trí";
        onLocated();
      }, function (err) {
        var msg = err.code === 1
          ? "Bạn chưa cho phép truy cập vị trí. Có thể bật lại trong phần cài đặt trang web của trình duyệt."
          : "Không xác định được vị trí lúc này, vui lòng thử lại.";
        setStatus(msg, true);
        btn.disabled = false;
        btn.textContent = label;
      }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 });
    });
  }

  renderBrand();
  renderAbout();
  renderPricing();
  renderMenuTeaser();
  renderStats();
  initSlider();
  renderBranches();
  U.initNav();
})();
