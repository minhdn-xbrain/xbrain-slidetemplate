// @ts-nocheck
interface SlideRendererDeps {
  BRAND_PHOTOS: Record<string, string>;
  renderStandardWhiteHeader: (sectionTag: string, slideNumberStr: string) => string;
  renderStandardWhiteFooter: (slideNumberStr: string, showAwsCoBrand?: boolean) => string;
  renderAwsPartnerBadge: (theme?: string) => string;
  renderBarChart: (c: any) => string;
  renderDoughnutChart: (c: any) => string;
}

export function createSlideRenderers(deps: SlideRendererDeps) {
  const {
    BRAND_PHOTOS,
    renderStandardWhiteHeader,
    renderStandardWhiteFooter,
    renderAwsPartnerBadge,
    renderBarChart,
    renderDoughnutChart,
  } = deps;

    const SLIDE_RENDERERS = Object.freeze({
  'cover': ({slide, index, isThumbnail, numStr, ce, c}) => {
          return `
            <div class="w-[1920px] h-[1080px] bg-xbrain-orange-bands relative overflow-hidden flex flex-col justify-between p-[110px]">
              <!-- Top-Right & Bottom-Left Isometric Circuit Patterns (<30% opacity rule) -->
              <svg class="circuit-pattern-overlay light-on-orange -top-[40px] -right-[40px] w-[1060px] h-[750px]"><use href="#xbrain-circuit-pattern"></use></svg>
              <svg class="circuit-pattern-overlay light-on-orange -bottom-[90px] -left-[80px] w-[780px] h-[550px]"><use href="#xbrain-circuit-pattern"></use></svg>

              <!-- Top Co-Branded Header -->
              <div class="relative z-10 flex items-start justify-between">
                <div class="flex flex-col">
                  <svg class="w-[270px] h-[82px]"><use href="#xbrain-logo-white"></use></svg>
                  <div class="flex items-center gap-2.5 mt-1 pl-2">
                    <span class="text-[20px] font-body text-white/90 font-medium">Powered by</span>
                    <svg class="w-[115px] h-[36px]"><use href="#techx-logo-white"></use></svg>
                  </div>
                </div>
                <div class="px-6 py-2.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 font-heading font-bold text-[18px] tracking-[0.08em] uppercase text-white" ${ce} data-field="badge">
                  ${c.badge || 'BRAND PRESENTATION'}
                </div>
              </div>

              <!-- Center Hero Typography with Inline Reversed Xbrain Logo (PDF Page 36 Cover Motif) -->
              <div class="relative z-10 my-auto max-w-[1380px] pt-8">
                <div class="font-heading font-extrabold text-[92px] leading-[1.08] tracking-tight text-white">
                  <div ${ce} data-field="titleLine1">${c.titleLine1 || 'Building Future'}</div>
                  <div ${ce} data-field="titleLine2">${c.titleLine2 || 'Tech Talent,'}</div>
                  <div class="flex items-center gap-7 flex-wrap mt-2">
                    <span ${ce} data-field="titleLine3">${c.titleLine3 || 'together with'}</span>
                    <svg class="w-[370px] h-[112px] inline-block -mb-3"><use href="#xbrain-logo-white"></use></svg>
                  </div>
                </div>

                <div class="mt-10 pl-6 border-l-4 border-[#7FD7BB] max-w-[1060px]">
                  <p class="font-body text-[28px] leading-[1.45] text-white/95 font-medium" ${ce} data-field="subtitle">
                    ${c.subtitle || ''}
                  </p>
                </div>
              </div>

              <!-- Bottom Metadata Bar -->
              <div class="relative z-10 pt-8 border-t border-white/30 flex items-center justify-between text-white">
                <div class="flex items-center gap-10">
                  <div>
                    <div class="text-[14px] font-heading uppercase tracking-wider text-white/75">Presented By</div>
                    <div class="text-[22px] font-heading font-bold mt-0.5" ${ce} data-field="presenter">${c.presenter || 'Mr. Ha Ngo — CEO'}</div>
                  </div>
                  <div class="h-10 w-[1px] bg-white/30"></div>
                  <div>
                    <div class="text-[14px] font-heading uppercase tracking-wider text-white/75">Headquarters</div>
                    <div class="text-[20px] font-body mt-0.5" ${ce} data-field="location">${c.location || 'Vietnam Innovation Hub Town, Da Nang'}</div>
                  </div>
                </div>
                <div class="flex items-center gap-6">
                  ${renderAwsPartnerBadge('dark')}
                  <div class="px-5 py-2.5 rounded-xl bg-white text-[#F97C00] font-heading font-extrabold text-[20px]" ${ce} data-field="website">
                    ${c.website || 'www.xbrain.com.vn'}
                  </div>
                </div>
              </div>
            </div>
          `;
  },
  'agenda': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const agendaItems = (c.items || []).map((it, idx) => `
            <div class="flex items-center justify-between p-6 rounded-2xl bg-[#F8F9FA] hover:bg-[#FFF5ED] border border-[#EAEAEA] transition-all">
              <div class="flex items-center gap-6">
                <div class="w-[68px] h-[68px] rounded-2xl bg-[#F97C00] text-white font-heading font-extrabold text-[28px] flex items-center justify-center shrink-0 shadow-md" ${ce} data-field="items.${idx}.num">
                  ${it.num}
                </div>
                <div>
                  <h3 class="font-heading font-extrabold text-[26px] text-[#2B3736]" ${ce} data-field="items.${idx}.title">${it.title}</h3>
                  <p class="font-body text-[19px] text-[#5E6E6D] mt-1" ${ce} data-field="items.${idx}.desc">${it.desc}</p>
                </div>
              </div>
              <div class="px-4 py-2 rounded-full bg-[#E5F4EF] text-[#25AC9D] font-heading font-bold text-[16px] shrink-0" ${ce} data-field="items.${idx}.tag">
                ${it.tag}
              </div>
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              <svg class="circuit-pattern-overlay gray-on-white -bottom-[60px] -left-[60px] w-[620px] h-[440px]"><use href="#xbrain-circuit-pattern"></use></svg>
              ${renderStandardWhiteHeader(c.sectionTag || 'AGENDA & STRUCTURE', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[36px] pb-[90px] grid grid-cols-12 gap-12 items-center">
                <!-- Left Column: Giant Brand Lockup + Summary Card (PDF Page 2 Motif) -->
                <div class="col-span-5 flex flex-col justify-center pr-6">
                  <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDECE1] text-[#F97C00] font-heading font-bold text-[15px] uppercase tracking-wider w-fit mb-6" ${ce} data-field="tocLabel">${c.tocLabel || 'Table of Contents'}</div>
                  <h1 class="font-heading font-extrabold text-[48px] leading-[1.15] text-[#2B3736] mb-8" ${ce} data-field="title">
                    ${c.title || 'Strategic Presentation Agenda'}
                  </h1>

                  <div class="p-8 rounded-3xl bg-gradient-to-br from-[#FFF5ED] to-[#FDECE1] border border-[#FBCAAB] relative overflow-hidden">
                    <svg class="w-[290px] h-[88px] mb-5"><use href="#xbrain-logo-primary"></use></svg>
                    <h3 class="font-heading font-bold text-[24px] text-[#2B3736] mb-3" ${ce} data-field="leftHeadline">
                      ${c.leftHeadline || ''}
                    </h3>
                    <p class="font-body text-[19px] leading-[1.55] text-[#425453]" ${ce} data-field="leftSummary">
                      ${c.leftSummary || ''}
                    </p>
                    <div class="mt-6 pt-5 border-t border-[#FBCAAB] flex items-center justify-between text-[16px] font-heading font-bold text-[#F97C00]">
                      <span ${ce} data-field="sidebarPartners">${c.sidebarPartners || 'AWS • Synaptix • TechX'}</span>
                      <span ${ce} data-field="sidebarNote">${c.sidebarNote || '16 Reusable Slides'}</span>
                    </div>
                  </div>
                </div>

                <!-- Right Column: 5 Structured Agenda Blocks -->
                <div class="col-span-7 flex flex-col gap-4">
                  ${agendaItems}
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'section-divider': ({slide, index, isThumbnail, numStr, ce, c}) => {
          return `
            <div class="w-[1920px] h-[1080px] bg-xbrain-section-divider relative overflow-hidden flex flex-col justify-between">
              <svg class="circuit-pattern-overlay light-on-orange right-0 bottom-0 w-[860px] h-[610px]"><use href="#xbrain-circuit-pattern"></use></svg>

              <!-- Top Band (25% height) -->
              <div class="relative z-10 px-[96px] pt-[56px]">
                <div class="flex items-center justify-between pb-[26px]">
                  <svg class="w-[190px] h-[58px]"><use href="#xbrain-logo-white"></use></svg>
                  <span class="font-body text-[24px] text-white/95 font-medium" ${ce} data-field="categoryLabel">${c.categoryLabel || 'Brand Guideline'}</span>
                </div>
                <div class="slide-header-line-white"></div>
              </div>

              <!-- Middle Band (48.5% height) -->
              <div class="relative z-10 px-[96px] my-auto">
                <h1 class="font-heading font-extrabold text-[112px] leading-[1.05] text-white tracking-tight" ${ce} data-field="title">
                  ${c.title || 'Introduction'}
                </h1>
                <p class="font-body text-[28px] text-white/90 max-w-[1150px] mt-6 font-medium" ${ce} data-field="subtitle">
                  ${c.subtitle || ''}
                </p>
              </div>

              <!-- Bottom Band (26.5% height) with Mint #7FD7BB Giant Section Number -->
              <div class="relative z-10 px-[96px] pb-[56px] flex items-end justify-between">
                <div class="font-heading font-extrabold text-[168px] leading-[0.85] text-[#7FD7BB] select-none" ${ce} data-field="sectionNumber">
                  ${c.sectionNumber || '01'}
                </div>
                <div class="font-heading font-bold text-[24px] text-white/90 pb-2">
                  ${numStr}
                </div>
              </div>
            </div>
          `;
  },
  'closing': ({slide, index, isThumbnail, numStr, ce, c}) => {
          return `
            <div class="w-[1920px] h-[1080px] bg-xbrain-orange-bands relative overflow-hidden flex flex-col justify-between p-[110px]">
              <svg class="circuit-pattern-overlay light-on-orange -top-[30px] -right-[30px] w-[1080px] h-[760px]"><use href="#xbrain-circuit-pattern"></use></svg>
              <svg class="circuit-pattern-overlay light-on-orange -bottom-[90px] -left-[70px] w-[760px] h-[540px]"><use href="#xbrain-circuit-pattern"></use></svg>

              <!-- Top Co-Branded Lockup -->
              <div class="relative z-10 flex items-start justify-between">
                <div>
                  <svg class="w-[340px] h-[104px]"><use href="#xbrain-logo-white"></use></svg>
                  <div class="flex items-center gap-3 mt-2 pl-2">
                    <span class="text-[22px] font-body text-white/90">Powered by</span>
                    <svg class="w-[125px] h-[38px]"><use href="#techx-logo-white"></use></svg>
                  </div>
                </div>
                ${renderAwsPartnerBadge('dark')}
              </div>

              <!-- Giant Thank You Headline -->
              <div class="relative z-10 my-auto">
                <h1 class="font-heading font-extrabold text-[136px] leading-[1.0] text-white tracking-tight" ${ce} data-field="headline">
                  ${c.headline || 'Thank you'}
                </h1>
                <p class="font-body text-[32px] text-white/95 font-semibold mt-5 max-w-[1100px]" ${ce} data-field="subheadline">
                  ${c.subheadline || ''}
                </p>
              </div>

              <!-- Bottom Contact Card Grid (Stationery Details from PDF Pages 28–31) -->
              <div class="relative z-10 grid grid-cols-12 gap-6 bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/30 text-white">
                <div class="col-span-4 border-r border-white/25 pr-6">
                  <div class="text-[14px] font-heading font-bold uppercase tracking-wider text-[#7FD7BB]" ${ce} data-field="contactLabel">${c.contactLabel || 'Executive Contact'}</div>
                  <div class="text-[28px] font-heading font-extrabold mt-1" ${ce} data-field="contactName">${c.contactName || 'Mr. Ha Ngo'}</div>
                  <div class="text-[19px] text-white/90 font-body" ${ce} data-field="contactRole">${c.contactRole || 'Chief Executive Officer'}</div>
                </div>
                <div class="col-span-4 border-r border-white/25 px-4">
                  <div class="text-[14px] font-heading font-bold uppercase tracking-wider text-[#7FD7BB]" ${ce} data-field="channelsLabel">${c.channelsLabel || 'Direct Channels'}</div>
                  <div class="text-[20px] font-body font-semibold mt-2" ${ce} data-field="phone">${c.phone || ''}</div>
                  <div class="text-[19px] font-body text-white/90 mt-1" ${ce} data-field="email">${c.email || ''}</div>
                </div>
                <div class="col-span-4 pl-4 flex flex-col justify-between">
                  <div>
                    <div class="text-[14px] font-heading font-bold uppercase tracking-wider text-[#7FD7BB]" ${ce} data-field="locationLabel">${c.locationLabel || 'Innovation Hub Location'}</div>
                    <div class="text-[19px] font-body mt-1.5" ${ce} data-field="address">${c.address || ''}</div>
                  </div>
                  <div class="text-[22px] font-heading font-extrabold text-[#FFD54C] mt-2" ${ce} data-field="website">${c.website || 'www.xbrain.com.vn'}</div>
                </div>
              </div>
            </div>
          `;
  },
  'title-body': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const pillarCards = (c.pillars || []).map((p, idx) => `
            <div class="p-6 rounded-2xl bg-white/95 border-l-4 border-[#F97C00] shadow-md">
              <div class="flex items-center gap-3 mb-1.5">
                <span class="w-7 h-7 rounded-full bg-[#FDECE1] text-[#F97C00] font-heading font-extrabold text-[14px] flex items-center justify-center">0${idx + 1}</span>
                <h4 class="font-heading font-bold text-[22px] text-[#2B3736]" ${ce} data-field="pillars.${idx}.title">${p.title}</h4>
              </div>
              <p class="font-body text-[18px] text-[#5E6E6D] pl-10" ${ce} data-field="pillars.${idx}.desc">${p.desc}</p>
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              <!-- Large Isometric Circuit Pattern on Right Half (Exact PDF Page 5 Layout) -->
              <svg class="circuit-pattern-overlay orange-on-white right-[-40px] bottom-[40px] w-[1020px] h-[720px]"><use href="#xbrain-circuit-pattern"></use></svg>

              ${renderStandardWhiteHeader(c.sectionTag || 'INTRODUCTION', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[36px] pb-[90px] flex flex-col">
                <div class="mb-8">
                  <div class="font-heading font-normal text-[30px] uppercase tracking-wide text-[#425453]">INTRODUCTION</div>
                  <h1 class="font-heading font-extrabold text-[52px] text-[#3B3C3E] mt-1" ${ce} data-field="title">${c.title || '1.2 Our Vision and Our Mission'}</h1>
                </div>

                <div class="grid grid-cols-12 gap-12 flex-1 items-center">
                  <!-- Left 7 Columns: Structured Narrative Paragraphs -->
                  <div class="col-span-7 space-y-8 pr-6">
                    <div class="p-8 rounded-3xl bg-[#F8F9FA] border border-[#E5E7EB]">
                      <div class="inline-block px-3.5 py-1 rounded-full bg-[#F97C00] text-white font-heading font-bold text-[14px] uppercase tracking-wider mb-3" ${ce} data-field="missionLabel">
                        ${c.missionLabel || 'OUR CORE MISSION'}
                      </div>
                      <p class="font-body text-[23px] leading-[1.58] text-[#2B3736]" ${ce} data-field="missionText">
                        ${c.missionText || ''}
                      </p>
                    </div>

                    <div class="p-8 rounded-3xl bg-[#E5F4EF]/65 border border-[#7FD7BB]">
                      <div class="inline-block px-3.5 py-1 rounded-full bg-[#25AC9D] text-white font-heading font-bold text-[14px] uppercase tracking-wider mb-3" ${ce} data-field="visionLabel">
                        ${c.visionLabel || 'LONG-TERM REGIONAL VISION'}
                      </div>
                      <p class="font-body text-[23px] leading-[1.58] text-[#2B3736]" ${ce} data-field="visionText">
                        ${c.visionText || ''}
                      </p>
                    </div>
                  </div>

                  <!-- Right 5 Columns: Strategic Pillars Floating over Circuit Network -->
                  <div class="col-span-5 space-y-5">
                    <div class="p-6 rounded-2xl bg-xbrain-orange-bands text-white shadow-lg">
                      <div class="text-[14px] font-heading font-bold uppercase tracking-wider text-white/80">Strategic Ecosystem Alignment</div>
                      <div class="text-[26px] font-heading font-extrabold mt-1">TechX • AWS • Synaptix</div>
                    </div>
                    ${pillarCards}
                  </div>
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'two-column': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const rationalePills = (c.points || []).map((pt, i) => `
            <div class="flex items-center bg-white/95 rounded-2xl p-4 shadow-md">
              <div class="w-[72px] h-[64px] rounded-xl bg-[#E5F4EF] text-[#2B3736] font-heading font-extrabold text-[28px] flex items-center justify-center shrink-0 border border-[#7FD7BB]" ${ce} data-field="points.${i}.num">
                ${pt.num}
              </div>
              <div class="pl-5 pr-3 font-body font-bold text-[21px] leading-[1.35] text-[#2B3736]" ${ce} data-field="points.${i}.text">
                ${pt.text}
              </div>
            </div>
          `).join('');

          const rightStats = (c.rightMetrics || []).map((m, i) => `
            <div class="p-5 rounded-2xl bg-[#FFF5ED] border border-[#FBCAAB]">
              <div class="font-heading font-extrabold text-[34px] text-[#F97C00]" ${ce} data-field="rightMetrics.${i}.val">${m.val}</div>
              <div class="font-body font-semibold text-[18px] text-[#425453] mt-1" ${ce} data-field="rightMetrics.${i}.label">${m.label}</div>
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              <svg class="circuit-pattern-overlay gray-on-white right-[-40px] top-[120px] w-[780px] h-[550px]"><use href="#xbrain-circuit-pattern"></use></svg>
              ${renderStandardWhiteHeader(c.sectionTag || 'CONTEXT & RATIONALE', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[36px] pb-[90px] flex flex-col">
                <h1 class="font-heading font-extrabold text-[48px] text-[#25AC9D] mb-8" ${ce} data-field="title">
                  ${c.title || 'Context & Rationale'}
                </h1>

                <div class="grid grid-cols-12 gap-10 flex-1 items-center">
                  <!-- Left Column: Orange Block Container with 01-04 Numbered Rows (Exact PDF Page 36 Slide 2 Motif) -->
                  <div class="col-span-6 bg-xbrain-orange-bands rounded-3xl p-9 shadow-xl flex flex-col justify-between h-full">
                    <div class="flex items-center justify-between text-white mb-4">
                      <span class="font-heading font-bold text-[18px] uppercase tracking-wider">Industry Drivers (01 – 04)</span>
                      <span class="px-3 py-1 rounded-full bg-white/20 text-xs font-heading font-bold">Market Reality</span>
                    </div>
                    <div class="space-y-5 my-auto">
                      ${rationalePills}
                    </div>
                  </div>

                  <!-- Center Connector Arrow + Right Column Synthesis -->
                  <div class="col-span-6 flex items-center gap-8 pl-2">
                    <div class="w-[68px] h-[68px] rounded-full bg-[#25AC9D] text-white flex items-center justify-center shrink-0 shadow-lg">
                      <svg class="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                    </div>

                    <div class="flex-1 bg-white rounded-3xl p-9 border-2 border-[#EAEAEA] shadow-lg">
                      <svg class="w-[280px] h-[85px] mb-5"><use href="#xbrain-logo-primary"></use></svg>
                      <h3 class="font-heading font-extrabold text-[30px] leading-[1.25] text-[#2B3736] mb-4" ${ce} data-field="rightTitle">
                        ${c.rightTitle || ''}
                      </h3>
                      <p class="font-body text-[21px] leading-[1.6] text-[#425453] mb-7" ${ce} data-field="rightBody">
                        ${c.rightBody || ''}
                      </p>
                      <div class="grid grid-cols-2 gap-4">
                        ${rightStats}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'text-image': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const hiPills = (c.highlights || []).map((h, i) => `
            <div class="px-5 py-3.5 rounded-2xl bg-[#FFF5ED] border border-[#FBCAAB]">
              <div class="text-[13px] font-heading font-bold uppercase tracking-wider text-[#F97C00]" ${ce} data-field="highlights.${i}.label">${h.label}</div>
              <div class="text-[20px] font-heading font-extrabold text-[#2B3736] mt-0.5" ${ce} data-field="highlights.${i}.value">${h.value}</div>
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              ${renderStandardWhiteHeader(c.sectionTag || 'INTRODUCTION', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[34px] pb-[90px] flex flex-col justify-between">
                <div>
                  <div class="font-heading font-normal text-[30px] uppercase tracking-wide text-[#425453]">INTRODUCTION</div>
                  <h1 class="font-heading font-extrabold text-[50px] text-[#3B3C3E] mt-1" ${ce} data-field="title">${c.title || '1.1 Who We Are'}</h1>
                </div>

                <!-- Top Row: Giant Xbrain Logo + Lead Definition (Exact PDF Page 4 Layout) -->
                <div class="grid grid-cols-12 gap-12 items-center my-4">
                  <div class="col-span-5">
                    <svg class="w-full max-w-[610px] h-[185px]"><use href="#xbrain-logo-primary"></use></svg>
                  </div>
                  <div class="col-span-7">
                    <p class="font-body text-[26px] leading-[1.5] text-[#2B3736]" ${ce} data-field="leadParagraph">
                      ${c.leadParagraph || ''}
                    </p>
                  </div>
                </div>

                <!-- Bottom Row: Narrative Body on Left + Rounded Classroom Photo on Right (PDF Page 4) -->
                <div class="grid grid-cols-12 gap-12 items-center">
                  <div class="col-span-6 flex flex-col justify-between space-y-6">
                    <p class="font-body text-[23px] leading-[1.58] text-[#2B3736]" ${ce} data-field="bodyParagraph">
                      ${c.bodyParagraph || ''}
                    </p>
                    <div class="grid grid-cols-3 gap-4 pt-2">
                      ${hiPills}
                    </div>
                  </div>

                  <div class="col-span-6">
                    <div class="relative rounded-[28px] overflow-hidden shadow-2xl border-4 border-white bg-[#1A2222] h-[390px]">
                      <img src="${BRAND_PHOTOS.lab1}" alt="Xbrain Think Big Classroom" class="w-full h-full object-cover" />
                      <!-- Logo on Light Image Corner per PDF Page 16 Rule -->
                      <div class="absolute top-4 left-5 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-xl shadow">
                        <svg class="w-[110px] h-[32px]"><use href="#xbrain-logo-primary"></use></svg>
                      </div>
                      <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 text-white">
                        <span class="font-heading font-bold text-[17px]" ${ce} data-field="imageCaption">${c.imageCaption || ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, true)}
            </div>
          `;
  },
  'three-card': ({slide, index, isThumbnail, numStr, ce, c}) => {
          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              <svg class="circuit-pattern-overlay orange-on-white -bottom-[80px] -left-[60px] w-[620px] h-[440px]"><use href="#xbrain-circuit-pattern"></use></svg>
              ${renderStandardWhiteHeader(c.sectionTag || 'INTRODUCTION', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[30px] pb-[90px] flex flex-col">
                <div class="mb-6">
                  <div class="font-heading font-normal text-[28px] uppercase tracking-wide text-[#425453]">INTRODUCTION</div>
                  <h1 class="font-heading font-extrabold text-[48px] text-[#3B3C3E]" ${ce} data-field="title">${c.title || '1.3 Our Value'}</h1>
                </div>

                <!-- 3 Staggered Value Cards (Mint #E5F4EF | Elevated Orange #F97C00 | Mint #E5F4EF) — Exact PDF Page 6 -->
                <div class="grid grid-cols-3 gap-9 flex-1 items-stretch pt-2">

                  <!-- Card 1: Image Top, Mint Content Bottom -->
                  <div class="x-card-mint overflow-hidden flex flex-col shadow-lg mt-6">
                    <div class="h-[280px] w-full overflow-hidden bg-slate-200">
                      <img src="${BRAND_PHOTOS.lab1}" alt="Practice-Driven Excellence" class="w-full h-full object-cover" />
                    </div>
                    <div class="p-8 flex-1 flex flex-col justify-center text-center">
                      <h3 class="font-heading font-extrabold text-[28px] text-[#1F2928] mb-4" ${ce} data-field="card1Title">
                        ${c.card1Title || 'Practice-Driven Excellence'}
                      </h3>
                      <p class="font-body text-[21px] leading-[1.5] text-[#2B3736]" ${ce} data-field="card1Body">
                        ${c.card1Body || ''}
                      </p>
                    </div>
                  </div>

                  <!-- Card 2 (Center Elevated): Orange Content Top, Presenter Image Bottom -->
                  <div class="x-card-orange overflow-hidden flex flex-col shadow-2xl mb-6">
                    <div class="p-8 flex-1 flex flex-col justify-center text-center">
                      <h3 class="font-heading font-extrabold text-[28px] text-white mb-4" ${ce} data-field="card2Title">
                        ${c.card2Title || 'Industry Alignment & Impact'}
                      </h3>
                      <p class="font-body text-[21px] leading-[1.5] text-white/95" ${ce} data-field="card2Body">
                        ${c.card2Body || ''}
                      </p>
                    </div>
                    <div class="h-[280px] w-full overflow-hidden bg-slate-800 p-3 pt-0">
                      <img src="${BRAND_PHOTOS.presenter}" alt="Industry Alignment & Impact" class="w-full h-full object-cover rounded-[18px]" />
                    </div>
                  </div>

                  <!-- Card 3: Image Top, Mint Content Bottom -->
                  <div class="x-card-mint overflow-hidden flex flex-col shadow-lg mt-6">
                    <div class="h-[280px] w-full overflow-hidden bg-slate-200">
                      <img src="${BRAND_PHOTOS.lab2}" alt="Sustainable Talent Empowerment" class="w-full h-full object-cover" />
                    </div>
                    <div class="p-8 flex-1 flex flex-col justify-center text-center">
                      <h3 class="font-heading font-extrabold text-[28px] text-[#1F2928] mb-4" ${ce} data-field="card3Title">
                        ${c.card3Title || 'Sustainable Talent Empowerment'}
                      </h3>
                      <p class="font-body text-[21px] leading-[1.5] text-[#2B3736]" ${ce} data-field="card3Body">
                        ${c.card3Body || ''}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'four-quadrant': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const quadCards = (c.quadrants || []).map((q, i) => `
            <div class="bg-white rounded-3xl p-8 border-2 border-[#EAEAEA] shadow-md flex flex-col justify-between relative overflow-hidden">
              <div class="absolute top-0 left-0 right-0 h-2.5" style="background:${q.color || '#F97C00'}"></div>
              <div class="flex items-start justify-between gap-4 mt-2">
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-heading font-extrabold text-[26px] shadow" style="background:${q.color || '#F97C00'}" ${ce} data-field="quadrants.${i}.num">
                    ${q.num}
                  </div>
                  <h3 class="font-heading font-extrabold text-[27px] leading-[1.25] text-[#2B3736] max-w-[480px]" ${ce} data-field="quadrants.${i}.title">
                    ${q.title}
                  </h3>
                </div>
                <div class="w-12 h-12 rounded-xl bg-[#FFF5ED] border border-[#FBCAAB] flex items-center justify-center text-[#F97C00] shrink-0">
                  <span class="font-heading font-black text-lg">✦</span>
                </div>
              </div>
              <p class="font-body text-[21px] leading-[1.55] text-[#425453] mt-5 pl-20" ${ce} data-field="quadrants.${i}.desc">
                ${q.desc}
              </p>
              <div class="mt-5 pl-20 flex items-center gap-2 text-[15px] font-heading font-bold uppercase tracking-wider" style="color:${q.color || '#F97C00'}">
                <span>Verified Outcome Pillar</span>
                <span>→</span>
              </div>
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-[#F8F9FA] relative overflow-hidden flex flex-col">
              <svg class="circuit-pattern-overlay gray-on-white right-[-40px] bottom-[-40px] w-[720px] h-[510px]"><use href="#xbrain-circuit-pattern"></use></svg>
              ${renderStandardWhiteHeader(c.sectionTag || 'PROGRAM OBJECTIVES', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[32px] pb-[90px] flex flex-col">
                <div class="flex items-end justify-between mb-8">
                  <div>
                    <h1 class="font-heading font-extrabold text-[48px] text-[#25AC9D]" ${ce} data-field="title">${c.title || 'Program Objectives'}</h1>
                    <p class="font-body text-[22px] text-[#5E6E6D] mt-1" ${ce} data-field="subtitle">${c.subtitle || ''}</p>
                  </div>
                  <div class="px-5 py-2.5 rounded-full bg-[#E5F4EF] text-[#25AC9D] font-heading font-bold text-[17px]">
                    4 Strategic Quadrants
                  </div>
                </div>

                <!-- 2x2 Quadrant Grid -->
                <div class="grid grid-cols-2 grid-rows-2 gap-8 flex-1">
                  ${quadCards}
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'quote': ({slide, index, isThumbnail, numStr, ce, c}) => {
          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              <svg class="circuit-pattern-overlay orange-on-white right-[-30px] top-[140px] w-[860px] h-[610px]"><use href="#xbrain-circuit-pattern"></use></svg>
              ${renderStandardWhiteHeader(c.sectionTag || 'BRAND MANIFESTO', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[40px] pb-[96px] grid grid-cols-12 gap-12 items-center">
                <!-- Left 8 Columns: Giant Orange Quotation Mark + Vietnamese & English Manifesto (PDF Page 22 Motif) -->
                <div class="col-span-8 pr-6">
                  <!-- Orange Quote Mark from PDF Page 22 -->
                  <div class="font-heading font-black text-[150px] leading-[0.65] text-[#F97C00] select-none mb-6">“</div>

                  <blockquote class="font-heading font-extrabold text-[42px] leading-[1.32] text-[#1F2928] tracking-tight" ${ce} data-field="quoteVN">
                    ${c.quoteVN || ''}
                  </blockquote>

                  <div class="mt-7 p-6 rounded-2xl bg-[#FFF5ED] border-l-4 border-[#F97C00]">
                    <p class="font-body italic font-bold text-[24px] text-[#425453]" ${ce} data-field="quoteEN">
                      “${c.quoteEN || ''}”
                    </p>
                  </div>

                  <div class="mt-8 flex items-center gap-5">
                    <div class="w-14 h-14 rounded-full bg-[#F97C00] text-white font-heading font-extrabold text-[22px] flex items-center justify-center">
                      HN
                    </div>
                    <div>
                      <div class="font-heading font-extrabold text-[24px] text-[#2B3736]" ${ce} data-field="author">${c.author || 'Mr. Ha Ngo'}</div>
                      <div class="font-body text-[19px] text-[#5E6E6D]" ${ce} data-field="role">${c.role || 'CEO, Xbrain'}</div>
                    </div>
                  </div>
                </div>

                <!-- Right 4 Columns: Key Takeaway Highlight Card -->
                <div class="col-span-4">
                  <div class="bg-xbrain-orange-bands rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                    <div class="text-[15px] font-heading font-bold uppercase tracking-widest text-white/80 mb-3">Key Takeaway</div>
                    <div class="font-heading font-extrabold text-[86px] leading-none text-[#FFD54C]" ${ce} data-field="highlightStat">
                      ${c.highlightStat || '100%'}
                    </div>
                    <p class="font-heading font-bold text-[24px] leading-[1.35] mt-4" ${ce} data-field="highlightLabel">
                      ${c.highlightLabel || ''}
                    </p>
                    <div class="mt-8 pt-6 border-t border-white/30">
                      <svg class="w-[200px] h-[60px]"><use href="#xbrain-logo-white"></use></svg>
                    </div>
                  </div>
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'kpi-dashboard': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const secKpis = (c.secondaryKpis || []).map((k, i) => `
            <div class="bg-white rounded-2xl p-6 border-2 border-[#EAEAEA] shadow-sm flex items-center justify-between">
              <div>
                <div class="font-heading font-extrabold text-[38px]" style="color:${k.color || '#F97C00'}" ${ce} data-field="secondaryKpis.${i}.val">${k.val}</div>
                <div class="font-body font-bold text-[18px] text-[#425453] mt-0.5" ${ce} data-field="secondaryKpis.${i}.label">${k.label}</div>
              </div>
              <div class="w-3 h-14 rounded-full" style="background:${k.color || '#F97C00'}"></div>
            </div>
          `).join('');

          const segCards = (c.segments || []).map((s, idx) => `
            <div class="bg-white rounded-3xl p-7 border-2 border-[#EAEAEA] shadow-md flex flex-col justify-between relative">
              <div class="flex items-center justify-between mb-4">
                <div class="w-14 h-14 rounded-2xl bg-[#FFF5ED] border border-[#FBCAAB] text-[#F97C00] font-heading font-extrabold text-[22px] flex items-center justify-center">
                  0${idx + 1}
                </div>
                <span class="px-3.5 py-1 rounded-full bg-[#E5F4EF] text-[#25AC9D] font-heading font-bold text-[15px]" ${ce} data-field="segments.${idx}.badge">${s.badge}</span>
              </div>
              <div>
                <h3 class="font-heading font-extrabold text-[25px] text-[#2B3736] mb-2" ${ce} data-field="segments.${idx}.title">${s.title}</h3>
                <p class="font-body text-[19px] leading-[1.5] text-[#5E6E6D]" ${ce} data-field="segments.${idx}.desc">${s.desc}</p>
              </div>
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-[#F8F9FA] relative overflow-hidden flex flex-col">
              <svg class="circuit-pattern-overlay gray-on-white right-[-40px] top-[120px] w-[760px] h-[530px]"><use href="#xbrain-circuit-pattern"></use></svg>
              ${renderStandardWhiteHeader(c.sectionTag || 'KPI DASHBOARD', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[30px] pb-[90px] flex flex-col justify-between">
                <h1 class="font-heading font-extrabold text-[46px] text-[#25AC9D]" ${ce} data-field="title">
                  ${c.title || 'Target Participants & Cohort KPIs'}
                </h1>

                <!-- Top Row: Hero Teal KPI Banner (500 Applications / 200 Qualified — Exact PDF Page 36 Top-Right) + 3 Secondary KPIs -->
                <div class="grid grid-cols-12 gap-8 items-stretch">
                  <div class="col-span-7 rounded-3xl bg-[#25AC9D] text-white p-9 shadow-xl grid grid-cols-2 gap-8 items-center relative overflow-hidden">
                    <div class="border-r border-white/30 pr-6 text-center">
                      <div class="font-heading font-extrabold text-[92px] leading-none" ${ce} data-field="primaryKpi1Val">${c.primaryKpi1Val || '500'}</div>
                      <div class="font-heading font-bold text-[24px] mt-2" ${ce} data-field="primaryKpi1Label">${c.primaryKpi1Label || 'Applications'}</div>
                      <div class="font-body text-[16px] text-white/85 mt-1" ${ce} data-field="primaryKpi1Sub">${c.primaryKpi1Sub || ''}</div>
                    </div>
                    <div class="pl-2 text-center">
                      <div class="font-heading font-extrabold text-[92px] leading-none text-[#FFD54C]" ${ce} data-field="primaryKpi2Val">${c.primaryKpi2Val || '200'}</div>
                      <div class="font-heading font-bold text-[24px] mt-2" ${ce} data-field="primaryKpi2Label">${c.primaryKpi2Label || 'Qualified Participants'}</div>
                      <div class="font-body text-[16px] text-white/85 mt-1" ${ce} data-field="primaryKpi2Sub">${c.primaryKpi2Sub || ''}</div>
                    </div>
                  </div>

                  <div class="col-span-5 flex flex-col justify-between gap-3.5">
                    ${secKpis}
                  </div>
                </div>

                <!-- Bottom Row: 3 Target Participant Segment Cards (PDF Page 36) -->
                <div class="grid grid-cols-3 gap-8">
                  ${segCards}
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'charts': ({slide, index, isThumbnail, numStr, ce, c}) => {

          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              ${renderStandardWhiteHeader(c.sectionTag || 'DATA ANALYTICS', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[28px] pb-[90px] flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <h1 class="font-heading font-extrabold text-[46px] text-[#2B3736]" ${ce} data-field="title">
                    ${c.title || 'Practical Competency Growth & Curriculum Allocation'}
                  </h1>
                  <div class="flex items-center gap-5 text-[16px] font-heading font-bold">
                    <span class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-[#B6B7B7] inline-block"></span> Pre-Training Baseline</span>
                    <span class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-[#F97C00] inline-block"></span> Post-Xbrain Capstone</span>
                  </div>
                </div>

                <div class="grid grid-cols-12 gap-8 flex-1 my-4 items-stretch">
                  <!-- Left 7 Columns: Grouped Bar Chart -->
                  <div class="col-span-7 bg-[#F8F9FA] rounded-3xl p-7 border border-[#E5E7EB] flex flex-col justify-between">
                    <div>
                      <h3 class="font-heading font-bold text-[24px] text-[#2B3736]" ${ce} data-field="barChartTitle">${c.barChartTitle || ''}</h3>
                      <p class="font-body text-[17px] text-[#5E6E6D]" ${ce} data-field="barChartSubtitle">${c.barChartSubtitle || ''}</p>
                    </div>
                    <div class="relative h-[430px] w-full mt-4">
                      ${renderBarChart(c)}
                    </div>
                  </div>

                  <!-- Right 5 Columns: Doughnut Chart + Key Takeaway Box -->
                  <div class="col-span-5 flex flex-col justify-between gap-6">
                    <div class="bg-[#F8F9FA] rounded-3xl p-7 border border-[#E5E7EB] flex-1 flex flex-col justify-between">
                      <div>
                        <h3 class="font-heading font-bold text-[23px] text-[#2B3736]" ${ce} data-field="doughnutTitle">${c.doughnutTitle || ''}</h3>
                        <p class="font-body text-[16px] text-[#5E6E6D]" ${ce} data-field="doughnutSubtitle">${c.doughnutSubtitle || ''}</p>
                      </div>
                      <div class="relative h-[250px] w-full my-auto">
                        ${renderDoughnutChart(c)}
                      </div>
                    </div>

                    <div class="bg-[#E5F4EF] rounded-3xl p-6 border border-[#7FD7BB]">
                      <div class="text-[13px] font-heading font-bold uppercase tracking-wider text-[#25AC9D]">Executive Data Insight</div>
                      <h4 class="font-heading font-extrabold text-[22px] text-[#1F2928] mt-1" ${ce} data-field="keyInsightTitle">${c.keyInsightTitle || ''}</h4>
                      <p class="font-body text-[17px] text-[#2B3736] mt-1.5 leading-snug" ${ce} data-field="keyInsightBody">${c.keyInsightBody || ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'data-table': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const metaPillsHTML = (c.metaPills || []).map((m, i) => `
            <div class="p-4 rounded-2xl ${i % 2 === 0 ? 'bg-[#F97C00] text-white' : 'bg-[#E5F4EF] text-[#2B3736] border border-[#7FD7BB]'} flex flex-col justify-center">
              <div class="text-[13px] font-heading font-bold uppercase tracking-wider opacity-85" ${ce} data-field="metaPills.${i}.label">${m.label}</div>
              <div class="text-[20px] font-heading font-extrabold mt-0.5" ${ce} data-field="metaPills.${i}.val">${m.val}</div>
            </div>
          `).join('');

          const tableRowsHTML = (c.rows || []).map((r, i) => `
            <tr class="hover:bg-[#FFF5ED] transition-colors">
              <td class="font-heading font-extrabold text-[#2B3736]">
                <span class="inline-block px-3.5 py-1.5 rounded-lg text-white text-[16px]" style="background:${r.badgeColor || '#F97C00'}" ${ce} data-field="rows.${i}.phase">${r.phase}</span>
              </td>
              <td class="font-heading font-bold text-[#F97C00] whitespace-nowrap" ${ce} data-field="rows.${i}.duration">${r.duration}</td>
              <td class="font-heading font-bold text-[#2B3736]" ${ce} data-field="rows.${i}.module">${r.module}</td>
              <td class="text-[#425453]" ${ce} data-field="rows.${i}.deliverables">${r.deliverables}</td>
              <td class="font-semibold text-[#25AC9D]" ${ce} data-field="rows.${i}.assessment">${r.assessment}</td>
            </tr>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              ${renderStandardWhiteHeader(c.sectionTag || 'LEARNING STRUCTURE', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[28px] pb-[90px] flex flex-col justify-between">
                <h1 class="font-heading font-extrabold text-[46px] text-[#25AC9D]" ${ce} data-field="title">
                  ${c.title || 'Program Overview & Structured Learning Phases'}
                </h1>

                <!-- Top Summary Meta Strip (PDF Page 36 Program Overview Bars) -->
                <div class="grid grid-cols-4 gap-6 my-3">
                  ${metaPillsHTML}
                </div>

                <!-- Corporate Curriculum Data Table -->
                <div class="bg-white rounded-3xl border-2 border-[#E5E7EB] shadow-lg overflow-hidden flex-1 flex flex-col">
                  <table class="w-full text-left border-collapse x-data-table">
                    <thead>
                      <tr class="bg-[#425453] text-white">
                        <th class="w-[16%]" ${ce} data-field="colPhase">${c.colPhase || 'Training Phase'}</th>
                        <th class="w-[11%]" ${ce} data-field="colDuration">${c.colDuration || 'Duration'}</th>
                        <th class="w-[23%]" ${ce} data-field="colModule">${c.colModule || 'Core Curriculum Track'}</th>
                        <th class="w-[28%]" ${ce} data-field="colLabs">${c.colLabs || 'Hands-On Labs &amp; Technical Scope'}</th>
                        <th class="w-[22%]" ${ce} data-field="colOutput">${c.colOutput || 'Output &amp; Evaluation'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tableRowsHTML}
                    </tbody>
                  </table>
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'timeline': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const milestoneCards = (c.milestones || []).map((m, idx) => `
            <div class="relative flex flex-col justify-between bg-white/15 backdrop-blur-md border-2 border-white/35 rounded-3xl p-7 text-white shadow-xl">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="px-4 py-1.5 rounded-full bg-white text-[#F97C00] font-heading font-extrabold text-[18px]" ${ce} data-field="milestones.${idx}.period">${m.period}</span>
                  <span class="font-heading font-bold text-[16px] text-[#FFD54C]" ${ce} data-field="milestones.${idx}.phase">${m.phase}</span>
                </div>
                <h3 class="font-heading font-extrabold text-[26px] leading-[1.25] mb-3" ${ce} data-field="milestones.${idx}.title">${m.title}</h3>
                <p class="font-body text-[19px] leading-[1.5] text-white/90" ${ce} data-field="milestones.${idx}.desc">${m.desc}</p>
              </div>
              <div class="mt-6 pt-4 border-t border-white/25 flex items-center justify-between">
                <span class="text-[14px] font-heading uppercase tracking-wider text-[#7FD7BB]">Key Milestone</span>
                <span class="font-heading font-bold text-[17px]" ${ce} data-field="milestones.${idx}.deliverable">${m.deliverable}</span>
              </div>
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-xbrain-orange-bands relative overflow-hidden flex flex-col justify-between p-[96px]">
              <svg class="circuit-pattern-overlay light-on-orange right-[-40px] top-[-40px] w-[900px] h-[640px]"><use href="#xbrain-circuit-pattern"></use></svg>

              <!-- Top Header -->
              <div class="relative z-10">
                <div class="flex items-center justify-between pb-6 border-b border-white/35">
                  <div class="flex items-center gap-6">
                    <svg class="w-[185px] h-[56px]"><use href="#xbrain-logo-white"></use></svg>
                    <span class="text-white/50">|</span>
                    <span class="font-heading font-bold text-[18px] uppercase tracking-widest text-white/90">${c.sectionTag || 'PROGRAM ROADMAP'}</span>
                  </div>
                  <span class="font-heading font-bold text-[22px] text-white">${numStr}</span>
                </div>

                <h1 class="font-heading font-extrabold text-[52px] text-white mt-7" ${ce} data-field="title">
                  ${c.title || 'Program Overview — Cohort Execution Timeline'}
                </h1>
                <p class="font-body text-[23px] text-white/90 mt-1" ${ce} data-field="subtitle">
                  ${c.subtitle || ''}
                </p>
              </div>

              <!-- Horizontal Axis Line + Nodes (PDF Page 36 Program Overview Orange Slide Motif) -->
              <div class="relative z-10 my-2">
                <div class="h-1.5 bg-white/40 w-full rounded-full relative flex items-center justify-around">
                  <div class="w-7 h-7 rounded-full bg-[#7FD7BB] border-4 border-white shadow"></div>
                  <div class="w-7 h-7 rounded-full bg-[#FFD54C] border-4 border-white shadow"></div>
                  <div class="w-7 h-7 rounded-full bg-[#7FD7BB] border-4 border-white shadow"></div>
                  <div class="w-7 h-7 rounded-full bg-[#FFFFFF] border-4 border-[#25AC9D] shadow"></div>
                </div>
              </div>

              <!-- 4 Milestone Columns -->
              <div class="relative z-10 grid grid-cols-4 gap-7 flex-1 max-h-[500px]">
                ${milestoneCards}
              </div>

              <!-- Footer -->
              <div class="relative z-10 flex items-center justify-between text-white/85 text-[18px] pt-4 border-t border-white/25">
                <span>Continuous Mentorship by AWS, Synaptix & TechX Principal Engineers</span>
                <span class="font-heading font-bold text-white">www.xbrain.com.vn</span>
              </div>
            </div>
          `;
  },
  'comparison': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const leftList = (c.leftItems || []).map((it, i) => `
            <div class="bg-white rounded-2xl p-5 border border-[#FBCAAB] shadow-sm">
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-[#425453] text-white font-heading font-bold text-[14px] flex items-center justify-center">0${i+1}</span>
                <h4 class="font-heading font-extrabold text-[21px] text-[#2B3736]" ${ce} data-field="leftItems.${i}.title">${it.title}</h4>
              </div>
              <p class="font-body text-[18px] text-[#5E6E6D] mt-1.5 pl-10" ${ce} data-field="leftItems.${i}.desc">${it.desc}</p>
            </div>
          `).join('');

          const rightList = (c.rightItems || []).map((it, i) => `
            <div class="bg-white rounded-2xl p-5 border border-[#F97C00]/30 shadow-sm">
              <div class="flex items-center gap-3">
                <span class="w-7 h-7 rounded-full bg-[#F97C00] text-white font-heading font-bold text-[14px] flex items-center justify-center">✓</span>
                <h4 class="font-heading font-extrabold text-[21px] text-[#2B3736]" ${ce} data-field="rightItems.${i}.title">${it.title}</h4>
              </div>
              <p class="font-body text-[18px] text-[#5E6E6D] mt-1.5 pl-10" ${ce} data-field="rightItems.${i}.desc">${it.desc}</p>
            </div>
          `).join('');

          const uniBenefits = (c.bottomBenefits || []).map((b, i) => `
            <div class="px-4 py-2.5 rounded-xl bg-white border border-[#7FD7BB] font-heading font-bold text-[17px] text-[#2B3736] flex items-center gap-2 shadow-sm">
              <span class="text-[#25AC9D]">●</span>
              <span ${ce} data-field="bottomBenefits.${i}">${b}</span>
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden flex flex-col">
              ${renderStandardWhiteHeader(c.sectionTag || 'COMMITMENT & OUTPUT', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[24px] pb-[86px] flex flex-col justify-between">
                <h1 class="font-heading font-extrabold text-[44px] text-[#25AC9D]" ${ce} data-field="title">
                  ${c.title || 'Student Commitment & Output'}
                </h1>

                <!-- Two-Pane Comparison (Exact PDF Page 36 Peach Containers) -->
                <div class="grid grid-cols-2 gap-10 my-2">
                  <!-- Left Pane: What we need from students -->
                  <div class="bg-[#FDECE1] rounded-3xl p-7 border-2 border-[#FBCAAB] flex flex-col justify-between">
                    <div class="flex items-center gap-4 mb-4">
                      <div class="w-12 h-12 rounded-2xl bg-[#425453] text-white flex items-center justify-center font-heading font-extrabold text-[20px]" ${ce} data-field="leftBadge">${c.leftBadge || 'IN'}</div>
                      <div>
                        <h3 class="font-heading font-extrabold text-[27px] text-[#2B3736]" ${ce} data-field="leftHeader">${c.leftHeader || 'What we need from students'}</h3>
                        <p class="font-body text-[17px] text-[#5E6E6D]" ${ce} data-field="leftSub">${c.leftSub || ''}</p>
                      </div>
                    </div>
                    <div class="space-y-3.5">
                      ${leftList}
                    </div>
                  </div>

                  <!-- Right Pane: What we can offer -->
                  <div class="bg-[#FBD8C0] rounded-3xl p-7 border-2 border-[#F97C00]/40 flex flex-col justify-between">
                    <div class="flex items-center gap-4 mb-4">
                      <div class="w-12 h-12 rounded-2xl bg-[#F97C00] text-white flex items-center justify-center font-heading font-extrabold text-[20px]" ${ce} data-field="rightBadge">${c.rightBadge || 'OUT'}</div>
                      <div>
                        <h3 class="font-heading font-extrabold text-[27px] text-[#2B3736]" ${ce} data-field="rightHeader">${c.rightHeader || 'What we can offer'}</h3>
                        <p class="font-body text-[17px] text-[#425453]" ${ce} data-field="rightSub">${c.rightSub || ''}</p>
                      </div>
                    </div>
                    <div class="space-y-3.5">
                      ${rightList}
                    </div>
                  </div>
                </div>

                <!-- Bottom Strip: Benefits for the University (PDF Page 36) -->
                <div class="bg-[#E5F4EF] rounded-3xl p-6 border border-[#7FD7BB]">
                  <div class="font-heading font-extrabold text-[20px] text-[#25AC9D] mb-3" ${ce} data-field="bottomBannerTitle">
                    ${c.bottomBannerTitle || 'Benefits for the University'}
                  </div>
                  <div class="grid grid-cols-3 gap-3">
                    ${uniBenefits}
                  </div>
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  },
  'track-architecture': ({slide, index, isThumbnail, numStr, ce, c}) => {
          const cloudMods = (c.cloudopsModules || []).map((m, i) => `
            <div class="p-3.5 rounded-xl bg-[#E5F4EF] border border-[#7FD7BB] text-[#1F2928] font-heading font-bold text-[16px] flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-full bg-[#25AC9D] text-white text-[12px] flex items-center justify-center shrink-0">0${i+1}</span>
              <span ${ce} data-field="cloudopsModules.${i}">${m}</span>
            </div>
          `).join('');

          const devMods = (c.devopsModules || []).map((m, i) => `
            <div class="p-3.5 rounded-xl bg-[#FFF5ED] border border-[#FBCAAB] text-[#1F2928] font-heading font-bold text-[16px] flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-full bg-[#F97C00] text-white text-[12px] flex items-center justify-center shrink-0">0${i+1}</span>
              <span ${ce} data-field="devopsModules.${i}">${m}</span>
            </div>
          `).join('');

          const pedStack = (c.pedagogyLayers || []).map((l, i) => `
            <div class="py-3 px-5 rounded-2xl text-white font-heading font-extrabold text-[18px] shadow-md text-center" style="background:${l.color}" ${ce} data-field="pedagogyLayers.${i}.name">
              ${l.name}
            </div>
          `).join('');

          const nextStepsList = (c.nextSteps || []).map((ns, i) => `
            <div class="px-4 py-2.5 rounded-xl bg-white border border-[#E5E7EB] font-heading font-bold text-[16px] text-[#2B3736] shadow-sm" ${ce} data-field="nextSteps.${i}">
              ${ns}
            </div>
          `).join('');

          return `
            <div class="w-[1920px] h-[1080px] bg-[#F8F9FA] relative overflow-hidden flex flex-col">
              ${renderStandardWhiteHeader(c.sectionTag || 'TRACK FOCUS & PEDAGOGY', numStr)}

              <div class="relative z-10 flex-1 px-[96px] pt-[24px] pb-[86px] flex flex-col justify-between">
                <h1 class="font-heading font-extrabold text-[44px] text-[#2B3736]" ${ce} data-field="title">
                  ${c.title || 'CloudOps & DevOps Track Focus + Learning Methodology'}
                </h1>

                <div class="grid grid-cols-12 gap-8 flex-1 my-3 items-stretch">
                  <!-- Left 4 Columns: CloudOps Track (Teal #25AC9D — PDF Page 36 Bottom-Left) -->
                  <div class="col-span-4 bg-white rounded-3xl p-7 border-2 border-[#7FD7BB] shadow-md flex flex-col justify-between">
                    <div>
                      <span class="px-3 py-1 rounded-full bg-[#E5F4EF] text-[#25AC9D] font-heading font-bold text-xs uppercase">Track 01</span>
                      <h3 class="font-heading font-extrabold text-[34px] text-[#25AC9D] mt-2" ${ce} data-field="cloudopsTitle">${c.cloudopsTitle || 'CloudOps'}</h3>
                      <p class="font-body text-[17px] text-[#425453] mt-2 leading-snug" ${ce} data-field="cloudopsDesc">${c.cloudopsDesc || ''}</p>
                    </div>
                    <div class="space-y-2.5 mt-4">
                      ${cloudMods}
                    </div>
                  </div>

                  <!-- Center 4 Columns: DevOps Track (Orange #F97C00 — PDF Page 36 Bottom-Center) -->
                  <div class="col-span-4 bg-white rounded-3xl p-7 border-2 border-[#FBCAAB] shadow-md flex flex-col justify-between">
                    <div>
                      <span class="px-3 py-1 rounded-full bg-[#FDECE1] text-[#F97C00] font-heading font-bold text-xs uppercase">Track 02</span>
                      <h3 class="font-heading font-extrabold text-[34px] text-[#F97C00] mt-2" ${ce} data-field="devopsTitle">${c.devopsTitle || 'DevOps'}</h3>
                      <p class="font-body text-[17px] text-[#425453] mt-2 leading-snug" ${ce} data-field="devopsDesc">${c.devopsDesc || ''}</p>
                    </div>
                    <div class="space-y-2.5 mt-4">
                      ${devMods}
                    </div>
                  </div>

                  <!-- Right 4 Columns: 5-Layer Teaching Stack + Next Steps (PDF Page 36 Bottom-Right) -->
                  <div class="col-span-4 flex flex-col justify-between gap-5">
                    <div class="bg-white rounded-3xl p-6 border-2 border-[#EAEAEA] shadow-md flex-1 flex flex-col justify-between">
                      <h3 class="font-heading font-extrabold text-[23px] text-[#2B3736]" ${ce} data-field="pedagogyTitle">${c.pedagogyTitle || 'Teaching & Learning Approach'}</h3>
                      <div class="space-y-2.5 my-auto">
                        ${pedStack}
                      </div>
                    </div>

                    <div class="bg-[#FDECE1] rounded-3xl p-5 border border-[#FBCAAB]">
                      <div class="font-heading font-extrabold text-[18px] text-[#F97C00] mb-2">Next Steps for Launch</div>
                      <div class="grid grid-cols-2 gap-2">
                        ${nextStepsList}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              ${renderStandardWhiteFooter(numStr, false)}
            </div>
          `;
  }
    });

  return SLIDE_RENDERERS;
}
