export const caseStudyContent = {
  title: "Case Study",
  titleAr: "دراسة المشروع",
  subtitle: "من فكرة إلى منصة Fintech متكاملة",
  problem: {
    title: "المشكلة",
    description:
      "مكاتب الحوالات التقليدية تعتمد على سجلات ورقية وجداول Excel — مما يسبب أخطاء، بطء، وصعوبة في تتبع الحوالات بين الفروع المتعددة.",
    points: [
      "لا يوجد تتبع مركزي للحوالات بين الفروع",
      "صعوبة حساب الأرباح والضرائب لكل فرع",
      "غياب صلاحيات واضحة بين المدير والموظف",
      "لا توجد إشعارات فورية عند وصول حوالة",
    ],
  },
  solution: {
    title: "الحل",
    description:
      "بناء منصة Full-Stack متعددة الفروع مع ثلاثة أدوار مستخدمين، حوالات SYP/USD، تقارير PDF/Excel، وإشعارات Socket.io في الوقت الفعلي.",
    points: [
      "لوحة تحكم مركزية للمدير العام",
      "لوحة فرع مستقلة لمدير كل فرع",
      "واجهة موظف مخصصة للحوالات اليومية",
      "إيصالات PDF عربية مع تحويل المبلغ لكلمات",
    ],
  },
  challenges: [
    {
      title: "صلاحيات متعددة الأدوار",
      description: "Middleware في Next.js + JWT claims في FastAPI لحماية كل مسار حسب الدور.",
      tech: "Next.js Middleware + JWT",
    },
    {
      title: "حوالات بين فروع",
      description: "منطق معاملات مع تحديث أرصدة الفروع المرسل والمستقبل atomically.",
      tech: "SQLAlchemy Transactions",
    },
    {
      title: "إيصالات PDF عربية",
      description: "تحويل الأرقام إلى كلمات عربية + html2canvas لالتقاط الإيصال.",
      tech: "jsPDF + html2canvas",
    },
    {
      title: "RTL + UX عربي",
      description: "تصميم كامل من اليمين لليسار مع خط Cairo وتنسيق تواريخ عربية.",
      tech: "Tailwind + Cairo Font",
    },
  ],
  metrics: [
    { label: "صفحات وواجهات", value: "25+" },
    { label: "API Endpoints", value: "40+" },
    { label: "أدوار مستخدمين", value: "3" },
    { label: "عملات مدعومة", value: "2" },
    { label: "وقت التطوير", value: "3+ أشهر" },
    { label: "Tech Stack", value: "8+" },
  ],
  lessons: [
    "فصل Frontend عن Backend يسهّل النشر المستقل على Vercel + Railway",
    "Demo accounts جاهزة ضرورية لأي مشروع Portfolio",
    "Middleware للصلاحيات أفضل من التحقق في كل component",
    "Seed script يوفر ساعات عند عرض المشروع للمراجعين",
  ],
} as const;
