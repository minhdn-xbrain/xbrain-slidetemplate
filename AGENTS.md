# XBrain Presentation System

## Ràng buộc

- Giữ mã ứng dụng, CSS, SVG và dữ liệu mẫu trong một file HTML.
- File phải mở trực tiếp bằng `file://`; CDN chỉ là phần nâng cao tùy chọn.
- Giữ release `1.0.0` và JSON schema `1.0` trừ khi yêu cầu thay đổi version.
- Duy trì khả năng đọc JSON schema `3.0` và bản nháp cũ.
- Các selector `v3-*` còn được giữ để tương thích `customCss`; kiểm tra tác động trước khi đổi tên.

## Thiết kế và sửa mã

- Áp dụng SOLID bằng module có trách nhiệm rõ và interface nhỏ.
- Mở rộng layout, diagram và component qua registry hiện có.
- Ghi nhận chỉnh sửa qua `DeckStore`; render không được thay đổi lịch sử.
- Truyền dependency trình duyệt vào module xử lý dữ liệu và lưu trữ.
- Dùng event delegation cho thao tác UI; giữ implementation trong scope riêng.
- Chỉ xóa mã sau khi kiểm tra tham chiếu trong HTML, template, event và JSON.
- Khi sửa nhận diện thương hiệu, đọc `docs/XBrain_Brand Guidelines.pdf`.

## Kiểm chứng

- Kiểm tra luồng bị ảnh hưởng bằng trình duyệt và đối chiếu với baseline.
- Khi sửa state/editor: kiểm tra undo/redo và dữ liệu nhập không hợp lệ.
- Khi sửa import/export: kiểm tra JSON cũ và mở lại HTML xuất bằng `file://`.
- Khi sửa render: kiểm tra các loại liên quan, Gallery, bản in và fallback offline.
- Báo rõ kiểm thử đã chạy, kết quả và phần chưa kiểm chứng.
