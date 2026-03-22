// ===== 10 KỊCH BẢN TEST CHO CreateCourseForm =====
// Dựa trên categories có sẵn và các chức năng mới

// Categories: 1-HR, 2-Finance, 3-Marketing, 4-Sales, 5-IT, 6-Operations, 7-R&D, 8-Customer Service, 9-Legal, 10-Product Management

console.log("=== KỊCH BẢN TEST TẠO KHÓA HỌC ===");

// ===== KỊCH BẢN 1: HR - Basic Course =====
const scenario1 = {
  name: "Kịch bản 1: HR - Khóa học cơ bản",
  basicInfo: {
    title: "Nhập sự và Đào tạo Nhân viên Mới",
    description: "Khóa học thiết kế cho nhân viên mới, bao gồm quy trình làm việc, văn hóa công ty và các kỹ năng cơ bản cần thiết.",
    categoryId: 1, // Human Resources
    thumbnailUrl: "https://picsum.photos/seed/hr_onboarding/640/360",
    status: "draft",
    durationHours: 12,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Giới thiệu Công ty",
      items: [
        { type: "lesson", title: "Lịch sử và Tầm nhìn Công ty", duration: 45 },
        { type: "lesson", title: "Cơ cấu Tổ chức", duration: 30 },
        { type: "quiz", title: "Quiz: Về Công ty", questionCount: 8 }
      ]
    },
    {
      title: "Chương 2: Quy trình làm việc",
      items: [
        { type: "lesson", title: "Quy định nội bộ", duration: 60 },
        { type: "lesson", title: "Sử dụng hệ thống công ty", duration: 45 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "all_employees", dueType: "relative", dueDays: 7 }
  ]
};

// ===== KỊCH BẢN 2: Finance - Advanced Course =====
const scenario2 = {
  name: "Kịch bản 2: Finance - Khóa học nâng cao",
  basicInfo: {
    title: "Phân tích Tài chính Doanh nghiệp",
    description: "Khóa học nâng cao về phân tích báo cáo tài chính, quản lý dòng tiền và ra quyết định đầu tư.",
    categoryId: 2, // Finance
    thumbnailUrl: "https://picsum.photos/seed/finance_analysis/640/360",
    status: "pending_approval",
    durationHours: 24,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: Báo cáo Tài chính",
      items: [
        { type: "lesson", title: "Bảng cân đối kế toán", duration: 90 },
        { type: "lesson", title: "Báo cáo kết quả kinh doanh", duration: 90 },
        { type: "quiz", title: "Quiz: Đọc hiểu BCTC", questionCount: 15 }
      ]
    },
    {
      title: "Chương 2: Phân tích Dòng tiền",
      items: [
        { type: "lesson", title: "Cash Flow Analysis", duration: 120 },
        { type: "quiz", title: "Quiz: Dòng tiền", questionCount: 10 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 2, dueType: "fixed", dueDate: "2024-12-31" }
  ]
};

// ===== KỊCH BẢN 3: Marketing - Public Course =====
const scenario3 = {
  name: "Kịch bản 3: Marketing - Khóa học công khai",
  basicInfo: {
    title: "Digital Marketing Fundamentals",
    description: "Tìm hiểu các kênh digital marketing, SEO, social media marketing và email marketing hiệu quả.",
    categoryId: 3, // Marketing
    thumbnailUrl: "https://picsum.photos/seed/digital_marketing/640/360",
    status: "pending_approval",
    durationHours: 20,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: Marketing Foundation",
      items: [
        { type: "lesson", title: "Introduction to Digital Marketing", duration: 60 },
        { type: "lesson", title: "Market Research Basics", duration: 75 },
        { type: "quiz", title: "Quiz: Marketing Basics", questionCount: 12 }
      ]
    },
    {
      title: "Chương 2: Social Media Marketing",
      items: [
        { type: "lesson", title: "Facebook Marketing", duration: 90 },
        { type: "lesson", title: "Instagram & TikTok Strategy", duration: 90 },
        { type: "quiz", title: "Quiz: Social Media", questionCount: 10 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "all_employees", dueType: "none" },
    { targetType: "department", departmentId: 3, dueType: "relative", dueDays: 30 }
  ]
};

// ===== KỊCH BẢN 4: Sales - Skills Training =====
const scenario4 = {
  name: "Kịch bản 4: Sales - Đào tạo kỹ năng",
  basicInfo: {
    title: "Kỹ năng Bán hàng Chuyên nghiệp",
    description: "Phát triển kỹ năng giao tiếp, đàm phán và chốt sale hiệu quả trong môi trường kinh doanh hiện đại.",
    categoryId: 4, // Sales
    thumbnailUrl: "https://picsum.photos/seed/sales_skills/640/360",
    status: "draft",
    durationHours: 16,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Foundation Skills",
      items: [
        { type: "lesson", title: "Communication Skills", duration: 120 },
        { type: "lesson", title: "Product Knowledge", duration: 90 },
        { type: "quiz", title: "Quiz: Sales Foundation", questionCount: 8 }
      ]
    },
    {
      title: "Chương 2: Advanced Techniques",
      items: [
        { type: "lesson", title: "Negotiation Skills", duration: 150 },
        { type: "lesson", title: "Closing Techniques", duration: 120 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 4, dueType: "relative", dueDays: 21 },
    { targetType: "user", userId: 1, dueType: "none" }
  ]
};

// ===== KỊCH BẢN 5: IT - Technical Course =====
const scenario5 = {
  name: "Kịch bản 5: IT - Khóa học kỹ thuật",
  basicInfo: {
    title: "Web Development với React.js",
    description: "Học lập trình web hiện đại với React.js, từ cơ bản đến nâng cao, bao gồm Hooks, Redux và best practices.",
    categoryId: 5, // Information Technology
    thumbnailUrl: "https://picsum.photos/seed/react_development/640/360",
    status: "pending_approval",
    durationHours: 40,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: React Basics",
      items: [
        { type: "lesson", title: "Components & Props", duration: 90 },
        { type: "lesson", title: "State & Events", duration: 120 },
        { type: "quiz", title: "Quiz: React Fundamentals", questionCount: 15 }
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
      title: "Chương 3: Project",
      items: [
        { type: "lesson", title: "Build E-commerce App", duration: 240 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 5, dueType: "relative", dueDays: 45 },
    { targetType: "role", roleId: 1, dueType: "fixed", dueDate: "2024-12-15" }
  ]
};

// ===== KỊCH BẢN 6: Operations - Process Training =====
const scenario6 = {
  name: "Kịch bản 6: Operations - Đào tạo quy trình",
  basicInfo: {
    title: "Quản lý Chuỗi Cung ứng Hiệu quả",
    description: "Tối ưu hóa quy trình chuỗi cung ứng, quản lý tồn kho và logistics trong môi trường kinh doanh hiện đại.",
    categoryId: 6, // Operations
    thumbnailUrl: "https://picsum.photos/seed/supply_chain/640/360",
    status: "pending_approval",
    durationHours: 18,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Supply Chain Overview",
      items: [
        { type: "lesson", title: "Introduction to Supply Chain", duration: 90 },
        { type: "lesson", title: "Inventory Management", duration: 120 },
        { type: "quiz", title: "Quiz: Supply Chain Basics", questionCount: 10 }
      ]
    },
    {
      title: "Chương 2: Logistics & Distribution",
      items: [
        { type: "lesson", title: "Transportation Management", duration: 105 },
        { type: "lesson", title: "Warehouse Operations", duration: 90 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "all_employees", dueType: "relative", dueDays: 30 }
  ]
};

// ===== KỊCH BẢN 7: R&D - Innovation Course =====
const scenario7 = {
  name: "Kịch bản 7: R&D - Khóa học đổi mới",
  basicInfo: {
    title: "Design Thinking và Innovation",
    description: "Phương pháp Design Thinking để giải quyết vấn đề và tạo ra sản phẩm đột phá.",
    categoryId: 7, // Research and Development
    thumbnailUrl: "https://picsum.photos/seed/design_thinking/640/360",
    status: "draft",
    durationHours: 24,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Design Thinking Foundation",
      items: [
        { type: "lesson", title: "Empathy & Research", duration: 120 },
        { type: "lesson", title: "Ideation Techniques", duration: 150 },
        { type: "quiz", title: "Quiz: Design Thinking", questionCount: 12 }
      ]
    },
    {
      title: "Chương 2: Prototyping & Testing",
      items: [
        { type: "lesson", title: "Rapid Prototyping", duration: 180 },
        { type: "lesson", title: "User Testing Methods", duration: 120 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 7, dueType: "none" },
    { targetType: "user", userId: 2, dueType: "relative", dueDays: 60 }
  ]
};

// ===== KỊCH BẢN 8: Customer Service - Service Excellence =====
const scenario8 = {
  name: "Kịch bản 8: Customer Service - Dịch vụ khách hàng",
  basicInfo: {
    title: "Chất lượng Dịch vụ Khách hàng",
    description: "Nâng cao kỹ năng giao tiếp, xử lý tình huống và tạo trải nghiệm khách hàng xuất sắc.",
    categoryId: 8, // Customer Service
    thumbnailUrl: "https://picsum.photos/seed/customer_service/640/360",
    status: "pending_approval",
    durationHours: 14,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: Customer Service Skills",
      items: [
        { type: "lesson", title: "Communication Excellence", duration: 90 },
        { type: "lesson", title: "Problem Solving", duration: 105 },
        { type: "quiz", title: "Quiz: Customer Service", questionCount: 15 }
      ]
    },
    {
      title: "Chương 2: Handling Difficult Customers",
      items: [
        { type: "lesson", title: "De-escalation Techniques", duration: 120 },
        { type: "lesson", title: "Service Recovery", duration: 90 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 8, dueType: "relative", dueDays: 14 },
    { targetType: "role", roleId: 2, dueType: "fixed", dueDate: "2024-11-30" }
  ]
};

// ===== KỊCH BẢN 9: Legal - Compliance Training =====
const scenario9 = {
  name: "Kịch bản 9: Legal - Đào tạo tuân thủ",
  basicInfo: {
    title: "Tuân thủ Pháp luật Doanh nghiệp",
    description: "Các quy định pháp luật quan trọng cho doanh nghiệp: lao động, thuế, bảo mật dữ liệu và sở hữu trí tuệ.",
    categoryId: 9, // Legal
    thumbnailUrl: "https://picsum.photos/seed/legal_compliance/640/360",
    status: "pending_approval",
    durationHours: 16,
    visibility: "private"
  },
  curriculum: [
    {
      title: "Chương 1: Labor Law",
      items: [
        { type: "lesson", title: "Labor Regulations", duration: 120 },
        { type: "lesson", title: "Employee Rights", duration: 90 },
        { type: "quiz", title: "Quiz: Labor Law", questionCount: 10 }
      ]
    },
    {
      title: "Chương 2: Data Protection",
      items: [
        { type: "lesson", title: "Privacy Laws", duration: 105 },
        { type: "lesson", title: "GDPR Compliance", duration: 120 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "all_employees", dueType: "relative", dueDays: 30 },
    { targetType: "department", departmentId: 9, dueType: "none" }
  ]
};

// ===== KỊCH BẢN 10: Product Management - Comprehensive Course =====
const scenario10 = {
  name: "Kịch bản 10: Product Management - Khóa học tổng hợp",
  basicInfo: {
    title: "Product Management từ A-Z",
    description: "Khóa học toàn diện về quản lý sản phẩm, từ research, development đến launch và iteration.",
    categoryId: 10, // Product Management
    thumbnailUrl: "https://picsum.photos/seed/product_management/640/360",
    status: "pending_approval",
    durationHours: 36,
    visibility: "public"
  },
  curriculum: [
    {
      title: "Chương 1: Product Strategy",
      items: [
        { type: "lesson", title: "Market Research & Analysis", duration: 150 },
        { type: "lesson", title: "Product Vision & Roadmap", duration: 120 },
        { type: "quiz", title: "Quiz: Product Strategy", questionCount: 15 }
      ]
    },
    {
      title: "Chương 2: Development Process",
      items: [
        { type: "lesson", title: "Agile & Scrum for PM", duration: 180 },
        { type: "lesson", title: "User Stories & Prioritization", duration: 150 },
        { type: "quiz", title: "Quiz: Development Process", questionCount: 12 }
      ]
    },
    {
      title: "Chương 3: Launch & Growth",
      items: [
        { type: "lesson", title: "Go-to-Market Strategy", duration: 120 },
        { type: "lesson", title: "Product Metrics & Analytics", duration: 135 },
        { type: "quiz", title: "Quiz: Product Analytics", questionCount: 10 }
      ]
    }
  ],
  assignmentRules: [
    { targetType: "department", departmentId: 10, dueType: "relative", dueDays: 60 },
    { targetType: "department", departmentId: 5, dueType: "fixed", dueDate: "2024-12-31" },
    { targetType: "role", roleId: 1, dueType: "none" }
  ]
};

// ===== EXPORT ALL SCENARIOS =====
const allScenarios = [scenario1, scenario2, scenario3, scenario4, scenario5, scenario6, scenario7, scenario8, scenario9, scenario10];

console.log("=== DANH SÁCH 10 KỊCH BẢN TEST ===");
allScenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log(`   Category ID: ${scenario.basicInfo.categoryId}`);
  console.log(`   Status: ${scenario.basicInfo.status}`);
  console.log(`   Visibility: ${scenario.basicInfo.visibility}`);
  console.log(`   Duration: ${scenario.basicInfo.durationHours}h`);
  console.log(`   Sections: ${scenario.curriculum.length}`);
  console.log(`   Assignment Rules: ${scenario.assignmentRules.length}`);
});

console.log("\n=== HƯỚNG DẪN TEST ===");
console.log("1. Copy từng kịch bản vào form CreateCourseForm");
console.log("2. Test các chức năng:");
console.log("   - Department/User dropdown search");
console.log("   - Drag & drop curriculum items");
console.log("   - Assignment rules với các target_type khác nhau");
console.log("   - Validation ở mỗi step");
console.log("   - Upload thumbnail");
console.log("   - Save và Publish");
console.log("3. Kiểm tra edge cases:");
console.log("   - Không có section");
console.log("   - Section không có items");
console.log("   - Invalid dates");
console.log("   - Large file uploads");

export { allScenarios, scenario1, scenario2, scenario3, scenario4, scenario5, scenario6, scenario7, scenario8, scenario9, scenario10 };
