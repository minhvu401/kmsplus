// ===== 10 KỊCH BẢN TEST CHO CreateCourseForm - CẬP NHẬT =====
// Dựa trên categories mới và các chức năng đã code

// Course Categories (ID 1-39): Engineering, HR Policies, Sales & Marketing, IT Support, General, etc.
// Department Categories (ID 1-10): Human Resources, Finance, Marketing, Sales, IT, Operations, R&D, Customer Service, Legal, Product Management

console.log("=== KỊCH BẢN TEST TẠO KHÓA HỌC - CẬP NHẬT ===");

// ===== KỊCH BẢN 1: Engineering - Backend Development =====
const scenario1 = {
  name: "Kịch bản 1: Engineering - Backend Development",
  basicInfo: {
    title: "Node.js & Express.js Backend Development",
    description: "Khóa học toàn diện về phát triển backend với Node.js, Express.js, MongoDB và các best practices hiện đại.",
    categoryId: 6, // Backend Development (con của Engineering)
    thumbnailUrl: "https://picsum.photos/seed/nodejs_backend/640/360",
    status: "draft",
    durationHours: 32,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Node.js Fundamentals",
      items: [
        { type: "lesson", title: "Introduction to Node.js", duration: 90 },
        { type: "lesson", title: "Modules & npm", duration: 75 },
        { type: "quiz", title: "Quiz: Node.js Basics", questionCount: 10 }
      ]
    },
    {
      title: "Chương 2: Express.js Framework",
      items: [
        { type: "lesson", title: "Express Setup & Routing", duration: 120 },
        { type: "lesson", title: "Middleware & Error Handling", duration: 105 },
        { type: "quiz", title: "Quiz: Express.js", questionCount: 12 }
      ]
    },
    {
      title: "Chương 3: Database Integration",
      items: [
        { type: "lesson", title: "MongoDB with Mongoose", duration: 150 },
        { type: "lesson", title: "RESTful API Design", duration: 135 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 5, dueType: "relative", dueDays: 45 }, // IT Department
    { targetType: "role", roleId: 1, dueType: "fixed", dueDate: "2024-12-31" }
  ]
};

// ===== KỊCH BẢN 2: Engineering - Frontend Development =====
const scenario2 = {
  name: "Kịch bản 2: Engineering - Frontend Development",
  basicInfo: {
    title: "React.js & Modern Frontend Development",
    description: "Master React.js, Redux, Next.js và các công cụ frontend hiện đại để xây dựng ứng dụng web động.",
    categoryId: 7, // Frontend Development (con của Engineering)
    thumbnailUrl: "https://picsum.photos/seed/react_frontend/640/360",
    status: "pending_approval",
    durationHours: 40,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: React Foundation",
      items: [
        { type: "lesson", title: "Components & JSX", duration: 90 },
        { type: "lesson", title: "State & Props", duration: 120 },
        { type: "quiz", title: "Quiz: React Basics", questionCount: 15 }
      ]
    },
    {
      title: "Chương 2: Advanced React",
      items: [
        { type: "lesson", title: "React Hooks Deep Dive", duration: 150 },
        { type: "lesson", title: "Context API & Redux", duration: 180 },
        { type: "quiz", title: "Quiz: Advanced React", questionCount: 20 }
      ]
    },
    {
      title: "Chương 3: Next.js & Deployment",
      items: [
        { type: "lesson", title: "Next.js Framework", duration: 120 },
        { type: "lesson", title: "Production Deployment", duration: 90 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 5, dueType: "relative", dueDays: 60 }, // IT Department
    { targetType: "all_employees", dueType: "none" }
  ]
};

// ===== KỊCH BẢN 3: HR Policies =====
const scenario3 = {
  name: "Kịch bản 3: HR Policies - Employee Training",
  basicInfo: {
    title: "Employee Onboarding & Company Policies",
    description: "Khóa học bắt buộc cho nhân viên mới về quy định công ty, văn hóa làm việc và các chính sách nhân sự.",
    categoryId: 2, // HR Policies
    thumbnailUrl: "https://picsum.photos/seed/hr_policies/640/360",
    status: "pending_approval",
    durationHours: 16,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Company Introduction",
      items: [
        { type: "lesson", title: "Company History & Values", duration: 60 },
        { type: "lesson", title: "Organizational Structure", duration: 45 },
        { type: "quiz", title: "Quiz: Company Knowledge", questionCount: 8 }
      ]
    },
    {
      title: "Chương 2: HR Policies",
      items: [
        { type: "lesson", title: "Employee Handbook", duration: 90 },
        { type: "lesson", title: "Workplace Ethics", duration: 75 },
        { type: "quiz", title: "Quiz: HR Policies", questionCount: 12 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "all_employees", dueType: "relative", dueDays: 7 },
    { targetType: "department", departmentId: 1, dueType: "none" } // HR Department
  ]
};

// ===== KỊCH BẢN 4: Sales & Marketing =====
const scenario4 = {
  name: "Kịch bản 4: Sales & Marketing - Digital Marketing",
  basicInfo: {
    title: "Digital Marketing & Social Media Strategy",
    description: "Chiến lược marketing kỹ thuật số, SEO, social media và content marketing cho doanh nghiệp hiện đại.",
    categoryId: 3, // Sales & Marketing
    thumbnailUrl: "https://picsum.photos/seed/digital_marketing/640/360",
    status: "draft",
    durationHours: 24,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: Marketing Foundation",
      items: [
        { type: "lesson", title: "Digital Marketing Overview", duration: 75 },
        { type: "lesson", title: "Target Audience Analysis", duration: 90 },
        { type: "quiz", title: "Quiz: Marketing Basics", questionCount: 10 }
      ]
    },
    {
      title: "Chương 2: Social Media Marketing",
      items: [
        { type: "lesson", title: "Facebook & Instagram Marketing", duration: 120 },
        { type: "lesson", title: "Content Creation Strategy", duration: 105 },
        { type: "quiz", title: "Quiz: Social Media", questionCount: 15 }
      ]
    },
    {
      title: "Chương 3: SEO & Analytics",
      items: [
        { type: "lesson", title: "Search Engine Optimization", duration: 135 },
        { type: "lesson", title: "Google Analytics", duration: 90 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 3, dueType: "relative", dueDays: 30 }, // Marketing Department
    { targetType: "department", departmentId: 4, dueType: "relative", dueDays: 30 } // Sales Department
  ]
};

// ===== KỊCH BẢN 5: IT Support - Network Setup =====
const scenario5 = {
  name: "Kịch bản 5: IT Support - Network Setup",
  basicInfo: {
    title: "Network Administration & IT Support",
    description: "Quản lý mạng LAN/WAN, troubleshooting và các kỹ năng hỗ trợ IT chuyên nghiệp.",
    categoryId: 8, // Network Setup (con của IT Support)
    thumbnailUrl: "https://picsum.photos/seed/network_admin/640/360",
    status: "pending_approval",
    durationHours: 28,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Network Fundamentals",
      items: [
        { type: "lesson", title: "TCP/IP & Networking Basics", duration: 120 },
        { type: "lesson", title: "Network Hardware", duration: 105 },
        { type: "quiz", title: "Quiz: Network Basics", questionCount: 12 }
      ]
    },
    {
      title: "Chương 2: Network Administration",
      items: [
        { type: "lesson", title: "Router & Switch Configuration", duration: 150 },
        { type: "lesson", title: "Network Security", duration: 135 },
        { type: "quiz", title: "Quiz: Network Admin", questionCount: 15 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 5, dueType: "fixed", dueDate: "2024-12-15" }, // IT Department
    { targetType: "user", userId: 1, dueType: "none" }
  ]
};

// ===== KỊCH BẢN 6: General Knowledge =====
const scenario6 = {
  name: "Kịch bản 6: General Knowledge - Professional Skills",
  basicInfo: {
    title: "Professional Communication & Soft Skills",
    description: "Phát triển kỹ năng giao tiếp, làm việc nhóm và các kỹ năng mềm cần thiết trong môi trường công sở.",
    categoryId: 10, // General Knowledge
    thumbnailUrl: "https://picsum.photos/seed/soft_skills/640/360",
    status: "pending_approval",
    durationHours: 20,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: Communication Skills",
      items: [
        { type: "lesson", title: "Business Communication", duration: 90 },
        { type: "lesson", title: "Presentation Skills", duration: 105 },
        { type: "quiz", title: "Quiz: Communication", questionCount: 10 }
      ]
    },
    {
      title: "Chương 2: Teamwork & Leadership",
      items: [
        { type: "lesson", title: "Collaboration Tools", duration: 75 },
        { type: "lesson", title: "Leadership Fundamentals", duration: 90 },
        { type: "quiz", title: "Quiz: Leadership", questionCount: 8 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "all_employees", dueType: "relative", dueDays: 21 }
  ]
};

// ===== KỊCH BẢN 7: Science - Biology =====
const scenario7 = {
  name: "Kịch bản 7: Science - Biology Fundamentals",
  basicInfo: {
    title: "Biology for Beginners - Life Sciences",
    description: "Khóa học giới thiệu về sinh học cơ bản, tế bào, di truyền học và các hệ sinh thái.",
    categoryId: 11, // Science
    thumbnailUrl: "https://picsum.photos/seed/biology_science/640/360",
    status: "draft",
    durationHours: 18,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: Cell Biology",
      items: [
        { type: "lesson", title: "Cell Structure & Function", duration: 90 },
        { type: "lesson", title: "Cell Division", duration: 105 },
        { type: "quiz", title: "Quiz: Cell Biology", questionCount: 12 }
      ]
    },
    {
      title: "Chương 2: Genetics",
      items: [
        { type: "lesson", title: "DNA & RNA", duration: 120 },
        { type: "lesson", title: "Heredity & Variation", duration: 90 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 7, dueType: "relative", dueDays: 45 } // R&D Department
  ]
};

// ===== KỊCH BẢN 8: Technology =====
const scenario8 = {
  name: "Kịch bản 8: Technology - AI & Machine Learning",
  basicInfo: {
    title: "Introduction to Artificial Intelligence",
    description: "Giới thiệu về AI, Machine Learning, Deep Learning và các ứng dụng thực tế trong công nghiệp.",
    categoryId: 12, // Technology
    thumbnailUrl: "https://picsum.photos/seed/ai_ml/640/360",
    status: "pending_approval",
    durationHours: 36,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: AI Fundamentals",
      items: [
        { type: "lesson", title: "What is Artificial Intelligence", duration: 90 },
        { type: "lesson", title: "Types of AI & ML", duration: 120 },
        { type: "quiz", title: "Quiz: AI Basics", questionCount: 15 }
      ]
    },
    {
      title: "Chương 2: Machine Learning",
      items: [
        { type: "lesson", title: "Supervised Learning", duration: 150 },
        { type: "lesson", title: "Neural Networks", duration: 135 },
        { type: "quiz", title: "Quiz: Machine Learning", questionCount: 18 }
      ]
    },
    {
      title: "Chương 3: Practical Applications",
      items: [
        { type: "lesson", title: "Computer Vision", duration: 120 },
        { type: "lesson", title: "Natural Language Processing", duration: 135 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 5, dueType: "relative", dueDays: 60 }, // IT Department
    { targetType: "department", departmentId: 7, dueType: "fixed", dueDate: "2024-12-31" } // R&D Department
  ]
};

// ===== KỊCH BẢN 9: Health =====
const scenario9 = {
  name: "Kịch bản 9: Health - Workplace Wellness",
  basicInfo: {
    title: "Workplace Health & Wellness Program",
    description: "Chương trình sức khỏe tại nơi làm việc, bao gồm dinh dưỡng, thể dục và sức khỏe tâm thần.",
    categoryId: 29, // Health
    thumbnailUrl: "https://picsum.photos/seed/workplace_health/640/360",
    status: "pending_approval",
    durationHours: 12,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Physical Health",
      items: [
        { type: "lesson", title: "Ergonomics at Work", duration: 60 },
        { type: "lesson", title: "Exercise & Nutrition", duration: 75 },
        { type: "quiz", title: "Quiz: Physical Health", questionCount: 8 }
      ]
    },
    {
      title: "Chương 2: Mental Health",
      items: [
        { type: "lesson", title: "Stress Management", duration: 90 },
        { type: "lesson", title: "Work-Life Balance", duration: 60 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "all_employees", dueType: "relative", dueDays: 14 }
  ]
};

// ===== KỊCH BẢN 10: Law =====
const scenario10 = {
  name: "Kịch bản 10: Law - Business Compliance",
  basicInfo: {
    title: "Business Law & Corporate Compliance",
    description: "Các quy định pháp luật quan trọng cho doanh nghiệp: hợp đồng, lao động, thuế và bảo mật thông tin.",
    categoryId: 34, // Law
    thumbnailUrl: "https://picsum.photos/seed/business_law/640/360",
    status: "pending_approval",
    durationHours: 22,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Contract Law",
      items: [
        { type: "lesson", title: "Business Contracts", duration: 120 },
        { type: "lesson", title: "Negotiation & Agreements", duration: 105 },
        { type: "quiz", title: "Quiz: Contract Law", questionCount: 12 }
      ]
    },
    {
      title: "Chương 2: Corporate Compliance",
      items: [
        { type: "lesson", title: "Labor Regulations", duration: 135 },
        { type: "lesson", title: "Data Protection & Privacy", duration: 120 },
        { type: "quiz", title: "Quiz: Compliance", questionCount: 15 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 9, dueType: "relative", dueDays: 30 }, // Legal Department
    { targetType: "department", departmentId: 2, dueType: "relative", dueDays: 30 }, // Finance Department
    { targetType: "role", roleId: 1, dueType: "none" } // Managers
  ]
};

// ===== EXPORT ALL SCENARIOS =====
const allScenarios = [scenario1, scenario2, scenario3, scenario4, scenario5, scenario6, scenario7, scenario8, scenario9, scenario10];

console.log("=== DANH SÁCH 10 KỊCH BẢN TEST - CẬP NHẬT ===");
allScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log(`   Course Category ID: ${scenario.basicInfo.categoryId}`);
  console.log(`   Status: ${scenario.basicInfo.status}`);
  console.log(`   Visibility: ${scenario.basicInfo.visibility}`);
  console.log(`   Duration: ${scenario.basicInfo.durationHours}h`);
  console.log(`   Sections: ${scenario.curriculum.length}`);
  console.log(`   Assignment Rules: ${scenario.assignmentRules.length}`);
});

console.log("\n=== COURSE CATEGORIES ĐÃ SỬ DỤNG ===");
console.log("6 - Backend Development (Engineering)");
console.log("7 - Frontend Development (Engineering)");
console.log("2 - HR Policies");
console.log("3 - Sales & Marketing");
console.log("8 - Network Setup (IT Support)");
console.log("10 - General Knowledge");
console.log("11 - Science");
console.log("12 - Technology");
console.log("29 - Health");
console.log("34 - Law");

console.log("\n=== DEPARTMENT CATEGORIES ĐÃ SỬ DỤNG TRONG ASSIGNMENT RULES ===");
console.log("1 - Human Resources");
console.log("2 - Finance");
console.log("3 - Marketing");
console.log("4 - Sales");
console.log("5 - Information Technology");
console.log("7 - Research and Development");
console.log("9 - Legal");

console.log("\n=== HƯỚNG DẪN TEST ===");
console.log("1. Copy từng kịch bản vào form CreateCourseForm");
console.log("2. Test các chức năng mới:");
console.log("   - Department dropdown search (dùng department categories)");
console.log("   - User dropdown search");
console.log("   - Drag & drop curriculum items");
console.log("   - Assignment rules với các target_type");
console.log("   - Validation ở mỗi step");
console.log("3. Kiểm tra edge cases:");
console.log("   - Course categories với parent_id khác null");
console.log("   - Multiple assignment rules");
console.log("   - Mixed due_date types");

export { allScenarios, scenario1, scenario2, scenario3, scenario4, scenario5, scenario6, scenario7, scenario8, scenario9, scenario10 };
