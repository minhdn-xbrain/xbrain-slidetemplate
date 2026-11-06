# XBrain compiler và pipeline v1

Runtime, renderer, CSS và dữ liệu mặc định nằm trong `index.html`. CLI yêu cầu Node ≥ 18, dùng chính runtime đó trong `node:vm`; chỉ chuỗi JSON đi qua ranh giới VM. Release vẫn **1.0.0**, document version vẫn **1.0**. Mặc định `strict`, `untrusted`.

## Quy trình

```sh
node tools/xbrain.mjs repair input.json -o repaired.json --json
node tools/xbrain.mjs qa repaired.json --browser --offline --json
node tools/xbrain.mjs build repaired.json --offline -o presentation.html
# Hoặc cả pipeline; lưu thêm .repaired.json và .qa.json:
node tools/xbrain.mjs pipeline input.json --browser --offline -o presentation.html
```

`--browser` dùng Chrome/Edge qua `CHROME_PATH`. Báo cáo ghi rõ trình duyệt có thực sự đo hay không; không tìm thấy trình duyệt là cảnh báo, trình duyệt chạy lỗi là lỗi QA. Summary và exit code tính cả diagnostic trình duyệt. Chế độ in dùng fallback SVG; CDN không bắt buộc. `build --app` xuất ứng dụng có thể chỉnh sửa, còn mặc định xuất HTML tĩnh không có script.

`repair` không sửa dữ liệu thiếu bằng số giả. Lỗi còn lại làm CLI trả exit code 1; version không hỗ trợ trả 2 trước khi sửa document hoặc prefetch. Kiểm tra và sửa các diagnostic trước khi dùng đầu ra.

## Kích thước và phân trang

Container `card`, `stack`, `row`, `grid`, `columns`, `group` dùng chung phép tính chiều cao nội tại và box con cho render/QA. Khoảng trống ưu tiên các hàng chứa visual, xuyên qua container lồng nhau. Độ sâu render tối đa vẫn 7.

`repair` phân trang table lớn và container chứa nhiều phần tử, kể cả khi slide chỉ có một component. Table được snapshot **sau transform** rồi chia hàng: không chạy lại group/join trên từng mảnh, giữ đúng thứ tự, giá trị và header. Số hàng mỗi trang phụ thuộc chiều cao còn lại, tối đa 12. Với font/table hiện tại và scene 642px, table toàn slide thường chứa **8 hàng**, còn table trong card chứa **7 hàng**. Dùng 10–12 hàng với cùng font/padding sẽ cắt nội dung. Tiêu đề tiếp nối có `(n/k)`, ID không đụng ID có sẵn; repair lần hai giữ nguyên document.

Nội dung đơn lẻ không thể tách (ví dụ một đoạn text rất dài), freeform, style tác giả tự đổi kích thước và raw HTML/SVG tùy ý vẫn cần xử lý diagnostic và kiểm tra trực quan.

## Đồ thị và nhãn

Đồ thị có cạnh tường minh dùng phân tầng: DFS xác định feedback arcs, đảo hướng tạm để xếp tầng, thêm dummy slots cho cạnh vượt tầng và sắp thứ tự theo barycentre. Cạnh hiển thị giữ nguyên hướng/giá trị gốc. Sankey có một scale chung cho mọi dải và dành không gian cho dải hồi tiếp; dummy không trở thành node dữ liệu. Tree giữ các cạnh đa cha và đặt nút con theo trọng tâm cha khi đủ chỗ. Đồ thị quá dày báo `layout.overflow` thay vì sinh kích thước âm.

Scatter, radar và Sankey có bố trí tránh đè nhãn có giới hạn. Không có tọa độ X thì scatter báo thiếu trong cả Studio và compiler, không tự tạo chỉ số X. Radar giữ mọi series; series thiếu giá trị không được tạo đỉnh bằng số 0.

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

Composer resolve title/subtitle/components từ đúng vị trí ở slide hoặc slide.content, dùng chung renderer và editor. Content Editor kiểm tra toàn bộ số hữu hạn trước khi một giao dịch DeckStore ghi bất kỳ trường nào. Inline edit dùng event delegation và cùng root resolver; undo/redo vẫn hoạt động sau xuất/mở lại HTML. Theme Composer chọn cặp foreground/background phù hợp, logo âm bản trên nền tối, giữ chữ trên card sáng tối màu; chart title được hiển thị và tính vào diện tích plot.

## Kiểm thử

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
# Optional, không thêm dependency trình duyệt vào ứng dụng:
XB_PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome \
  node tests/browser_improvements.mjs /tmp/xbrain-browser-check
```

Fixture tích hợp: `tests/fixtures/recursive-pipeline.json`. Kết quả và ảnh trước/sau: `docs/audits/2026-11-06-improvements/`. Fixture PARADOX gốc được giữ làm stress test các lỗi template legacy/nội dung đã ghi trong audit, không phải deck chuẩn đã sửa.
