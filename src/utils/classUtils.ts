import { twMerge } from "tailwind-merge"

type ClassNameValues = ClassNameValue[]
type ClassNameValue = string | false | 0 | ClassNameValues | null | undefined

//cái nì là để nó ghi đè lên css defautl, ví dụ là đè lên icon của antd chẳng hạn
export const tw = (...classList: ClassNameValues) => {
  return twMerge(classList)
}

export default {
  tw,
}
