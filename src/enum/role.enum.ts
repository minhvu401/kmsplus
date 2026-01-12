export enum Role {
  EMPLOYEE = "Employee",
  CONTRIBUTOR = "Contributor",
  TRAINING_MANAGER = "TrainingManager",
  ADMIN = "Admin",
  DASHBOARD_VIEWER = "DashboardViewer",
}

export const RoleConfig = {
  [Role.EMPLOYEE]: {
    id: 1,
    name: "Employee",
    label: "Nhân viên",
  },
  [Role.CONTRIBUTOR]: {
    id: 2,
    name: "Contributor",
    label: "Người đóng góp",
  },
  [Role.TRAINING_MANAGER]: {
    id: 3,
    name: "TrainingManager",
    label: "Quản lý đào tạo",
  },
  [Role.ADMIN]: {
    id: 4,
    name: "Admin",
    label: "Quản trị viên",
  },
  [Role.DASHBOARD_VIEWER]: {
    id: 5,
    name: "DashboardViewer",
    label: "Xem bảng điều khiển",
  },
} as const
