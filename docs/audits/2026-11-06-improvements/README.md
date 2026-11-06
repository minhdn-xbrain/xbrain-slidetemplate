# Kiểm chứng triển khai bốn giai đoạn

Ngày: 06/11/2026 (Asia/Bangkok). Baseline đối chiếu: `e57dd32`. Release `1.0.0`, JSON version `1.0` được giữ nguyên.

## Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Unittest, gồm test trình duyệt của CLI | **59/59 pass**, không skip |
| Fixture `recursive-pipeline.json`, repair → qa → build | 9 slide thành **12 slide**, 1 thao tác phân trang sâu; **0 lỗi, 0 cảnh báo**, 1 thông tin về feedback arc |
| QA Chromium của pipeline, chặn CDN bằng `--offline` | Đã đo, **0 phát hiện** |
| Studio và HTML static, chặn toàn bộ HTTP(S) | **0 lỗi JS**, **0 tràn/va chạm được đo** trên fixture tích hợp |
| Positive control: hai SVG text chồng nhau, bên trong group có transform | Phát hiện giao nhau **96%**, kèm hai bounding box |
| Sáu container grid/columns/row/stack/card/group trong Chromium | Box con đúng chiều rộng, không tràn/va chạm đo được |
| Editor: sai số sau khi đã sửa title | Không ghi bất kỳ trường nào; modal vẫn mở và đánh dấu trường sai |
| Editor: title/subtitle/components nằm ở slide.content hoặc trộn hai cấp | Đọc/lưu đúng nơi; số 0 được giữ |
| Undo/redo, render/QA không thêm lịch sử | Pass |
| Inline → modal → undo/redo, trước và sau xuất/mở lại HTML bằng file:// | Pass |
| Import version sai | Bị từ chối; document hiện tại giữ nguyên |
| Prefetch HTTP thực trên server local, replay offline | Tải đúng 1 lần, nhúng CSV và SHA-256; replay không tải lại; version sai không gây request |
| CSS slide, cả nested @media | Không đổi màu slide kế tiếp; global selector/fixed position bị chặn |
| SVG title, MathML và script không có tag đóng | Title/MathML được giữ; thân script bị loại |
| Gallery, laptop 1366×768 và 1440×900 | Đã mở, chụp ảnh |
| PDF offline | **12 trang**, mỗi trang **1440 × 810 pt** (16:9), không có enhancement CDN |
| Schema dẫn xuất và git diff whitespace | Đồng bộ; `git diff --check` sạch |

Kết quả máy đọc: [pipeline.json](pipeline.json), [results.json](results.json). Fixture gốc không bị sửa trong quá trình repair; table được chia từ dữ liệu sau transform, giữ đủ 25 hàng. Gọi repair lại giữ nguyên document.

## Ảnh đối chiếu

- [Container lồng nhau trước thay đổi](baseline-nested.png) và [sau thay đổi](nested.png): cả hai cột/chart hiện đầy đủ, sử dụng chiều cao khả dụng.
- [Sankey](sankey.png): giữ cạnh dài và dải hồi tiếp, chung scale theo giá trị.
- [Tree đa cha](tree.png), [nhãn scatter](scatter.png), [radar sáu chuỗi](radar.png).
- [Theme tối và chart heading](theme.png).
- [Studio 1366](studio-1366.png), [Studio 1440](studio-1440.png), [Gallery](gallery.png), [PDF](print.pdf).

## Phạm vi và giới hạn

Bốn giai đoạn kiến trúc trong bản kế hoạch đính kèm đã được triển khai. Có thêm sửa theme Composer, heading chart và parity scatter để không tiếp tục mất thông tin ở các luồng bị ảnh hưởng.

Đây không phải bản biên tập lại toàn bộ 42 slide PARADOX. Fixture stress đó vẫn có **25 lỗi / 41 cảnh báo / 1 thông tin** ở pipeline Node: 20 lỗi `content.truncated` của template legacy, 5 lỗi trường dữ liệu chart; có thêm 5 cảnh báo va chạm mà QA mới phát hiện. Nội dung/loại chart sai ý nghĩa và các renderer legacy bị giới hạn trong F01–F09 vẫn cần sửa riêng theo audit gốc. Fixture và dữ liệu nguồn được giữ nguyên, không tự tạo số hay quan hệ để làm QA xanh.

Không khẳng định mục tiêu “100% không va chạm” cho mọi JSON bất kỳ: bố trí tránh nhãn là heuristic có giới hạn; đồ thị quá dày báo lỗi. Node chỉ ước lượng font và hình học; trình duyệt cần cho group transform, CSS và font thực. Raw HTML, style tác giả tự ghi đè và một phần tử quá lớn không có điểm chia cần kiểm tra/chỉnh sửa theo diagnostic. Table ưu tiên đủ nội dung: số hàng mỗi trang thực tế là 7–8 ở font hiện tại, thay vì ép 10–12 hàng rồi cắt mất hàng cuối.

## Chạy lại

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
CHROME_PATH=/path/to/chrome node tools/xbrain.mjs pipeline \
  tests/fixtures/recursive-pipeline.json --offline --browser -o /tmp/xbrain.html
XB_PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome \
  XB_BASELINE_HTML=/path/to/baseline.html \
  node tests/browser_improvements.mjs /tmp/xbrain-browser-check
```

Trong lượt kiểm chứng này Chromium dùng bản cài sẵn; thư viện hệ thống được cung cấp qua `LD_LIBRARY_PATH`. Ứng dụng không có thêm dependency runtime hoặc dịch vụ mạng bắt buộc.
