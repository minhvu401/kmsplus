import { z } from "zod"

export const LoginDto = z.object({
  email: z.string(),
  password: z.string(),
})

export type LoginDtoType = z.infer<typeof LoginDto>
