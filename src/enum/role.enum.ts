export enum Role {
  EMPLOYEE = "Employee",
  CONTRIBUTOR = "Contributor",
  TRAINING_MANAGER = "Training Manager",
  ADMIN = "Admin",
  DIRECTOR = "Director",
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
    name: "Training Manager",
    label: "Quản lý đào tạo",
  },
  [Role.ADMIN]: {
    id: 4,
    name: "Admin",
    label: "Quản trị viên",
  },
  [Role.DIRECTOR]: {
    id: 5,
    name: "Director",
    label: "Giám đốc",
  },
} as const
