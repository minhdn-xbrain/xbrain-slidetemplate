# Kiểm chứng header mới

Ngày 06/11/2026, Asia/Bangkok. Baseline: `c655ace`. Release **1.0.0**, schema **1.0** giữ nguyên.

## Thay đổi

Header có hai tầng: ngữ cảnh tài liệu và nhóm thao tác. Trình chiếu được giữ bên phải; các thao tác khác nằm trong Tệp, Thêm slide, AI / JSON, Xuất và Tùy chọn. Gallery đổi tên Tổng quan theo đúng chức năng xem lưới slide của deck hiện tại. Logo âm bản dùng lại asset XBrain có sẵn.

Lịch sử phát thông báo trạng thái sau thay đổi/undo/redo, không ghi lịch sử trong render. Nhãn nháp chỉ báo đã lưu sau khi ghi localStorage thành công hoặc khôi phục thành công. QA giữ kết quả cùng snapshot đã kiểm tra, báo cần kiểm tra lại khi document hoặc dữ liệu URL đổi. Menu, chế độ xem và schema không sửa document.

## Kết quả

- **59/59 unittest pass**, gồm kiểm tra pixel bằng Chromium, không skip.
- Header không cuộn ngang ở **1440, 1366, 1024, 768, 640 và 390 px**; Trình chiếu và nhãn tác vụ chính nằm trong viewport.
- Header desktop cao **105 px**, baseline 108 px. Màn hình hẹp xuống hàng để giữ nhãn đọc được.
- Cả năm menu dùng được bằng chuột, Enter/Space, mũi tên, Home/End, Tab và Escape; focus trở về nút mở. Menu được đóng khi click ra ngoài hoặc resize.
- Import qua nút Tệp và file chooser hoạt động; version sai bị từ chối, giữ nguyên deck và tên tài liệu.
- Lưu nháp, khôi phục, lỗi quota/storage, undo/redo và trạng thái QA sau sửa/undo/redo đã kiểm tra.
- Đã mở các công cụ cũ từ vị trí mới: thư viện mẫu, Visual Library, JSON slide, JSON deck, Schema / Contract, thương hiệu và thông tin phiên bản.
- Sao chép schema/contract, fallback khi clipboard bị hạn chế và tải JSON tiếp tục hoạt động, cả sau xuất/mở lại HTML bằng file://.
- Tải JSON, HTML editable, gọi in toàn bộ slide, vào/thoát trình chiếu và khôi phục trạng thái sửa trực tiếp đã kiểm tra. Bộ kiểm thử hồi quy tạo PDF offline 12 trang.
- Fixture hồi quy: **0 lỗi / 0 cảnh báo**, một thông tin về feedback arc; **0 lỗi JavaScript**.
- Biên dịch cùng fixture ở baseline và bản mới cho kết quả document, slide HTML, hash và diagnostics giống nhau. Schema vẫn đồng bộ với runtime. `git diff --check` sạch.

Số liệu máy đọc: [results.json](results.json), [regression.json](regression.json).

## Ảnh

| Kích thước | Baseline | Header mới |
|---|---|---|
| 1366 px | [Trước](baseline-header-1366.png) | [Sau](header-1366.png) |
| 1440 px | [Trước](baseline-header-1440.png) | [Sau](header-1440.png) |

[Menu AI / JSON](ai-menu.png) · [Studio](studio-1366.png).

## Chạy lại

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
XB_PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome \
  node tests/browser_header.mjs /tmp/xbrain-header-check
XB_PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome \
  node tests/browser_improvements.mjs /tmp/xbrain-regression
```

Browser checks chạy Chromium headless, chặn HTTP(S) để kiểm chứng offline. Có thể đặt `XB_BASELINE_HTML` để chụp ảnh baseline. Lượt này chưa kiểm tra riêng Edge, Firefox/Safari, font CDN online hoặc từng extension AI cụ thể. Không thêm dependency runtime vào ứng dụng.
