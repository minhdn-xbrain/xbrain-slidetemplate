import React from 'react';

const MAIN_COLORS = [
  { hex: '#F97C00', name: 'Primary Orange', rgb: 'R249 G124 B0', border: false },
  { hex: '#FF8B2C', name: 'Warm Orange', rgb: 'R255 G139 B44', border: false },
  { hex: '#FF991D', name: 'Amber Orange', rgb: 'R255 G153 B29', border: false },
  { hex: '#FBCAAB', name: 'Soft Peach', rgb: 'R251 G202 B171', border: false },
  { hex: '#425453', name: 'Dark Teal (Text)', rgb: 'R66 G84 B83', border: false },
  { hex: '#B6B7B7', name: 'Neutral Gray', rgb: 'R182 G183 B183', border: false },
  { hex: '#D3D1CF', name: 'Light Gray', rgb: 'R211 G209 B207', border: false },
  { hex: '#FFFFFF', name: 'Pure White', rgb: 'R255 G255 B255', border: true },
];

const SECONDARY_COLORS = [
  { hex: '#25AC9D', name: 'Teal' },
  { hex: '#7FD7BB', name: 'Mint' },
  { hex: '#85439A', name: 'Purple' },
  { hex: '#24338A', name: 'Indigo' },
  { hex: '#007BC1', name: 'Blue' },
  { hex: '#00B3D8', name: 'Cyan' },
  { hex: '#FE4A0B', name: 'Red-Orange' },
  { hex: '#F6AF2F', name: 'Amber' },
  { hex: '#FFD54C', name: 'Yellow' },
];

const EVIDENCE_ROWS = [
  {
    element: 'Primary Orange Palette',
    value: '#F97C00, #FF8B2C, #FF991D, #FBCAAB',
    page: 'Trang 19 (17)',
    kind: 'Extracted',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    confidence: 'High',
  },
  {
    element: 'Dark Teal & Neutral Palette',
    value: '#425453 (thay cho đen tuyền), #B6B7B7, #D3D1CF, #FFFFFF',
    page: 'Trang 19 (17)',
    kind: 'Extracted',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    confidence: 'High',
  },
  {
    element: 'Secondary Palette (9 màu)',
    value: '#25AC9D, #7FD7BB, #85439A, #24338A, #007BC1, #00B3D8, #FE4A0B, #F6AF2F, #FFD54C',
    page: 'Trang 20 (18)',
    kind: 'Extracted',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    confidence: 'High',
  },
  {
    element: 'Headline & Body Typefaces',
    value: 'Manrope (Headlines) & Nunito (Secondary/Body), Optical kerning',
    page: 'Trang 22–23',
    kind: 'Extracted',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    confidence: 'High',
  },
  {
    element: 'Logo Grid & Minimum Size',
    value: 'Tỷ lệ 30.5X × 9X (X-mark 9.5X), Safe space Y, Min size: 200px × 58.6px',
    page: 'Trang 9, 11',
    kind: 'Extracted',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    confidence: 'High',
  },
  {
    element: 'Co-Branding Lockup Rule',
    value: 'Xbrain + "Powered by techX" ở góc trên trái; AWS Partner badge ở góc dưới phải',
    page: 'Trang 17 (15)',
    kind: 'Extracted',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    confidence: 'High',
  },
  {
    element: 'Brand Pattern Rule',
    value: 'Họa tiết mạch lục giác Isometric 3D, độ mờ (opacity) bắt buộc dưới 30%',
    page: 'Trang 27 (25)',
    kind: 'Extracted',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    confidence: 'High',
  },
  {
    element: 'Slide Template Visual Motifs',
    value: 'Nền cam 4 dải dọc, thẻ bo góc #E5F4EF (Mint) & #FDECE1 (Peach), số thứ tự 01–04 đặt trong pill cam',
    page: 'Trang 6, 36',
    kind: 'Inferred',
    badgeClass: 'bg-amber-500/20 text-amber-300',
    confidence: 'High',
  },
  {
    element: '1920×1080 Typographic Scale',
    value: 'Cover H1: 76px, Divider H1: 88px, Slide Title: 46px, Body: 21px, KPI Number: 68px',
    page: 'Áp dụng cho Canvas 16:9',
    kind: 'Proposed',
    badgeClass: 'bg-sky-500/20 text-sky-300',
    confidence: 'High',
  },
];

export const BrandSystemView: React.FC = () => {
  return (
    <div id="brand-system-view" className="hidden flex-1 overflow-y-auto bg-[#141A1A] p-8 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-10 pb-16">
        {/* Hero Banner */}
        <div className="bg-xbrain-orange-bands rounded-2xl p-8 relative overflow-hidden shadow-xl">
          <svg className="circuit-pattern-overlay light-on-orange right-0 top-0 w-[460px] h-[320px]">
            <use href="#xbrain-circuit-pattern" />
          </svg>
          <div className="relative z-10 max-w-3xl">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider mb-3">
              Phase 1 &amp; Phase 2 — Brand Identity System
            </span>
            <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-white">
              Hệ Thống Nhận Diện Thương Hiệu Xbrain (Dec 2025)
            </h1>
            <p className="mt-2 text-white/90 text-base">
              Tổng hợp đầy đủ bảng màu, hệ thống chữ (Manrope &amp; Nunito), quy chuẩn Logo (Grid 30.5X × 9X, khoảng cách an toàn Y, kích thước tối thiểu 200px × 58.6px), họa tiết mạch lục giác 3D (&lt;30% opacity) và bảng đối chiếu bằng chứng từ PDF.
            </p>
          </div>
        </div>

        {/* 1. Color System */}
        <section className="bg-[#1C2525] border border-[#2D3B3B] rounded-2xl p-6">
          <h3 className="text-xl font-heading font-bold text-white mb-1">
            1. Hệ Thống Màu Sắc Thương Hiệu (PDF Trang 19–20)
          </h3>
          <p className="text-sm text-slate-400 mb-5">
            Thay vì sử dụng màu đen tuyền (#000000), Xbrain kết hợp sắc Cam Năng Lượng (#F97C00) cùng Xanh Đen Đậm (#425453 - Dark Teal) và Xám Trung Tính.
          </p>

          <div className="mb-6">
            <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#FF991D] mb-3">
              3.1 Main Colors — Orange &amp; Dark Teal Neutral Palette (Trang 19)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {MAIN_COLORS.map((color) => (
                <div key={color.hex} className="bg-[#141B1B] p-2.5 rounded-xl border border-[#2B3737]">
                  <div
                    className={`h-14 rounded-lg mb-2 ${color.border ? 'border border-slate-600' : ''}`}
                    style={{ background: color.hex }}
                  />
                  <div className="font-heading font-bold text-xs text-white">{color.hex}</div>
                  <div className="text-[11px] text-slate-400">{color.name}</div>
                  <div className="text-[10px] text-slate-500">{color.rgb}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#7FD7BB] mb-3">
              3.2 Secondary Colors — Role &amp; Track Identification (Trang 20)
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
              {SECONDARY_COLORS.map((color) => (
                <div key={color.hex} className="bg-[#141B1B] p-2 rounded-lg border border-[#2B3737]">
                  <div className="h-10 rounded mb-1.5" style={{ background: color.hex }} />
                  <div className="font-heading font-bold text-[11px]">{color.hex}</div>
                  <div className="text-[10px] text-slate-400">{color.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Logo System & Typography Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-[#1C2525] border border-[#2D3B3B] rounded-2xl p-6">
            <h3 className="text-xl font-heading font-bold text-white mb-2">
              2. Hệ Thống Logo &amp; Co-Branding (Trang 8–17)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tỷ lệ chuẩn 30.5X × 9X (biểu tượng X rộng 9.5X). Kích thước tối thiểu Digital: 200px × 58.6px. Ý nghĩa thương hiệu: <em>&quot;Xbrain means Technology for User&apos;s Experience&quot;</em>.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center">
                <svg className="w-40 h-14">
                  <use href="#xbrain-logo-primary" />
                </svg>
                <span className="text-[11px] font-heading font-bold text-slate-600 mt-2">
                  Primary Logo (Light BG)
                </span>
              </div>
              <div className="bg-xbrain-orange-bands rounded-xl p-4 flex flex-col items-center justify-center">
                <svg className="w-40 h-14">
                  <use href="#xbrain-logo-white" />
                </svg>
                <span className="text-[11px] font-heading font-bold text-white mt-2">
                  Reversed Logo (Orange/Dark BG)
                </span>
              </div>
              <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-slate-200">
                <div className="flex flex-col items-start">
                  <svg className="w-36 h-11">
                    <use href="#xbrain-logo-primary" />
                  </svg>
                  <div className="flex items-center gap-1.5 -mt-1 ml-1">
                    <span className="text-[11px] font-body text-[#425453]">Powered by</span>
                    <svg className="w-14 h-4">
                      <use href="#techx-logo-color" />
                    </svg>
                  </div>
                </div>
                <span className="text-[11px] font-heading font-bold text-slate-600 mt-2">
                  Co-branded Lockup (Trang 17)
                </span>
              </div>
              <div className="bg-[#111827] rounded-xl p-4 flex flex-col items-center justify-center">
                <svg className="w-40 h-14">
                  <use href="#xbrain-logo-white" />
                </svg>
                <span className="text-[11px] font-heading font-bold text-slate-300 mt-2">
                  Negative Version (Dark BG)
                </span>
              </div>
            </div>
          </section>

          <section className="bg-[#1C2525] border border-[#2D3B3B] rounded-2xl p-6">
            <h3 className="text-xl font-heading font-bold text-white mb-2">
              3. Hệ Thống Typography (Trang 22–24)
            </h3>
            <div className="space-y-4">
              <div className="bg-[#141B1B] p-4 rounded-xl border border-[#2B3737]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold text-[#FF991D] uppercase">
                    4.1 Main Font (Headlines)
                  </span>
                  <span className="text-xs text-slate-400">Optical Kerning • No Scale Distortion</span>
                </div>
                <div className="text-2xl font-heading font-extrabold text-white mt-1">
                  MANROPE — Bold / ExtraBold / SemiBold
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Sử dụng cho tiêu đề chính của slide, số liệu KPI lớn, tiêu đề section và nhãn phân mục.
                </p>
              </div>
              <div className="bg-[#141B1B] p-4 rounded-xl border border-[#2B3737]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold text-[#7FD7BB] uppercase">
                    4.2 Secondary Font (Body &amp; Subtitles)
                  </span>
                  <span className="text-xs text-slate-400">
                    Optical Kerning • Regular / SemiBold / Bold
                  </span>
                </div>
                <div className="text-2xl font-body font-bold text-white mt-1">
                  NUNITO — Balanced &amp; Approachable
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Sử dụng cho nội dung văn bản, danh sách bullet, mô tả thẻ, bảng biểu và chú thích.
                </p>
              </div>
              <div className="bg-[#141B1B] p-4 rounded-xl border border-[#2B3737]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-bold text-slate-400 uppercase">
                    4.3 Font for Official Documents (Trang 24)
                  </span>
                  <span className="text-xs text-slate-500">Contracts &amp; Legal Print-outs Only</span>
                </div>
                <div className="text-xl font-serif text-slate-200 mt-1">
                  Times New Roman — Hợp đồng, hồ sơ thầu &amp; công văn nhà nước
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 3. Evidence-Based Analysis Table (Phase 1.3) */}
        <section className="bg-[#1C2525] border border-[#2D3B3B] rounded-2xl p-6">
          <h3 className="text-xl font-heading font-bold text-white mb-2">
            4. Bảng Phân Tích Bằng Chứng (Phase 1.3 — Evidence-Based Analysis)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Phân biệt rõ ràng giữa dữ liệu trích xuất trực tiếp (Extracted), dữ liệu suy luận từ trang mẫu (Inferred) và quy tắc đề xuất cho hệ thống slide (Proposed).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141B1B] text-slate-300 border-b border-[#2D3B3B] font-heading">
                  <th className="p-3">Design Element</th>
                  <th className="p-3">Giá Trị Cụ Thể (Value)</th>
                  <th className="p-3">Trang PDF</th>
                  <th className="p-3">Phân Loại</th>
                  <th className="p-3">Độ Tin Cậy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3737]">
                {EVIDENCE_ROWS.map((row) => (
                  <tr key={row.element}>
                    <td className="p-3 font-semibold text-white">{row.element}</td>
                    <td className="p-3">{row.value}</td>
                    <td className="p-3">{row.page}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${row.badgeClass}`}>
                        {row.kind}
                      </span>
                    </td>
                    <td className="p-3">{row.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
