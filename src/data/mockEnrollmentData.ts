// @/src/data/mockEnrollmentData.ts

export const COURSE_STATS = {
  totalEnrolled: 1245,
  avgCompletion: 68,
  rating: 4.8,
  title: "Advanced Cybersecurity Compliance",
}

export const ENROLLMENT_LIST = [
  {
    id: "u1",
    name: "Sarah Jenkins",
    email: "sarah.j@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    enrollmentDate: "Oct 24, 2023",
    progress: 92,
    status: "In Progress",
  },
  {
    id: "u2",
    name: "Michael Chen",
    email: "m.chen@design.co",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    enrollmentDate: "Oct 22, 2023",
    progress: 100,
    status: "Completed",
  },
  {
    id: "u3",
    name: "James D.",
    email: "james.dev@tech.io",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    enrollmentDate: "Nov 01, 2023",
    progress: 24,
    status: "In Progress",
  },
  {
    id: "u4",
    name: "Emily Watson",
    email: "emily.w@studio.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    enrollmentDate: "Oct 15, 2023",
    progress: 0,
    status: "Not Started",
  },
  {
    id: "u5",
    name: "Robert K.",
    email: "rob.k@logistics.net",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    enrollmentDate: "Oct 29, 2023",
    progress: 78,
    status: "In Progress",
  },
]

export const LEARNER_DETAIL = {
  id: "u1",
  name: "Sarah Jenkins",
  email: "sarah.j@company.com",
  role: "Software Engineer",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  enrollmentDate: "Oct 12, 2023",
  overallProgress: 78,
  timeSpent: "4h 15m",
  avgQuizScore: 88,
  modules: [
    {
      title: "Module 1: Cybersecurity Fundamentals",
      items: [
        {
          title: "Introduction to Data Privacy",
          type: "video",
          status: "Completed",
          score: null,
          date: "Oct 10, 2023",
        },
        {
          title: "Understanding Phishing Threats",
          type: "video",
          status: "Completed",
          score: null,
          date: "Oct 11, 2023",
        },
        {
          title: "Module 1 Assessment: Basic Concepts",
          type: "quiz",
          status: "Passed",
          score: 92,
          date: "Oct 12, 2023",
        },
      ],
    },
    {
      title: "Module 2: Advanced Network Security",
      items: [
        {
          title: "Firewall Configuration Basics",
          type: "text",
          status: "In Progress",
          score: null,
          date: "Oct 15, 2023",
        },
        {
          title: "Secure Remote Access Protocols",
          type: "text",
          status: "Not Started",
          score: null,
          date: null,
        },
        {
          title: "Module 2 Assessment: Network Defense",
          type: "quiz",
          status: "Not Submitted",
          score: null,
          date: null,
        },
      ],
    },
    {
      title: "Module 3: Incident Response",
      items: [
        {
          title: "Practice Quiz: First Response",
          type: "quiz",
          status: "Failed",
          score: 45,
          date: "Oct 01, 2023",
        },
      ],
    },
  ],
}
