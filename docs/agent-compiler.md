# XBrain compiler và pipeline v1

Runtime, renderer, CSS và dữ liệu mặc định nằm trong `index.html`. CLI yêu cầu Node ≥ 18, dùng chính runtime đó trong `node:vm`; chỉ chuỗi JSON đi qua ranh giới VM. Release vẫn **1.0.0**, document version vẫn **1.0**. Mặc định `strict`, `untrusted`. Runtime từ `--html` phải đáng tin cậy; VM không phải sandbox của hệ điều hành.

## Header và thao tác Studio

Header chia hai tầng: tên tài liệu/số slide/trạng thái nháp ở trên, thao tác ở dưới. **Soạn thảo** và **Tổng quan** chuyển giữa canvas và lưới slide của deck đang mở. **Trình chiếu** luôn nằm ở nhóm bên phải.

- **Tệp:** mở bài trình chiếu JSON, lưu nháp hoặc khôi phục nháp (`xbrain-v1-draft`).
- **Thêm slide:** slide từ mẫu hoặc biểu đồ/sơ đồ.
- **Sửa nội dung:** chỉnh slide hiện tại; **AI / JSON** cung cấp schema, JSON slide, JSON toàn deck và nạp lại dữ liệu URL.
- **Kiểm tra:** chạy QA; badge phản ánh lần kiểm tra thực tế, chuyển sang **Kiểm tra lại** khi nội dung hoặc dữ liệu URL thay đổi.
- **Xuất:** HTML chỉnh sửa được, dữ liệu JSON, In/PDF.
- **Tùy chọn:** bật/tắt chỉnh sửa trực tiếp, hướng dẫn thương hiệu và thông tin phiên bản.

Menu mở bằng click, Enter/Space hoặc mũi tên lên/xuống; dùng mũi tên/Home/End để chọn và Escape để đóng. Nhãn thao tác được giữ khi offline. Màn hình hẹp xuống hàng thay vì dùng thanh cuộn ngang.

**Đã lưu nháp** chỉ hiện sau khi lưu/khôi phục thành công. Sửa rồi undo về đúng bản đã lưu khôi phục trạng thái đó; bản HTML mở lại bắt đầu một phiên tra cứu trạng thái mới. Undo/redo bật theo lịch sử thực tế; mở menu, đổi chế độ xem và xem schema không ghi lịch sử.

## Lấy contract từ trình duyệt

Chọn **AI / JSON → Schema / Contract** trong Studio. Tab **Schema JSON** hiển thị kết quả `XBrainCompiler.schema()`; tab **Agent Contract** hiển thị kết quả `XBrainCompiler.contract()`, gồm schema, layout, component, variant, yêu cầu dữ liệu, giới hạn và mã diagnostic.

JSON được tạo khi mở/chuyển tab và hiển thị trong phần tử văn bản `#v1-contract-json` của dialog `#v1-contract-modal`, để extension AI đọc qua DOM/accessibility. **Sao chép** dùng clipboard với fallback chọn văn bản khi trình duyệt hạn chế quyền; **Tải JSON** lưu `xbrain-deck-v1.schema.json` hoặc `xbrain-agent-contract-v1.json` theo tab hiện tại. Có thể chuyển tab bằng phím mũi tên và đóng bằng Escape.

Tính năng dùng được qua `file://`, offline và trong HTML editable đã xuất. Việc tra cứu không thay đổi deck hoặc lịch sử undo/redo. Nội dung chỉ được tạo trong lúc tra cứu, không nhúng thêm một bản schema tĩnh vào HTML xuất.

## Quy trình

```sh
node tools/xbrain.mjs repair input.json -o repaired.json --json
node tools/xbrain.mjs qa repaired.json --browser --offline --json
node tools/xbrain.mjs build repaired.json --offline -o presentation.html
# Hoặc cả pipeline; lưu thêm .repaired.json và .qa.json:
node tools/xbrain.mjs pipeline input.json --browser --offline -o presentation.html
# Production gate: browser bắt buộc, nhãn bị rút gọn/khó đọc cũng chặn xuất bản:
node tools/xbrain.mjs pipeline input.json --require-browser --offline \
  --fail-on text.truncated,layout.legibility,layout.text-collision -o presentation.html
```

`--browser` dùng Chrome/Edge qua `CHROME_PATH`. Báo cáo ghi rõ trình duyệt có thực sự đo hay không; không tìm thấy trình duyệt là cảnh báo, trình duyệt chạy lỗi là lỗi QA. Summary và exit code tính cả diagnostic trình duyệt. Chế độ in dùng fallback SVG; CDN không bắt buộc. `build --app` xuất ứng dụng có thể chỉnh sửa, còn mặc định xuất HTML tĩnh không có script.

`repair` không sửa dữ liệu thiếu bằng số giả, không clamp số liệu nghiệp vụ và không làm tròn số để khớp integer. Có thể clamp thuộc tính hình học; `"70%"` chỉ được đổi thành `70` ở component progress có đơn vị phần trăm rõ ràng. Document thiếu version hoặc khác `1.0` bị từ chối trước khi sửa; mảng slide cũ vẫn được bọc thành document v1 để giữ tương thích.

`pipeline` chỉ ghi HTML khi QA và quality gate đạt. Khi thất bại vẫn ghi `.repaired.json`, `.qa.json`, trả exit code 1 và `published:false`; HTML thành công đã có tại cùng đường dẫn được giữ nguyên. Agent phải đọc `published`/exit code trước khi sử dụng artifact, tránh lấy nhầm bản cũ. Version không hỗ trợ trả 2 trước repair/prefetch. `build --app` cũng từ chối deck có lỗi. `build` thông thường vẫn có thể xuất bản xem lỗi để debug; dùng `pipeline` cho đầu ra production.

Khi có `--browser` hoặc `--require-browser`, pipeline đo rồi reflow tối đa **3 lượt**. Overflow làm tăng `textSafety` trong `[1,2]` để dự phòng chiều rộng font cho paragraph/list/table; mỗi lượt phân trang lại từ input gốc. Không thay đổi chữ hay số. Overflow đo được còn lại luôn chặn pipeline. `--require-browser` biến việc thiếu browser thành error; `--browser` giữ warning khi không có executable để tương thích. `--fail-on` áp dụng cho `qa`, `build`, `pipeline`; mã diagnostic không tồn tại bị từ chối.

`.qa.json` ghi `attempts` và manifest SHA-256 của runtime HTML, schema, input sau prefetch, document đã sửa, HTML đầu ra; không ghi timestamp. `hash` cũ là identity nội dung slide, không phải hash toàn artifact. Manifest lưu cả options cuối cùng. Để replay byte-identical, dùng runtime cùng hash và options đã ghi, ví dụ:

```sh
node tools/xbrain.mjs build presentation.repaired.json --offline \
  --text-safety 1.41 -o replay.html
```

Hệ số `1.41` chỉ là ví dụ; lấy giá trị thật ở `manifest.options.textSafety` (mặc định `1`). Các fragment giữ `minHeight` để khi mở lại JSON vẫn mang theo hình học dự phòng; replay chính xác cả build hash cần giữ options. Hình ảnh/font ngoài chưa được đóng gói tự động; `--offline` bỏ CDN của ứng dụng, không tự snapshot mọi asset tác giả tham chiếu.

## Kích thước và phân trang

Container `card`, `stack`, `row`, `grid`, `columns`, `group` dùng chung phép tính chiều cao nội tại và box con cho render/QA. Khoảng trống ưu tiên các hàng chứa visual, xuyên qua container lồng nhau. Độ sâu render tối đa vẫn 7.

`repair` phân trang table, list và text/paragraph, kể cả trong container lồng nhau. Các mục list được giữ nguyên; nối text các mảnh trả lại đúng chuỗi gốc. Table được snapshot **sau transform** rồi chia hàng: không chạy lại group/join trên từng mảnh, giữ đúng thứ tự, giá trị và header. Không snapshot khi nguồn/transform có lỗi hoặc việc suy luận cột bỏ dữ liệu. Table dùng cột rộng bằng nhau, ngắt từ dài và tính chiều cao theo nội dung từng ô; ô nhiều dòng làm giảm số hàng mỗi trang. Hàng ngắn toàn slide thường chứa **8 hàng**, trong card **7 hàng**, tối đa 12. Tiêu đề tiếp nối có `(n/k)`, ID không đụng ID có sẵn; repair lần hai giữ nguyên document.

Một mục list/ô table quá lớn không thể chia mà vẫn giữ cấu trúc, freeform, header dài, style tác giả tự đổi kích thước và raw HTML/SVG tùy ý vẫn cần xử lý diagnostic và kiểm tra trực quan. Reflow chỉ là heuristic có giới hạn, chưa tối ưu số trang hay tự viết lại nội dung.

Giới hạn `maxRows`/`maxSeries` của chart nằm cạnh renderer trong `CHART_VARIANTS`; `contract()` và annotation `x-v1-constraints` của schema lấy từ cùng nguồn này. `x-v1-limits` lấy từ layout registry. Annotation giúp agent lập kế hoạch; validation kiểu/shape vẫn dùng JSON Schema, còn điều kiện dữ liệu và hình học dùng diagnostic runtime. Các trường bắt buộc có điều kiện của mọi layout legacy chưa được mô hình hóa hoàn toàn. Validator đã thực thi `uniqueItems`, boolean schema và các bound đang hỗ trợ, đồng thời trả diagnostic cho shape sai thay vì ném exception.

## Đồ thị và nhãn

Đồ thị có cạnh tường minh dùng phân tầng: DFS xác định feedback arcs, đảo hướng tạm để xếp tầng, thêm dummy slots cho cạnh vượt tầng và sắp thứ tự theo barycentre. Cạnh hiển thị giữ nguyên hướng/giá trị gốc. Sankey có một scale chung cho mọi dải và dành không gian cho dải hồi tiếp; dummy không trở thành node dữ liệu. Tree giữ các cạnh đa cha và đặt nút con theo trọng tâm cha khi đủ chỗ. Đồ thị quá dày báo `layout.overflow` thay vì sinh kích thước âm.

Scatter, radar và Sankey có bố trí tránh đè nhãn có giới hạn. Không có tọa độ X thì scatter báo thiếu trong cả Studio và compiler, không tự tạo chỉ số X. Radar giữ mọi series; series thiếu giá trị không được tạo đỉnh bằng số 0.

Grouped/stacked chart bỏ hàng thiếu series và báo error, không thay bằng `0`. Vượt số hàng/node/series hoặc cột table bị bỏ là `data.truncated` mức error khi strict. Ngày ISO kiểm tra ngày thực tế, kể cả năm nhuận; Gantt không vẽ thanh có end trước start. Template `charts` strict dùng renderer chart chung, không chèn donut mẫu, không ép điểm vào 0–100; `sankey-flow` strict dùng engine Sankey có scale chung thay cho độ dày minh họa có clamp. Studio mặc định vẫn giữ chế độ legacy để tương thích.

`layout.text-collision` báo giao nhau trên 15% diện tích **hộp nhỏ hơn**, kèm hai hộp, nội dung và loại phép đo. Node dùng ước lượng font; Chromium dùng `getBoundingClientRect()` của `<text>` trong từng SVG, bao gồm transform. Node không có layout engine để đo CSS, group transform hay font trình duyệt; dùng `--browser` để kiểm tra những trường hợp đó. Tránh nhãn là heuristic có giới hạn, không phải bảo đảm hình học cho mọi đồ thị/dữ liệu đầu vào.

## Transform dữ liệu

Thứ tự cố định: **join → derive → filter → sort → offset → limit → group → select → exclude**. Không biến đổi dataset gốc.

```json
{
  "type": "table",
  "dataRef": "measurements",
  "transform": {
    "join": {
      "leftKey": "districtId",
      "rightDataset": "targets",
      "rightKey": "id",
      "prefix": "target_",
      "select": ["capacity"]
    },
    "derive": {
      "difference": {
        "op": "subtract",
        "args": [{"field": "after"}, {"field": "before"}]
      },
      "percent": {
        "op": "percent",
        "args": [{"field": "after"}, {"field": "target_capacity"}]
      }
    },
    "groupBy": "district",
    "agg": "sum",
    "select": ["label", "difference", "percent"]
  }
}
```

- `groupBy` giữ tất cả trường series số theo `deckSeriesKeys`; bỏ trường nhóm và các trường phụ như x/y/target. `agg`: `sum` (mặc định), `avg`, `min`, `max`, `count`. Chỉ định `aggregateField` giữ dạng tương thích `{label,value}`. Dữ liệu không có số không tự thành 0.
- `derive` là map tên cột → biểu thức AST. Operand là số hữu hạn, `{field:"tên"}` hoặc biểu thức con. Operator `add`, `subtract`, `multiply`, `divide`, `percent` nhận đúng hai operand. Các cột dẫn xuất xử lý theo thứ tự khai báo. Thiếu operand, chia 0, hoặc vượt độ sâu 16 phát `data.derive`; không dùng eval/Function.
- `join` là left join; khóa phân biệt kiểu dữ liệu. Khóa bên phải trùng báo lỗi; tên cột trùng không ghi đè bên trái, hãy dùng `prefix` hoặc `select`. Dataset không tồn tại báo `data.unknown-ref`.
- `select` và `exclude` chọn cột sau gom nhóm, tránh đưa đồng thời cột tổng và cột cấu phần vào chart. Ý nghĩa quan hệ giữa các hàng vẫn do tác giả khai báo.
- YAML dùng cùng subset tất định ở CLI/Studio: danh sách mapping phẳng hoặc mapping gốc. Chuỗi có nháy giữ kiểu chuỗi, `#` trong chuỗi hoặc giữa từ được giữ; màu hex không có nháy cũng được giữ. Không tự chuyển sang parser CDN khác.

## Snapshot dữ liệu ngoài

```sh
node tools/xbrain.mjs pipeline remote.json --prefetch -o cached.html
node tools/xbrain.mjs build cached.repaired.json --offline -o replay.html
```

`--prefetch` là lựa chọn tường minh: tải HTTP(S) ngoài VM, timeout 15 giây, mỗi URL một lần trong lượt chạy. Nội dung nguyên bản được nhúng vào `dataset.value`, format được lưu và `dataset.snapshot.sha256` ghi SHA-256 của nội dung tải về. Không có timestamp trong output. File `.repaired.json` là bản cache có thể lưu và biên dịch lại offline.

Không có network I/O trong sandbox. URL chưa có `value`/`data` phát `determinism.external-missing` ở mức error, kể cả dataset chưa dùng. `--offline` và `--prefetch` không dùng đồng thời. Hash ghi nguồn snapshot, không làm dữ liệu từ URL trở thành nguồn đáng tin cậy.

## CSS, sanitizer và editor

CSS Composer được tiền tố `[data-slide-id="..."]` cho từng selector, kể cả trong `@media`, `@supports`, `@container`, `@layer`. Layout/slide CSS của template tự định nghĩa cũng được xuất cạnh slide để bản static và Studio cùng phạm vi. Global selector `html/body/:root/:host`, sibling selector từ root, `position:fixed`, at-rule ngoài danh sách (gồm `@page`, `@import`, `@keyframes`) và CSS nesting trong declaration bị bỏ kèm `css.blocked`. Dùng selector phẳng; root của Composer dùng `.v1-slide`.

Untrusted HTML/SVG dùng tokenizer theo trạng thái và danh sách tag cho phép. Script/style/iframe/object/foreignObject và các tag bị chặn khác nuốt thân đến tag đóng hoặc EOF. SVG `<title>` và MathML an toàn được giữ; handler và URL chủ động bị loại. Trusted template code vẫn là mã tác giả được phép chạy khi chọn `--trusted`.

HTML editable do CLI xuất giữ nguyên chính sách strict/trust khi mở lại, sanitize cả custom HTML/SVG và chặn compile helper/slide code từ các lần import tiếp theo trong untrusted app. CDN ECharts/Mermaid không được bật cho untrusted app; `--offline` bỏ cả link font và module import CDN. Studio gốc vẫn trusted theo thiết kế cũ. VM call dùng danh sách method cho phép và drain microtask trong timeout; không truyền host object. Những biện pháp này không thay thế cô lập OS/container cho dịch vụ nhận mã JavaScript hoặc runtime HTML không tin cậy. Kết quả `--trusted` có thể không tất định nếu tác giả dùng thời gian, random hay trạng thái toàn cục.

Composer resolve title/subtitle/components từ đúng vị trí ở slide hoặc slide.content, dùng chung renderer và editor. Content Editor kiểm tra toàn bộ số hữu hạn trước khi một giao dịch DeckStore ghi bất kỳ trường nào. Inline edit dùng event delegation và cùng root resolver; undo/redo vẫn hoạt động sau xuất/mở lại HTML. Theme Composer chọn cặp foreground/background phù hợp, logo âm bản trên nền tối, giữ chữ trên card sáng tối màu; chart title được hiển thị và tính vào diện tích plot.

## Kiểm thử

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
# Optional, không thêm dependency trình duyệt vào ứng dụng:
XB_PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome \
  node tests/browser_improvements.mjs /tmp/xbrain-browser-check
XB_PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome \
  node tests/browser_header.mjs /tmp/xbrain-header-check
XB_PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome \
  node tests/browser_agent_engine.mjs /tmp/xbrain-agent-check
```

Fixture tích hợp: `tests/fixtures/recursive-pipeline.json`. Kết quả và ảnh trước/sau: `docs/audits/2026-11-06-improvements/`. Fixture PARADOX gốc được giữ làm stress test các lỗi template legacy/nội dung đã ghi trong audit, không phải deck chuẩn đã sửa.

Fixture bổ sung: `tests/fixtures/agent-native.json`. Audit compiler, ảnh trước/sau, matrix deck thực tế và giới hạn còn lại: [2026-11-08-agent-compiler](audits/2026-11-08-agent-compiler/README.md).
