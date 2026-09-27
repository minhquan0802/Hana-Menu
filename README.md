# Hana BBQ & Hot Pot Buffet — Website

Web tĩnh (HTML/CSS/JS thuần), host bằng GitHub Pages. Mở `index.html` bằng trình duyệt là chạy.
Node.js **chỉ cần trên máy** khi cập nhật cuốn menu từ PDF — GitHub Pages không chạy Node và cũng không cần.

## Cấu trúc

```
index.html              Trang chủ (giới thiệu, bảng giá, thực đơn, chi nhánh)
menu.html               Cuốn menu lật trang (trang = ảnh xuất từ PDF menu)
data/data.js            ★ DỮ LIỆU — giá, chi nhánh, hotline, giới thiệu, mục của cuốn menu
data/menu-pages.js      Tự tạo bởi `npm run build:menu` — không sửa tay
css/style.css           Giao diện chung + trang chủ
css/menu.css            Giao diện trang cuốn menu
js/common.js            Hàm dùng chung
js/main.js              Dựng nội dung trang chủ
js/menu-book.js         Cuốn menu: mục lục, tiếng lật, phím, lăn chuột
js/flipbook.js          Bộ lật trang (CSS 3D) — lật liền nhiều tờ, kéo trang theo con trỏ
assets/sounds/          Tiếng lật trang (lấy từ menu cũ)
assets/menu-pages/      Ảnh các trang menu (tự tạo bởi `npm run build:menu`)
assets/images/          logo, ảnh trang chủ (site/), ảnh món minh họa (menu/)
tools/build-menu.mjs    Script chuyển PDF menu → trang cho cuốn menu
PDF/                    File thiết kế/PDF gốc — chỉ để trên máy (đã .gitignore)
```

## Cập nhật cuốn menu (menu.html)

Cuốn menu dùng đúng các trang của file PDF thiết kế trên Canva, nên giống y bản in.

1. Sửa menu trên Canva → **Tải xuống PDF** → lưu vào thư mục `PDF/`
   (mặc định: `PDF/HANA-menu-2026.pdf.pdf`).
2. Lần đầu trên máy: `npm install`
3. Chạy:
   ```
   npm run build:menu
   ```
   hoặc với file khác: `npm run build:menu -- "PDF/ten file moi.pdf"`
4. Nếu thứ tự trang thay đổi: sửa số `page` trong `data/data.js` → `menuBook.sections`
   (số trang đếm như trong PDF, trang bìa = 1).
5. Mở `menu.html` kiểm tra → commit → push. GitHub Pages tự cập nhật sau ít phút.

Khác:
- Link thẳng tới mục: `menu.html#khai-vi`, `menu.html#bang-gia`… (dùng `id` trong `menuBook.sections`),
  hoặc tới trang cụ thể: `menu.html#trang-12` — tiện làm mã QR đặt trên bàn.
- Bố cục như trang menu cũ (hana.hethongpos.com): cuốn menu chiếm trọn chiều cao màn hình, mọi điều hướng
  (link web, mục lục, số trang, bản chữ) ẩn trong bảng trượt — mở bằng nút tròn nhỏ ở góc trên bên trái.
- Lật bằng kéo trang (mép trang bám theo con trỏ), bấm vào trang, vuốt, mũi tên hai bên, lăn chuột, phím ← →.
  Bấm liên tục thì nhiều tờ lật liền cùng lúc. Có tiếng lật trang (bật/tắt trong bảng điều hướng).
- PDF có 42 trang; web bỏ trang 20 (Gan Bò) và 25 (Bào Ngư Băng Trấn) cho giống menu cũ
  — cấu hình ở `package.json` (`--bo 20,25`).
- Ảnh trang chỉ tải quanh trang đang xem, nên mở menu nhanh dù cả cuốn ~7MB.

## Cập nhật trang chủ

Sửa **`data/data.js`** — mỗi phần đều có chú thích tiếng Việt ngay trong file.

- **Đổi giá:** sửa `adult` / `child` trong `pricing.packages` (ghi số, không dấu chấm: `348000`).
  Nhớ giữ khớp với trang Bảng giá trong PDF menu.
- **Thực đơn trên trang chủ:** danh sách `menu` (danh mục + món) dùng cho các ô "Thực đơn" và số liệu.
- **Ảnh trên trang chủ:** đều là ảnh của Hana, cắt từ ảnh gốc nhúng trong PDF menu.
  Ô "Thực đơn" lấy từ `menuBook.sections` (mục có `image`, ảnh ở `assets/images/menu/`).
- **Logo:** `assets/images/logo-hana.png` (từ `PDF/THIETKE/logo-hana.png`); `favicon.png` là bản vuông.
- **Ẩn chi nhánh:** đổi `active: true` thành `active: false`.
- **Tọa độ chi nhánh** (nút "Tìm chi nhánh gần tôi"): trên Google Maps bấm chuột phải đúng vị trí
  nhà hàng → bấm dòng số đầu tiên để sao chép → dán vào `lat`, `lng`.
  Tắt tính năng: `nearestBranch: false`. Tính năng chỉ chạy khi web ở `https://`.

Sửa xong lưu file và tải lại trang (F5). Nếu trang hiện dòng báo lỗi đỏ, thường là do thiếu dấu phẩy `,` hoặc dấu nháy `"` ở chỗ vừa sửa.

## Thiết kế

- Trang chủ: phong cách tham khảo kingbbq.vn — header trắng, chữ in hoa Roboto, chữ viết tay Kristi,
  xám `#D3D3D3` / nâu vàng `#C7AC92`. Biến màu/font ở đầu `css/style.css`.
- Cuốn menu: theo trang menu cũ của Hana — nền gỗ, xanh navy `#012753`, cam `#F08020`,
  font Montserrat / Open Sans (đúng font trong PDF menu).
- Git tag `v1.0-giao-dien-1`: giao diện cũ "quán nướng lúc tối", để quay lại khi cần.
