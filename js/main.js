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

  /* ---------- thông tin chung ---------- */
  function renderBrand() {
    var tel = "tel:" + (brand.hotline || "");
    $all("[data-hotline-link]").forEach(function (a) { a.href = tel; });
    fill("[data-hotline-text]", esc(brand.hotlineDisplay || brand.hotline));
    fill("[data-opening-hours]", esc(brand.openingHours));
    fill("[data-brand-name]", esc(brand.name));
    fill("[data-year]", new Date().getFullYear());
    if (brand.tagline) fill("[data-brand-tagline]", esc(brand.tagline));

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
      return '<li class="highlight">' +
        '<span class="highlight-icon" aria-hidden="true">' + esc(h.icon) + "</span>" +
        "<strong>" + esc(h.title) + "</strong>" +
        "<span>" + esc(h.text) + "</span>" +
        "</li>";
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

    fill("[data-pricing-packages]", packages.map(function (p) {
      var isActive = p === active;
      return '<article class="price-card' + (isActive ? " is-active" : "") + '">' +
        (isActive ? '<span class="price-badge">Đang áp dụng</span>' : "") +
        "<h3>" + esc(p.name) + "</h3>" +
        '<p class="price-schedule">' + esc(p.schedule) + "</p>" +
        '<dl class="price-rows">' +
          (p.adult != null ? "<div><dt>Người lớn</dt><dd>" + money(p.adult) + "</dd></div>" : "") +
          (p.child != null ? "<div><dt>Trẻ em</dt><dd>" + money(p.child) + "</dd></div>" : "") +
        "</dl>" +
        "</article>";
    }).join(""));

    fill("[data-pricing-notes]", (pricing.notes || []).map(function (n) {
      return "<li>" + esc(n) + "</li>";
    }).join(""));

    var hero = $("[data-hero-price]");
    if (hero) {
      var lowest = packages.reduce(function (min, p) {
        return p.adult != null && (min == null || p.adult < min) ? p.adult : min;
      }, null);
      if (lowest != null) {
        hero.innerHTML = "Chỉ từ <strong>" + money(lowest) + "</strong> / người";
        hero.hidden = false;
      }
    }
  }

  /* ---------- menu ---------- */
  function menuItemHtml(item) {
    var img = item.image
      ? '<img class="dish-img" src="' + esc(MENU_IMG_DIR + item.image) + '" alt="' + esc(item.name) + '" loading="lazy">'
      : "";
    var tags = (item.tags || []).map(function (t) {
      return '<span class="tag tag-' + esc(tagClass(t)) + '">' + esc(t) + "</span>";
    }).join("");
    var price = item.price != null && item.price !== ""
      ? '<span class="dish-price">' + money(item.price) + "</span>"
      : "";

    return '<li class="dish' + (img ? " has-img" : "") + '">' +
      img +
      '<div class="dish-body">' +
        '<div class="dish-head"><h4>' + esc(item.name) + "</h4>" + price + "</div>" +
        (item.desc ? '<p class="dish-desc">' + esc(item.desc) + "</p>" : "") +
        (tags ? '<div class="dish-tags">' + tags + "</div>" : "") +
      "</div>" +
      "</li>";
  }

  function tagClass(tag) {
    var t = String(tag).toLowerCase();
    if (t.indexOf("cay") > -1) return "spicy";
    if (t.indexOf("mới") > -1) return "new";
    if (t.indexOf("bán chạy") > -1) return "hot";
    return "default";
  }

  function categoryHtml(cat) {
    return '<section class="menu-cat" id="menu-' + esc(cat.id) + '">' +
      '<h3 class="menu-cat-title"><span aria-hidden="true">' + esc(cat.icon) + "</span> " + esc(cat.name) + "</h3>" +
      (cat.note ? '<p class="menu-cat-note">' + esc(cat.note) + "</p>" : "") +
      '<ul class="dish-list">' + (cat.items || []).map(menuItemHtml).join("") + "</ul>" +
      "</section>";
  }

  function renderMenu() {
    var cats = data.menu || [];
    var tabs = $("[data-menu-tabs]");
    var body = $("[data-menu-body]");
    if (!tabs || !body) return;

    var tabList = [{ id: "all", name: "Tất cả", icon: "" }].concat(cats);
    tabs.innerHTML = tabList.map(function (c, i) {
      return '<button type="button" role="tab" class="chip" data-cat="' + esc(c.id) + '" aria-selected="' + (i === 0) + '">' +
        (c.icon ? '<span aria-hidden="true">' + esc(c.icon) + "</span> " : "") + esc(c.name) +
        "</button>";
    }).join("");

    function show(id) {
      var list = id === "all" ? cats : cats.filter(function (c) { return c.id === id; });
      body.innerHTML = list.map(categoryHtml).join("");
      $all("[data-menu-tabs] .chip").forEach(function (b) {
        b.setAttribute("aria-selected", String(b.getAttribute("data-cat") === id));
      });
    }

    tabs.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-cat]");
      if (btn) show(btn.getAttribute("data-cat"));
    });

    show("all");
  }

  /* ---------- chi nhánh ---------- */
  function mapLink(b) {
    if (b.mapUrl) return b.mapUrl;
    return "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("Hana Buffet " + b.address + ", " + b.city);
  }

  function branchHtml(b) {
    var phone = b.phone || brand.hotline;
    var phoneText = b.phone || brand.hotlineDisplay || brand.hotline;
    return '<article class="branch-card">' +
      (b.image ? '<img class="branch-img" src="' + esc(IMG_DIR + b.image) + '" alt="Hana Buffet ' + esc(b.name) + '" loading="lazy">' : "") +
      '<div class="branch-body">' +
        '<p class="branch-city">' + esc(b.city) + "</p>" +
        "<h3>Hana " + esc(b.name) + "</h3>" +
        '<p class="branch-line">📍 ' + esc(b.address) + "</p>" +
        '<p class="branch-line">🕚 ' + esc(b.hours || brand.openingHours) + "</p>" +
        '<p class="branch-line">📞 ' + esc(phoneText) + "</p>" +
        '<div class="branch-actions">' +
          '<a class="btn btn-primary btn-sm" href="tel:' + esc(phone) + '">Gọi đặt bàn</a>' +
          '<a class="btn btn-outline btn-sm" href="' + esc(mapLink(b)) + '" target="_blank" rel="noopener">Chỉ đường</a>' +
        "</div>" +
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

    function show(city) {
      var shown = city === "all" ? branches : branches.filter(function (b) { return b.city === city; });
      list.innerHTML = shown.map(branchHtml).join("");
      $all("[data-branch-filter] .chip").forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.getAttribute("data-city") === city));
      });
    }

    // Chỉ hiện bộ lọc khi có từ 2 thành phố trở lên
    if (filter && cities.length > 1) {
      filter.innerHTML = ["all"].concat(cities).map(function (c) {
        var count = c === "all" ? branches.length : branches.filter(function (b) { return b.city === c; }).length;
        return '<button type="button" class="chip" data-city="' + esc(c) + '">' +
          esc(c === "all" ? "Tất cả" : c) + ' <span class="chip-count">' + count + "</span></button>";
      }).join("");
      filter.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-city]");
        if (btn) show(btn.getAttribute("data-city"));
      });
    }

    show("all");
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
