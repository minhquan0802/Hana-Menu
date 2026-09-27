/* =====================================================================
   HANA BUFFET — FILE DỮ LIỆU
   ---------------------------------------------------------------------
   Đây là file DUY NHẤT cần sửa khi cập nhật giá, menu, chi nhánh.
   Không cần đụng vào HTML/CSS/JS khác.

   Quy tắc khi sửa:
   - Chữ đặt trong dấu nháy: "…"
   - Mỗi mục trong danh sách cách nhau bằng dấu phẩy ,
   - Giá ghi số nguyên, KHÔNG có dấu chấm: 236000 (web tự hiện 236.000₫)
   - Ảnh món: bỏ file vào assets/images/menu/ rồi ghi tên file vào "image".
     Không có ảnh thì để image: "" — web vẫn hiển thị bình thường.
   - Sửa xong, tải lại trang (F5) để xem.

   (!) Số liệu hiện tại là DỮ LIỆU MẪU lấy từ các trang review (04/2025),
       cần kiểm tra lại trước khi đưa lên web.
   ===================================================================== */

window.HANA_DATA = {

  /* ---------- THÔNG TIN CHUNG ---------- */
  brand: {
    name: "Hana BBQ & Hot Pot Buffet",
    shortName: "Hana Buffet",
    headline: "Nướng, nhúng, ăn thoả thích.",        // câu lớn đầu trang
    tagline: "Buffet lẩu nướng gọi món tại bàn, phong cách Nhật – Hàn – Âu: bò Mỹ & Úc, hải sản, lẩu Thái, lẩu Miso, pizza và mì Ý.",
    hotline: "1900555579",          // số dùng để bấm gọi (không dấu cách)
    hotlineDisplay: "1900 555 579", // số hiển thị trên web
    openingHours: "11:00 – 15:00 và 17:00 – 22:00",
    facebook: "https://www.facebook.com/hanabuffet.bbq",
    // Để trống "" nếu chưa có — nút tương ứng sẽ tự ẩn
    zalo: "",
    instagram: "",
    tiktok: ""
  },

  /* ---------- GIỚI THIỆU ---------- */
  about: {
    title: "Về Hana",
    paragraphs: [
      "Hana BBQ & Hot Pot Buffet mang đến trải nghiệm buffet lẩu nướng gọi món tại bàn, kết hợp tinh hoa ẩm thực Nhật Bản, Hàn Quốc cùng các món Âu quen thuộc.",
      "Từ những lát bò Mỹ, bò Úc tươi mềm, hải sản đa dạng đến nồi lẩu Thái chua cay hay lẩu Miso thanh ngọt — tất cả đều được phục vụ không giới hạn, trong không gian ấm cúng, riêng tư cho gia đình và bạn bè."
    ],
    // Các điểm nổi bật (nên giữ 4 mục, mỗi mục ngắn gọn)
    highlights: [
      { title: "Bò Mỹ & Úc", text: "Thịt bò nhập khẩu, tươi mềm mỗi ngày" },
      { title: "Nướng không khói", text: "Bếp nướng hiện đại, không ám mùi" },
      { title: "Lẩu đa vị", text: "Lẩu Thái, lẩu Miso đậm đà" },
      { title: "Món Âu", text: "Pizza, mì Ý, salad, tráng miệng" }
    ]
  },

  /* ---------- BẢNG GIÁ BUFFET ---------- */
  pricing: {
    title: "Bảng giá buffet",
    // Mỗi khung giá: tên, thời gian áp dụng, giá người lớn, giá trẻ em.
    // "match" giúp web tự tô sáng khung giá đang áp dụng lúc khách xem:
    //   days: "weekday" (T2–T6) | "weekend" (T7, CN) — ngày lễ không tự nhận biết được
    //   from/to: giờ bắt đầu/kết thúc (0–24)
    // Không muốn tự tô sáng thì xóa dòng match.
    packages: [
      {
        name: "Buffet trưa",
        schedule: "Thứ 2 – Thứ 6, 11:00 – 15:00",
        adult: 236000,
        child: 136000,
        match: { days: "weekday", from: 11, to: 15 }
      },
      {
        name: "Buffet tối",
        schedule: "Thứ 2 – Thứ 6, 17:00 – 22:00",
        adult: 276000,
        child: 176000,
        match: { days: "weekday", from: 17, to: 22 }
      },
      {
        name: "Cuối tuần & Lễ",
        schedule: "Thứ 7, Chủ nhật và ngày lễ, cả ngày",
        adult: 296000,
        child: 196000,
        match: { days: "weekend", from: 11, to: 22 }
      }
    ],
    // Ghi chú hiển thị dưới bảng giá
    notes: [
      "Giá chưa bao gồm 10% VAT và đồ uống.",
      "Giá trẻ em áp dụng theo chiều cao — vui lòng hỏi nhân viên tại quầy."
    ]
  },

  /* ---------- MENU ----------
     Mỗi danh mục (category) gồm:
       id    : mã ngắn, không dấu, không khoảng trắng (vd "bo-nuong")
       name  : tên hiển thị
       note  : ghi chú nhỏ cho cả danh mục (có thể để "")
       items : danh sách món

     Mỗi món (item) gồm:
       name  : tên món
       desc  : mô tả ngắn (có thể để "")
       image : tên file ảnh trong assets/images/menu/ (có thể để "")
       tags  : nhãn, vd ["Bán chạy"], ["Cay"], ["Mới"] — để [] nếu không có
       price : CHỈ ghi khi món tính tiền riêng (đồ uống, món thêm).
               Món nằm trong buffet thì bỏ trống hoặc xóa dòng price.
  */
  menuIntro: "Gọi món tại bàn, không giới hạn số lần gọi. Đồ uống tính riêng.",

  menu: [
    {
      id: "bo-nuong",
      name: "Bò nướng",
      note: "",
      items: [
        { name: "Ba chỉ bò Mỹ", desc: "Thái mỏng, sốt Hana đặc biệt", image: "", tags: ["Bán chạy"] },
        { name: "Bắp bò Úc", desc: "Mềm, ngọt thịt", image: "", tags: [] },
        { name: "Lõi vai bò Mỹ", desc: "Ướp sốt tiêu đen", image: "", tags: [] },
        { name: "Sườn bò non sốt Galbi", desc: "Phong cách Hàn Quốc", image: "", tags: ["Mới"] }
      ]
    },
    {
      id: "heo-ga",
      name: "Heo & Gà",
      note: "",
      items: [
        { name: "Ba chỉ heo nướng", desc: "", image: "", tags: [] },
        { name: "Gà nướng lá dứa", desc: "Thơm lá dứa, da giòn", image: "", tags: ["Bán chạy"] },
        { name: "Cánh gà sốt cay", desc: "", image: "", tags: ["Cay"] },
        { name: "Xiên nai nướng", desc: "", image: "", tags: [] }
      ]
    },
    {
      id: "hai-san",
      name: "Hải sản",
      note: "",
      items: [
        { name: "Tôm nướng", desc: "", image: "", tags: [] },
        { name: "Mực nướng sa tế", desc: "", image: "", tags: ["Cay"] },
        { name: "Sò điệp nướng mỡ hành", desc: "", image: "", tags: ["Bán chạy"] },
        { name: "Nghêu hấp", desc: "", image: "", tags: [] }
      ]
    },
    {
      id: "lau",
      name: "Lẩu",
      note: "Chọn 1 loại nước lẩu cho mỗi bàn",
      items: [
        { name: "Lẩu Thái chua cay", desc: "", image: "", tags: ["Cay"] },
        { name: "Lẩu Miso Nhật", desc: "Thanh ngọt, đậm vị", image: "", tags: [] },
        { name: "Rau & nấm nhúng lẩu", desc: "", image: "", tags: [] }
      ]
    },
    {
      id: "mon-au",
      name: "Món Âu",
      note: "",
      items: [
        { name: "Pizza hải sản", desc: "", image: "", tags: [] },
        { name: "Mì Ý sốt bò bằm", desc: "", image: "", tags: [] },
        { name: "Khoai tây chiên", desc: "", image: "", tags: [] }
      ]
    },
    {
      id: "khai-vi",
      name: "Khai vị & Salad",
      note: "",
      items: [
        { name: "Salad rau củ sốt mayonnaise nhà làm", desc: "", image: "", tags: [] },
        { name: "Kim chi", desc: "", image: "", tags: [] }
      ]
    },
    {
      id: "trang-mieng",
      name: "Tráng miệng",
      note: "",
      items: [
        { name: "Kem", desc: "Nhiều vị", image: "", tags: [] },
        { name: "Sữa chua", desc: "", image: "", tags: [] },
        { name: "Thạch trái cây", desc: "", image: "", tags: [] }
      ]
    },
    {
      id: "do-uong",
      name: "Đồ uống",
      note: "Đồ uống tính riêng, không nằm trong giá buffet",
      items: [
        { name: "Nước ngọt các loại", desc: "", image: "", tags: [], price: 25000 },
        { name: "Trà đào", desc: "", image: "", tags: [], price: 35000 },
        { name: "Bia Tiger", desc: "Lon 330ml", image: "", tags: [], price: 30000 }
      ]
    }
  ],

  /* ---------- TÌM CHI NHÁNH GẦN NHẤT ----------
     true  = hiện nút "Tìm chi nhánh gần tôi" (chỉ hỏi vị trí khi khách bấm)
     false = ẩn tính năng này
     Lưu ý: trình duyệt chỉ cho lấy vị trí khi web chạy trên https:// (hoặc mở file trực tiếp trên máy). */
  nearestBranch: true,

  /* ---------- CHI NHÁNH ----------
     Mỗi chi nhánh gồm:
       name    : tên chi nhánh
       city    : thành phố (dùng cho bộ lọc)
       address : địa chỉ đầy đủ
       phone   : số riêng của chi nhánh (vd "0909 474 758") — để "" sẽ dùng hotline chung
       hours   : giờ mở cửa riêng — để "" sẽ dùng giờ chung ở trên
       mapUrl  : link Google Maps — để "" web sẽ tự tạo link tìm theo địa chỉ
       image   : ảnh chi nhánh trong assets/images/ (có thể để "")
       lat, lng: tọa độ, dùng để tìm chi nhánh gần nhất.
                 Lấy tọa độ chính xác: mở Google Maps → bấm chuột phải đúng
                 vị trí nhà hàng → bấm dòng số đầu tiên (vd 10.78692, 106.69716)
                 để sao chép → dán số trước dấu phẩy vào lat, số sau vào lng.
                 Chi nhánh không có tọa độ vẫn hiển thị, chỉ không tính khoảng cách.
       active  : true = đang hoạt động; false = ẩn khỏi web

     Trạng thái & tọa độ đối chiếu Google Maps ngày 27/09/2026.
     Địa chỉ ghi theo phường mới (sau sáp nhập 2025), kèm quận cũ cho dễ nhận biết.
  */
  branches: [
    // ===== ĐANG HOẠT ĐỘNG =====
    { name: "Tú Xương", city: "TP. Hồ Chí Minh", address: "51 Tú Xương, P. Xuân Hòa (Quận 3 cũ)", phone: "", hours: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=Hana%20Buffet%20T%C3%BA%20X%C6%B0%C6%A1ng%2C%2051%20T%C3%BA%20X%C6%B0%C6%A1ng", image: "", lat: 10.7781127, lng: 106.6839408, active: true },
    { name: "Ba Tháng Hai", city: "TP. Hồ Chí Minh", address: "392 – 394 đường 3 Tháng 2, P. Hòa Hưng (Quận 10 cũ)", phone: "0909 474 758", hours: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=Hana%20Buffet%20Ba%20Th%C3%A1ng%20Hai%2C%20392%203%20Th%C3%A1ng%202", image: "", lat: 10.7692586, lng: 106.6695576, active: true },
    { name: "Tân Phú", city: "TP. Hồ Chí Minh", address: "204 – 206 Tân Sơn Nhì, P. Tân Sơn Nhì (Quận Tân Phú cũ)", phone: "", hours: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=Hana%20Buffet%20T%C3%A2n%20Ph%C3%BA%2C%20204%20T%C3%A2n%20S%C6%A1n%20Nh%C3%AC", image: "", lat: 10.7988466, lng: 106.6318016, active: true },
    { name: "Vũng Tàu", city: "Vũng Tàu", address: "205 Lê Hồng Phong, P. Tam Thắng (TP. Vũng Tàu cũ)", phone: "", hours: "", mapUrl: "https://www.google.com/maps/search/?api=1&query=Hana%20BBQ%2C%20205%20L%C3%AA%20H%E1%BB%93ng%20Phong%20V%C5%A9ng%20T%C3%A0u", image: "", lat: 10.3523887, lng: 107.0884932, active: true },

    // ===== ĐÃ ĐÓNG CỬA VĨNH VIỄN (theo Google Maps) — giữ lại để tham khảo, không hiện trên web =====
    { name: "Mạc Đĩnh Chi", city: "TP. Hồ Chí Minh", address: "45A Mạc Đĩnh Chi, P. Đa Kao, Quận 1", phone: "", hours: "", mapUrl: "", image: "", lat: 10.7860422, lng: 106.6978978, active: false },
    { name: "Phạm Viết Chánh", city: "TP. Hồ Chí Minh", address: "25 – 25A Phạm Viết Chánh, P. Nguyễn Cư Trinh, Quận 1", phone: "", hours: "", mapUrl: "", image: "", lat: 10.7673776, lng: 106.6849621, active: false },
    { name: "Quận 2", city: "TP. Hồ Chí Minh", address: "01 Nguyễn Quý Đức, P. An Phú, Quận 2", phone: "", hours: "", mapUrl: "", image: "", lat: 10.7995997, lng: 106.7385645, active: false },
    { name: "Điện Biên Phủ", city: "TP. Hồ Chí Minh", address: "243 Điện Biên Phủ, P. 6, Quận 3", phone: "", hours: "", mapUrl: "", image: "", lat: 10.7834847, lng: 106.6910313, active: false },
    { name: "Phan Văn Trị", city: "TP. Hồ Chí Minh", address: "699A Phan Văn Trị, Quận Gò Vấp", phone: "", hours: "", mapUrl: "", image: "", lat: 10.8276067, lng: 106.6871357, active: false },
    { name: "Nguyễn Văn Linh", city: "TP. Hồ Chí Minh", address: "1034 Nguyễn Văn Linh, P. Tân Phong, Quận 7", phone: "", hours: "", mapUrl: "", image: "", lat: 10.729266, lng: 106.7053339, active: false }
  ]
};
