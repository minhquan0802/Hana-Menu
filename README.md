# Hana BBQ & Hot Pot Buffet — Website

Web tĩnh (HTML/CSS/JS thuần, không cần cài đặt hay build). Mở `index.html` bằng trình duyệt là chạy.

## Cấu trúc

```
index.html            Trang chủ (giới thiệu, bảng giá, danh mục menu, chi nhánh)
menu.html             Cuốn menu lật trang
data/data.js          ★ DỮ LIỆU — giá, menu, chi nhánh, hotline, giới thiệu
css/style.css         Giao diện chung (màu, font, header/footer, trang chủ)
css/menu.css          Giao diện cuốn menu
js/common.js          Hàm dùng chung
js/main.js            Dựng nội dung trang chủ
js/menu-book.js       Dựng các trang của cuốn menu + hiệu ứng lật
js/vendor/            Thư viện lật trang StPageFlip 2.0.7 (MIT) — không cần sửa
assets/images/        logo.png, ảnh chi nhánh
assets/images/menu/   Ảnh món ăn
```

## Cập nhật nội dung

Chỉ sửa **`data/data.js`** — mỗi phần đều có chú thích tiếng Việt ngay trong file.

- **Câu lớn đầu trang / mô tả:** sửa `brand.headline` và `brand.tagline`; dòng giới thiệu menu là `menuIntro`.
- **Đổi giá:** sửa `adult` / `child` trong `pricing.packages` (ghi số, không dấu chấm: `236000`).
- **Thêm món:** chép một dòng `{ name: ..., desc: ..., image: "", tags: [] }` trong danh mục, sửa lại.
- **Thêm ảnh món:** bỏ ảnh vào `assets/images/menu/` (vd `ba-chi-bo.jpg`), ghi `image: "ba-chi-bo.jpg"`.
  Nên dùng ảnh vuông, ~600×600px, dưới 200KB.
- **Tên tiếng Anh:** `nameEn` cho món và danh mục (hiện nhỏ dưới tên tiếng Việt trong cuốn menu).
- **Ảnh bìa danh mục** (trang trái của cuốn menu): bỏ ảnh dọc 3:4 vào `assets/images/menu/`, ghi vào `cover`.
  Chưa có ảnh thì trang bìa dùng hình vỉ nướng.
- **Thêm danh mục:** chép cả khối `{ id: ..., name: ..., items: [...] }`; `id` viết không dấu, không khoảng trắng.
- **Ẩn chi nhánh:** đổi `active: true` thành `active: false`.
- **Tọa độ chi nhánh** (dùng cho nút "Tìm chi nhánh gần tôi"): trên Google Maps bấm chuột phải đúng vị trí
  nhà hàng → bấm dòng số đầu tiên để sao chép → dán vào `lat`, `lng`.
  Tắt hẳn tính năng: đặt `nearestBranch: false`. Tính năng chỉ chạy khi web ở `https://`.
- **Món tính tiền riêng** (đồ uống, món thêm): thêm `price: 30000`.

Sửa xong lưu file và tải lại trang (F5). Nếu trang hiện dòng báo lỗi đỏ, thường là do thiếu dấu phẩy `,` hoặc dấu nháy `"` ở chỗ vừa sửa.

## Cuốn menu (menu.html)

- Thứ tự: bìa → bảng giá | mục lục → mỗi danh mục một cặp trang (bìa danh mục | các món) → bìa sau.
- Tự chia trang: món được xếp thử vào trang, hết chỗ thì sang trang mới — không cần tự đếm món.
- Link thẳng tới danh mục: `menu.html#lau`, `menu.html#do-uong`, `menu.html#bang-gia`… (dùng `id` của danh mục) — tiện làm mã QR đặt trên bàn.
- Lật bằng kéo góc trang, vuốt, nút ‹ ›, phím ← →; trên điện thoại hiện từng trang.

## Thiết kế

Chủ đề "quán nướng lúc tối": đầu trang là vỉ nướng than hồng (SVG vẽ trong `index.html`), phần còn lại trình bày như tờ menu in.
Màu và font khai báo ở đầu `css/style.css` (biến `--fire`, `--char`, `--butter`…). Font: Paytone One (tiêu đề, giá) và Lexend (nội dung).

## Đưa lên mạng

Upload nguyên thư mục lên bất kỳ hosting tĩnh nào: GitHub Pages, Netlify, Cloudflare Pages, hoặc hosting thường của tên miền `hana.vn`.
