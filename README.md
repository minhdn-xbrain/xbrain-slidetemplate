# XBrain Presentation System

Presentation as Code với React, TypeScript và Vite. Nội dung deck dùng JSON schema `1.0`; bản phát hành ứng dụng là `1.0.0`.

## Phát triển

Cần Node.js 22.15 trở lên và npm.

```sh
npm ci
npm run dev
```

Vite phục vụ mã nguồn trong lúc phát triển. Để tạo bản HTML độc lập có thể mở bằng `file://` và hoạt động offline:

```sh
npm run build
```

Mở `dist/index.html` trong trình duyệt. Để xuất một bản HTML có thể chỉnh sửa, thực hiện thao tác xuất từ bản build này; server phát triển không chứa ứng dụng trong một tệp HTML.

Ảnh, SVG và CSS được lưu trong `public/assets`; cấu hình Vite đọc và nhúng chúng vào HTML khi build. Module `src/lib/xbrainAssets.ts` cung cấp các asset này cho ứng dụng và compiler.

## Kiểm tra và compiler

```sh
npm run lint
npm test
python3 -m unittest discover -s src/__tests__ -p 'test_*.py'
npm run schema
```

Lệnh `npm run schema` tạo lại `contracts/xbrain-deck-v1.schema.json` từ các registry hiện tại. Compiler được dùng trực tiếp trong ứng dụng và Agent API. Các kiểm thử Python cần `jsonschema` và dùng Vite để nạp compiler TypeScript.
