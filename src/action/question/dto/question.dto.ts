import { z } from "zod"

const normalizeNewlines = (val: unknown) => {
  if (typeof val !== "string") return val
  return val.replace(/\r\n/g, "\n")
}

export const CreateQuestionDto = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters"),
  content: z.preprocess(
    normalizeNewlines,
    z
      .string()
      .min(10, "Content must be at least 10 characters")
      .max(3000, "Content must be under 3000 characters")
  ),
  category_id: z.coerce.number().int().min(1, "Please select a category"),
  user_id: z.coerce.number().int(),
})

export type CreateQuestionDtoType = z.infer<typeof CreateQuestionDto>

export const UpdateQuestionDto = z.object({
  id: z.coerce.number().int(),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters"),
  content: z.preprocess(
    normalizeNewlines,
    z
      .string()
      .min(10, "Content must be at least 10 characters")
      .max(3000, "Content must be under 3000 characters")
  ),
  category_id: z.coerce.number().int(),
})

export type UpdateQuestionDtoType = z.infer<typeof UpdateQuestionDto>

export const CreateAnswerDto = z.object({
  content: z.preprocess(
    normalizeNewlines,
    z
      .string()
      .min(15, "Content must be at least 15 characters")
      .max(600, "Content must be under 600 characters")
  ),
  user_id: z.coerce.number().int(),
  question_id: z.coerce.number().int(),
})

export type CreateAnswerDtoType = z.infer<typeof CreateAnswerDto>

export const UpdateAnswerDto = z.object({
  content: z.preprocess(
    normalizeNewlines,
    z
      .string()
      .min(15, "Content must be at least 15 characters")
      .max(600, "Content must be under 600 characters")
  ),
  answer_id: z.coerce.number().int(),
  question_id: z.coerce.number().int(),
})

export type UpdateAnswerDtoType = z.infer<typeof UpdateAnswerDto>
