/* Hana Buffet — cuốn menu lật trang (menu.html).
   Tạo các trang từ window.HANA_DATA rồi gắn hiệu ứng lật bằng StPageFlip (js/vendor, MIT).

   Thứ tự trang (chỉ số 0 là bìa):
     0            bìa trước
     1 | 2        bảng giá | mục lục
     lẻ | chẵn    mỗi danh mục: trang bìa danh mục (trái) | trang món (phải)
                  món được xếp thử vào một trang ẩn; hết chỗ thì sang trang mới
                  (nên món có ảnh/mô tả dài sẽ ít món hơn mỗi trang);
                  thêm trang đệm khi cần để bìa danh mục luôn nằm bên trái
     cuối         bìa sau */
(function () {
  "use strict";

  var data = window.HANA_DATA;
  var U = window.HanaUtil;
  var book = document.querySelector("[data-book]");
  if (!data || !U || !book) {
    if (book) book.innerHTML = '<p class="data-error">Không đọc được dữ liệu. Kiểm tra lại file data/data.js.</p>';
    return;
  }

  var MAX_ITEMS_PER_PAGE = 6;
  var esc = U.esc, money = U.money;
  var brand = data.brand || {};
  var cats = (data.menu || []).filter(function (c) { return (c.items || []).length; });
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  U.fillBrand(brand);
  U.initNav();

  /* ---------- tạo trang ---------- */
  var pages = [];     // { html, cls, hard, catId }
  var catStart = {};  // id danh mục → chỉ số trang bìa danh mục

  function addPage(cls, html, opts) {
    opts = opts || {};
    pages.push({ cls: cls, html: html, hard: !!opts.hard, catId: opts.catId || null, foot: opts.foot !== false });
  }


  // Vỉ nướng — cùng hình với đầu trang chủ, dùng làm hình nền bìa danh mục khi chưa có ảnh
  function grillSvg(id) {
    var bars = "";
    for (var x = 46; x <= 358; x += 24) bars += '<line x1="' + x + '" y1="20" x2="' + x + '" y2="380"/>';
    return '<svg class="grill-art" viewBox="0 0 400 400" aria-hidden="true">' +
      '<defs><radialGradient id="em-' + id + '" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#FFCF5A"/><stop offset="45%" stop-color="#F37021"/>' +
        '<stop offset="80%" stop-color="#C62F1D"/><stop offset="100%" stop-color="#5A1A0C"/></radialGradient>' +
        '<clipPath id="cl-' + id + '"><circle cx="200" cy="200" r="163"/></clipPath></defs>' +
      '<circle cx="200" cy="200" r="194" fill="#3B2619"/><circle cx="200" cy="200" r="182" fill="#140C08"/>' +
      '<circle cx="200" cy="200" r="168" fill="url(#em-' + id + ')"/>' +
      '<g clip-path="url(#cl-' + id + ')" stroke="#20140E" stroke-width="7" stroke-linecap="round">' + bars + "</g>" +
      '<circle cx="200" cy="200" r="166" fill="none" stroke="#20140E" stroke-width="9"/>' +
      "</svg>";
  }

  function tagsHtml(tags) {
    return (tags || []).map(function (t) {
      return '<span class="bk-tag bk-tag-' + U.tagClass(t) + '">' + esc(t) + "</span>";
    }).join("");
  }

  function itemHtml(item, i) {
    var img = item.image
      ? '<img class="item-img" src="' + esc(U.MENU_IMG_DIR + item.image) + '" alt="' + esc(item.name) + '" loading="lazy">'
      : "";
    return '<li class="item' + (img ? " has-img" : "") + (img && i % 2 ? " is-flipped" : "") + '">' +
      img +
      '<div class="item-text">' +
        '<p class="item-name">' + esc(item.name) + "</p>" +
        (item.nameEn ? '<p class="item-en">' + esc(item.nameEn) + "</p>" : "") +
        (item.desc ? '<p class="item-desc">' + esc(item.desc) + "</p>" : "") +
        ((item.tags || []).length ? '<p class="item-tags">' + tagsHtml(item.tags) + "</p>" : "") +
        (U.hasPrice(item) ? '<p class="item-price">' + money(item.price) + "</p>" : "") +
      "</div>" +
      "</li>";
  }

  function itemsPageHtml(cat, sub, group, gi) {
    return '<header class="items-head">' +
        "<h3>" + esc(cat.name) + (gi ? ' <span class="items-cont">(tiếp)</span>' : "") + "</h3>" +
        "<p>" + esc(sub) + "</p>" +
      "</header>" +
      '<ul class="items">' + group.map(itemHtml).join("") + "</ul>";
  }

  // Xếp thử món vào một trang ẩn cùng tỉ lệ 3:4; món nào làm tràn trang thì sang trang mới.
  // Mọi kích thước trong trang tính theo bề rộng trang (cqw) nên đo một lần đúng cho mọi màn hình.
  var measurer = null;
  function paginate(cat, sub) {
    if (!measurer) {
      measurer = document.createElement("div");
      measurer.className = "page pg-items p-right";
      measurer.setAttribute("aria-hidden", "true");
      measurer.style.cssText = "position:absolute;left:-10000px;top:0;width:480px;height:640px;visibility:hidden";
      document.body.appendChild(measurer);
    }
    function fits(group, gi) {
      measurer.innerHTML = '<div class="page-inner">' + itemsPageHtml(cat, sub, group, gi) +
        '<footer class="pg-foot"><span>Hana</span><span>0</span></footer></div>';
      var list = measurer.querySelector(".items");
      return list.scrollHeight <= list.clientHeight + 1;
    }
    var groups = [];
    var current = [];
    cat.items.forEach(function (item) {
      var trial = current.concat([item]);
      if (current.length && (trial.length > MAX_ITEMS_PER_PAGE || !fits(trial, groups.length))) {
        groups.push(current);
        current = [item];
      } else {
        current = trial;
      }
    });
    if (current.length) groups.push(current);
    return groups;
  }

  // Chờ font tải xong mới đo chia trang (font khác làm chữ cao/thấp khác); tối đa 2,5 giây
  function whenFontsReady(cb) {
    var done = false;
    function go() { if (!done) { done = true; cb(); } }
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load("400 20px \"Paytone One\""),
        document.fonts.load("400 16px Lexend"),
        document.fonts.load("500 16px Lexend")
      ]).then(go, go);
    } else go();
    setTimeout(go, 2500);
  }

  whenFontsReady(build);

  function build() {
    // 0 — bìa trước
    addPage("pg-cover",
      '<div class="cover-plate"><img src="assets/images/logo.png" alt="Hana BBQ & Hot Pot Buffet"></div>' +
      '<p class="cover-title">Menu</p>' +
      '<p class="cover-sub">' + esc(brand.name || "Hana BBQ & Hot Pot Buffet") + "</p>",
      { hard: true, foot: false });

    // 1 — bảng giá
    var pricing = data.pricing || {};
    addPage("pg-prices",
      '<h2 class="pg-title">' + esc(pricing.title || "Bảng giá buffet") + "</h2>" +
      '<ul class="price-list">' + (pricing.packages || []).map(function (p) {
        return "<li>" +
          "<div>" +
            '<p class="pl-name">' + esc(p.name) + "</p>" +
            '<p class="pl-time">' + esc(p.schedule) + "</p>" +
          "</div>" +
          '<dl class="pl-prices">' +
            (p.adult != null ? "<div><dt>Người lớn</dt><dd>" + money(p.adult) + "</dd></div>" : "") +
            (p.child != null ? "<div><dt>Trẻ em</dt><dd>" + money(p.child) + "</dd></div>" : "") +
          "</dl></li>";
      }).join("") + "</ul>" +
      '<ul class="pl-notes">' + (pricing.notes || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>");

    // 2 — mục lục (điền số trang sau khi biết vị trí các danh mục)
    addPage("pg-toc", "");

    // Danh mục
    cats.forEach(function (cat) {
      var id = cat.id;
      catStart[id] = pages.length;

      // Trang bìa danh mục
      var cover = cat.cover
        ? '<img class="catcover-photo" src="' + esc(U.MENU_IMG_DIR + cat.cover) + '" alt="">'
        : '<div class="catcover-art">' + grillSvg(id) + "</div>";
      addPage("pg-catcover" + (cat.cover ? " has-photo" : ""),
        cover +
        '<div class="catcover-text">' +
          '<h2 class="catcover-title">' + esc(cat.name) + "</h2>" +
          (cat.nameEn ? '<p class="catcover-en">' + esc(cat.nameEn) + "</p>" : "") +
          (cat.note ? '<p class="catcover-note">' + esc(cat.note) + "</p>" : "") +
        "</div>",
        { catId: id });

      // Trang món
      var allPriced = cat.items.every(U.hasPrice);
      var sub = cat.note || (allPriced ? "Tính riêng" : "Đã gồm trong giá buffet");
      paginate(cat, sub).forEach(function (group, gi) {
        addPage("pg-items", itemsPageHtml(cat, sub, group, gi), { catId: id });
      });

      // Trang đệm để danh mục sau bắt đầu ở trang trái (chỉ số lẻ)
      if (pages.length % 2 === 0) {
        addPage("pg-filler",
          '<p class="filler-mark">Hana</p>' +
          '<p class="filler-text">' + esc(data.menuIntro || "") + "</p>",
          { catId: id });
      }
    });

    // Mục lục
    pages[2].html =
      '<h2 class="pg-title">Mục lục</h2>' +
      '<ol class="toc">' +
        '<li><button type="button" data-goto="1"><span>Bảng giá buffet</span><span class="toc-leader"></span><span class="toc-num">1</span></button></li>' +
        cats.map(function (c) {
          return '<li><button type="button" data-goto="' + catStart[c.id] + '">' +
            "<span>" + esc(c.name) + "</span>" +
            '<span class="toc-leader"></span><span class="toc-num">' + catStart[c.id] + "</span></button></li>";
        }).join("") +
      "</ol>";

    // Bìa sau — số trang luôn chẵn vì danh mục cuối kết thúc ở trang phải
    var branches = (data.branches || []).filter(function (b) { return b.active !== false; });
    addPage("pg-back",
      '<p class="back-mark">Hana</p>' +
      '<p class="back-label">Đặt bàn</p>' +
      '<p class="back-phone">' + esc(brand.hotlineDisplay || brand.hotline) + "</p>" +
      '<p class="back-hours">Mở cửa ' + esc(brand.openingHours) + "</p>" +
      '<ul class="back-branches">' + branches.map(function (b) {
        return "<li><strong>Hana " + esc(b.name) + "</strong><span>" + esc(b.address) + "</span></li>";
      }).join("") + "</ul>",
      { hard: true, foot: false });

    /* ---------- render ---------- */
    var total = pages.length;
    book.innerHTML = pages.map(function (p, i) {
      var side = p.hard ? "" : i % 2 ? " p-left" : " p-right";
      return '<div class="page ' + p.cls + side + '"' + (p.hard ? ' data-density="hard"' : "") + ">" +
        '<div class="page-inner">' + p.html +
          (p.foot ? '<footer class="pg-foot"><span>Hana</span><span>' + i + "</span></footer>" : "") +
        "</div></div>";
    }).join("");

    if (measurer) measurer.remove();

    var jump = document.querySelector("[data-book-jump]");
    jump.innerHTML =
      '<button type="button" class="tab" data-goto="1">Bảng giá</button>' +
      cats.map(function (c) {
        return '<button type="button" class="tab" data-goto="' + catStart[c.id] + '" data-cat="' + esc(c.id) + '">' + esc(c.name) + "</button>";
      }).join("");

    var counter = document.querySelector("[data-book-counter]");
    var prevBtn = document.querySelector("[data-book-prev]");
    var nextBtn = document.querySelector("[data-book-next]");

    // Không tải được thư viện lật trang → hiện các trang xếp dọc
    if (!window.St || !window.St.PageFlip) {
      book.classList.add("is-static");
      document.querySelector(".book-controls").hidden = true;
      document.querySelector(".book-hint").hidden = true;
      jump.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-goto]");
        if (btn) book.children[+btn.getAttribute("data-goto")].scrollIntoView({ behavior: "smooth" });
      });
      return;
    }

    var flip = new window.St.PageFlip(book, {
      width: 480,
      height: 640,
      size: "stretch",
      minWidth: 250,
      maxWidth: 620,
      minHeight: 333,
      maxHeight: 827,
      showCover: true,
      usePortrait: true,
      mobileScrollSupport: true,
      maxShadowOpacity: 0.55,
      showPageCorners: false,   // không gập góc trang khi chỉ rê chuột; muốn lật thì kéo, bấm nút hoặc vuốt
      flippingTime: reduceMotion ? 250 : 900,
      startPage: startIndexFromHash()
    });
    flip.loadFromHTML(book.querySelectorAll(".page"));
    book.classList.add("is-ready");

    function startIndexFromHash() {
      var id = decodeURIComponent(location.hash.slice(1));
      if (id === "bang-gia") return 1;
      return catStart[id] || 0;
    }

    function catAt(index) {
      return pages[index] ? pages[index].catId : null;
    }

    function goTo(index) {
      if (reduceMotion) flip.turnToPage(index);
      else flip.flip(index);
    }

    function update() {
      var i = flip.getCurrentPageIndex();
      var landscape = flip.getOrientation() === "landscape";
      var last = total - 1;

      if (i === 0) counter.textContent = "Bìa trước";
      else if (i === last) counter.textContent = "Bìa sau";
      else if (landscape) {
        var left = i % 2 ? i : i - 1;
        counter.textContent = "Trang " + left + "–" + Math.min(left + 1, last - 1) + " / " + (total - 2);
      } else counter.textContent = "Trang " + i + " / " + (total - 2);

      prevBtn.disabled = i === 0;
      nextBtn.disabled = i >= last;

      // Tab đang đọc + cập nhật #hash để chia sẻ đúng trang
      var cat = catAt(landscape && i % 2 === 0 && i > 0 ? i - 1 : i);
      var onPrices = !cat && i >= 1 && i <= 2;
      Array.prototype.forEach.call(jump.querySelectorAll(".tab"), function (t) {
        var active = cat ? t.getAttribute("data-cat") === cat : onPrices && t.getAttribute("data-goto") === "1";
        t.setAttribute("aria-current", active ? "true" : "false");
        if (active) t.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
      var hash = cat ? "#" + cat : onPrices ? "#bang-gia" : "";
      if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname);
    }

    flip.on("flip", update);
    flip.on("changeOrientation", update);
    update();

    prevBtn.addEventListener("click", function () { flip.flipPrev(); });
    nextBtn.addEventListener("click", function () { flip.flipNext(); });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-goto]");
      if (btn) goTo(+btn.getAttribute("data-goto"));
    });

    document.addEventListener("keydown", function (e) {
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") flip.flipNext();
      if (e.key === "ArrowLeft") flip.flipPrev();
    });
  }
})();
