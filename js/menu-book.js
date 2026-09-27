/* Hana Buffet — cuốn menu lật trang (menu.html).
   Tạo các trang từ window.HANA_DATA rồi gắn hiệu ứng lật bằng StPageFlip (js/vendor, MIT).

   Thứ tự trang (chỉ số 0 là bìa):
     0        bìa trước
     1 | 2    bảng giá | mục lục
     3 …      trang món theo thứ tự danh mục trong data.js; món đánh số liên tục.
              Một trang có thể chứa nhiều danh mục nhưng mỗi danh mục nằm trọn một trang:
              xếp thử vào một trang ẩn, danh mục không vừa phần còn lại thì sang trang mới.
              Mỗi trang in ảnh (đĩa tròn tràn mép ngoài) của tối đa 2 món đầu tiên có ảnh.
     cuối     bìa sau (thêm trang đệm trước nếu cần để bìa sau nằm riêng) */
(function () {
  "use strict";

  var data = window.HANA_DATA;
  var U = window.HanaUtil;
  var book = document.querySelector("[data-book]");
  if (!data || !U || !book) {
    if (book) book.innerHTML = '<p class="data-error">Không đọc được dữ liệu. Kiểm tra lại file data/data.js.</p>';
    return;
  }

  var FIRST_DISH_PAGE = 3;
  var PLATES_PER_PAGE = 2;
  var esc = U.esc, money = U.money;
  var brand = data.brand || {};
  var cats = (data.menu || []).filter(function (c) { return (c.items || []).length; });
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  U.fillBrand(brand);
  U.initNav();

  /* ---------- nội dung trang món ---------- */

  // Vỉ nướng — dùng làm "đĩa" khi trang không có món nào có ảnh
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

  function blockHtml(b) {
    if (b.type === "head") {
      return '<h3 class="cat-head"><span class="cat-name">' + esc(b.cat.name) + "</span>" +
          (b.cont ? ' <span class="cat-cont">(tiếp)</span>' : "") + "</h3>" +
        (!b.cont && (b.cat.nameEn || b.cat.note)
          ? '<p class="cat-sub">' +
              (b.cat.nameEn ? '<span class="cat-en">' + esc(b.cat.nameEn) + "</span>" : "") +
              (b.cat.note ? '<span class="cat-note">' + esc(b.cat.note) + "</span>" : "") +
            "</p>"
          : "");
    }
    var item = b.item;
    return '<div class="dish">' +
      '<span class="dish-no">' + b.no + "</span>" +
      '<div class="dish-text">' +
        '<p class="dish-name">' + esc(item.name) + "</p>" +
        (item.nameEn ? '<p class="dish-en">' + esc(item.nameEn) + "</p>" : "") +
        (item.desc ? '<p class="dish-desc">' + esc(item.desc) + "</p>" : "") +
        ((item.tags || []).length ? '<p class="dish-tags">' + tagsHtml(item.tags) + "</p>" : "") +
        (U.hasPrice(item) ? '<p class="dish-price">' + money(item.price) + "</p>" : "") +
      "</div>" +
      "</div>";
  }

  function platesHtml(blocks, key) {
    var withImg = blocks.filter(function (b) { return b.type === "item" && b.item.image; }).slice(0, PLATES_PER_PAGE);
    if (!withImg.length) {
      return '<div class="dish-plates dish-plates-1" aria-hidden="true"><div class="dish-plate dish-plate-grill">' + grillSvg(key) + "</div></div>";
    }
    return '<div class="dish-plates dish-plates-' + withImg.length + '" aria-hidden="true">' + withImg.map(function (b) {
      return '<figure class="dish-plate">' +
        '<img src="' + esc(U.MENU_IMG_DIR + b.item.image) + '" alt="" loading="lazy">' +
        '<figcaption class="dish-plate-no">' + b.no + "</figcaption>" +
        "</figure>";
    }).join("") + "</div>";
  }

  // Cột chữ; tách riêng để trang đo và trang thật dùng chung
  function dishColHtml(blocks) {
    return '<div class="dish-col"><div class="dish-flow">' + blocks.map(blockHtml).join("") + "</div></div>";
  }

  /* ---------- chia trang bằng cách đo ---------- */
  // Trang ẩn cùng tỉ lệ 3:4; mọi kích thước tính theo bề rộng trang (cqw) nên đo một lần đúng mọi màn hình.
  var measurer = null;
  function fits(blocks) {
    if (!measurer) {
      measurer = document.createElement("div");
      measurer.className = "page pg-dish p-right";
      measurer.setAttribute("aria-hidden", "true");
      measurer.style.cssText = "position:absolute;left:-10000px;top:0;width:480px;height:640px;visibility:hidden";
      document.body.appendChild(measurer);
    }
    measurer.innerHTML = '<div class="page-inner">' + dishColHtml(blocks) +
      '<footer class="pg-foot"><span>Hana</span><span>0</span></footer></div>';
    var col = measurer.querySelector(".dish-col");
    return col.scrollHeight <= col.clientHeight + 1;
  }

  // Giữ trọn mỗi danh mục trên một trang: danh mục không vừa phần còn lại thì sang trang mới.
  // Chỉ danh mục dài hơn cả một trang trống mới bị tách, phần sau có tiêu đề kèm "(tiếp)".
  function paginate() {
    var result = [];
    var current = [];
    var no = 0;

    cats.forEach(function (cat) {
      var blocks = [{ type: "head", cat: cat }].concat(cat.items.map(function (item) {
        return { type: "item", cat: cat, item: item, no: ++no };
      }));

      if (current.length && !fits(current.concat(blocks))) {
        result.push(current);
        current = [];
      }
      if (fits(current.concat(blocks))) {
        current = current.concat(blocks);
        return;
      }

      // Danh mục quá dài cho một trang: tách theo từng món
      blocks.forEach(function (b) {
        if (b.type === "head") { current.push(b); return; }
        if (current.length > 1 && !fits(current.concat([b]))) {
          result.push(current);
          current = [{ type: "head", cat: cat, cont: true }];
        }
        current.push(b);
      });
    });
    if (current.length) result.push(current);
    return result;
  }

  // Chờ font tải xong mới đo (font khác làm chữ cao/thấp khác); tối đa 2,5 giây
  function whenFontsReady(cb) {
    var done = false;
    function go() { if (!done) { done = true; cb(); } }
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('400 20px "Paytone One"'),
        document.fonts.load('400 20px "Pacifico"'),
        document.fonts.load("400 16px Lexend"),
        document.fonts.load("500 16px Lexend")
      ]).then(go, go);
    } else go();
    setTimeout(go, 2500);
  }

  whenFontsReady(build);

  function build() {
    var pages = [];     // { cls, html, hard, foot, catIds }
    var catStart = {};  // id danh mục → trang có tiêu đề đầu tiên của danh mục

    function addPage(cls, html, opts) {
      opts = opts || {};
      pages.push({ cls: cls, html: html, hard: !!opts.hard, foot: opts.foot !== false, catIds: opts.catIds || [] });
    }

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

    // 2 — mục lục (điền sau khi biết số trang)
    addPage("pg-toc", "");

    // 3… — trang món
    paginate().forEach(function (blocks) {
      var index = pages.length;
      var ids = [];
      blocks.forEach(function (b) {
        if (ids.indexOf(b.cat.id) === -1) ids.push(b.cat.id);
        if (b.type === "head" && !b.cont) catStart[b.cat.id] = index;
      });
      addPage("pg-dish", platesHtml(blocks, "p" + index) + dishColHtml(blocks), { catIds: ids });
    });

    // Trang đệm: bìa sau phải ở chỉ số lẻ để đứng riêng
    if (pages.length % 2 === 0) {
      addPage("pg-filler",
        '<p class="filler-mark">Hana</p>' +
        '<p class="filler-text">' + esc(data.menuIntro || "") + "</p>");
    }

    // Mục lục
    pages[2].html =
      '<h2 class="pg-title">Mục lục</h2>' +
      '<ol class="toc">' +
        '<li><button type="button" data-goto="1"><span>Bảng giá buffet</span><span class="toc-leader"></span><span class="toc-num">1</span></button></li>' +
        cats.map(function (c) {
          return '<li><button type="button" data-goto="' + catStart[c.id] + '" data-cat="' + esc(c.id) + '">' +
            "<span>" + esc(c.name) + "</span>" +
            '<span class="toc-leader"></span><span class="toc-num">' + catStart[c.id] + "</span></button></li>";
        }).join("") +
      "</ol>" +
      '<p class="toc-note">Hình ảnh món ăn chỉ mang tính minh họa.</p>';

    // Bìa sau
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

    // Danh mục khách vừa chọn (tab, mục lục, #hash) — giữ tô sáng nếu còn nằm trên trang đang mở
    var wanted = decodeURIComponent(location.hash.slice(1)) || null;

    function catsOn(indexes) {
      var ids = [];
      indexes.forEach(function (i) {
        (pages[i] ? pages[i].catIds : []).forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); });
      });
      return ids;
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
      var visible = !landscape || i === 0 || i === last ? [i] : i % 2 ? [i, i + 1] : [i - 1, i];
      var ids = catsOn(visible);
      var cat = ids.indexOf(wanted) > -1 ? wanted : ids[0] || null;
      var onPrices = !cat && i >= 1 && i < FIRST_DISH_PAGE;
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
      if (!btn) return;
      wanted = btn.getAttribute("data-cat");
      goTo(+btn.getAttribute("data-goto"));
      update();   // danh mục đã nằm trên trang đang mở thì không có lần lật nào gọi update()
    });

    // Đổi #danh-muc trên cùng trang (vd bấm link menu.html#lau khi đang xem menu) → lật tới đó
    window.addEventListener("hashchange", function () {
      var target = startIndexFromHash();
      if (!target) return;
      wanted = decodeURIComponent(location.hash.slice(1));
      goTo(target);
    });

    document.addEventListener("keydown", function (e) {
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") flip.flipNext();
      if (e.key === "ArrowLeft") flip.flipPrev();
    });
  }
})();
