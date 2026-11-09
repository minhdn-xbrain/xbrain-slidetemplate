import type { XBrainSlide } from "../types/xbrain";
import { BRAND_PHOTOS } from "../lib/xbrainAssets";

export const INITIAL_TEMPLATE_SLIDES: XBrainSlide[] = [
      // SLIDE 1 — GROUP A: COVER SLIDE
      {
        id: "slide-01",
        type: "cover",
        group: "Overview",
        layoutName: "Cover Slide",
        content: {
          badge: "UNIVERSITY & ENTERPRISE COLLABORATION • DEC 2025",
          titleLine1: "Building Future",
          titleLine2: "Tech Talent,",
          titleLine3: "together with",
          subtitle: "An invitation for University & Enterprise Collaboration — Empowering the next generation of professionals with practical, future-ready skills in CloudOps, DevOps, and Generative AI.",
          presenter: "Mr. Ha Ngo — Chief Executive Officer",
          location: "Vietnam Innovation Hub Town, 179 Tran Hung Dao, Da Nang City",
          website: "www.xbrain.com.vn"
        }
      },

      // SLIDE 2 — GROUP A: AGENDA SLIDE
      {
        id: "slide-02",
        type: "agenda",
        group: "Overview",
        layoutName: "Agenda Slide",
        content: {
          sectionTag: "OVERVIEW & STRUCTURE",
          title: "Strategic Agenda & Presentation Roadmap",
          leftHeadline: "Bridging Academic Foundations & Production Engineering",
          leftSummary: "Built by top technology experts from AWS, Synaptix, and TechX to shape Vietnam's high-quality digital workforce.",
          items: [
            { num: "01", title: "Introduction & Brand Identity", desc: "Who We Are, Vision & Mission, and Three Core Pillars of Excellence", tag: "Slides 03–08" },
            { num: "02", title: "Context, Rationale & Program Objectives", desc: "Market demand for CloudOps/DevOps and strategic university-industry alignment", tag: "Slides 09–10" },
            { num: "03", title: "Target Participants & KPI Metrics", desc: "Candidate funnel (500 applications → 200 qualified talent) and performance benchmarks", tag: "Slides 11–12" },
            { num: "04", title: "Curriculum Architecture & Training Roadmap", desc: "16-week structured tracks (Foundation, Core Skills, Capstone) and Jan–Aug schedule", tag: "Slides 13–14" },
            { num: "05", title: "Student Commitment, Track Focus & Next Steps", desc: "Mutual expectations, CloudOps/DevOps deep-dive, and pilot cohort launch in Da Nang", tag: "Slides 15–16" }
          ]
        }
      },

      // SLIDE 3 — GROUP A: SECTION DIVIDER
      {
        id: "slide-03",
        type: "section-divider",
        group: "Overview",
        layoutName: "Section Divider",
        content: {
          sectionNumber: "01",
          categoryLabel: "BRAND & CORPORATE IDENTITY",
          title: "Introduction & Strategic Foundation",
          subtitle: "How Xbrain transforms emerging talent into world-class Cloud, DevOps, and GenAI professionals through hands-on engineering."
        }
      },

      // SLIDE 4 — GROUP B: TEXT + IMAGE (WHO WE ARE — PDF PAGE 4)
      {
        id: "slide-04",
        type: "text-image",
        group: "Narrative",
        layoutName: "Text + Image",
        content: {
          sectionTag: "INTRODUCTION",
          title: "1.1 Who We Are — Engine for Capability Building",
          leadParagraph: "is a talent development company built by top technology experts from AWS, Synaptix and TechX, with a mission to support students, fresh graduates, and career switchers in building strong foundations and job-ready skills in CloudOps and DevOps.",
          bodyParagraph: "Through structured training programs, hands-on labs, and real-world projects, Xbrain transforms emerging talent into world-class cloud and GenAI professionals, bridging the gap between academic learning and production-ready engineering. As TechX accelerates its GenAI, Data, and Security initiatives, Xbrain serves as the engine for capability building, shaping the next generation of technology leaders.",
          imageCaption: "Immersive hands-on Cloud & GenAI training cohort at Xbrain Innovation Hub",
          highlights: [
            { label: "Experts From", value: "AWS, Synaptix & TechX" },
            { label: "Core Focus", value: "CloudOps, DevOps & GenAI" },
            { label: "Methodology", value: "100% Real-World Labs" }
          ]
        }
      },

      // SLIDE 5 — GROUP B: TITLE + BODY CONTENT (VISION & MISSION — PDF PAGE 5)
      {
        id: "slide-05",
        type: "title-body",
        group: "Narrative",
        layoutName: "Title + Body Content",
        content: {
          sectionTag: "INTRODUCTION",
          title: "1.2 Our Vision and Our Mission",
          missionLabel: "OUR CORE MISSION",
          missionText: "Xbrain focuses on building strong foundations and practical capabilities in CloudOps, DevOps, and Generative AI, grounded in the belief that real expertise is shaped through hands-on experience and real-world application. Through structured training programs, immersive labs, and practical implementation, Xbrain prepares talent to operate confidently in production environments.",
          visionLabel: "LONG-TERM REGIONAL VISION",
          visionText: "Our vision extends beyond talent development. Xbrain aims to contribute to the growth of Vietnam's high-quality digital workforce, strengthen the country's position in the global technology value chain, and support the adoption of advanced cloud and AI solutions across key industries. By doing so, Xbrain plays a vital role in enabling TechX's long-term regional expansion.",
          pillars: [
            { title: "Industry Demand Alignment", desc: "Guided directly by principal architects and practitioners from TechX, AWS, and Synaptix." },
            { title: "Operational Readiness", desc: "Training engineered around live production architectures, security standards, and cost optimization." },
            { title: "Workforce Sustainability", desc: "Building a continuous talent pipeline for Vietnam's digital economy and regional tech ecosystem." }
          ]
        }
      },

      // SLIDE 6 — GROUP B: THREE-CARD LAYOUT (OUR VALUE — PDF PAGE 6)
      {
        id: "slide-06",
        type: "three-card",
        group: "Narrative",
        layoutName: "Three-Card Layout",
        content: {
          sectionTag: "INTRODUCTION",
          title: "1.3 Our Value — Three Pillars of Xbrain Impact",
          card1Title: "Practice-Driven Excellence",
          card1Body: "We build real expertise through hands-on experience, practical labs, and production-level challenges. Our programs focus on applied learning to ensure talent is truly job-ready.",
          card2Title: "Industry Alignment & Impact",
          card2Body: "Guided by experts from TechX, AWS, and Synaptix, we stay aligned with evolving industry needs. Our approach ensures operational relevance and contributes to a stronger digital workforce ecosystem.",
          card3Title: "Sustainable Talent Empowerment",
          card3Body: "We empower learners with strong foundations, clear pathways, and long-term career capabilities. Xbrain develops adaptable professionals ready to grow into future technology leaders."
        }
      },

      // SLIDE 7 — GROUP B: TWO-COLUMN CONTENT (CONTEXT & RATIONALE — PDF PAGE 36)
      {
        id: "slide-07",
        type: "two-column",
        group: "Narrative",
        layoutName: "Two-Column Content",
        content: {
          sectionTag: "STRATEGIC RATIONALE",
          title: "Context & Rationale for University Collaboration",
          points: [
            { num: "01.", text: "Rapid growth in Cloud computing, Data & AI technology across APAC enterprises" },
            { num: "02.", text: "Increasing demand for practical, job-ready CloudOps & DevOps engineering skills" },
            { num: "03.", text: "Universities play a key foundational role in preparing the future technology workforce" },
            { num: "04.", text: "Critical gap between academic theory and real-world production environment practice" }
          ],
          rightTitle: "The Catalyst Bridging Academia & Enterprise Production",
          rightBody: "Xbrain is committed to developing high-quality, job-ready talent, supporting sustainable workforce growth, and contributing to the national technology ecosystem through structured mentorship, AWS Skill Builder labs, and enterprise capstone projects.",
          rightMetrics: [
            { val: "4–6 Mos", label: "Intensive Blended Program" },
            { val: "3 Pillars", label: "Labs • Mentorship • Projects" }
          ]
        }
      },

      // SLIDE 8 — GROUP B: FOUR-QUADRANT LAYOUT (PROGRAM OBJECTIVES — PDF PAGE 36)
      {
        id: "slide-08",
        type: "four-quadrant",
        group: "Narrative",
        layoutName: "Four-Quadrant Layout",
        content: {
          sectionTag: "STRATEGIC GOALS",
          title: "Program Objectives & Ecosystem Value Creation",
          subtitle: "Designed to deliver measurable outcomes for students, universities, and enterprise technology partners.",
          quadrants: [
            { num: "01", title: "Enhance Practical CloudOps & DevOps Skills", desc: "Equip students with hands-on proficiency in cloud infrastructure, CI/CD automation, containerization, and security best practices.", color: "#F97C00", icon: "cloud-cog" },
            { num: "02", title: "Complement Existing University Curricula", desc: "Integrate industry-validated cloud labs and AWS Skill Builder modules directly alongside academic computer science foundations.", color: "#25AC9D", icon: "book-open-check" },
            { num: "03", title: "Improve Employability & Career Readiness", desc: "Bridge the transition from classroom to production engineering with real project portfolios, mock interviews, and direct job offers.", color: "#007BC1", icon: "award" },
            { num: "04", title: "Establish Long-Term University Collaboration", desc: "Build sustainable co-branded educational initiatives, faculty workshops, and R&D talent pipelines with partner universities.", color: "#85439A", icon: "handshake" }
          ]
        }
      },

      // SLIDE 9 — GROUP B: QUOTE / KEY TAKEAWAY (BRAND MANIFESTO — PDF PAGE 8 & 22)
      {
        id: "slide-09",
        type: "quote",
        group: "Narrative",
        layoutName: "Quote / Key Takeaway",
        content: {
          sectionTag: "BRAND PHILOSOPHY & MANIFESTO",
          quoteVN: "XBrain là công ty phát triển nhân tài được xây dựng bởi các chuyên gia công nghệ hàng đầu đến từ AWS, Synaptix và TechX.",
          quoteEN: "Xbrain means Technology for User's Experience — Real expertise is shaped through hands-on experience and real-world application.",
          author: "XBrain Brand Guidelines",
          role: "Thông điệp thương hiệu (không quy cho phát biểu của cá nhân)",
          highlightStat: "03",
          highlightLabel: "Learning pillars: hands-on labs, mentorship and real-world projects"
        }
      },

      // SLIDE 10 — GROUP C: KPI DASHBOARD (TARGET PARTICIPANTS — PDF PAGE 36)
      {
        id: "slide-10",
        type: "kpi-dashboard",
        group: "Metrics & Plan",
        layoutName: "KPI Dashboard",
        content: {
          sectionTag: "COHORT TARGETS · SAMPLE METRICS",
          title: "Target Participants & Illustrative Cohort Metrics",
          primaryKpi1Val: "500",
          primaryKpi1Label: "Targeted Applications per Cohort",
          primaryKpi1Sub: "Across partner universities & tech communities in Central Vietnam",
          primaryKpi2Val: "200",
          primaryKpi2Label: "Qualified Program Participants",
          primaryKpi2Sub: "40% selective admission rate via technical & aptitude assessment",
          secondaryKpis: [
            { val: "16–20 Wks", label: "Blended Learning Duration", color: "#F97C00" },
            { val: "85%+", label: "Illustrative Lab Completion Target", color: "#25AC9D" },
            { val: "100%", label: "Illustrative Mentorship Coverage", color: "#007BC1" }
          ],
          segments: [
            { title: "3rd & 4th Year Undergraduates", desc: "IT, Computer Science, and Software Engineering students preparing for industry internships and graduation.", badge: "Demo • 55%" },
            { title: "Fresh University Graduates", desc: "Recent STEM graduates seeking intensive production experience to accelerate full-time Cloud/DevOps placement.", badge: "Demo • 30%" },
            { title: "Motivated Career Switchers", desc: "Software developers and sysadmins transitioning into modern CloudOps, DevOps, and GenAI engineering roles.", badge: "Demo • 15%" }
          ]
        }
      },

      // SLIDE 11 — GROUP C: CHARTS & DATA VISUALIZATION (COMPETENCY GROWTH)
      {
        id: "slide-11",
        type: "charts",
        group: "Metrics & Plan",
        layoutName: "Charts & Data Visualization",
        content: {
          sectionTag: "DATA-DRIVEN CAPABILITY ANALYTICS",
          title: "Practical Competency Growth & Curriculum Allocation",
          barChartTitle: "MẪU DỮ LIỆU — Technical Readiness Score (100-Pt Scale)",
          barData: [
            { label: "Cloud Infra", pre: 34, post: 92 },
            { label: "CI/CD", pre: 28, post: 89 },
            { label: "Kubernetes", pre: 22, post: 86 },
            { label: "Terraform IaC", pre: 19, post: 88 },
            { label: "Monitoring", pre: 31, post: 91 }
          ],
          doughnutData: [
            { label: "Hands-on Labs", value: 45, color: "#F97C00" },
            { label: "Capstone", value: 25, color: "#25AC9D" },
            { label: "Mentorship", value: 15, color: "#007BC1" },
            { label: "Theory", value: 15, color: "#F6AF2F" }
          ],
          barChartSubtitle: "Illustrative dataset — not an actual measured cohort result",
          doughnutTitle: "Training Hours Distribution by Modality",
          doughnutSubtitle: "Total 240+ guided & self-paced hours over 4–6 months",
          keyInsightTitle: "Dữ liệu minh họa — thay trước khi sử dụng chính thức",
          keyInsightBody: "The charts illustrate editable visual structure. Replace these sample figures with verified training metrics before external distribution."
        }
      },

      // SLIDE 12 — GROUP C: DATA TABLE (LEARNING STRUCTURE — PDF PAGE 36)
      {
        id: "slide-12",
        type: "data-table",
        group: "Metrics & Plan",
        layoutName: "Data Table",
        content: {
          sectionTag: "CURRICULUM ARCHITECTURE",
          title: "Program Overview & Structured Learning Phases",
          metaPills: [
            { label: "Duration", val: "4 – 6 Months (16–20 Weeks)" },
            { label: "Format", val: "Online & Offline Blended Learning" },
            { label: "Specific Tracks", val: "CloudOps & DevOps Engineering" },
            { label: "Location", val: "Da Nang Innovation Hub & Partner Campuses" }
          ],
          rows: [
            {
              phase: "Phase 01 • Foundation",
              duration: "6 – 8 Weeks",
              module: "Cloud Practitioner Foundation & Cloud Fundamentals",
              deliverables: "Linux/Networking, Core AWS Compute/Storage/IAM, Cloud Security & Billing Basics",
              assessment: "AWS Cloud Practitioner Mock Exam + Hands-on Lab Checkpoints",
              badgeColor: "#25AC9D"
            },
            {
              phase: "Phase 02 • Core Skills",
              duration: "6 – 8 Weeks",
              module: "Specialized Track: CloudOps OR DevOps Engineering",
              deliverables: "CloudOps: Monitoring, HA, Cost Optimization | DevOps: CI/CD, Docker/K8s, Terraform IaC",
              assessment: "Production Scenario Troubleshooting & Automated Pipeline Labs",
              badgeColor: "#F97C00"
            },
            {
              phase: "Phase 03 • Capstone",
              duration: "2 – 4 Weeks",
              module: "Real-World Enterprise Group Capstone Project",
              deliverables: "End-to-end multi-tier cloud deployment, observability dashboard & architecture defense",
              assessment: "Live Technical Defense Evaluated by TechX, AWS & Synaptix Experts",
              badgeColor: "#24338A"
            },
            {
              phase: "Phase 04 • Career Launch",
              duration: "4 Weeks",
              module: "Technical Interview Prep & Enterprise Placement",
              deliverables: "CV/Portfolio polish, mock system design interviews & direct hiring matching",
              assessment: "Internship Completion Certificate & Full-Time Job Offers",
              badgeColor: "#85439A"
            }
          ]
        }
      },

      // SLIDE 13 — GROUP C: TIMELINE / ROADMAP (PROGRAM OVERVIEW — PDF PAGE 36)
      {
        id: "slide-13",
        type: "timeline",
        group: "Metrics & Plan",
        layoutName: "Timeline / Roadmap",
        content: {
          sectionTag: "ANNUAL EXECUTION SCHEDULE",
          title: "Program Overview — Cohort Execution Timeline",
          subtitle: "Structured 8-month cycle from university outreach and candidate assessment to full-time job placement.",
          milestones: [
            {
              period: "JAN – MAR",
              phase: "Stage 01",
              title: "Application & Technical Assessment",
              desc: "University roadshows, 500+ student applications, online aptitude testing, and selection of 200 qualified participants.",
              deliverable: "Finalize MoU & Cohort Onboarding"
            },
            {
              period: "MAR – MAY",
              phase: "Stage 02",
              title: "Cloud Foundations & Guided Labs",
              desc: "6–8 weeks of Cloud Practitioner fundamentals, core infrastructure architecture, IAM security, and AWS Skill Builder labs.",
              deliverable: "Foundation Gate Review"
            },
            {
              period: "MAY – JUL",
              phase: "Stage 03",
              title: "CloudOps & DevOps Track + Capstone",
              desc: "Deep-dive track specialization (CI/CD, IaC, Observability) followed by a 4-week real-world group project mentored by experts.",
              deliverable: "Capstone Architecture Defense"
            },
            {
              period: "JUL – AUG",
              phase: "Stage 04",
              title: "Interviews for Full-Time Engineering Jobs",
              desc: "Certification issuance, technical hiring panels with TechX, Synaptix & partner enterprises, and career onboarding.",
              deliverable: "Certificate & Job Placement"
            }
          ]
        }
      },

      // SLIDE 14 — GROUP C: COMPARISON / BEFORE & AFTER (STUDENT COMMITMENT & OUTPUT — PDF PAGE 36)
      {
        id: "slide-14",
        type: "comparison",
        group: "Metrics & Plan",
        layoutName: "Comparison / Two-Pane",
        content: {
          sectionTag: "MUTUAL VALUE & UNIVERSITY BENEFITS",
          title: "Student Commitment, Program Output & University Benefits",
          leftHeader: "What We Need From Students",
          leftSub: "Core commitments required to succeed in production-grade training",
          leftItems: [
            { title: "Active Participation & Discipline", desc: "Consistent attendance across blended lectures, mentor check-ins, and team sprints." },
            { title: "100% Lab & Project Completion", desc: "Timely execution of hands-on cloud labs, CI/CD exercises, and group capstone milestones." },
            { title: "Technical Understanding & Documentation", desc: "Clear architectural documentation, runbooks, and post-mortem analysis." }
          ],
          rightHeader: "What We Offer to Students",
          rightSub: "Tangible career outcomes and industry credentials delivered by Xbrain",
          rightItems: [
            { title: "Hands-On Experience with Mentor Support", desc: "Direct coaching from AWS, Synaptix, and TechX senior cloud engineers." },
            { title: "Industry Community for Professional Growth", desc: "Lifetime access to Xbrain alumni network, tech talks, and cloud study groups." },
            { title: "Internship Certificate & Direct Job Offers", desc: "Verified completion credentials and priority fast-track interviews for full-time roles." }
          ],
          bottomBannerTitle: "Strategic Benefits for Partner Universities (PDF Page 36)",
          bottomBenefits: [
            "Enhanced student employability",
            "Improved graduate employment rate",
            "Industry-aligned experiential learning",
            "Stronger industry engagement",
            "Co-branded educational initiatives",
            "Curriculum enrichment support"
          ]
        }
      },

      // SLIDE 15 — GROUP C: TRACK DEEP-DIVE & TEACHING APPROACH (PDF PAGE 36)
      {
        id: "slide-15",
        type: "track-architecture",
        group: "Metrics & Plan",
        layoutName: "Track Deep-Dive & Pedagogy",
        content: {
          sectionTag: "SPECIALIZED TRACKS & PEDAGOGY",
          title: "CloudOps & DevOps Track Focus + Learning Methodology",
          cloudopsTitle: "CloudOps Track Focus",
          cloudopsDesc: "Emphasizes operational excellence in cloud environments: infrastructure management, security, monitoring, and cost optimization.",
          cloudopsModules: [
            "Cloud infrastructure fundamentals",
            "Compute, storage & networking",
            "Identity & access management",
            "Monitoring, security & cost awareness",
            "Operational best practices"
          ],
          devopsTitle: "DevOps Track Focus",
          devopsDesc: "Emphasizes collaboration and automation across development and operations to accelerate delivery and system reliability.",
          devopsModules: [
            "Source control & collaboration",
            "Automated CI/CD pipelines",
            "Containerization & orchestration",
            "Infrastructure as Code (IaC)",
            "Deployment & observability"
          ],
          pedagogyTitle: "5-Layer Teaching & Learning Approach",
          pedagogyLayers: [
            { name: "01. Learning-by-Doing Methodology", color: "#F6AF2F" },
            { name: "02. Guided Labs & Supervised Practice", color: "#25AC9D" },
            { name: "03. Mentorship from Industry Practitioners", color: "#00B3D8" },
            { name: "04. Continuous Feedback & Assessment", color: "#FE4A0B" },
            { name: "05. AWS Skill Builder & Production Labs", color: "#F97C00" }
          ],
          nextSteps: [
            "01. Align on collaboration scope",
            "02. Discuss student selection & schedule",
            "03. Finalize MoU agreement",
            "04. Launch pilot cohort in Da Nang"
          ]
        }
      },

      // SLIDE 16 — GROUP A: CLOSING / THANK YOU SLIDE (PDF PAGE 36 & 37)
      {
        id: "slide-16",
        type: "closing",
        group: "Overview",
        layoutName: "Closing / Thank You",
        content: {
          headline: "THANK YOU",
          subheadline: "Let's Build Vietnam's Next Generation of Cloud & GenAI Leaders Together.",
          contactName: "Mr. Ha Ngo",
          contactRole: "Chief Executive Officer — Xbrain",
          phone: "(+84) 932 369 216  |  +(84) 28 3620 9897",
          email: "ha.ngo@xbrain.com.vn  |  Cloud@xbrain.com.vn",
          address: "Vietnam Innovation Hub Town, 179 Tran Hung Dao, An Hai Ward, Da Nang City",
          website: "www.xbrain.com.vn"
        }
      },
      {"type":"process-flow","content":{"sectionTag":"PROCESS DESIGN","kicker":"PROPOSED DIAGRAM · OPERATING FLOW","title":"Từ mục tiêu đến kết quả đào tạo","subtitle":"Một quy trình triển khai rõ trách nhiệm và điểm kiểm soát trong mỗi giai đoạn.","steps":[{"title":"Discover","desc":"Nhu cầu kỹ năng, phân khúc học viên và yêu cầu doanh nghiệp"},{"title":"Design","desc":"Chọn track, mục tiêu kỹ thuật, labs và mentor"},{"title":"Deliver","desc":"Đào tạo, lab thực hành và capstone theo cohort"},{"title":"Validate","desc":"Đánh giá năng lực, demo sản phẩm, phản hồi"},{"title":"Improve","desc":"Cập nhật syllabus, mentor playbook và lộ trình"}]},"id":"slide-17","group":"Diagrams","layoutName":"Process Flow"},
      {"type":"conversion-funnel","content":{"sectionTag":"CONVERSION DESIGN","kicker":"PROPOSED DIAGRAM · ILLUSTRATIVE DATA","title":"Tuyển sinh: Funnel chuyển đổi ứng viên","subtitle":"Số liệu dưới đây chỉ để minh họa bố cục, không phải số liệu thực tế.","note":"Dữ liệu minh họa · thay toàn bộ chỉ tiêu trước khi sử dụng chính thức","stages":[{"title":"Reach • Truyền thông","value":"2,000","desc":"lượt quan tâm (minh họa)"},{"title":"Apply • Đăng ký","value":"500","desc":"hồ sơ (minh họa)"},{"title":"Screen • Sàng lọc","value":"350","desc":"hồ sơ đạt điều kiện"},{"title":"Assess • Đánh giá","value":"260","desc":"tham gia bài test"},{"title":"Enroll • Nhập học","value":"200","desc":"học viên (minh họa)"}]},"id":"slide-18","group":"Diagrams","layoutName":"Conversion Funnel"},
      {"type":"cycle-loop","content":{"sectionTag":"CONTINUOUS IMPROVEMENT","kicker":"PROPOSED DIAGRAM · LEARNING LOOP","title":"Vòng lặp cải tiến năng lực thực chiến","subtitle":"Cấu trúc đề xuất để trình bày cách XBrain tối ưu chương trình đào tạo theo phản hồi.","center":"BUILD → LEARN","centerSub":"→ IMPROVE","nodes":[{"title":"Set outcomes","desc":"Mục tiêu năng lực"},{"title":"Build labs","desc":"Tình huống production"},{"title":"Practice","desc":"Thực hành có mentor"},{"title":"Assess","desc":"Rubric & demonstration"},{"title":"Iterate","desc":"Phản hồi & cập nhật"}]},"id":"slide-19","group":"Diagrams","layoutName":"Continuous Improvement Cycle"},
      {"type":"strategy-pyramid","content":{"sectionTag":"STRATEGIC FRAMEWORK","kicker":"PROPOSED DIAGRAM · HIERARCHY","title":"Tháp xây dựng năng lực nghề nghiệp","subtitle":"Từ nền tảng kiến thức đến tác động thực tế trong môi trường doanh nghiệp.","levels":[{"title":"Production Readiness","short":"Ready for real workloads","callout":"Tác động doanh nghiệp"},{"title":"Capstone & Mentorship","short":"Real projects • feedback","callout":"Chứng minh năng lực"},{"title":"CloudOps / DevOps Tracks","short":"Tools • operations • delivery","callout":"Kỹ năng chuyên sâu"},{"title":"Cloud Foundation","short":"Cloud • Linux • networking","callout":"Nền tảng bắt buộc"}]},"id":"slide-20","group":"Diagrams","layoutName":"Strategy Pyramid"},
      {"type":"decision-matrix","content":{"sectionTag":"DECISION SUPPORT","kicker":"PROPOSED DIAGRAM · COMPARISON","title":"Ma trận đánh giá ưu tiên đào tạo","subtitle":"Ví dụ so sánh các lựa chọn nội dung theo năng lực cần đạt.","note":"Chỉ là mô hình đánh giá minh họa; thay ma trận bằng quyết định thực tế.","columns":["CloudOps","DevOps","GenAI","Security","Data"],"rows":[{"label":"Foundation","values":["High","High","Mid","High","Mid"]},{"label":"Hands-on","values":["High","High","High","High","Mid"]},{"label":"Capstone","values":["High","High","High","Mid","High"]},{"label":"Hiring","values":["Mid","High","Mid","High","Mid"]},{"label":"Mentorship","values":["High","High","High","High","High"]}]},"id":"slide-21","group":"Diagrams","layoutName":"Decision Matrix"},
      {"type":"org-chart","content":{"sectionTag":"OPERATING MODEL","kicker":"PROPOSED DIAGRAM · GOVERNANCE","title":"Mô hình quản trị và vận hành cohort","subtitle":"Minh họa các nhóm chức năng, không phải sơ đồ nhân sự chính thức của XBrain.","rootTitle":"Program Steering","rootDesc":"Accountability & outcomes","teams":[{"title":"Academic Design","desc":"Curriculum & assessment","output":"Learning standards","metric":"Owner: Curriculum"},{"title":"Engineering Mentors","desc":"Labs & production cases","output":"Technical coaching","metric":"Owner: Engineering"},{"title":"Operations","desc":"Enrollment & schedules","output":"Cohort execution","metric":"Owner: Program Ops"},{"title":"Career & Partners","desc":"Industry feedback & hiring","output":"Employment support","metric":"Owner: Partnerships"}]},"id":"slide-22","group":"Diagrams","layoutName":"Organization / Governance"},
      {"type":"swimlane","content":{"sectionTag":"DELIVERY MANAGEMENT","kicker":"PROPOSED DIAGRAM · SWIMLANE","title":"Swimlane: phối hợp triển khai chương trình","subtitle":"Mỗi hàng đại diện một nhóm phụ trách, mỗi cột là một giai đoạn phối hợp.","phases":["Plan","Prepare","Deliver","Evaluate"],"lanes":[{"name":"XBrain","tasks":["Scope & outcomes","Curriculum & mentor","Labs / assessments","Quality review"]},{"name":"University","tasks":["Student outreach","Venue & schedule","Student support","Feedback loop"]},{"name":"Industry","tasks":["Skill requirements","Real-world cases","Mentor participation","Talent interviews"]}]},"id":"slide-23","group":"Diagrams","layoutName":"Swimlane Plan"},
      {"type":"hub-spoke","content":{"sectionTag":"CAPABILITY ECOSYSTEM","kicker":"PROPOSED DIAGRAM · HUB & SPOKE","title":"XBrain Capability Building Ecosystem","subtitle":"Mô hình các năng lực xoay quanh trung tâm đào tạo nhân lực công nghệ.","center":"XBrain","centerSub":"LEARNING ENGINE","nodes":[{"title":"CloudOps","desc":"Run & operate"},{"title":"DevOps","desc":"Automate & deliver"},{"title":"GenAI","desc":"AI application"},{"title":"Security","desc":"Trust & control"},{"title":"Industry","desc":"Mentor & feedback"},{"title":"University","desc":"Talent pipeline"}]},"id":"slide-24","group":"Diagrams","layoutName":"Hub & Spoke"},
      {"type":"learner-journey","content":{"sectionTag":"EXPERIENCE DESIGN","kicker":"PROPOSED DIAGRAM · JOURNEY","title":"Learner Journey: hành trình từ khám phá đến nghề nghiệp","subtitle":"5 giai đoạn để thiết kế trải nghiệm học viên nhất quán và có thể đo lường.","stages":[{"channel":"AWARENESS","title":"Discover","action":"Tìm hiểu chương trình, track và điều kiện đầu vào","metric":"Reach / Interest"},{"channel":"ADMISSION","title":"Apply","action":"Nộp hồ sơ, kiểm tra nền tảng và chọn track","metric":"Applications"},{"channel":"LEARNING","title":"Practice","action":"Labs, mentor check-in và học qua tình huống thực tế","metric":"Lab completion"},{"channel":"CAPSTONE","title":"Demonstrate","action":"Project review, demo và bảo vệ kiến trúc","metric":"Portfolio quality"},{"channel":"CAREER","title":"Launch","action":"Phỏng vấn, hỗ trợ nghề nghiệp và alumni learning","metric":"Career outcomes"}]},"id":"slide-25","group":"Diagrams","layoutName":"Learner Journey"},
      {"type":"layered-architecture","content":{"sectionTag":"ARCHITECTURE FRAMEWORK","kicker":"PROPOSED DIAGRAM · TECH STACK","title":"Kiến trúc kỹ năng CloudOps / DevOps theo lớp","subtitle":"Cấu trúc kiến thức minh họa để kết nối công nghệ với vận hành thực tế.","tiers":[{"title":"User & Business Outcomes","desc":"Reliability, delivery speed, cost & customer experience","tag":"OUTCOMES"},{"title":"Observability & Security","desc":"Monitoring, identity, policy and incident response","tag":"CONTROL"},{"title":"Delivery Automation","desc":"CI/CD, infrastructure as code, containers & pipelines","tag":"AUTOMATE"},{"title":"Cloud Platform Services","desc":"Compute, storage, networking, managed services","tag":"PLATFORM"},{"title":"Foundational Skills","desc":"Linux, scripting, networking fundamentals","tag":"FOUNDATION"}]},"id":"slide-26","group":"Diagrams","layoutName":"Layered Architecture"},
      {"type":"sankey-flow","content":{"sectionTag":"ALLOCATION DESIGN","kicker":"PROPOSED DIAGRAM · CONCEPTUAL FLOW","title":"Dòng chảy năng lực: từ nguồn lực đến kết quả","subtitle":"Sankey minh họa tương quan; độ rộng chỉ mang tính trực quan, không phải báo cáo định lượng.","note":"Mô hình phân bổ khái niệm · số liệu là dữ liệu mẫu, chưa được kiểm chứng","sources":[{"label":"Hands-on Labs"},{"label":"Mentorship"},{"label":"Capstone"}],"targets":[{"label":"Technical Skills"},{"label":"Portfolio"},{"label":"Career Readiness"}],"links":[{"from":0,"to":0,"value":44},{"from":0,"to":1,"value":16},{"from":1,"to":0,"value":16},{"from":1,"to":2,"value":23},{"from":2,"to":1,"value":31},{"from":2,"to":2,"value":26}]},"id":"slide-27","group":"Diagrams","layoutName":"Sankey / Allocation Flow"},
      {"type":"heatmap","content":{"sectionTag":"SKILL ANALYTICS","kicker":"PROPOSED DIAGRAM · ILLUSTRATIVE SCORING","title":"Heatmap năng lực theo công nghệ và nhóm","subtitle":"Thang điểm 0–5 minh họa cách theo dõi readiness theo từng nhóm kỹ năng.","note":"Điểm năng lực minh họa; thay bằng rubric và dữ liệu thực tế khi sử dụng.","columns":["Cloud","Linux","CI/CD","IaC","Security","Monitor"],"rows":[{"label":"Cohort A","values":[4,3,3,2,3,2]},{"label":"Cohort B","values":[4,4,3,4,2,3]},{"label":"Cohort C","values":[2,3,4,4,3,3]},{"label":"Cohort D","values":[3,4,4,3,4,3]},{"label":"Cohort E","values":[4,5,4,4,3,5]}]},"id":"slide-28","group":"Diagrams","layoutName":"Capability Heatmap"},
      {"id": "slide-venn-diagram", "type": "venn-diagram", "group": "Diagrams", "layoutName": "Venn Diagram", "content": {"sectionTag": "VALUE PROPOSITION", "kicker": "PROPOSED DIAGRAM · VENN", "title": "Điểm giao thoa tạo nên năng lực thực chiến", "subtitle": "Ba nguồn lực gặp nhau ở trung tâm: học viên sẵn sàng làm việc trong môi trường production.", "center": "Job-ready", "centerSub": "Talent", "sets": [{"title": "Nhà trường", "desc": "Nền tảng học thuật, sinh viên có định hướng và lịch học ổn định."}, {"title": "Doanh nghiệp", "desc": "Bài toán thật, mentor thực chiến và nhu cầu tuyển dụng."}, {"title": "XBrain", "desc": "Chương trình, lab hands-on và phương pháp đánh giá năng lực."}]}},
      {"id": "slide-swot-analysis", "type": "swot-analysis", "group": "Diagrams", "layoutName": "SWOT Analysis", "content": {"sectionTag": "STRATEGIC ANALYSIS", "kicker": "PROPOSED DIAGRAM · SWOT", "title": "Phân tích SWOT chương trình đào tạo CloudOps", "subtitle": "Bức tranh nội lực và bối cảnh thị trường để chọn ưu tiên cho cohort tiếp theo.", "quadrants": [{"letter": "S", "title": "Strengths · Điểm mạnh", "items": ["Mentor đến từ AWS, Synaptix, TechX", "Lab mô phỏng môi trường production", "Lộ trình rõ theo track", "Đánh giá bằng sản phẩm thật"]}, {"letter": "W", "title": "Weaknesses · Điểm yếu", "items": ["Quy mô cohort còn nhỏ", "Phụ thuộc lịch mentor", "Nội dung GenAI mới hình thành"]}, {"letter": "O", "title": "Opportunities · Cơ hội", "items": ["Nhu cầu kỹ sư cloud tăng", "Hợp tác nhiều trường đại học", "Chuyển đổi số tại doanh nghiệp", "Chứng chỉ quốc tế được ưa chuộng"]}, {"letter": "T", "title": "Threats · Thách thức", "items": ["Cạnh tranh từ khóa học online", "Công nghệ thay đổi nhanh", "Học viên bỏ giữa chừng"]}]}},
      {"id": "slide-priority-matrix", "type": "priority-matrix", "group": "Diagrams", "layoutName": "Priority Matrix", "content": {"sectionTag": "DECISION SUPPORT", "kicker": "PROPOSED DIAGRAM · IMPACT × EFFORT", "title": "Ma trận ưu tiên sáng kiến", "subtitle": "Mỗi hạng mục được chấm theo tác động (0–100) và công sức (0–100) để chọn việc làm trước.", "note": "Dữ liệu minh họa · thay bằng số liệu đã kiểm chứng trước khi dùng chính thức", "xLabel": "Công sức thực hiện →", "yLabel": "Tác động →", "quadrantLabels": ["Làm ngay", "Dự án lớn", "Làm khi rảnh", "Cân nhắc bỏ"], "items": [{"label": "Bộ lab CI/CD mẫu", "x": 25, "y": 82}, {"label": "Ngân hàng câu hỏi đánh giá", "x": 35, "y": 68}, {"label": "Nền tảng học trực tuyến riêng", "x": 85, "y": 78}, {"label": "Chương trình mentor 1-1", "x": 62, "y": 88}, {"label": "Video giới thiệu track", "x": 20, "y": 30}, {"label": "Tự viết công cụ chấm bài", "x": 80, "y": 28}]}},
      {"id": "slide-mind-map", "type": "mind-map", "group": "Diagrams", "layoutName": "Mind Map", "content": {"sectionTag": "IDEATION", "kicker": "PROPOSED DIAGRAM · MIND MAP", "title": "Sơ đồ tư duy: thiết kế một cohort đào tạo", "subtitle": "Ý tưởng trung tâm và các nhánh cần quyết định trước khi khởi động.", "center": "Cohort 2026", "centerSub": "CloudOps & DevOps", "branches": [{"title": "Học viên", "leaves": ["Tiêu chí đầu vào", "Bài test năng lực", "Phân nhóm theo track"]}, {"title": "Nội dung", "leaves": ["Syllabus 16 tuần", "Lab hands-on", "Capstone project"]}, {"title": "Mentor", "leaves": ["Lịch check-in", "Rubric đánh giá", "Playbook"]}, {"title": "Đối tác", "leaves": ["Trường đại học", "Doanh nghiệp tuyển dụng"]}, {"title": "Vận hành", "leaves": ["Lịch học", "Hạ tầng lab", "Hỗ trợ học viên"]}, {"title": "Đo lường", "leaves": ["Tỉ lệ hoàn thành", "Điểm capstone", "Tỉ lệ có việc"]}]}},
      {"id": "slide-fishbone", "type": "fishbone", "group": "Diagrams", "layoutName": "Fishbone / Root Cause", "content": {"sectionTag": "ROOT CAUSE ANALYSIS", "kicker": "PROPOSED DIAGRAM · FISHBONE", "title": "Vì sao học viên chưa hoàn thành lab đúng hạn?", "subtitle": "Phân tích nguyên nhân theo 6 nhóm để chọn biện pháp khắc phục có trọng tâm.", "problem": "Tỉ lệ hoàn thành lab thấp", "problemSub": "Vấn đề cần giải quyết", "categories": [{"title": "Học viên", "causes": ["Thiếu nền tảng Linux", "Quỹ thời gian hạn chế", "Ngại hỏi mentor"]}, {"title": "Nội dung", "causes": ["Lab quá dài", "Hướng dẫn thiếu bước", "Ví dụ chưa sát thực tế"]}, {"title": "Mentor", "causes": ["Check-in thưa", "Phản hồi chậm"]}, {"title": "Hạ tầng", "causes": ["Tài khoản lab cấp muộn", "Giới hạn quota", "Môi trường không ổn định"]}, {"title": "Quy trình", "causes": ["Hạn nộp dồn cuối tuần", "Chưa có nhắc việc"]}, {"title": "Đo lường", "causes": ["Không theo dõi theo ngày", "Thiếu cảnh báo sớm"]}]}},
      {"id": "slide-staircase", "type": "staircase", "group": "Diagrams", "layoutName": "Maturity Staircase", "content": {"sectionTag": "MATURITY MODEL", "kicker": "PROPOSED DIAGRAM · STAIRCASE", "title": "Bậc thang trưởng thành của kỹ sư CloudOps", "subtitle": "Mỗi bậc là một mức năng lực có tiêu chí quan sát được.", "levels": [{"tag": "LEVEL 01", "title": "Nền tảng", "desc": "Linux, mạng, khái niệm cloud cơ bản."}, {"tag": "LEVEL 02", "title": "Thực hành có hướng dẫn", "desc": "Dựng hạ tầng theo lab, đọc log và sửa lỗi đơn giản."}, {"tag": "LEVEL 03", "title": "Vận hành độc lập", "desc": "Tự động hoá, giám sát, xử lý sự cố thường gặp."}, {"tag": "LEVEL 04", "title": "Thiết kế giải pháp", "desc": "Chọn kiến trúc, tối ưu chi phí và bảo mật."}, {"tag": "LEVEL 05", "title": "Dẫn dắt", "desc": "Mentor người khác, chuẩn hoá quy trình cho đội."}]}},
      {"id": "slide-concentric-circles", "type": "concentric-circles", "group": "Diagrams", "layoutName": "Concentric Circles", "content": {"sectionTag": "CORE MODEL", "kicker": "PROPOSED DIAGRAM · CONCENTRIC", "title": "Mô hình năng lực theo vòng đồng tâm", "subtitle": "Từ giá trị cốt lõi ở trung tâm lan ra kỹ năng, công cụ và hệ sinh thái.", "layers": [{"title": "Tư duy", "desc": "Học qua thực hành, chịu trách nhiệm với kết quả."}, {"title": "Kỹ năng lõi", "desc": "Linux, mạng, lập trình script, bảo mật cơ bản."}, {"title": "Công cụ", "desc": "Cloud services, CI/CD, IaC, giám sát."}, {"title": "Hệ sinh thái", "desc": "Mentor, cộng đồng alumni, đối tác tuyển dụng."}]}},
      {"id": "slide-value-chain", "type": "value-chain", "group": "Diagrams", "layoutName": "Value Chain (Chevron)", "content": {"sectionTag": "VALUE CHAIN", "kicker": "PROPOSED DIAGRAM · CHEVRON", "title": "Chuỗi giá trị đào tạo nhân lực công nghệ", "subtitle": "Mỗi chặng tạo ra một đầu ra cụ thể cho chặng tiếp theo.", "stages": [{"title": "Thu hút", "items": ["Roadshow tại trường", "Cộng đồng công nghệ"]}, {"title": "Tuyển chọn", "items": ["Bài test năng lực", "Phỏng vấn định hướng"]}, {"title": "Đào tạo", "items": ["Lab hands-on", "Mentor check-in", "Đánh giá theo rubric"]}, {"title": "Dự án", "items": ["Capstone theo nhóm", "Bảo vệ kiến trúc"]}, {"title": "Việc làm", "items": ["Phỏng vấn doanh nghiệp", "Cộng đồng alumni"]}]}},
      {"id": "slide-decision-tree", "type": "decision-tree", "group": "Diagrams", "layoutName": "Decision Tree", "content": {"sectionTag": "DECISION GUIDE", "kicker": "PROPOSED DIAGRAM · DECISION TREE", "title": "Chọn track phù hợp cho học viên", "subtitle": "Hai câu hỏi định hướng giúp xếp học viên vào lộ trình phù hợp nhất.", "root": {"title": "Đã có nền tảng lập trình?", "desc": "Câu hỏi đầu vào"}, "branches": [{"label": "Có", "title": "Thích tự động hoá quy trình?", "children": [{"label": "Có", "title": "DevOps Track", "desc": "CI/CD, container, IaC"}, {"label": "Chưa", "title": "CloudOps Track", "desc": "Vận hành, giám sát, chi phí"}]}, {"label": "Chưa", "title": "Sẵn sàng học bổ trợ 4 tuần?", "children": [{"label": "Có", "title": "Foundation + CloudOps", "desc": "Bổ trợ Linux & mạng trước"}, {"label": "Chưa", "title": "Khóa nhập môn", "desc": "Đăng ký cohort kế tiếp"}]}]}},
      {"id": "slide-system-architecture", "type": "system-architecture", "group": "Diagrams", "layoutName": "System Architecture", "content": {"sectionTag": "SOLUTION ARCHITECTURE", "kicker": "PROPOSED DIAGRAM · SYSTEM CONTEXT", "title": "Kiến trúc nền tảng lab cho học viên", "subtitle": "Luồng từ người dùng đến dữ liệu, chia theo vùng trách nhiệm.", "zones": [{"title": "Người dùng", "items": [{"title": "Học viên", "desc": "Trình duyệt, IDE"}, {"title": "Mentor", "desc": "Chấm bài, phản hồi"}]}, {"title": "Truy cập", "items": [{"title": "CDN & WAF", "desc": "Bảo vệ biên"}, {"title": "Đăng nhập SSO", "desc": "Phân quyền theo vai"}]}, {"title": "Ứng dụng", "items": [{"title": "Cổng học tập", "desc": "Bài học, tiến độ"}, {"title": "Dịch vụ lab", "desc": "Cấp môi trường"}, {"title": "Chấm tự động", "desc": "Kiểm tra kết quả"}]}, {"title": "Dữ liệu", "items": [{"title": "Cơ sở dữ liệu", "desc": "Hồ sơ, điểm số"}, {"title": "Kho lưu trữ", "desc": "Bài nộp, log"}]}, {"title": "Vận hành", "items": [{"title": "Giám sát", "desc": "Metrics, cảnh báo"}, {"title": "Chi phí", "desc": "Ngân sách theo cohort"}]}]}},
      {"id": "slide-kanban-board", "type": "kanban-board", "group": "Diagrams", "layoutName": "Kanban Board", "content": {"sectionTag": "DELIVERY TRACKING", "kicker": "PROPOSED DIAGRAM · KANBAN", "title": "Bảng công việc chuẩn bị cohort", "subtitle": "Trạng thái từng hạng mục và người phụ trách tại thời điểm báo cáo.", "note": "Trạng thái minh họa · cập nhật từ công cụ quản lý công việc trước khi trình bày", "columns": [{"title": "Backlog", "cards": [{"title": "Video giới thiệu track", "tag": "Marketing", "owner": "Comms"}, {"title": "Khảo sát kỳ vọng học viên", "tag": "Research", "owner": "Ops"}]}, {"title": "Cần làm", "cards": [{"title": "Rubric capstone", "tag": "Academic", "owner": "Curriculum"}, {"title": "Lịch mentor tháng 1", "tag": "Ops", "owner": "Program"}]}, {"title": "Đang làm", "cards": [{"title": "Lab CI/CD tuần 5–6", "tag": "Lab", "owner": "Engineering"}, {"title": "Hạ tầng tài khoản lab", "tag": "Infra", "owner": "CloudOps"}, {"title": "Bài test đầu vào", "tag": "Academic", "owner": "Curriculum"}]}, {"title": "Rà soát", "cards": [{"title": "Syllabus 16 tuần", "tag": "Academic", "owner": "Steering"}]}, {"title": "Hoàn thành", "cards": [{"title": "MoU với trường", "tag": "Partner", "owner": "Partnerships"}, {"title": "Landing page tuyển sinh", "tag": "Marketing", "owner": "Comms"}]}]}},
      {"id": "slide-gantt-roadmap", "type": "gantt-roadmap", "group": "Diagrams", "layoutName": "Gantt Roadmap", "content": {"sectionTag": "EXECUTION PLAN", "kicker": "PROPOSED DIAGRAM · GANTT", "title": "Kế hoạch triển khai cohort theo tháng", "subtitle": "Thanh thể hiện khoảng thời gian; hình thoi là mốc cần phê duyệt.", "periods": ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"], "today": 2.4, "tasks": [{"title": "Truyền thông & tuyển sinh", "owner": "Comms", "start": 0, "end": 2}, {"title": "Đánh giá đầu vào", "owner": "Academic", "start": 1.5, "end": 3}, {"title": "Foundation", "owner": "Mentors", "start": 2.5, "end": 4.5}, {"title": "Track CloudOps / DevOps", "owner": "Mentors", "start": 4.5, "end": 6.5}, {"title": "Capstone", "owner": "Engineering", "start": 6, "end": 7.2}, {"title": "Phỏng vấn & tuyển dụng", "owner": "Partners", "start": 6.8, "end": 8}], "milestones": [{"label": "Chốt danh sách", "at": 3}, {"label": "Gate review", "at": 4.5}, {"label": "Demo day", "at": 7.2}]}},
      {"id": "slide-line-chart", "type": "line-chart", "group": "Diagrams", "layoutName": "Line Trend Chart", "content": {"sectionTag": "PERFORMANCE TREND", "kicker": "PROPOSED CHART · TREND LINE", "title": "Điểm sẵn sàng kỹ thuật tăng theo tuần", "subtitle": "Điểm trung bình (thang 100) của hai track qua 8 tuần đào tạo.", "note": "Dữ liệu minh họa · thay bằng số liệu đã kiểm chứng trước khi dùng chính thức", "unit": "điểm", "labels": ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"], "series": [{"name": "CloudOps", "values": [32, 41, 49, 58, 64, 71, 79, 86]}, {"name": "DevOps", "values": [28, 35, 44, 51, 60, 69, 76, 84]}], "insightLabel": "Mức tăng sau 8 tuần", "insightValue": "+54", "insightText": "Điểm CloudOps tăng từ 32 lên 86. Tuần 4–5 là giai đoạn bứt tốc khi bắt đầu lab tự động hoá."}},
      {"id": "slide-waterfall-chart", "type": "waterfall-chart", "group": "Diagrams", "layoutName": "Waterfall Chart", "content": {"sectionTag": "BUDGET BRIDGE", "kicker": "PROPOSED CHART · WATERFALL", "title": "Cầu ngân sách cohort: từ kế hoạch đến thực tế", "subtitle": "Các khoản tăng/giảm giải thích chênh lệch giữa ngân sách đầu kỳ và cuối kỳ (triệu đồng).", "note": "Dữ liệu minh họa · thay bằng số liệu đã kiểm chứng trước khi dùng chính thức", "unit": "tr", "items": [{"label": "Ngân sách đầu kỳ", "value": 500, "kind": "start"}, {"label": "Hạ tầng lab", "value": 80, "kind": "delta"}, {"label": "Mentor bổ sung", "value": 45, "kind": "delta"}, {"label": "Tài trợ đối tác", "value": -120, "kind": "delta"}, {"label": "Tối ưu chi phí cloud", "value": -15, "kind": "delta"}, {"label": "Sự kiện Demo day", "value": 30, "kind": "delta"}, {"label": "Cuối kỳ", "value": 0, "kind": "total"}]}},
      {"id": "slide-bar-ranking", "type": "bar-ranking", "group": "Diagrams", "layoutName": "Bar Ranking", "content": {"sectionTag": "SKILL DEMAND", "kicker": "PROPOSED CHART · RANKING", "title": "Kỹ năng được doanh nghiệp yêu cầu nhiều nhất", "subtitle": "Số tin tuyển dụng nhắc đến kỹ năng trong mẫu khảo sát.", "note": "Dữ liệu minh họa · thay bằng số liệu đã kiểm chứng trước khi dùng chính thức", "unit": "tin", "highlight": 0, "target": 60, "targetLabel": "Ngưỡng ưu tiên", "items": [{"label": "Cloud (AWS/Azure/GCP)", "value": 86}, {"label": "CI/CD", "value": 74}, {"label": "Container & Kubernetes", "value": 69}, {"label": "Infrastructure as Code", "value": 57}, {"label": "Monitoring & Observability", "value": 48}, {"label": "Security cơ bản", "value": 41}]}},
      {"id": "slide-radar-chart", "type": "radar-chart", "group": "Diagrams", "layoutName": "Radar Chart", "content": {"sectionTag": "CAPABILITY PROFILE", "kicker": "PROPOSED CHART · RADAR", "title": "Hồ sơ năng lực trước và sau chương trình", "subtitle": "Thang 0–5 cho từng nhóm kỹ năng của một cohort.", "note": "Dữ liệu minh họa · thay bằng số liệu đã kiểm chứng trước khi dùng chính thức", "max": 5, "axes": ["Cloud", "Linux", "CI/CD", "IaC", "Security", "Monitoring"], "series": [{"name": "Sau chương trình", "values": [4.5, 4.2, 4, 3.8, 3.5, 4.1]}, {"name": "Đầu vào", "values": [1.8, 2.6, 1.5, 1.2, 1.6, 1.4]}]}},
      {"id": "slide-progress-rings", "type": "progress-rings", "group": "Diagrams", "layoutName": "Progress Rings", "content": {"sectionTag": "PROGRAM HEALTH", "kicker": "PROPOSED CHART · PROGRESS", "title": "Tiến độ các hạng mục chuẩn bị", "subtitle": "Phần trăm hoàn thành tại thời điểm báo cáo.", "note": "Dữ liệu minh họa · thay bằng số liệu đã kiểm chứng trước khi dùng chính thức", "rings": [{"value": 92, "title": "Syllabus", "desc": "16 tuần nội dung đã duyệt"}, {"value": 75, "title": "Lab hands-on", "desc": "24/32 bài lab sẵn sàng"}, {"value": 60, "title": "Mentor", "desc": "9/15 mentor xác nhận lịch"}, {"value": 40, "title": "Tuyển sinh", "desc": "200/500 hồ sơ mục tiêu"}]}},
      {"id": "slide-custom-html", "type": "custom-html", "group": "Narrative", "layoutName": "Custom HTML", "content": {"sectionTag": "CUSTOM LAYOUT", "title": "Slide HTML tự do trong khung chuẩn", "html": "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:8px\"><div style=\"padding:44px;border-radius:24px;background:#FFF5ED;border:1px solid #FBCAAB\"><div style=\"font:800 30px Manrope;color:#F97C00;margin-bottom:14px\">content.html</div><div style=\"font:500 24px/1.55 Nunito;color:#425453\">Nhận HTML bất kỳ: bảng, danh sách, iframe, ảnh. Inline edit sẽ giữ nguyên thẻ HTML.</div></div><div style=\"padding:44px;border-radius:24px;background:#E5F4EF;border:1px solid #7FD7BB\"><div style=\"font:800 30px Manrope;color:#25AC9D;margin-bottom:14px\">Khung thương hiệu</div><div style=\"font:500 24px/1.55 Nunito;color:#425453\">Header có logo, đường kẻ cam và footer chuẩn thương hiệu. Phần ở giữa là của bạn.</div></div></div>"}},
      {"id": "slide-custom-diagram", "type": "custom-diagram", "group": "Diagrams", "layoutName": "Custom SVG Diagram", "content": {"sectionTag": "CUSTOM DIAGRAM", "kicker": "PROPOSED DIAGRAM · CUSTOM SVG", "title": "Diagram tự vẽ bằng SVG", "subtitle": "content.svg được đặt nguyên văn vào vùng vẽ 1728 × 600 của khung diagram chuẩn.", "svg": "<rect x=\"0\" y=\"180\" width=\"480\" height=\"240\" rx=\"28\" fill=\"#F97C00\"/><text x=\"240\" y=\"312\" text-anchor=\"middle\" fill=\"#fff\" font-family=\"Manrope\" font-size=\"40\" font-weight=\"800\">Input</text><path d=\"M500 300H600\" stroke=\"#425453\" stroke-width=\"6\"/><path d=\"M596 284L624 300L596 316Z\" fill=\"#425453\"/><rect x=\"624\" y=\"180\" width=\"480\" height=\"240\" rx=\"28\" fill=\"#FFFFFF\" stroke=\"#FBCAAB\" stroke-width=\"4\"/><text x=\"864\" y=\"312\" text-anchor=\"middle\" fill=\"#425453\" font-family=\"Manrope\" font-size=\"40\" font-weight=\"800\">Process</text><path d=\"M1124 300H1224\" stroke=\"#425453\" stroke-width=\"6\"/><path d=\"M1220 284L1248 300L1220 316Z\" fill=\"#425453\"/><rect x=\"1248\" y=\"180\" width=\"480\" height=\"240\" rx=\"28\" fill=\"#25AC9D\"/><text x=\"1488\" y=\"312\" text-anchor=\"middle\" fill=\"#fff\" font-family=\"Manrope\" font-size=\"40\" font-weight=\"800\">Output</text>"}}
    ];
