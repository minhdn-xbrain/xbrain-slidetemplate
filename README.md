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

Mở **AI / JSON → AI Console** để nạp candidate JSON, kiểm tra, render, xem diagnostic, áp dụng JSON Patch và xuất HTML tĩnh sau QA. Browser agent có thể dùng giao diện này hoặc `window.XB.agent`; candidate chỉ vào Studio sau thao tác commit được kiểm tra. Xem [API Agent](docs/agent-console-api.md) và [browser runbook](docs/agent-console-browser-runbook.md). Agent ưu tiên linh hoạt: nội dung tác giả có thể chạy HTML, CSS, JavaScript và tải tài nguyên ngoài với quyền của trang. XBrain đo hình học trong browser; việc xem ảnh và đánh giá thị giác do agent bên ngoài thực hiện.

Bắt đầu với deck tối thiểu sau trong `deck.json`, hoặc tham khảo [deck QBR](tests/fixtures/qbr-deck.json) và [JSON Schema](contracts/xbrain-deck-v1.schema.json):

```json
{
  "version": "1.0",
  "slides": [{ "type": "cover", "content": { "titleLine1": "Bài trình bày" } }]
}
```

Chạy với **Node.js ≥ 18**:

```bash
node tools/xbrain.mjs repair deck.json -o deck.repaired.json
node tools/xbrain.mjs qa deck.repaired.json --json
node tools/xbrain.mjs build deck.repaired.json -o deck.html
```

Sửa các lỗi QA trước khi build. Có thể gộp quy trình bằng `node tools/xbrain.mjs pipeline deck.json -o deck.html`. Pipeline chỉ ghi HTML khi đạt QA; bản sửa, diagnostic và manifest SHA-256 nằm trong `.repaired.json`, `.qa.json`.

Để agent đo hình học thực tế và tự reflow tối đa 3 lượt, cấu hình `CHROME_PATH` rồi chạy:

```bash
node tools/xbrain.mjs pipeline deck.json --require-browser --offline \
  --fail-on text.truncated,layout.legibility,layout.text-collision -o deck.html
```

Xem [audit và kết quả kiểm thử compiler](docs/audits/2026-11-08-agent-compiler/README.md) cho các cải tiến, deck mẫu và giới hạn đã biết.

Compiler, CLI, Agent API và Studio mặc định dùng chế độ `trusted`, cho phép layout/helper JavaScript. Bộ lọc chống injection và chế độ `--untrusted` cũ đã được gỡ.

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
