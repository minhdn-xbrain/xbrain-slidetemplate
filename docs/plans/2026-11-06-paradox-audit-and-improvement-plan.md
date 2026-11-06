# PARADOX: kiểm tra màn hình và kế hoạch cải thiện

Ngày kiểm tra: **06/11/2026**, Asia/Bangkok. Baseline: commit `d8e5468` và fixture người dùng cung cấp `tests/fixtures/paradox_xbrain.json` (42 slide). Lượt audit này không sửa mã ứng dụng hoặc fixture gốc. Khi hoàn tất có thay đổi bên ngoài workspace đổi tên “Template as Code” thành “Presentation as Code”; đã giữ nguyên và kiểm tra lại. Hash baseline và hash workspace lúc hoàn tất nằm trong manifest. Đây là báo cáo chẩn đoán và kế hoạch triển khai, chưa phải bản sửa lỗi.

## Kết quả chính

Có **19 nhóm vấn đề được xác nhận**, gồm lỗi renderer, lỗi cấu hình/nội dung fixture và lỗi thao tác trong Studio. Nghiêm trọng nhất là **số liệu bị đổi hoặc mất mà QA không báo**, không chỉ là bố cục thiếu đẹp.

| Kiểm tra | Kết quả baseline |
|---|---|
| Compiler strict, untrusted trên deck gốc | **25 lỗi, 36 cảnh báo, 1 thông tin**, điểm 81,69/100 |
| Studio lenient, trusted | **22 lỗi, 39 cảnh báo, 1 thông tin**, điểm 83,19/100 |
| QA có Chromium đo pixel | 0 phát hiện pixel bổ sung; vẫn có các lỗi dữ liệu và hiển thị bên dưới |
| `repair` trên bản sao | **0 thay đổi**; vẫn 25 lỗi / 36 cảnh báo |
| Mở trực tiếp `file://` | Đã kiểm tra 42/42 slide online và 42/42 offline |
| Bộ unittest hiện có | **41/41 pass**, gồm bài đo trình duyệt sau khi cung cấp Chromium và thư viện hệ thống |
| Xuất HTML từ Studio, mở lại bằng `file://`, chặn mạng | 42 slide; deck trước/sau giống nhau qua JSON serialization |
| In qua renderer của Studio | PDF **42 trang**, 1440 × 810 pt, đúng tỷ lệ 16:9; lỗi nội dung vẫn tồn tại |

**25 lỗi là số diagnostic, không phải 25 lỗi độc lập.** Trong đó có 20 diagnostic `content.truncated` và 5 diagnostic `data.field-missing`. 36 cảnh báo gồm 24 `layout.legibility`, 8 `text.truncated`, 2 `data.series-missing`, 1 `data.truncated`, 1 `data.field-missing`.

Ảnh tổng quan đủ 42 slide:

| Chế độ | Slide 01–14 | Slide 15–28 | Slide 29–42 |
|---|---|---|---|
| Online, Manrope/Nunito và CDN tải thành công | [Ảnh](../audits/2026-11-06-paradox/online-01-14.jpg) | [Ảnh](../audits/2026-11-06-paradox/online-15-28.jpg) | [Ảnh](../audits/2026-11-06-paradox/online-29-42.jpg) |
| Offline, chặn toàn bộ HTTP/HTTPS | [Ảnh](../audits/2026-11-06-paradox/offline-01-14.jpg) | [Ảnh](../audits/2026-11-06-paradox/offline-15-28.jpg) | [Ảnh](../audits/2026-11-06-paradox/offline-29-42.jpg) |

## Danh sách vấn đề và hướng xử lý

P0: có thể khiến người xem hiểu sai số liệu, cần xử lý trước khi dùng deck để trình bày. P1: mất nội dung, khó đọc hoặc cản trở chỉnh sửa. Vị trí mã tính theo baseline; JSON pointer dùng chỉ số từ 0, số slide trong báo cáo tính từ 1.

### F01 · P0 · Heatmap đổi số và mất quận — slide 09

- **Thực tế:** Đông Lưới / B = `23.4` và Nam Cảng / B = `27.1` đều thành `5`; chỉ còn 6 hàng, mất **Đảo Nổi**. Chú giải hiện `0 = Not ready / 5 = Advanced` không đúng đơn vị rủi ro của deck, còn nằm đè lên hàng cuối.
- **Nguyên nhân xác nhận:** `dgHeat` tại HTML:4222 dùng `slice(0,6)` và `Math.round(dgClamp(v,0,5))`. Mục `heatmap` trong `LAYOUT_CATALOG` không khai báo giới hạn này; schema nhận số bất kỳ. Bản tối giản một ô `27.1` vẫn ra `5` với `diagnostics: []`.
- **Hướng sửa:** giữ nguyên giá trị hiển thị; tách miền màu khỏi số gốc; hỗ trợ miền/đơn vị dữ liệu rõ ràng và đủ 7 hàng hoặc báo quá giới hạn. Giữ hành vi thang năng lực cũ bằng cấu hình tương thích, không áp 0–5 cho mọi heatmap.
- **Nghiệm thu:** đủ 42 ô, 7 quận; đọc được `23.4`, `27.1`; chú giải đúng đơn vị và không đè lên bảng; miền ngoài hợp đồng phải có diagnostic.
- [Ảnh màn hình](../audits/2026-11-06-paradox/slide-09.png), [ảnh từ PDF](../audits/2026-11-06-paradox/print-9.png).

### F02 · P0 · Sankey mất Microgrid và sai tỷ lệ dòng — slide 11

- **Thực tế:** có 5 nguồn nhưng chỉ vẽ 4. Microgrid `19.0268 GWh` biến mất trong khi ghi chú vẫn tuyên bố tổng `380.535 GWh`. Dòng 167.4355 và 91.3284 có cùng độ rộng dù giá trị khác nhau.
- **Nguyên nhân:** `dgSankey`, HTML:4221, cắt nguồn còn 4, bỏ link đến nguồn bị cắt; độ rộng dùng `clamp(value,2,70)`, có sàn 10 px. Không có diagnostic cho trường hợp này.
- **Hướng sửa:** ưu tiên tái sử dụng bộ Sankey của Composer với adapter dữ liệu từ `sources/targets/links`; chuẩn hoá độ rộng theo cùng một hệ số tỷ lệ. Không tự thêm quan hệ. Đưa giới hạn và kiểm tra tổng vào registry/QA.
- **Nghiệm thu:** 5 nguồn, 5 link; tổng dòng đã vẽ khớp `380.5352` theo số nguồn đã làm tròn và khớp `380.535` trong dung sai đã khai báo; tỷ lệ độ rộng theo dữ liệu.
- [Ảnh](../audits/2026-11-06-paradox/slide-11.png).

### F03 · P0 · Ma trận so sánh lệch tiêu đề cột — slide 36

- **Thực tế:** hàng A có `16.7` dưới **KỊCH BẢN**, `165` dưới **THIẾU ĐIỆN**, `85.2` dưới **CHI PHÍ**, `4.7` dưới **ĐỈNH Y TẾ**, và `—` dưới **CHÊNH QUẬN**. Toàn bộ 6 hàng bị lệch.
- **Nguyên nhân:** fixture đưa 5 tiêu đề gồm cả cột nhãn, nhưng `dgMatrix` (HTML:4215) dành nhãn hàng ở ngoài rồi ánh xạ `columns[j]` vào `values[j]`; mỗi hàng chỉ có 4 giá trị. Validator không kiểm tra độ dài hai mảng.
- **Hướng sửa:** trước mắt sửa bản deck sử dụng để `columns` chỉ chứa 4 tiêu chí số. Làm rõ hợp đồng cột nhãn; QA kiểm tra số giá trị/cột, giữ số `0` thay vì dùng `value || '—'`.
- **Nghiệm thu:** số `16.7` nằm dưới **THIẾU ĐIỆN GWh**, `165.0` dưới **CHI PHÍ**; dữ liệu thiếu/thừa cột phải báo đúng JSON pointer.
- [Ảnh](../audits/2026-11-06-paradox/slide-36.png).

### F04 · P0 · Sáu điểm bị ép về cùng trục X — slide 38

- **Thực tế:** toàn bộ điểm A–F dồn ở mép phải; không thể so sánh chi phí `107.4` đến `225.5`.
- **Nguyên nhân:** `dgPriority` tại HTML:4302–4303 kẹp X/Y vào 0–100. Fixture đưa X theo tỷ VND; schema chỉ yêu cầu `number`, không có ràng buộc miền hoặc diagnostic. Probe 2 điểm cho cùng `cx=1100`; đổi X sang 10 và 80 thì vị trí khác nhau.
- **Hướng sửa:** cho deck này dùng scatter với `x=costBn`, `y=mitigationPct` và nhãn trục/đơn vị. Với template priority cũ, khai báo rõ miền 0–100 và báo ngoài miền; nếu mở rộng hỗ trợ miền tự chọn thì bổ sung schema tương thích và tick trục.
- **Nghiệm thu:** sáu X khác nhau nằm đúng vị trí; giá trị ngoài miền không được kẹp im lặng.
- [Ảnh](../audits/2026-11-06-paradox/slide-38.png).

### F05 · P1 · Hub sáu nhánh chỉ có A/B/C — slide 10

- `dgDecisionTree` (HTML:4406) cắt 3 nhánh; D/E/F mất hoàn toàn. QA đã báo đúng giới hạn, nhưng Studio vẫn import/render một bản đồ không đầy đủ.
- **Hướng sửa:** hỗ trợ bố cục 6 nhánh trong registry hiện có, hoặc thay bằng component phù hợp đủ 6 mục. Không chia hub thành hai slide làm mất khả năng nhìn tổng thể nếu còn phương án vừa khung.
- **Nghiệm thu:** nhìn thấy đủ A–F và trang đích tương ứng; root không có dấu `…`.
- [Ảnh](../audits/2026-11-06-paradox/slide-10.png).

### F06 · P1 · Mất mốc 72h, nhãn số làm tròn quá thô — slide 14/18/22/26/30/34

- `dgLineChart` (HTML:4498) chỉ lấy 12 nhãn trong 13 mốc, nên trục dừng ở 66h. `xFmt` (HTML:4245) luôn làm tròn một chữ số thập phân: ở slide 14, `0.057` hiện `0,1`, `0.038` hiện `0`.
- **Hướng sửa:** dùng bố cục đủ 13 điểm hoặc Composer line; thống nhất precision theo đơn vị/miền để phân biệt giá trị GW nhỏ. Thưa nhãn trục nếu cần nhưng giữ mọi điểm dữ liệu.
- **Nghiệm thu:** đủ 0–72h, mỗi chuỗi 13 điểm; nhãn khác 0 cho số dương này và phân biệt được trước/sau; không bỏ mẫu để vừa giới hạn.

### F07 · P1 · Radar chỉ có A/B, mất C–F — slide 37

- `dgRadar` (HTML:4567) chỉ lấy 2 series; bảng bên cạnh cũng chỉ phục vụ hai chuỗi và chênh lệch. Deck yêu cầu so 6 kịch bản; QA đã báo giới hạn.
- **Hướng sửa:** dùng radar hỗ trợ nhiều series hoặc small multiples có cùng miền/trục, đủ chú giải A–F; không đơn thuần tăng `slice` vì bảng và bảng màu vẫn cố định hai chuỗi.
- **Nghiệm thu:** đủ 6 chuỗi, 4 trục và bảng/chú giải đồng bộ, không đánh đồng chênh lệch hai chuỗi với thang điểm chuẩn hoá.
- [Ảnh](../audits/2026-11-06-paradox/slide-37.png).

### F08 · P1 · Variant không khớp dữ liệu — slide 13/17/21/25/29/33/40

| Slide / component (tính từ 1) | Vấn đề | Xử lý bản deck sử dụng |
|---|---|---|
| 13 / 5 · stacked-bar | Chỉ có `value`, không có nhiều series | Dùng một hàng `{Phục vụ, Thiếu}` để thể hiện cấu phần tải, hoặc bar so sánh |
| 17 / 6 · gauge | Nhận 7 quận, chỉ vẽ Bắc Bến | Đổi chart so sánh đủ 7 hàng; không gộp thành số tổng nếu không định nghĩa phép gộp |
| 21 / 6 · bullet | Không có target | Đổi bar, hoặc cung cấp target có nguồn |
| 25 / 6 và 40 / 1 · scatter | Thiếu X | Cung cấp X/Y có ý nghĩa từ dữ liệu hiện có, hoặc đổi chart |
| 29 / 6 · dumbbell | Không có before/after → `No data` | Dùng bar so sánh quận; không tự tạo before/after |
| 33 / 5 · bubble | Thiếu X, Y/size chưa được định nghĩa theo ý nghĩa | Cung cấp đại lượng đúng hoặc đổi chart |
| 40 / 4 · range-bar | Không có start/end → `No data` | Đổi dot/bar; chỉ dùng range khi có hai đầu khoảng thật |
| 40 / 6 · marimekko | Chỉ có một series | Dùng bar hoặc chuẩn bị dữ liệu cấu phần thật |

Mỗi variant cần có ví dụ dữ liệu hợp lệ và báo thiếu ngay tại component. Giữ fixture stress gốc để kiểm tra lỗi; không chữa dữ liệu bằng số bịa. [Slide 29](../audits/2026-11-06-paradox/slide-29.png), [slide 40](../audits/2026-11-06-paradox/slide-40.png).

### F09 · P0 · Chart đúng cú pháp nhưng sai ý nghĩa — slide 17/21/25/29/33/39/40

- Slide 25 donut nhận **Tải + Phục vụ + Thiếu**, dù Tải đã bằng hai phần còn lại: hiện `TOTAL 806` thay cho tải khoảng `402.831 GWh`. Phục vụ nhìn thành 47% thay vì khoảng 93,6% tải.
- Slide 17 waterfall cộng cả ba số dương: `415.911 + 371.707 + 44.204 = 831.822`, không mô tả được bảo toàn điện.
- Slide 29 treemap dùng tổng và các phần như các ô độc lập, nhân đôi tổng; phần Thiếu còn mất nhãn vì quá nhỏ.
- Slide 21 area nối các danh mục Tải/Phục vụ/Thiếu; slide 33 và 40 funnel coi quận/kịch bản độc lập là các bước, xuất hiện `265% of previous` ở slide 40. Đây là lựa chọn chart sai thông điệp của fixture, không phải sai thuật toán funnel.
- Slide 39 waffle cộng các tỷ lệ giảm chi phí của sáu kịch bản độc lập rồi phân bổ 100 ô, khiến người xem dễ hiểu thành các phần của cùng tổng.
- **Hướng sửa:** donut/treemap chỉ lấy các cấu phần không giao nhau; waterfall dùng Tải → trừ Thiếu → Phục vụ với dấu và `total` đúng hợp đồng. Dùng bar/dot để so quận hoặc kịch bản độc lập; hiển thị đơn vị và ghi chú chuyển đổi. Bổ sung kiểm tra quan hệ dữ liệu khi quan hệ được khai báo, không suy đoán từ tiêu đề.
- **Nghiệm thu:** tất cả tổng/tỷ lệ đọc được từ chart đối chiếu với dataset; chart nào không đủ dữ liệu phải báo thiếu. [Slide 25](../audits/2026-11-06-paradox/slide-25.png), [slide 17](../audits/2026-11-06-paradox/slide-17.png).

### F10 · P0 · Studio và build strict vẽ khác dữ liệu — slide 25/33/40

- `deckScatter` (HTML:4963–4966) trong lenient tự lấy X = `i+1` khi thiếu X, nên Studio vẫn hiện điểm. Compiler strict báo lỗi và hiện `No data`.
- **Hướng sửa:** chart có dữ liệu một phần phải giữ cùng quy tắc “không tự tạo số” trong mọi chế độ. Nếu cho phép scatter danh mục/index, phải là lựa chọn được khai báo, có nhãn rõ. QA trong Studio phải cho biết kết quả chế độ xuất, không chỉ kết quả lenient.
- **Nghiệm thu:** cùng JSON và cùng options cho cùng số mark/tọa độ; không xuất hiện X tự suy ra khi chưa khai báo. [Studio](../audits/2026-11-06-paradox/slide-25.png), [static strict](../audits/2026-11-06-paradox/static-25.png).

### F11 · P1 · Theme làm tiêu đề Composer gần như biến mất — slide 13/17/21/25/29/33/39/40

- Đo CSS: chữ `rgb(234,247,255)` (`#EAF7FF`) trên nền trắng. Tái hiện cả online/offline.
- `deckComposer` (HTML:5811–5814) lấy token `ink` nhưng nền mặc định vẫn trắng, trạng thái dark dựa vào `slide.variant`, bỏ qua `theme.preset` của fixture.
- **Hướng sửa:** có một bộ resolve theme xác định foreground/background/logo theo preset và override, dùng chung renderer; kiểm tra tương phản. Định nghĩa rõ phạm vi theme với template legacy thay vì chỉ áp một phần token.
- **Nghiệm thu:** tiêu đề đạt tỷ lệ tương phản ít nhất 3:1 cho chữ lớn, body ít nhất 4,5:1; kiểm tra cả nền sáng/tối và logo phù hợp. Nếu thay nhận diện, đọc Brand Guidelines PDF trước.
- [Ảnh](../audits/2026-11-06-paradox/slide-13.png), [bản in](../audits/2026-11-06-paradox/print-13.png).

### F12 · P1 · Tên chart không hiện trong hình — toàn bộ 24 chart Composer

- JSON có `title` nhưng renderer `chart` (HTML:5717) chỉ vẽ SVG; tiêu đề chủ yếu được dùng trong nội dung truy cập/metadata, không thành heading hiển thị. Các khung trong Atlas không cho biết rõ đang đo gì.
- **Hướng sửa:** thống nhất tuỳ chọn title/heading của chart và `chart-card`, tính chiều cao heading trong layout. Bổ sung đơn vị/chú giải đúng dữ liệu; tránh hiển thị hai tiêu đề khi dùng chart-card.
- **Nghiệm thu:** người xem phân biệt được chỉ số và đơn vị của mọi chart mà không đọc JSON.

### F13 · P1 · Nhãn chart quá nhỏ — toàn bộ 8 slide Composer

- QA báo **24** cảnh báo khả năng đọc: chart ở slide kịch bản khoảng 852×238 px trong scene, Atlas khoảng 560×310 px; sau scale xuống laptop, nhiều nhãn chỉ còn vài pixel.
- `xbSolveGrid` / `deckCheckFit` (HTML:5748 trở đi) giải được khung nhưng chưa đảm bảo kích thước chữ thực tế sau SVG/viewBox và scale toàn slide.
- **Hướng sửa:** ưu tiên nội dung: bớt chart mỗi slide, tăng diện tích plot, giảm tick hợp lý, layout chữ theo kích thước thực. Dùng nhãn số tối thiểu khoảng 18–20 px trong scene 1920 px làm điểm xuất phát rồi kiểm tra trên laptop/máy chiếu; không chỉ tăng chiều cao khung trong khi SVG tiếp tục co toàn bộ.
- **Nghiệm thu:** có baseline ảnh ở 1366×768 và 1440×900, nhãn đọc được; QA đo kích thước text sau transform; mỗi cảnh báo còn lại có lý do và ảnh đối chiếu.

### F14 · P1 · Process ba bước nhỏ, lệch trái, chữ bị cắt — slide 15/19/23/27/31/35

- `dgProcess` (HTML:4211) dùng toạ độ dành cho 5 bước (`x=14+i*341`, rộng 315) dù đầu vào chỉ có 3 bước. Chữ hành động dài bị rút gọn, trong khi nửa phải gần như trống.
- **Hướng sửa:** tính slot theo số bước thực, dùng khoảng trống để tăng chiều rộng và xuống dòng; kiểm tra cả 3 và 5 bước trong Gallery/print.
- **Nghiệm thu:** đủ ba tiêu đề hành động, không `…` ở các câu hiện bị cắt của slide 15/19/27; bố cục cân đối trong vùng graphic.

### F15 · P1 · Form Composer không đọc nội dung đang có — 8 slide Composer

- Mở Sửa nội dung ở slide 25: chỉ thấy `title`, `subtitle` **đều trống**; không thấy metric/chart nào.
- `openContentEditorModal` (HTML:7869) chỉ đọc `current.title/current.components`, trong khi fixture hợp lệ dùng `content.title/content.components`. Renderer hỗ trợ cả hai dạng. Lưu title mới tạo override ở cấp slide; undo/redo của thay đổi này đã hoạt động.
- **Hướng sửa:** resolver chung xác định vị trí dữ liệu của Composer, form đọc/ghi cùng đường dẫn nguồn, không tạo hai nguồn khác nhau. Mọi cập nhật đi qua `DeckStore`.
- **Nghiệm thu:** form hiển thị đúng title/subtitle và 7 component của slide 25; sửa metric, lưu, undo, redo, export/reimport đều nhất quán cho cả hai dạng JSON.
- [Ảnh](../audits/2026-11-06-paradox/content-editor.png).

### F16 · P1 · Form dài đẩy cả tiêu đề và nút Lưu khỏi màn hình — slide 14

- Ở viewport 1920×1080, nút Lưu có `y=1645`; Playwright không thể click bằng tương tác thông thường. Modal dài vượt màn hình cả hai đầu.
- Wrapper dùng `max-h-[90vh]` (HTML:3580) nhưng stylesheet offline chỉ có utility `max-h-[85vh]`, không có lớp `90vh`. Khu vực fields cũng cần `min-height:0` để cuộn đúng trong flex.
- **Hướng sửa:** dùng CSS `v1-*` được nhúng thật, giới hạn chiều cao modal, header/footer cố định trong flex và phần fields cuộn.
- **Nghiệm thu:** title, Hủy, Lưu luôn trong viewport 1366×768/1440×900/1920×1080; sửa được trường cuối mà không phải kích hoạt nút bằng mã.
- [Ảnh](../audits/2026-11-06-paradox/long-editor.png).

### F17 · P1 · Nhập số không hợp lệ bị âm thầm đổi thành 0

- Trong form slide 14, sửa `yMax=0.55` thành `abc`; `applyContentEditor` (HTML:7889) dùng `Number(value)||0`, lưu thành `0`, đóng modal. Để kiểm tra phần dữ liệu này đã kích hoạt nút Lưu qua DOM vì F16 chặn click thông thường. Undo trả `0.55`, redo trở lại `0`.
- **Hướng sửa:** parse và validate toàn bộ form trước transaction; báo lỗi tại trường, giữ deck/history nguyên trạng khi dữ liệu sai; phân biệt rỗng, số 0 hợp lệ và giá trị không phải số. Quy định nhập số thập phân theo locale.
- **Nghiệm thu:** `abc`, rỗng không hợp lệ, Infinity và miền sai không ghi deck; `0` hợp lệ vẫn lưu được; undo/redo chỉ thêm một bước cho một lần lưu hợp lệ.

### F18 · P1 · Toolbar mất nút trên laptop

- Ở 1440 px, `↻ Data` và `Trình Chiếu` ra ngoài màn hình; cạnh phải Trình Chiếu khoảng **1649,9 px**. 1366 px còn mất thêm một phần Visual Library. 1920 px hiển thị đủ.
- **Hướng sửa:** bố trí nhóm thao tác chính gọn lại, menu cho thao tác phụ hoặc hàng cuộn có dấu hiệu rõ; giữ Trình Chiếu và xuất file truy cập được. Không yêu cầu người dùng thu nhỏ zoom trình duyệt.
- **Nghiệm thu:** nút chính click và focus bằng bàn phím được ở cả ba viewport; không bị `overflow:hidden` của app cắt mất.
- [1440 px](../audits/2026-11-06-paradox/studio-1440.png), [1366 px](../audits/2026-11-06-paradox/studio-1366.png).

### F19 · P1 · QA không đưa đủ thông tin để sửa và còn bỏ lọt sai dữ liệu

- `runDeckQA` (HTML:7900) dùng alert, chỉ hiện 18/61 mục; báo còn 43 mục và yêu cầu mở console. 18 mục đầu chủ yếu lặp lỗi timeline, khiến những lỗi chart phía sau khó tiếp cận.
- QA không báo sai số heatmap, mất Microgrid, kẹp toàn bộ X của priority hoặc lệch cột. `xbSemanticCheck` (HTML:8743) dựa vào một số mark SVG của Composer; các template legacy trên không có hợp đồng kiểm tra tương đương. Pixel QA chỉ đo hình học, không kiểm ý nghĩa, độ tương phản hay nội dung bị bỏ trước render.
- Hai bộ test hiện có không đưa fixture `paradox_xbrain.json` vào các ca deck thực: `test_json_contract.py` chỉ tự nạp tên `deck-*.json`; `test_compiler.py` liệt kê các deck khác. Vì vậy 41 test xanh không chứng minh deck này dùng được.
- **Hướng sửa:** panel QA có danh sách đủ, nhóm theo slide/nguyên nhân, chọn để nhảy slide, lọc severity và tải JSON; cho thấy cấu hình strict/trust. Mở rộng semantic assertions cho template legacy, giới hạn registry, và đối chiếu dữ liệu→mark, tránh chỉ dựa vào điểm tổng.
- **Nghiệm thu:** truy cập được mọi diagnostic trong UI; lỗi P0 có ca kiểm tra độc lập; không có ca kẹp/mất dữ liệu im lặng trong các layout đã kiểm.

## Phạm vi đã kiểm và các giới hạn cần phân biệt

| Màn hình / luồng | Đã kiểm | Kết quả và giới hạn |
|---|---|---|
| Slide Studio | Chọn/render/chụp 42 slide online + offline, 3 viewport cho shell | Không có exception JS trong lượt capture offline; có F01–F18 |
| Gallery | Mở deck 42 slide, ảnh grid và count | Render được; vẫn thừa hưởng lỗi renderer; filter group dùng group của fixture |
| Brand Design System | Mở màn hình, chụp baseline | Chưa kiểm toán tuân thủ từng trang Brand Guidelines PDF; không thay nhận diện |
| Sửa nội dung | Composer, form dài của line-chart, sửa số sai | F15–F17; undo/redo của các thay đổi đã thử hoạt động |
| Slide JSON | Nhập JSON sai cú pháp | Báo lỗi và giữ deck nguyên trạng |
| Mở JSON | Fixture v1 hợp lệ, fixture version sai | v1 mở được; version sai bị từ chối trước khi thay deck |
| Visual Library | Mở, tìm `scatter` | Có 1/104 variant; chưa thử chèn toàn bộ 104 variant |
| QA | Nút UI, API strict/lenient, CLI và pixel measurement | Có diagnostic; UI cắt danh sách và nhiều ca bỏ lọt |
| Trình chiếu | Vào từ slide 25, ArrowRight sang 26, Escape | Chuyển slide được; chưa kiểm tra mọi shortcut, máy chiếu và fullscreen policy của mọi trình duyệt |
| Export HTML | Xuất từ Studio rồi mở file mới, chặn mạng | Giữ 42 slide và nội dung deck; không chữa lỗi hình |
| Print/PDF | Gọi luồng Studio, tạo PDF 42 trang, raster kiểm tra trang 9/13/25/38/40 | Đúng tỷ lệ; F01/F11 còn tồn tại trong bản in |
| Static build strict | Build và mở file; đối chiếu 9/13/25/33/38/40 | Khác lenient ở chart thiếu dữ liệu, xem F10 |

Các điểm **không quy thành bug tính năng**:

- Fixture ghi rõ nhảy nhánh tương tác thuộc PPTX, JSON chỉ là bản đồ thị giác. XBrain chưa có hợp đồng `targetSlideId` cho nhánh này; bấm A–F để nhảy trang là tính năng bổ sung nếu cần, không phải lỗi đã hứa hỗ trợ. Không dùng số trang làm định danh vì reorder sẽ làm sai đích.
- Slide 06 dùng `system-architecture` để vẽ các zone và mũi tên tuần tự, không phải dependency graph 6 hệ. JSON không có edges để mô tả mạng phụ thuộc thực. Nếu chuyển sang graph, phải có quan hệ được cung cấp; không suy từ văn xuôi hoặc thứ tự zone.
- `paradox_model.json` / `paradox_audit.json` được nhắc trong deck nhưng không có trong repo tại thời điểm kiểm tra. Dataset đã nhúng vẫn dùng được; chưa thể xác minh provenance/audit ngoài fixture. Các group A–E của fixture đang được dùng theo chương, khác nghĩa group layout trong UI.

## Kế hoạch triển khai

### Đợt 1 — Khóa các lỗi sai dữ liệu trước (P0)

1. Đưa các ca tối giản F01–F04/F10 vào `tests/test_compiler.py`; đưa fixture PARADOX vào danh sách kiểm rõ ràng. Giữ deck stress gốc và các giá trị đầu vào để chứng minh lỗi; không xóa dữ liệu nhằm làm QA xanh.
2. Khai báo đủ hợp đồng/limits trong registry, bổ sung validator cho số cột, miền, số nguồn/link, và diagnostic khi bỏ mục. Với heatmap/Sankey, ưu tiên adapter sang renderer có hợp đồng dữ liệu sẵn thay vì duy trì hai thuật toán không tương đương.
3. Tạo **bản deck sử dụng riêng** đã chỉnh đúng variant, mapping và quan hệ tổng/phần (F03/F04/F08/F09). Chỉ map dữ liệu đã tồn tại; các trường không có nguồn phải đổi chart hoặc báo thiếu. Sửa scatter để mọi chế độ không tạo X ngầm.
4. Với mọi thay đổi schema/registry: sửa nguồn `XB_SCHEMA_BASE` trong HTML và registry, sinh lại schema bằng `node tools/xbrain.mjs schema --write`, cập nhật `tests/test_json_contract.py`. Giữ release `1.0.0`, schema `1.0` và khả năng đọc deck cũ.

**Cổng nghiệm thu:** không còn đổi số/mất mục im lặng trong ca P0; tổng và tỷ lệ chart của bản deck sử dụng đối chiếu được với dataset; input thiếu được báo rõ; strict và Studio không vẽ những đại lượng khác nhau.

### Đợt 2 — Phục hồi đủ nội dung và khả năng đọc

1. F05–F07: bố cục đủ 6 nhánh, 13 điểm và 6 series; chọn adapter Composer hoặc layout phù hợp, đồng bộ giới hạn và bảng/chú giải.
2. F11–F14: resolve theme thống nhất, heading chart hiển thị, tăng kích thước chữ thực tế, process layout theo số bước. Atlas có thể chia thành nhiều slide; các nhãn/đích tương tác nếu bổ sung sau phải tham chiếu ID ổn định.
3. Chụp lại mọi slide liên quan, Gallery và print ở online/offline; đối chiếu bộ ảnh baseline trong audit này.

**Cổng nghiệm thu:** bản deck sử dụng có `summary.errors == 0`; toàn bộ nội dung thiết yếu hiển thị; không còn tiêu đề chìm vào nền, chart không tên hoặc nhãn không đọc được. Cảnh báo còn lại phải được xem bằng ảnh, không chỉ chấp nhận vì điểm tổng cao.

### Đợt 3 — Làm Studio chỉnh sửa được trên laptop

1. F15: module nhỏ resolve đường dẫn Composer dùng chung cho form/render; ghi qua `DeckStore`, không thay dữ liệu khi render.
2. F16/F18: CSS nhúng `v1-*` cho modal và toolbar, không phụ thuộc lớp utility chưa sinh.
3. F17: parse/validate bản nháp form trước khi commit một transaction; không ghi số 0 thay lỗi nhập.
4. F19: panel QA đủ danh sách, lựa chọn slide, lọc và xuất báo cáo; hiển thị rõ QA cho chế độ xuất. Không thêm bước hỏi xác nhận lặp lại chỉ để che lỗi.

**Cổng nghiệm thu:** ở 1366×768 có thể mở form, đến trường cuối, Lưu/Hủy và vào trình chiếu; nhập sai không đổi deck/history; một lần lưu tương ứng một bước undo/redo; các dạng Composer cũ đều sửa được.

### Đợt 4 — Hồi quy và xuất bản

- Với bản deck sử dụng: chạy **repair → qa → build**, mặc định strict/untrusted; giữ report và ảnh trước/sau. Không áp repair trực tiếp lên fixture stress.
- Chạy toàn bộ unittest, browser QA và các ca UI cụ thể đã bổ sung; kiểm JSON hợp lệ, version sai, JSON lỗi, undo/redo, export HTML mở lại bằng `file://`.
- Kiểm print 16:9, đủ trang, không cắt nội dung; chặn mạng để kiểm fallback. Giữ runtime/CSS/SVG/sample trong một HTML, draft key `xbrain-v1-draft`, selector/ID/variable mới dùng `v1-*`.
- Chưa cam kết Safari/Firefox/mobile/máy chiếu đến khi có kiểm tra thực tế; chúng không nằm trong baseline Chromium lần này.

Thứ tự phụ thuộc: **đợt 1 → đợt 2 → đợt 3 → đợt 4**. Có thể làm phần CSS modal/toolbar sớm, nhưng nghiệm thu deck chỉ sau khi khóa tính đúng của dữ liệu. Chưa ước lượng thời gian vì đợt 2 cần quyết định mức tái sử dụng Composer so với mở rộng layout legacy.

## Tái hiện và bằng chứng máy đọc được

Chạy từ thư mục repo:

```bash
# Chỉ đọc runtime/fixture; hiện tại phải exit 1: 6 FAIL, 1 PASS control.
node docs/audits/2026-11-06-paradox/reproduce.mjs

# Báo cáo deck gốc, không sửa đầu vào.
node tools/xbrain.mjs qa tests/fixtures/paradox_xbrain.json --json

# Vòng lặp compiler trên bản sao, vẫn ghi build dù còn lỗi để xem baseline.
node tools/xbrain.mjs repair tests/fixtures/paradox_xbrain.json -o /tmp/paradox-audit-repaired.json --json
node tools/xbrain.mjs qa /tmp/paradox-audit-repaired.json --json
node tools/xbrain.mjs build /tmp/paradox-audit-repaired.json --offline -o /tmp/paradox-audit.html

# CHROME_PATH trỏ Chrome/Chromium có thể chạy trên máy.
CHROME_PATH=/path/to/chrome node tools/xbrain.mjs qa tests/fixtures/paradox_xbrain.json --browser --json
python3 -m unittest discover -s tests -p 'test_*.py'
```

Các lệnh repair/qa/build trên stress deck hiện exit 1 là **kết quả phát hiện lỗi**, không phải lỗi hạ tầng. Bản repair giữ nguyên 42 slide; build baseline hash `bae91d2eca725182`. Script tái hiện chạy lặp lại cho cùng kết quả, không cần trình duyệt hoặc npm dependency.

Trình duyệt của môi trường ban đầu thiếu Chrome ở đường dẫn MCP mặc định và thiếu `libnspr4/libnss3/libasound`. Đã dùng Chromium cục bộ, Playwright Core và thư viện giải nén trong `/tmp`; không thay môi trường dependency của repo. Lượt unittest đầu 40 pass/1 skip; sau khi cấu hình đầy đủ, **41 pass/0 skip**. Cú pháp tương đương trong AGENTS là `python -m unittest…`; máy này chỉ có `python3`.

- [Log kiểm chứng](../audits/2026-11-06-paradox/validation.txt).
- [Manifest: hash nguồn, viewport, phạm vi](../audits/2026-11-06-paradox/manifest.json).
- [QA strict nguyên bản](../audits/2026-11-06-paradox/qa-original.json), [QA có browser](../audits/2026-11-06-paradox/qa-browser.json), [repair không thay đổi](../audits/2026-11-06-paradox/repair-report.json).
- [Probe tối giản](../audits/2026-11-06-paradox/reproduce.mjs), [kết quả probe](../audits/2026-11-06-paradox/repro-results.json).
- [Text/SVG boxes của 42 slide offline](../audits/2026-11-06-paradox/browser-slides.json), [đối chiếu online](../audits/2026-11-06-paradox/online-observations.json).
- [Luồng UI, dialog QA và export roundtrip](../audits/2026-11-06-paradox/flows.json), [nhập số sai/JSON lỗi/Library](../audits/2026-11-06-paradox/editor-probes.json).
