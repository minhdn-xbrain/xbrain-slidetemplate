# Audit và cải tiến Agent-Native Compiler — 08/11/2026

Đã triển khai vào runtime và CLI, giữ release **1.0.0**, schema **1.0**, ứng dụng một HTML và khả năng mở bằng `file://`. Không thêm template hoặc tính năng UI. Workspace chỉ cung cấp `index.html` và schema; không có HTML runtime thứ hai để đối chiếu. Baseline dưới đây là `HEAD:index.html` trước chỉnh sửa của lượt làm việc này.

## Kết quả theo năm hướng

| Hướng | Nguyên nhân đã xác nhận | Thay đổi đã triển khai |
|---|---|---|
| Unified Contract | Validator tự viết bỏ qua `uniqueItems`; shape sai làm semantic checks ném exception; giới hạn chart rải trong renderer | Thực thi uniqueness theo giá trị JSON; xử lý boolean schema và các bound; required/reference dùng own properties; input sai trả diagnostic. `maxRows`/`maxSeries` đặt cạnh renderer trong registry, xuất qua contract/schema annotation; giới hạn template xuất thành `x-v1-limits`. |
| Semantic Visualization | Stacked/grouped điền số thiếu bằng 0; line và heatmap âm thầm bỏ series; template charts cũ tạo donut mẫu và ép điểm về 0–100; Sankey cũ clamp độ dày; parser ngày chấp nhận 31/02 | Bỏ hàng thiếu series và báo error; báo phần bị bỏ, strict không được coi là thành công khi truncate dữ liệu. Chart legacy strict dùng renderer chung; Sankey legacy strict dùng scale chung theo giá trị cạnh. Kiểm tra lịch thật, năm nhuận và end ≥ start cho Gantt. |
| Constraint-Based Layout | Table giả định mọi hàng cao 67px; không chia được list/paragraph; font fallback rộng hơn mô hình | Table chia theo chiều cao từng ô, cột cố định và ngắt từ dài. Pagination giữ thứ tự list, mọi ký tự paragraph và header table. Giữ `minHeight` của fragment; không snapshot transform bị lỗi. Browser có thể điều chỉnh dự phòng chiều rộng để reflow. |
| Headless QA & Auto-Repair | Pipeline ghi HTML trước khi có kết quả browser; browser thiếu chỉ warning; không có phản hồi từ số đo vào repair | Pipeline render → đo → reflow từ input gốc → đo lại, tối đa 3 lượt. Overflow còn lại chặn xuất bản; `--require-browser` bắt buộc đo; `--fail-on` cho tiêu chuẩn bổ sung. Giữ report khi thất bại, không ghi đè HTML thành công cũ. |
| Safe & Deterministic Compiler | VM gọi method bằng nội suy source; microtask có thể chạy ngoài timeout; app export dùng lại chính sách trusted dù compile untrusted; offline bỏ sót module CDN | Allowlist method và bracket lookup; timeout bao gồm microtask. App giữ strict/trust khi mở lại và khi import; chặn helper/slide code, sanitize custom HTML/SVG; bỏ CDN trong untrusted/offline app. Manifest SHA-256 ghi runtime, schema, input, document, output và options để replay. |

## Chính sách sửa dữ liệu

Probe trước sửa cho thấy `repair` biến progress **140 thành 100** và rating **9 thành 5**, rồi trả thành công. Đây là thay đổi ý nghĩa số liệu. Hiện hai giá trị được giữ nguyên và diagnostic yêu cầu tác giả sửa. Không làm tròn measurement/count để thỏa schema integer; không bỏ `%` khỏi giá trị số không khai báo đơn vị phần trăm. Chỉ geometry được clamp và chỉ chuỗi số có chuyển đổi không mất giá trị được coerce.

Document thiếu version trước đây tự được gắn `1.0`; hiện bị từ chối trước thay đổi theo AGENTS.md. Mảng slide legacy vẫn được bọc thành v1. Deck v1 hợp lệ tiếp tục được chấp nhận; dữ liệu sai trước đây lọt validator hoặc bị sửa sai sẽ có kết quả chặt hơn.

Dataset tên `constructor`, `toString`, `__proto__` không còn được hiểu là dữ liệu kế thừa từ Object prototype. Repair không làm lỗi derive/join biến mất bằng cách snapshot kết quả trung gian. Với table phân trang, cột được cố định theo table gốc; không suy luận lại header từ từng mảnh.

## Bằng chứng kiểm thử

Chạy `python3 -m unittest discover -s tests -p 'test_*.py'` với Chromium đã cấu hình: **79 test, 0 thất bại, 0 lỗi, 0 bỏ qua**. Bộ nền ban đầu có 59 test, trong đó một test browser bị bỏ qua khi chưa cấu hình browser. Thêm 19 regression cho engine và một test contract. Ngoài ra probe 324 lượt validate/compile/qa/repair với shape sai không có exception thoát ra ngoài.

Ba suite browser đều đạt:

- `tests/browser_improvements.mjs`: editor, atomic validation, undo/redo, Gallery, contract, mở lại export, static/offline và bản in; deck tích hợp 12 trang không có diagnostic đo được, không có page error.
- `tests/browser_header.mjs`: thao tác/header cũ, độ mới của QA, export, trình chiếu và in; không có page error.
- `tests/browser_agent_engine.mjs`: so baseline, pipeline đo/reflow, đủ 12 hàng table và 31 mục list, bản in, HTML editable qua `file://`, sanitize HTML/SVG, chặn code khi import lại; **0 CDN request, 0 page error**.

Fixture `agent-native.json` chứa table có ô nhiều dòng, list lồng trong card, paragraph tiếng Việt dài, điểm trước/sau âm và >100, Sankey lệch tỷ trọng 10:1000. Baseline sửa thành 6 slide, còn 2 error layout tĩnh và 4 diagnostic overflow browser. Sau cải tiến:

| Lượt | Dự phòng chiều rộng `textSafety` | Số slide | Overflow Chromium |
|---|---:|---:|---:|
| Repair và render đầu | 1.00 | 11 | 5 |
| Reflow từ input gốc | 1.41 | 15 | 0 |

Kết quả cuối **0 error, 0 warning**. Số trang tăng là chủ đích để bảo toàn nội dung. Paragraph được kiểm tra bằng cách nối các mảnh và so đúng mọi ký tự. Replay bằng repaired JSON và options trong manifest cho HTML byte-identical. Kiểm thử cũng xác nhận một lần pipeline thất bại không làm thay đổi HTML thành công đã có.

| Deck chạy pipeline offline + browser bắt buộc | Slide sau repair | Error / warning | Xuất bản |
|---|---:|---:|---|
| qbr-deck.json | 12 | 0 / 0 | Có |
| recursive-pipeline.json | 12 | 0 / 0 | Có; 1 info về feedback edge |
| deck-partnership-proposal.json | 11 | 0 / 0 | Có |
| deck-quarterly-ops-report.json | 12 | 0 / 7 | Có theo gate mặc định; còn text rút gọn/khó đọc và fallback enhanced |
| deck-template-as-code.json, trusted | 10 | 0 / 2 | Có theo gate mặc định; còn SVG text collision |
| agent-native.json | 15 | 0 / 0 | Có, sau hai lượt đo |
| edge-cases.json | 9 | 8 / 16 | Bị chặn đúng dự kiến |
| paradox_xbrain.json | 42 | 28 / 46 | Bị chặn; giữ nguyên các lỗi dữ liệu/template cần tác giả xử lý |

`security.code-blocked` trong deck trusted là info hiện có báo deck chứa code; không phải việc chặn thực thi. Không coi 6 deck xuất bản là tất cả đều hoàn hảo: hai deck còn warning như bảng trên. Với đầu ra cần không mất nhãn hoặc không có va chạm, thêm gate tương ứng.

Artifacts:

- [Verification](verification.json), [matrix deck](fixture-results.json), [đo trước/sau và manifest](browser-results.json).
- [Studio regression](studio-regression.json), [header regression](header-regression.json).
- Table: [trước](before-table.png), [sau](after-table.png). List: [trước](before-list.png), [sau](after-list.png).

Chromium dùng bản 156 có sẵn trong cache. Playwright và thư viện hệ thống thiếu được đặt trong `/tmp` để chạy kiểm thử, không thêm dependency vào ứng dụng hoặc repo. Font ngoài bị chặn khi đo offline. Số đo/profile và số trang có thể khác trên máy có font khác; manifest và môi trường renderer cần được giữ khi yêu cầu tái lập hình ảnh.

## Cách dùng cho agent

```sh
# Cần CHROME_PATH trỏ tới Chromium/Chrome chạy được.
node tools/xbrain.mjs contract -o /tmp/xbrain-contract.json
node tools/xbrain.mjs pipeline tests/fixtures/agent-native.json \
  --require-browser --offline \
  --fail-on text.truncated,layout.legibility,layout.text-collision \
  --json -o /tmp/presentation.html

# Replay: đọc textSafety thật trong manifest; 1.41 là profile của ca kiểm thử này.
node tools/xbrain.mjs build /tmp/presentation.repaired.json \
  --offline --text-safety 1.41 -o /tmp/replay.html
```

Agent đọc `ok`, `published`, `quality`, `diagnostics`, `attempts`, `manifest`. `published:false` nghĩa là HTML ở đường dẫn đích có thể là artifact của lần thành công cũ. Gate mặc định của pipeline chặn error và overflow browser, chưa chặn mọi warning. `build` không gate tùy chọn vẫn giữ khả năng xuất bản xem lỗi để tương thích; không dùng nó làm chốt production.

## Phạm vi và hạn chế còn lại

1. **Contract chưa hợp nhất toàn bộ renderer thành một model.** Enum, giới hạn chart và annotation template lấy từ registry; cấu trúc schema vẫn ở `XB_SCHEMA_BASE`. Nhiều trường có điều kiện của layout legacy chưa có hợp đồng ngữ nghĩa máy đọc được. Không đổi schema sang bắt buộc mọi trường để tránh phá deck v1 cũ.
2. **Không chứng minh được tính đúng của mọi biểu diễn.** Đã sửa các đường render nêu trên; kiểm tra mark proportionality hiện chỉ phủ một số mark. Các infographic legacy còn logic trình bày riêng như funnel theo tầng, heatmap lượng tử hóa 0–5, nội dung mặc định và khung bố trí cố định. Chưa thay toàn bộ chúng bằng renderer ngữ nghĩa; production nên dùng native chart/diagram với dữ liệu và quan hệ tường minh, đồng thời xem diagnostic/ảnh đầu ra.
3. **Reflow là heuristic, chưa là bộ giải tối ưu toàn cục.** Điều chỉnh margin chung cho body/table có thể chia nhiều trang hơn cần thiết. Table vẫn chia cột đều; chưa tối ưu bề rộng cột. Không tự tách ô table hoặc mục list quá lớn, tự viết lại tiêu đề, hoặc suy luận lại đồ thị. Browser vẫn cần font/environment ổn định.
4. **Pixel QA chưa tương đương kiểm tra mọi pixel hoặc accessibility.** Có thể chưa bắt mọi CSS clip-path, đối tượng che nhau, nội dung dynamic, text transform đặc biệt hay quan hệ chồng lấp giữa nhiều SVG. Không đo browser thì chỉ có ước lượng. Sau ba lượt chưa đạt, pipeline dừng và đưa diagnostic thay vì tự sửa vô hạn.
5. **VM không phải sandbox bảo mật.** Mặc định chỉ nhận JSON và không thực thi code của document; `--trusted`/`--html` yêu cầu mã tin cậy. Node xác nhận [node:vm không phải cơ chế bảo mật](https://nodejs.org/api/vm.html#vm-executing-javascript). Dịch vụ nhận runtime hoặc JavaScript từ bên ngoài vẫn cần worker/process/container có giới hạn CPU, RAM, filesystem, network và vòng đời. Việc này chưa triển khai trong lượt sửa repo này.
6. **Determinism có điều kiện.** Manifest xác định bytes/code/options; không kiểm soát `Date`, random, mutation trong trusted template, font hệ thống hay asset URL có thể đổi. Dataset prefetch có snapshot; chưa snapshot và kiểm tra integrity toàn bộ font/image. Hash slide cũ giữ tương thích, không thay thế SHA-256 toàn artifact.

Ưu tiên kế tiếp: đưa hợp đồng ngữ nghĩa và adapter của từng layout legacy vào registry, dùng scene model có provenance từ JSON tới từng mark; chuẩn hóa font/asset snapshot và profile browser; sau đó bổ sung bộ giải phân bổ bề rộng cột và repair theo từng đối tượng đo được. Các bước này giúp tăng độ chính xác mà không cần tăng số template hoặc mở rộng UI.
