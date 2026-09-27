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
    fill("[data-about-highlights]", (about.highlights || []).map(function (h) {
      return '<li class="fact"><strong>' + esc(h.title) + "</strong><span>" + esc(h.text) + "</span></li>";
    }).join(""));
  }

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

    fill("[data-pricing-rows]", packages.map(function (p) {
      var isActive = p === active;
      return '<tr' + (isActive ? ' class="is-now"' : "") + ">" +
        '<th scope="row"><span class="pkg-name">' + esc(p.name) + "</span>" +
          (isActive ? '<span class="now-pill">Đang áp dụng</span>' : "") +
          '<span class="pkg-time">' + esc(p.schedule) + "</span></th>" +
        '<td data-label="Người lớn">' + (p.adult != null ? money(p.adult) : "–") + "</td>" +
        '<td data-label="Trẻ em">' + (p.child != null ? money(p.child) : "–") + "</td>" +
        "</tr>";
    }).join(""));

    fill("[data-pricing-notes]", (pricing.notes || []).map(function (n) {
      return "<li>" + esc(n) + "</li>";
    }).join(""));

    renderTicket(packages, active);
  }

  // Phiếu giá ở đầu trang: giá đang áp dụng, hoặc giá thấp nhất khi ngoài giờ
  function renderTicket(packages, active) {
    var ticket = $("[data-now-ticket]");
    if (!ticket || !packages.length) return;

    if (active) {
      ticket.innerHTML =
        '<p class="ticket-head">Giá lúc này: ' + esc(active.name.toLowerCase()) + "</p>" +
        '<div class="ticket-prices">' +
          (active.adult != null ? "<div><span>Người lớn</span><strong>" + money(active.adult) + "</strong></div>" : "") +
          (active.child != null ? "<div><span>Trẻ em</span><strong>" + money(active.child) + "</strong></div>" : "") +
        "</div>";
    } else {
      var lowest = packages.reduce(function (min, p) {
        return p.adult != null && (min == null || p.adult < min) ? p.adult : min;
      }, null);
      ticket.innerHTML =
        '<p class="ticket-head">Mở cửa ' + esc(brand.openingHours) + "</p>" +
        '<div class="ticket-prices"><div><span>Người lớn, từ</span><strong>' + money(lowest) + "</strong></div></div>";
    }
  }

  /* ---------- menu (trang chủ chỉ giới thiệu, menu đầy đủ ở menu.html) ---------- */
  function renderMenuTeaser() {
    var cats = data.menu || [];
    fill("[data-menu-intro]", esc(data.menuIntro || ""));
    fill("[data-menu-cats]", cats.map(function (c) {
      var count = (c.items || []).length;
      return '<li><a class="menu-cat-link" href="menu.html#' + esc(c.id) + '">' +
        '<span class="menu-cat-name">' + esc(c.name) + "</span>" +
        '<span class="menu-cat-meta">' + (c.nameEn ? esc(c.nameEn) + ", " : "") + count + " món</span>" +
        "</a></li>";
    }).join(""));
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
  renderBranches();
  U.initNav();
})();
