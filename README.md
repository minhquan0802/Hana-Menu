# Hana BBQ & Hot Pot Buffet — Website

Web tĩnh (HTML/CSS/JS thuần, không cần cài đặt hay build). Mở `index.html` bằng trình duyệt là chạy.

## Cấu trúc

```
index.html            Khung trang (header, giới thiệu, bảng giá, menu, chi nhánh, footer)
data/data.js          ★ DỮ LIỆU — giá, menu, chi nhánh, hotline, giới thiệu
css/style.css         Giao diện (màu cam Hana, font, responsive)
js/main.js            Đọc data.js và dựng nội dung
assets/images/        logo.png, ảnh chi nhánh
assets/images/menu/   Ảnh món ăn
```

## Cập nhật nội dung

Chỉ sửa **`data/data.js`** — mỗi phần đều có chú thích tiếng Việt ngay trong file.

- **Đổi giá:** sửa `adult` / `child` trong `pricing.packages` (ghi số, không dấu chấm: `236000`).
- **Thêm món:** chép một dòng `{ name: ..., desc: ..., image: "", tags: [] }` trong danh mục, sửa lại.
- **Thêm ảnh món:** bỏ ảnh vào `assets/images/menu/` (vd `ba-chi-bo.jpg`), ghi `image: "ba-chi-bo.jpg"`.
  Nên dùng ảnh vuông, ~600×600px, dưới 200KB.
- **Thêm danh mục:** chép cả khối `{ id: ..., name: ..., items: [...] }`; `id` viết không dấu, không khoảng trắng.
- **Ẩn chi nhánh:** đổi `active: true` thành `active: false`.
- **Món tính tiền riêng** (đồ uống, món thêm): thêm `price: 30000`.

Sửa xong lưu file và tải lại trang (F5). Nếu trang hiện dòng báo lỗi đỏ, thường là do thiếu dấu phẩy `,` hoặc dấu nháy `"` ở chỗ vừa sửa.

## Đưa lên mạng

Upload nguyên thư mục lên bất kỳ hosting tĩnh nào: GitHub Pages, Netlify, Cloudflare Pages, hoặc hosting thường của tên miền `hana.vn`.
