/* Hana — bộ lật trang (thay cho thư viện StPageFlip).
 *
 * Mỗi "tờ" (leaf) là một phần tử quay quanh gáy sách bằng CSS 3D (rotateY), mặt trước/mặt sau là 2 trang.
 * - Mỗi tờ có hoạt ảnh riêng → bấm liên tục thì nhiều tờ cùng lật một lúc ("lật liền").
 * - Kéo trang: mép tờ bám theo con trỏ chuột (lật thẳng quanh gáy, không gập từ góc).
 * - Màn hình rộng: 2 trang (bìa trước/sau đứng riêng, tự căn giữa). Màn hình hẹp: từng trang một.
 *
 *   var fb = new HanaFlipbook(el, { pages: [url…], pageWidth, pageHeight, startPage, flipTime,
 *                                  onChange: fn(fb), onFlip: fn(fb) });
 *   fb.next(); fb.prev(); fb.goTo(page); fb.visible() → [chỉ số trang đang thấy]; fb.canNext(); fb.canPrev()
 * Chỉ số trang bắt đầu từ 0.
 */
(function () {
  "use strict";

  var DEG = Math.PI / 180;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function HanaFlipbook(root, opt) {
    this.root = root;
    this.opt = opt;
    this.n = opt.pages.length;
    this.ratio = opt.pageWidth / opt.pageHeight;
    this.time = opt.flipTime || 500;
    this.anims = {};
    this.drag = null;
    this.mode = null;
    this.target = 0;       // số tờ đã lật sau khi mọi hoạt ảnh xong
    this._raf = 0;

    root.classList.add("fb");
    root.innerHTML = '<div class="fb-stage"><div class="fb-under fb-under-l"></div><div class="fb-under fb-under-r"></div></div>';
    this.stage = root.firstChild;
    this.underL = this.stage.children[0];
    this.underR = this.stage.children[1];

    this.layout(opt.startPage || 0);
    this._bindPointer();

    var self = this, t = 0;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { self.layout(self.visible()[0]); }, 60);
    });
  }

  var P = HanaFlipbook.prototype;

  /* ---------- trang ↔ tờ ---------- */
  P.leafCount = function () { return this.mode === "spread" ? Math.ceil(this.n / 2) : this.n; };
  P.maxTarget = function () { return this.mode === "spread" ? this.leafCount() : this.n - 1; };
  P.pageToTarget = function (p) {
    p = clamp(p, 0, this.n - 1);
    return this.mode === "spread" ? Math.floor((p + 1) / 2) : p;
  };
  // trang ở mặt trước / mặt sau của tờ i (null nếu không có)
  P.frontPage = function (i) { return this.mode === "spread" ? 2 * i : i; };
  P.backPage = function (i) {
    if (this.mode !== "spread") return null;
    return 2 * i + 1 < this.n ? 2 * i + 1 : null;
  };

  P.visible = function () {
    var f = this.target;
    if (this.mode !== "spread") return [f];
    var out = [];
    if (f > 0) out.push(2 * f - 1);
    if (2 * f < this.n) out.push(2 * f);
    return out;
  };
  P.canNext = function () { return this.target < this.maxTarget(); };
  P.canPrev = function () { return this.target > 0; };

  /* ---------- kích thước + dựng ---------- */
  P.layout = function (page) {
    var o = this.opt;
    var vw = window.innerWidth, vh = window.innerHeight;
    var mode = vw < (o.singleBelow || 600) ? "single" : "spread";
    var maxH = vh - 2 * (o.gapY == null ? 10 : o.gapY);
    var pw = mode === "spread"
      ? Math.min(maxH * this.ratio, (vw - 2 * (o.sideSpace == null ? 56 : o.sideSpace)) / 2)
      : Math.min(maxH * this.ratio, vw - 2 * (o.gapX == null ? 10 : o.gapX));
    this.pw = Math.floor(pw);
    this.ph = Math.floor(pw / this.ratio);
    this.root.style.width = (mode === "spread" ? 2 * this.pw : this.pw) + "px";
    this.root.style.height = this.ph + "px";
    this.root.classList.toggle("is-single", mode === "single");

    if (mode !== this.mode) {
      this.mode = mode;
      this._build(page || 0);
    } else {
      this._positionLeaves();
      this._renderAll();
    }
  };

  P._build = function (page) {
    var self = this;
    Object.keys(this.anims).forEach(function (k) { delete self.anims[k]; });
    this.drag = null;
    (this.leaves || []).forEach(function (l) { l.el.remove(); });
    this.leaves = [];
    this.imgs = [];

    this.target = this.pageToTarget(page);
    for (var i = 0; i < this.leafCount(); i++) {
      var el = document.createElement("div");
      el.className = "fb-leaf";
      var front = this._face(this.frontPage(i), "fb-front " + (this.mode === "spread" ? "fb-right" : "fb-single"));
      var back = this._face(this.backPage(i), "fb-back fb-left");
      el.appendChild(front);
      el.appendChild(back);
      this.stage.appendChild(el);
      this.leaves.push({
        el: el, front: front, back: back,
        fShade: front.lastChild, bShade: back.lastChild,
        angle: i < this.target ? 180 : 0
      });
    }
    this._positionLeaves();
    this._renderAll();
    this._changed();
  };

  P._face = function (p, cls) {
    var face = document.createElement("div");
    var hard = p === 0 || p === this.n - 1;
    face.className = "fb-face " + cls + (hard ? " fb-hard" : "");
    if (p != null) {
      var img = document.createElement("img");
      img.alt = "Menu Hana – trang " + (p + 1);
      img.draggable = false;
      img.decoding = "async";
      img.dataset.src = this.opt.pages[p];
      face.appendChild(img);
      this.imgs[p] = img;
    }
    var shade = document.createElement("div");
    shade.className = "fb-shade";
    face.appendChild(shade);
    return face;
  };

  P.load = function (p) {
    var img = this.imgs[p];
    if (img && img.dataset.src) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
    return img;
  };

  P._positionLeaves = function () {
    var left = this.mode === "spread" ? this.pw : 0;
    this.leaves.forEach(function (l) {
      l.el.style.left = left + "px";
      l.el.style.width = this.pw + "px";
    }, this);
  };

  /* ---------- vẽ ---------- */
  P._renderLeaf = function (i) {
    var l = this.leaves[i], a = l.angle;
    var moving = a > 0.5 && a < 179.5;
    l.el.style.transform = "rotateY(" + (-a) + "deg)";
    // chồng bên phải: tờ số nhỏ nằm trên; chồng bên trái: tờ số lớn nằm trên
    l.el.style.zIndex = a < 90 ? 500 - i : 500 + i;
    var near = i >= this.target - 2 && i <= this.target + 1;
    l.el.style.visibility = near || this.anims[i] || (this.drag && this.drag.i === i) ? "" : "hidden";
    // tờ đang bay: tối dần khi nghiêng + bóng đổ
    l.fShade.style.opacity = a < 90 ? (a / 90 * 0.55).toFixed(3) : 0;
    l.bShade.style.opacity = a > 90 ? ((180 - a) / 90 * 0.55).toFixed(3) : 0;
    var s = Math.sin(a * DEG);
    l.el.classList.toggle("is-moving", moving);
    l.el.style.setProperty("--lift", moving ? s.toFixed(3) : 0);
  };

  P._renderAll = function () {
    for (var i = 0; i < this.leaves.length; i++) this._renderLeaf(i);
    // bìa trước / bìa sau đứng riêng → căn giữa
    var shift = 0;
    if (this.mode === "spread") {
      var v = this.visible();
      if (v.length === 1) shift = v[0] === 0 ? -this.pw / 2 : this.pw / 2;
      this.underL.style.display = this.target > 0 ? "" : "none";
      this.underR.style.display = 2 * this.target < this.n ? "" : "none";
    } else {
      this.underL.style.display = "none";
      this.underR.style.display = "";
    }
    this.stage.style.transform = shift ? "translateX(" + shift + "px)" : "";
  };

  /* ---------- hoạt ảnh ---------- */
  P._animate = function (i, to, time) {
    var l = this.leaves[i];
    var dist = Math.abs(to - l.angle);
    if (dist < 0.5) { l.angle = to; this._renderLeaf(i); return; }
    this.anims[i] = { from: l.angle, to: to, start: performance.now(), dur: Math.max(120, (time || this.time) * dist / 180) };
    this._loop();
  };

  P._loop = function () {
    if (this._raf) return;
    var self = this;
    this._raf = requestAnimationFrame(function tick(now) {
      var busy = false;
      Object.keys(self.anims).forEach(function (k) {
        var an = self.anims[k], l = self.leaves[k];
        var t = clamp((now - an.start) / an.dur, 0, 1);
        l.angle = an.from + (an.to - an.from) * easeOut(t);
        if (t >= 1) { l.angle = an.to; delete self.anims[k]; } else busy = true;
        self._renderLeaf(+k);
      });
      var d = self.drag;
      if (d && d.active) {
        var l = self.leaves[d.i];
        l.angle += (d.want - l.angle) * 0.35;      // bám theo con trỏ, mượt
        self._renderLeaf(d.i);
        busy = true;
      }
      if (busy) self._raf = requestAnimationFrame(tick);
      else { self._raf = 0; self._renderAll(); }
    });
  };

  P._changed = function () {
    this._renderAll();
    if (this.opt.onChange) this.opt.onChange(this);
  };
  P._flipped = function () { if (this.opt.onFlip) this.opt.onFlip(this); };

  /* ---------- điều khiển ---------- */
  P.next = function () {
    if (!this.canNext()) return false;
    var i = this.target++;
    this._animate(i, 180);
    this._flipped();
    this._changed();
    return true;
  };

  P.prev = function () {
    if (!this.canPrev()) return false;
    var i = --this.target;
    this._animate(i, 0);
    this._flipped();
    this._changed();
    return true;
  };

  // Tới thẳng một trang: các tờ ở giữa đặt ngay, chỉ tờ cuối có hoạt ảnh lật
  P.goTo = function (page, instant) {
    var t = this.pageToTarget(page);
    if (t === this.target) return;
    var i;
    if (t > this.target) {
      for (i = this.target; i < t - 1; i++) { delete this.anims[i]; this.leaves[i].angle = 180; }
      if (instant) { delete this.anims[t - 1]; this.leaves[t - 1].angle = 180; } else this._animate(t - 1, 180);
    } else {
      for (i = t + 1; i < this.target; i++) { delete this.anims[i]; this.leaves[i].angle = 0; }
      if (instant) { delete this.anims[t]; this.leaves[t].angle = 0; } else this._animate(t, 0);
    }
    this.target = t;
    if (!instant) this._flipped();
    this._changed();
  };

  /* ---------- kéo trang bằng chuột / ngón tay ---------- */
  P._bindPointer = function () {
    var self = this, st = this.stage, press = null;

    st.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      press = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, lastX: e.clientX, lastT: performance.now(), vx: 0 };
    });

    st.addEventListener("pointermove", function (e) {
      if (!press || e.pointerId !== press.id) return;
      var now = performance.now();
      if (now > press.lastT) press.vx = (e.clientX - press.lastX) / (now - press.lastT);
      press.lastX = e.clientX; press.lastT = now;
      var dx = e.clientX - press.x, dy = e.clientY - press.y;

      if (!self.drag) {
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
        var rect = st.getBoundingClientRect();
        var forward = self.mode === "spread" ? press.x > rect.left + self.pw : dx < 0;
        var i = forward ? self.target : self.target - 1;
        if (forward ? !self.canNext() : !self.canPrev()) { press = null; return; }
        delete self.anims[i];
        self.drag = { i: i, forward: forward, active: true, want: self.leaves[i].angle, from: self.leaves[i].angle };
        st.setPointerCapture(e.pointerId);
        st.classList.add("is-dragging");
      }
      self.drag.want = self._angleAt(e.clientX, press.x);
      self._loop();
    });

    function end(e) {
      if (!press || e.pointerId !== press.id) return;
      var d = self.drag, p = press;
      press = null;
      st.classList.remove("is-dragging");
      if (!d) {
        // chạm/bấm nhẹ lên trang → lật (như menu cũ)
        if (e.type === "pointerup" && performance.now() - p.t < 350) {
          var rect = st.getBoundingClientRect();
          var mid = rect.left + (self.mode === "spread" ? self.pw : self.pw / 2);
          if (e.clientX > mid) self.next(); else self.prev();
        }
        return;
      }
      d.active = false;
      self.drag = null;
      if (performance.now() - p.lastT > 100) p.vx = 0;   // đã dừng tay rồi mới thả → không tính là vuốt nhanh
      var a = self.leaves[d.i].angle, fast = 0.35;   // px/ms
      var commit = d.forward ? (a > 90 || p.vx < -fast) && p.vx < fast
                             : (a < 90 || p.vx > fast) && p.vx > -fast;
      if (e.type === "pointercancel") commit = false;
      if (commit) {
        self.target = d.forward ? d.i + 1 : d.i;
        self._animate(d.i, d.forward ? 180 : 0, self.time * 0.8);
        self._flipped();
        self._changed();
      } else {
        self._animate(d.i, d.forward ? 0 : 180, self.time * 0.6);
      }
    }
    st.addEventListener("pointerup", end);
    st.addEventListener("pointercancel", end);
  };

  // Góc lật ứng với vị trí con trỏ
  P._angleAt = function (x, startX) {
    var rect = this.stage.getBoundingClientRect();
    if (this.mode === "spread") {
      // mép tờ nằm đúng dưới con trỏ: x = gáy + cos(góc) × bề rộng trang
      return Math.acos(clamp((x - (rect.left + this.pw)) / this.pw, -1, 1)) / DEG;
    }
    // từng trang: quãng kéo so với lúc bắt đầu
    var d = this.drag, moved = (startX - x) / (this.pw * 0.85);
    return clamp(d.forward ? moved * 180 : 180 + moved * 180, 0, 180);
  };

  window.HanaFlipbook = HanaFlipbook;
})();
