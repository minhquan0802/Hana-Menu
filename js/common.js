/* Hana Buffet — hàm dùng chung cho index.html và menu.html */
(function () {
  "use strict";

  var vnd = new Intl.NumberFormat("vi-VN");

  window.HanaUtil = {
    MENU_IMG_DIR: "assets/images/menu/",
    IMG_DIR: "assets/images/",

    esc: function (value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },

    money: function (n) {
      return vnd.format(n) + "₫";
    },

    telHref: function (number) {
      return "tel:" + String(number || "").replace(/[^\d+]/g, "");
    },

    // Màu nhãn món: "Cay" đỏ, "Mới" xanh, "Bán chạy" cam
    tagClass: function (tag) {
      var t = String(tag).toLowerCase();
      if (t.indexOf("cay") > -1) return "spicy";
      if (t.indexOf("mới") > -1) return "new";
      if (t.indexOf("bán chạy") > -1) return "hot";
      return "plain";
    },

    hasPrice: function (item) {
      return item.price != null && item.price !== "";
    },

    // Điền số hotline, giờ mở cửa, tên thương hiệu… vào các thẻ data-* chung của header/footer
    fillBrand: function (brand) {
      var esc = this.esc;
      var tel = this.telHref(brand.hotline);
      function fill(sel, html) {
        Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { el.innerHTML = html; });
      }
      Array.prototype.forEach.call(document.querySelectorAll("[data-hotline-link]"), function (a) { a.href = tel; });
      fill("[data-hotline-text]", esc(brand.hotlineDisplay || brand.hotline));
      fill("[data-opening-hours]", esc(brand.openingHours));
      fill("[data-brand-name]", esc(brand.name));
      fill("[data-year]", new Date().getFullYear());
    },

    // Nút ☰ trên điện thoại
    initNav: function () {
      var toggle = document.querySelector(".nav-toggle");
      var nav = document.getElementById("site-nav");
      var header = document.querySelector(".site-header");
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
  };
})();
