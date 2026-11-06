# XBrain Agent-Native Compiler

Trình biên dịch giúp agent tự tạo, tự kiểm chứng và tự sửa presentation. Mã nằm ngay trong `xbrain-presentation-system-v1.0.0.html` (module `XBrainCompiler`, không phụ thuộc DOM). `tools/xbrain.mjs` chạy cùng mã đó trong Node, nên trình duyệt và CLI cho cùng một kết quả.

Release `1.0.0` và JSON schema `1.0` giữ nguyên. Mọi thay đổi đều tương thích ngược: deck v1 cũ vẫn mở được trong editor như trước.

## Vòng lặp cho agent

```bash
node tools/xbrain.mjs contract > contract.json        # 1. đọc hợp đồng: schema, layout, variant, mã chẩn đoán
node tools/xbrain.mjs repair deck.json -o deck.json   # 2. sửa tự động những gì chắc chắn đúng
node tools/xbrain.mjs qa deck.json --json             # 3. validate → render → kiểm tra bố cục/ngữ nghĩa
node tools/xbrain.mjs qa deck.json --browser          # 3b. đo pixel thật bằng Chrome/Edge headless (tùy chọn)
node tools/xbrain.mjs build deck.json -o deck.html    # 4. HTML tĩnh, không script, tái lập được từng byte
```

Hoặc chạy một lệnh: `node tools/xbrain.mjs pipeline deck.json -o deck.html`. Lệnh này ghi ra `deck.html`, `deck.repaired.json` và `deck.qa.json`.

Mã thoát: `0` là không còn lỗi, `1` là còn lỗi (đọc `diagnostics` rồi sửa JSON), `2` là sai version hoặc lỗi đầu vào. Với version sai, compiler không đổi gì trong tài liệu.

Agent nên lặp cho tới khi `summary.errors == 0`. Warning là những chỗ nên xem lại, ví dụ chữ bị rút gọn hoặc chart quá nhỏ.

## API (trình duyệt và Node)

| Hàm | Kết quả |
| --- | --- |
| `XBrainCompiler.contract()` | schema dẫn xuất, layout kèm `contentSchema` và `sample`, variant kèm hợp đồng dữ liệu, bảng mã chẩn đoán, kích thước scene |
| `validate(doc, opts)` | lỗi schema (JSON pointer, gợi ý tên gần nhất), dataset/asset không tồn tại, mảng vượt giới hạn layout, ngân sách ký tự |
| `compile(doc, opts)` | HTML từng slide, hash từng slide, hash build, chẩn đoán |
| `qa(doc, opts)` | `compile` cộng điểm từng slide; `measure: true` đo pixel khi có DOM |
| `repair(doc, opts)` | tài liệu đã sửa, danh sách thay đổi, chẩn đoán còn lại |
| `staticPage(compiled, {css, sprite})` | trang HTML tĩnh |

Trong editor, các hàm này có sẵn qua `XB.compiler`, `XB.qa()`, `XB.repair()`. Nút "Kiểm tra QA" và bước in PDF dùng chung compiler này.

`opts`:

- `strict` (mặc định `true`): không dùng dữ liệu mẫu. Thiếu dữ liệu là lỗi `data.missing` và vẽ ô "No data", không vẽ số giả. Editor chạy với `strict:false` để giữ hành vi cũ, nhưng vẫn báo `data.implicit-sample`.
- `trust` (mặc định `"untrusted"`): không chạy `layouts`/`helpers`/`render`/`template`; HTML/SVG/CSS/URL được làm sạch. Chỉ dùng `"trusted"` cho tài liệu do bạn kiểm soát.

## Định dạng chẩn đoán

```json
{ "code": "data.field-missing", "severity": "error", "path": "/slides/3/components/0",
  "message": "gantt: 2 task(s) without numeric/ISO start and end are listed without bars", "field": "start/end" }
```

`path` là JSON pointer vào tài liệu gốc. Danh sách mã đầy đủ có trong `contract().diagnostics`. Các nhóm chính:

- `schema.*`: sai cấu trúc; có `suggestion` khi đoán được tên đúng.
- `data.*`: thiếu dữ liệu, không phải số, âm, lệch tổng, bị cắt bớt.
- `graph.*`: edge treo, chu trình, thiếu quan hệ.
- `text.*` / `layout.*`: chữ bị rút gọn hoặc cắt, tràn scene, chồng lấn, chart quá nhỏ, tràn đo bằng pixel.
- `security.*`: code bị chặn, nội dung bị làm sạch.
- `semantic.mismatch`: tự kiểm tra hình học của mark so với dữ liệu.

## Dữ liệu cho chart và diagram

Mỗi variant khai báo đúng những trường nó đọc, xem `contract().variants`. Cùng một bảng alias được dùng cho cả renderer lẫn validator:

- Chart đọc hàng `{label, value}`. Một số variant dùng thêm trường: `target` (combo, bullet, gauge, progress-ring), `start`/`end` (range-bar), `before`/`after` (slope, dumbbell), `x`/`y`/`size` (scatter, bubble).
- Hàng có từ 2 trường số trở lên trở thành nhiều series (grouped, stacked, stacked-100, marimekko, line, radar, heatmap).
- Waterfall: hàng đầu là giá trị khởi đầu, hàng có `total: true` là tổng.
- Diagram đọc `nodes` (chuỗi hoặc `{id, label, desc, ...}`) và `edges` (`{from, to, label, value}`; `from`/`to` là id hoặc label).
  - Quan hệ chỉ được vẽ khi có trong dữ liệu: `edges` hoặc `node.parent`.
  - Thứ tự mảng chỉ có nghĩa với flow, cycle và timeline.
  - Các trường riêng: `node.status` (kanban), `node.lane` (swimlane), `start`/`end` (số hoặc `YYYY-MM[-DD]`, gantt), `x`/`y` (BCG, priority, risk-matrix, stakeholder), `node.group` (SWOT, PESTEL, bowtie, pros-cons), `node.raci` (RACI).
- Không có trường bắt buộc thì không có mark, kèm chẩn đoán. Renderer không bao giờ tự nghĩ ra giá trị hay quan hệ.
- Mark chính có `data-mark`/`data-v`. QA dùng chúng để kiểm tra chiều cao cột, diện tích treemap và độ rộng luồng sankey có tỉ lệ đúng với dữ liệu.

## Bố cục theo ràng buộc (Composer)

Scene của Composer rộng 1728 × 642 px, chia lưới 12 cột:

- Mỗi component có chiều cao mong muốn: `height` (cố định) hoặc `minHeight` (sàn), tự nới ra để vừa chữ theo phép đo ký tự xác định. Mỗi component cũng có chiều cao tối thiểu theo loại.
- Hàng co theo tỉ lệ cho vừa scene. Phần dư được chia cho chart/diagram không đặt `height`.
- Nếu đã co tới mức tối thiểu mà vẫn không vừa, compiler báo `layout.overflow`. `repair` khi đó tách slide thành nhiều phần `(1/2)`, `(2/2)`.
- Chart/diagram nhận viewBox theo đúng tỉ lệ khung, nên không còn bị thu nhỏ giữa khoảng trắng. Khung quá nhỏ cho chữ sẽ bị báo `layout.legibility`.
- Nhãn SVG được co cỡ chữ, rồi xuống dòng, và chỉ rút gọn khi không còn cách nào khác. Khi rút gọn, compiler báo `text.truncated` và giữ toàn văn trong `<title>`.

## An toàn và tái lập

- CLI chạy runtime trong `node:vm` với global thuộc realm mới. Giữa hai bên chỉ truyền chuỗi, mỗi lời gọi có timeout.
- Với tài liệu untrusted, context tắt `eval`/`new Function`.
- Code trusted vẫn chạy trong sandbox: `this.constructor.constructor('return process')` không với tới được `process`. Có test kiểm chứng điều này.
- Bộ làm sạch theo allowlist: bỏ `script`, `iframe`, `foreignObject`, `animate`, thuộc tính `on*`, URL `javascript:`/`data:` (trừ ảnh raster), `@import` và `url()` ngoài trong CSS.
- Kết quả xác định:
  - Định dạng số không phụ thuộc locale.
  - Sắp xếp theo code point.
  - Không có thời gian hay số ngẫu nhiên trong output.
  - `hash` của build bằng nhau khi đầu vào và tùy chọn giống nhau. Có test kiểm chứng.

## Đồng bộ một nguồn sự thật

`contracts/xbrain-deck-v1.schema.json` được sinh ra, không viết tay:

- Phần cấu trúc nằm trong HTML (`XB_SCHEMA_BASE`).
- Enum layout, component, variant và phần ánh xạ `content-*` lấy từ registry đang chạy (`LAYOUT_CATALOG`, `COMPONENT_RENDERERS`, `CHART_VARIANTS`, `DIAGRAM_VARIANTS`).

Sau khi sửa registry, chạy `node tools/xbrain.mjs schema --write`. Test sẽ fail nếu file schema lệch với runtime.

## Giới hạn còn lại

- Phép đo chữ trong Node là ước lượng theo bảng độ rộng ký tự. Muốn chính xác tới pixel thì dùng `qa --browser` (cần Chrome/Edge) hoặc `XB.qa()` trong trình duyệt.
- Layout template (nhóm A–D) vẫn dùng CSS/HTML cố định. Compiler chỉ phát hiện tràn (ngân sách ký tự, giới hạn mảng, đo pixel), chưa tự co layout đó.
- Mermaid và ECharts là thư viện CDN tùy chọn. Bản biên dịch offline hiện mã nguồn Mermaid hoặc chart dự phòng, kèm chẩn đoán `render.enhanced-only`.
- Bộ làm sạch dựa trên tokenizer theo allowlist, không phải trình phân tích HTML đầy đủ. Tài liệu cần an toàn tuyệt đối nên không chứa HTML/SVG thô.
- `repair` chỉ sửa những gì chắc chắn đúng: tên gần đúng, ép kiểu số, kẹp giá trị, dời vị trí, tách slide. Thiếu dữ liệu, edge treo hay chu trình thì agent phải tự sửa nội dung.
