# XBrain Presentation System

Bộ slide và studio trình chiếu theo nhận diện thương hiệu XBrain (Brand Guidelines 12/2025), gói gọn trong **một tệp HTML**. Bố cục do template trong HTML định nghĩa; nội dung, dữ liệu và cả layout mới đều có thể viết bằng **JSON** ("Template as Code").

- Mở trực tiếp bằng `file://`, không cần cài đặt hay server.
- 107 slide mẫu, 48 layout, 104 biến thể biểu đồ/diagram cho JSON Composer.
- Sửa chữ ngay trên slide, kéo-thả sắp xếp slide như PowerPoint/Canva, trình chiếu, in PDF, xuất HTML/JSON.
- Trình biên dịch cho agent (`tools/xbrain.mjs`): kiểm tra, tự sửa, QA và build deck JSON thành HTML tĩnh, chạy được cả trong trình duyệt lẫn Node.

## Bắt đầu nhanh

1. Mở `xbrain-presentation-system-v1.0.0.html` bằng Chrome hoặc Edge.
2. Bấm vào chữ trên slide để sửa (chế độ **Inline Edit: ON**). Kéo-thả slide ở panel bên trái để sắp xếp.
3. Bấm **Trình Chiếu** để trình bày, **Esc** để thoát.
4. Lưu lại:
   - **Tải HTML**: một tệp HTML độc lập chứa bộ slide đã sửa, gửi người khác mở là dùng được.
   - **Lưu JSON**: tệp dữ liệu `xbrain-presentation-data-v1.json`, mở lại bằng **Mở JSON**.

Font Manrope/Nunito, ECharts và Mermaid tải từ CDN khi có mạng. Khi offline, slide vẫn hiển thị bằng font dự phòng và hình SVG dựng sẵn.

## Cấu trúc repo

| Đường dẫn | Nội dung |
|---|---|
| `xbrain-presentation-system-v1.0.0.html` | Studio, runtime, trình biên dịch và bộ slide mẫu. Đây là sản phẩm chính được giao. |
| `tools/xbrain.mjs` | CLI của trình biên dịch (Node ≥ 18, không cần cài gói). Chạy chính mã trong HTML. |
| `contracts/xbrain-deck-v1.schema.json` | JSON Schema (Draft 2020-12) của định dạng deck `1.0`. **Được sinh tự động**, không sửa tay. |
| `contracts/example-deck-v1.json` | Ví dụ deck hợp lệ ngắn. |
| `tests/test_json_contract.py`, `tests/test_compiler.py` | Test hợp đồng và test trình biên dịch, chạy runtime trong HTML bằng Node. |
| `tests/fixtures/` | Deck mẫu viết chỉ bằng JSON (đề xuất hợp tác, báo cáo vận hành, template as code, QBR) và các ca biên: sai version, dữ liệu xấu, nội dung không tin cậy. |
| `docs/agent-compiler.md` | Hướng dẫn chi tiết trình biên dịch: vòng lặp cho agent, mã chẩn đoán, hợp đồng dữ liệu của chart/diagram. |
| `docs/XBrain_Brand Guidelines.pdf` | Bộ nhận diện thương hiệu dùng làm chuẩn. |
| `AGENTS.md` | Quy ước cho người và agent khi sửa mã. |

## Studio

**Ba chế độ xem:** Slide Studio (sửa từng slide), Template Gallery (lưới xem trước toàn bộ), Brand Design System (màu, font, logo).

**Thao tác slide** (ở panel trái và trong Gallery):

| Thao tác | Cách làm |
|---|---|
| Di chuyển | Kéo slide, thả vào vạch cam |
| Sao chép | Giữ `Ctrl` khi thả, hoặc `Ctrl+D` để nhân bản |
| Chọn nhiều | `Ctrl`+click, `Shift`+click, `Ctrl+A` (khi đang ở panel) |
| Sao chép / dán | `Ctrl+C` / `Ctrl+V`, dán được sang một tệp HTML khác |
| Cắt | `Ctrl+X` làm mờ slide; chọn vị trí mới rồi `Ctrl+V` để chuyển tới đó; `Esc` để huỷ |
| Dời vị trí | `Alt+↑` / `Alt+↓`, hoặc menu chuột phải (Đưa lên đầu, Đưa xuống cuối) |
| Xoá | `Delete` (khi đang ở panel) |
| Hoàn tác | `Ctrl+Z`, làm lại `Ctrl+Y` hoặc `Ctrl+Shift+Z` |
| Nhập slide | Thả tệp `.json` vào panel |

**Sửa nội dung**, từ đơn giản đến linh hoạt nhất:

1. **Trực tiếp trên slide**: mọi chữ có viền nét đứt đều sửa được, kể cả từng phần tử trong danh sách (số liệu, dòng bảng, mốc thời gian…).
2. **Header và footer** (nhãn chương, dòng chữ góc phải header, website, địa chỉ): sửa xong sẽ hiện hộp chọn áp dụng cho **trang này**, **khoảng trang** hoặc **toàn bộ**. Trang không có trường đó được bỏ qua.
3. **Sửa nội dung**: biểu mẫu liệt kê mọi trường của slide hiện tại.
4. **Slide JSON** (`</>`) và **Deck JSON**: sửa trực tiếp JSON của một slide hoặc cả bộ.

**Xuất bản:** **Trình Chiếu** toàn màn hình (thanh điều khiển ẩn; chuyển slide bằng `←`/`→`, `Space`, `PageUp`/`PageDown`), **In PDF** khổ 16:9, **Kiểm tra QA** để phát hiện chữ quá dài hoặc diagram tràn khung.

## Viết bộ slide bằng JSON

Một deck là một tài liệu có `"version": "1.0"` và mảng `slides`. Mỗi slide chọn một `type` (layout) và điền `content` theo đúng các trường layout đó cho phép. Schema từ chối tên trường sai, nên hãy kiểm trước khi dùng: `node tools/xbrain.mjs validate deck.json` (kèm gợi ý tên đúng) hoặc `qa` để kiểm cả bố cục.

```json
{
  "version": "1.0",
  "chrome": { "headerLabel": "XBrain · Đề xuất 2026", "website": "www.xbrain.com.vn" },
  "slides": [
    {
      "type": "cover",
      "content": { "titleLine1": "Cùng đào tạo", "titleLine2": "kỹ sư CloudOps", "titleLine3": "cùng", "subtitle": "Đề xuất hợp tác đào tạo." }
    },
    {
      "type": "venn-diagram",
      "content": {
        "title": "Ba nguồn lực gặp nhau",
        "note": "Dữ liệu minh họa",
        "center": "Job-ready",
        "sets": [
          { "title": "Nhà trường", "desc": "Nền tảng học thuật." },
          { "title": "Doanh nghiệp", "desc": "Bài toán thật." },
          { "title": "XBrain", "desc": "Lab hands-on." }
        ]
      }
    },
    {
      "type": "composer",
      "title": "Chỉ số chính",
      "components": [
        { "type": "metric", "title": "Học viên", "value": "120", "delta": "Minh họa", "span": 4, "minHeight": 200 },
        { "type": "chart", "variant": "bar", "span": 8, "data": [ { "label": "CloudOps", "value": 48 }, { "label": "DevOps", "value": 36 } ] }
      ]
    }
  ]
}
```

**Các nhóm layout** (danh sách trường của từng layout nằm ở `$defs/content-<type>` trong schema):

| Nhóm | Layout |
|---|---|
| A · Cấu trúc | `cover`, `agenda`, `section-divider`, `closing` |
| B · Nội dung | `title-body`, `two-column`, `text-image`, `three-card`, `four-quadrant`, `quote`, `custom-html` |
| C · Kinh doanh & dữ liệu | `kpi-dashboard`, `charts`, `data-table`, `timeline`, `comparison`, `track-architecture` |
| D · Diagram & biểu đồ | `process-flow`, `conversion-funnel`, `cycle-loop`, `strategy-pyramid`, `decision-matrix`, `org-chart`, `swimlane`, `hub-spoke`, `learner-journey`, `layered-architecture`, `sankey-flow`, `heatmap`, `venn-diagram`, `swot-analysis`, `priority-matrix`, `mind-map`, `fishbone`, `staircase`, `concentric-circles`, `value-chain`, `decision-tree`, `system-architecture`, `kanban-board`, `gantt-roadmap`, `line-chart`, `waterfall-chart`, `bar-ranking`, `radar-chart`, `progress-rings`, `custom-diagram` |
| E · Composer | `composer`: ghép tự do 50 loại component (chart, diagram, table, metric, markdown, mermaid, echarts, grid/columns lồng nhau…), dùng chung `datasets` (JSON, CSV, TSV, YAML) với `transform` lọc, sắp xếp, gom nhóm |

**Header/footer dạng dữ liệu:** `chrome` ở cấp deck (`headerLabel`, `website`, `address`) áp cho mọi slide; `chrome` trong từng slide ghi đè riêng cho slide đó.

## Template as code

Ngoài layout dựng sẵn, deck có thể tự mang layout viết bằng JavaScript:

- `helpers`: hàm/hằng dùng chung, viết dưới dạng chuỗi biểu thức JS hoặc mảng dòng.
- `layouts`: mỗi layout có `name`, `group`, `desc`, `sample` và `template` (template literal) hoặc `render` (thân hàm). Có thể thêm `frame: "dgPage"` để vẽ SVG trong khung diagram chuẩn, và `css`.
- Một slide cũng có thể tự mang `render`/`template`/`css` riêng.

Trong mã có sẵn `slide, index, isThumbnail, c, ce, numStr, layout` cùng các helper của runtime, ví dụ `renderStandardWhiteHeader`, `renderStandardWhiteFooter`, `dgPage`, `xT`, `xTC`, `xRect`, `escapeHtml` và các màu `XO`, `XT`, `XTEAL`. Gắn `${ce} data-field="tênTrường"` vào phần tử chứa chữ để chữ đó sửa được trên slide.

```json
{
  "version": "1.0",
  "helpers": { "pill": "(t) => `<span style=\"padding:8px 22px;border-radius:999px;background:${XO};color:#fff\">${escapeHtml(t)}</span>`" },
  "layouts": {
    "big-statement": {
      "group": "B",
      "name": "Big Statement",
      "sample": { "tag": "Thông điệp", "statement": "Học qua thực hành." },
      "template": "<div class=\"w-[1920px] h-[1080px] bg-white relative overflow-hidden\">${renderStandardWhiteHeader(escapeHtml(c.sectionTag || 'KEY MESSAGE'), numStr)}<div style=\"padding:120px 96px\">${pill(c.tag)}<div style=\"font:800 84px Manrope;color:#2B3736\" ${ce} data-field=\"statement\">${escapeHtml(c.statement)}</div></div>${renderStandardWhiteFooter(numStr)}</div>"
    }
  },
  "slides": [ { "type": "big-statement", "content": { "tag": "Thông điệp", "statement": "Năng lực thật đến từ bài toán thật." } } ]
}
```

Một tệp chỉ có `layouts`/`helpers` (không có `slides`) là một **pack**: mở bằng **Mở JSON** hoặc thả vào panel để thêm layout vào bộ đang mở. Xem `tests/fixtures/deck-template-as-code.json` để có ví dụ đầy đủ.

> Trong studio, mã trong JSON chạy với toàn quyền của trang: chỉ mở tệp JSON từ nguồn tin cậy. Trình biên dịch mặc định coi tài liệu là `untrusted` và **không** chạy `layouts`/`helpers`/`render`/`template`; muốn chạy phải thêm `--trusted`.

## Trình biên dịch cho agent

`tools/xbrain.mjs` chạy cùng mã với studio, nên trình duyệt và CLI cho cùng một kết quả. Vòng lặp khuyến nghị:

```bash
node tools/xbrain.mjs contract > contract.json          # hợp đồng: schema, layout, variant, mã chẩn đoán
node tools/xbrain.mjs repair deck.json -o deck.json     # tự sửa những gì chắc chắn đúng
node tools/xbrain.mjs qa deck.json --json               # validate → render → kiểm tra bố cục và dữ liệu
node tools/xbrain.mjs build deck.json -o deck.html      # HTML tĩnh, không script, tái lập được
node tools/xbrain.mjs pipeline deck.json -o deck.html   # gộp repair → qa → build
```

- Mã thoát: `0` là sạch, `1` là còn lỗi (đọc `diagnostics` để sửa JSON), `2` là sai version hoặc lỗi đầu vào.
- `--trusted` để chạy template as code; `--lenient` để cho phép dữ liệu mẫu ngầm định; `qa --browser` đo pixel bằng Chrome/Edge headless.
- Trong studio, cùng trình biên dịch có sẵn qua `XB.compiler`, `XB.qa()`, `XB.repair()`; nút **Kiểm tra QA** cũng dùng nó.

Chi tiết xem [`docs/agent-compiler.md`](docs/agent-compiler.md).

## API cho agent

Trang cung cấp `window.XB`, gọi được từ console hoặc công cụ tự động hoá trình duyệt:

| Lệnh | Tác dụng |
|---|---|
| `XB.getDeck()` / `XB.setDeck(doc)` | Đọc / thay toàn bộ deck (bắt buộc `version: "1.0"`) |
| `XB.addSlide(type, content, index)` / `XB.updateSlide(i, patch)` / `XB.removeSlide(i)` / `XB.moveSlide(from, to)` | Thao tác từng slide |
| `XB.defineLayout(type, def)` / `XB.defineHelper(name, src)` / `XB.merge(pack)` | Thêm layout, helper hoặc pack |
| `XB.setChrome(key, value, scope)` | Đổi header/footer cho `'current'`, `'all'` hoặc khoảng `[từ, đến]` |
| `XB.layouts()` / `XB.sample(type)` | Liệt kê layout, lấy nội dung mẫu |
| `XB.render(i)` / `XB.exportHTML()` / `XB.exportJSON()` | Render một slide, xuất HTML/JSON |
| `XB.undo()` / `XB.redo()` / `XB.errors()` | Hoàn tác, làm lại, lỗi biên dịch layout |
| `XB.compiler` / `XB.qa()` / `XB.repair()` | Trình biên dịch: kiểm tra, chấm điểm và tự sửa deck đang mở |

## Kiểm thử

Yêu cầu Node.js ≥ 18 và Python có `jsonschema >= 4.10`.

```bash
pip install "jsonschema>=4.10"
python -m unittest discover -s tests -p "test_*.py"
```

Test chạy chính mã ứng dụng trong HTML (không mở trình duyệt) để kiểm:
- schema khớp với registry đang chạy (layout, component, variant);
- quy tắc `version: "1.0"`;
- bản nháp, header/footer, template as code;
- các deck trong `tests/fixtures/`: hợp lệ theo schema, nạp được, render mọi slide không ra trang lỗi;
- trình biên dịch: chẩn đoán, repair, build tái lập được, sandbox cho nội dung không tin cậy.

Schema được sinh từ registry trong HTML. Sau khi thêm hoặc sửa layout, component hay variant, chạy `node tools/xbrain.mjs schema --write` rồi chạy lại test (xem `AGENTS.md`).

## Quy tắc thương hiệu (tóm tắt)

- Màu chính: cam `#F97C00` và xanh đậm `#425453` (thay cho màu đen). Màu phụ (`#25AC9D`, `#007BC1`, `#85439A`, `#F6AF2F`) chỉ để phân biệt nhóm dữ liệu.
- Dùng đúng logo có sẵn: bản màu trên nền sáng, bản trắng trên nền cam hoặc nền tối. Không đổi màu, xoay, kéo méo hay thêm hiệu ứng.
- Manrope cho tiêu đề, Nunito cho nội dung.
- Số liệu trong slide mẫu là minh họa: thay bằng số đã kiểm chứng trước khi trình bày ra ngoài, và không tự thêm huy hiệu hay chứng nhận đối tác khi chưa được cấp phép.

Chi tiết xem `docs/XBrain_Brand Guidelines.pdf`.

## Lưu ý

Repo chứa ảnh nội bộ, thông tin liên hệ và bộ nhận diện của XBrain, chỉ chia sẻ trong công ty.
