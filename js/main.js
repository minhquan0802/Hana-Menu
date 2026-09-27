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
  var MENU_IMG_DIR = "assets/images/menu/";
  var IMG_DIR = "assets/images/";

  /* ---------- helpers ---------- */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var vnd = new Intl.NumberFormat("vi-VN");
  function money(n) {
    return vnd.format(n) + "₫";
  }

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function fill(sel, html) {
    $all(sel).forEach(function (el) { el.innerHTML = html; });
  }

  function telHref(number) {
    return "tel:" + String(number || "").replace(/[^\d+]/g, "");
  }

  // Icon nét mảnh cho thông tin chi nhánh
  var ICONS = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>'
  };

  /* ---------- thông tin chung ---------- */
  function renderBrand() {
    $all("[data-hotline-link]").forEach(function (a) { a.href = telHref(brand.hotline); });
    fill("[data-hotline-text]", esc(brand.hotlineDisplay || brand.hotline));
    fill("[data-opening-hours]", esc(brand.openingHours));
    fill("[data-brand-name]", esc(brand.name));
    fill("[data-year]", new Date().getFullYear());
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

  /* ---------- menu ---------- */
  function tagClass(tag) {
    var t = String(tag).toLowerCase();
    if (t.indexOf("cay") > -1) return "spicy";
    if (t.indexOf("mới") > -1) return "new";
    if (t.indexOf("bán chạy") > -1) return "hot";
    return "plain";
  }

  function menuItemHtml(item) {
    var hasPrice = item.price != null && item.price !== "";
    var tags = (item.tags || []).map(function (t) {
      return '<span class="tag tag-' + tagClass(t) + '">' + esc(t) + "</span>";
    }).join("");

    return '<li class="dish">' +
      (item.image ? '<img class="dish-img" src="' + esc(MENU_IMG_DIR + item.image) + '" alt="' + esc(item.name) + '" loading="lazy">' : "") +
      '<div class="dish-body">' +
        '<p class="dish-line"><span class="dish-name">' + esc(item.name) + "</span>" +
          (tags ? " " + tags : "") +
          (hasPrice ? '<span class="leader" aria-hidden="true"></span><span class="dish-price">' + money(item.price) + "</span>" : "") +
        "</p>" +
        (item.desc ? '<p class="dish-desc">' + esc(item.desc) + "</p>" : "") +
      "</div>" +
      "</li>";
  }

  function categoryHtml(cat) {
    return '<section class="menu-cat" id="menu-' + esc(cat.id) + '">' +
      '<div class="menu-cat-head">' +
        "<h3>" + esc(cat.name) + "</h3>" +
        (cat.note ? '<p class="menu-cat-note">' + esc(cat.note) + "</p>" : "") +
      "</div>" +
      '<ul class="dish-list">' + (cat.items || []).map(menuItemHtml).join("") + "</ul>" +
      "</section>";
  }

  function renderMenu() {
    var cats = data.menu || [];
    var tabs = $("[data-menu-tabs]");
    var body = $("[data-menu-body]");
    if (!tabs || !body) return;

    fill("[data-menu-intro]", esc(data.menuIntro || ""));

    var tabList = [{ id: "all", name: "Tất cả" }].concat(cats);
    tabs.innerHTML = tabList.map(function (c, i) {
      return '<button type="button" role="tab" class="tab" data-cat="' + esc(c.id) + '" aria-selected="' + (i === 0) + '">' +
        esc(c.name) + "</button>";
    }).join("");

    function show(id) {
      var list = id === "all" ? cats : cats.filter(function (c) { return c.id === id; });
      body.innerHTML = list.map(categoryHtml).join("");
      $all("[data-menu-tabs] .tab").forEach(function (b) {
        b.setAttribute("aria-selected", String(b.getAttribute("data-cat") === id));
      });
    }

    tabs.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cat]");
      if (!btn) return;
      show(btn.getAttribute("data-cat"));
      btn.scrollIntoView({ block: "nearest", inline: "center" });
      // Đang cuộn giữa menu thì đưa về đầu danh sách món
      var bar = $(".menu-tabs-bar");
      if (bar && body.getBoundingClientRect().top < bar.getBoundingClientRect().bottom) {
        $("#menu").scrollIntoView();
      }
    });

    show("all");
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
      (b.image ? '<img class="branch-img" src="' + esc(IMG_DIR + b.image) + '" alt="Hana Buffet ' + esc(b.name) + '" loading="lazy">' : "") +
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

  /* ---------- điều hướng ---------- */
  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $("#site-nav");
    var header = $(".site-header");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("scroll", function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }, { passive: true });
  }

  renderBrand();
  renderAbout();
  renderPricing();
  renderMenu();
  renderBranches();
  initNav();
})();
