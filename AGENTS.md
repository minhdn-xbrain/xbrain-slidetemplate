# XBrain Presentation System

Ứng dụng React/Vite theo kiến trúc **Presentation as Code**: template/renderer định nghĩa bố cục; JSON cung cấp nội dung, cấu hình và dữ liệu. Khi thêm slide, tái sử dụng template qua JSON và giữ nội dung tách khỏi logic render.

## Ràng buộc

- Build ứng dụng, CSS, SVG và dữ liệu mẫu thành một file `dist/index.html`.
- Bản build phải mở trực tiếp bằng `file://`; CDN chỉ là phần nâng cao tùy chọn.
- Giữ release `1.0.0` và JSON schema `1.0` trừ khi yêu cầu thay đổi version.
- Dùng namespace `v1-*` cho selector, CSS variable và ID; lưu bản nháp bằng khóa `xbrain-v1-draft`.
- Import document phải có `version: "1.0"`; từ chối version khác trước khi thay đổi deck.
- Ưu tiên linh hoạt; dự án không yêu cầu tăng cường bảo mật cho nội dung tác giả.

## Thiết kế và sửa mã

- Áp dụng SOLID bằng module có trách nhiệm rõ và interface nhỏ.
- Mở rộng layout, diagram và component qua registry hiện có.
- Khi sửa format JSON, template hoặc component, đọc `contracts/xbrain-deck-v1.schema.json` và cập nhật `src/__tests__/schema-contract.test.ts` tương ứng.
- Schema là sản phẩm dẫn xuất: cấu trúc ở `XB_SCHEMA_BASE`, enum lấy từ registry (`LAYOUT_CATALOG`, `COMPONENT_RENDERERS`, `CHART_VARIANTS`, `DIAGRAM_VARIANTS`). Sau khi sửa registry chạy `npm run schema`.
- Variant mới khai báo nhãn, hợp đồng dữ liệu và renderer trong cùng một mục registry; renderer chỉ vẽ trường có trong dữ liệu và báo thiếu qua `XBDiag.report`, không tự tạo giá trị hay quan hệ.
- Tạo/kiểm tra deck bằng `XBrainCompiler` trong `src/store/xbrainStore.ts`: `repair` → `qa` → xuất HTML; mặc định `strict` và `trusted`.
- Ghi nhận chỉnh sửa qua `DeckStore`; render không được thay đổi lịch sử.
- Khi sửa Agent API hoặc Console: giữ candidate tách khỏi Studio, kiểm revision cho mutation và chỉ commit/export strict sau QA browser đầy đủ của revision hiện tại.
- Agent dùng nội dung trusted, cho phép HTML, CSS, JavaScript và tài nguyên ngoài; giữ dual revision check khi đưa document vào Studio. Console gọi cùng Agent API và không tự có renderer hoặc logic patch riêng.
- Truyền dependency trình duyệt vào module xử lý dữ liệu và lưu trữ.
- Dùng event delegation cho thao tác UI; giữ implementation trong scope riêng.
- Chỉ xóa mã sau khi kiểm tra tham chiếu trong HTML, template, event và JSON.
- Khi sửa nhận diện thương hiệu, đọc `docs/XBrain_Brand Guidelines.pdf`.

## Kiểm chứng

- Kiểm tra luồng bị ảnh hưởng bằng trình duyệt và đối chiếu với baseline.
- Khi sửa state/editor: kiểm tra undo/redo và dữ liệu nhập không hợp lệ.
- Khi sửa import/export: kiểm tra JSON v1 hợp lệ, version sai và mở lại HTML xuất bằng `file://`.
- Khi sửa render: kiểm tra các loại liên quan, Gallery, bản in và fallback offline.
- Khi sửa Agent API hoặc Console: chạy các `src/__tests__/browser_agent_*.browser.test.tsx` liên quan, gồm luồng API và click-only, kiểm tra file/host, stale QA và nội dung tác giả tùy biến; ghi rõ môi trường và phần chưa kiểm chứng.
- Chạy `npm run lint`, `npm test` và `npm run test:browser` (cần Node ≥ 22.15 và Chromium); các fixture thật và edge case nằm trong `src/__tests__/fixtures/`.
- Báo rõ kiểm thử đã chạy, kết quả và phần chưa kiểm chứng.
