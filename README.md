# XBrain Presentation System

Bộ công cụ tạo, chỉnh sửa và trình chiếu slide theo thương hiệu XBrain, gói trong **một file HTML**. Theo mô hình **Presentation as Code**, template định nghĩa bố cục; JSON cung cấp nội dung, cấu hình và dữ liệu.

Release **1.0.0** · JSON schema **1.0**.

## Bắt đầu nhanh

1. Mở [index.html](index.html) bằng Chrome hoặc Edge, không cần cài đặt hay server.
2. Bấm vào chữ để sửa, kéo-thả slide để sắp xếp; dùng **Tổng quan** để xem toàn bộ slide và **Thêm slide → Slide từ mẫu** để chọn mẫu.
3. Chọn **Trình chiếu** để trình bày hoặc **In PDF** để xuất bản in.
4. Chọn **Xuất → HTML có thể chỉnh sửa** hoặc **Xuất → Dữ liệu JSON** để lưu ra tệp. Mở lại JSON bằng **Tệp → Mở bài trình chiếu JSON**.

File mở trực tiếp bằng `file://`. Font, ECharts và Mermaid dùng CDN khi có mạng; khi offline, ứng dụng dùng font và nội dung dự phòng.

## Tạo slide bằng JSON

Mỗi deck cần `"version": "1.0"` và mảng `slides`. Mỗi slide chọn `type` và cung cấp dữ liệu theo hợp đồng của layout.

Trong Studio, mở **AI / JSON → Schema / Contract** để đọc **Schema JSON** hoặc **Agent Contract**, sao chép và tải JSON. Nội dung hiển thị trực tiếp để extension AI có thể đọc qua giao diện; tính năng dùng được offline và lấy dữ liệu từ compiler hiện tại.

Bắt đầu từ [deck mẫu](contracts/example-deck-v1.json), tra cấu trúc trong [JSON Schema](contracts/xbrain-deck-v1.schema.json), rồi chạy với **Node.js ≥ 18**:

```bash
node tools/xbrain.mjs repair deck.json -o deck.repaired.json
node tools/xbrain.mjs qa deck.repaired.json --json
node tools/xbrain.mjs build deck.repaired.json -o deck.html
```

Sửa các lỗi QA trước khi build. Có thể gộp quy trình bằng `node tools/xbrain.mjs pipeline deck.json -o deck.html`.

Compiler mặc định dùng `strict` và `untrusted`. Chỉ thêm `--trusted` để chạy layout/helper viết bằng JavaScript từ nguồn tin cậy. Trong Studio, mã trong JSON chạy với quyền của trang, nên chỉ mở JSON từ nguồn tin cậy.

Xem [hướng dẫn compiler và API](docs/agent-compiler.md) để tra lệnh, chẩn đoán và hợp đồng chart/diagram.

## Phát triển và kiểm thử

Mã ứng dụng, CSS, SVG và dữ liệu mẫu nằm trong file HTML chính; CLI chạy cùng runtime đó. Quy ước sửa mã nằm trong [AGENTS.md](AGENTS.md).

Cần Node.js ≥ 18 và Python có `jsonschema ≥ 4.10`:

```bash
pip install "jsonschema>=4.10"
python -m unittest discover -s tests -p "test_*.py"
```

Schema được sinh từ registry trong HTML. Sau khi sửa registry, chạy `node tools/xbrain.mjs schema --write` rồi kiểm thử lại. Các deck và ca biên nằm trong [tests/fixtures](tests/fixtures/).

## Thương hiệu và chia sẻ

Tuân theo [XBrain Brand Guidelines](docs/XBrain_Brand%20Guidelines.pdf). Số liệu mẫu chỉ để minh họa; thay bằng dữ liệu đã kiểm chứng trước khi sử dụng.

Repo chứa ảnh nội bộ, thông tin liên hệ và bộ nhận diện XBrain; chỉ chia sẻ trong công ty.
