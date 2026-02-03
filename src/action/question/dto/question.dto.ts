import { z } from "zod"

const normalizeNewlines = (val: unknown) => {
  if (typeof val !== "string") return val
  return val.replace(/\r\n/g, "\n")
}

// Strip HTML tags to get plain text for character counting
const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

// Custom refinement to validate plain text length (excluding HTML tags like images)
const contentLength = (min: number, max: number, minMsg: string, maxMsg: string) => {
  return z.string()
    .refine(
      (val) => stripHtmlTags(val).length >= min,
      { message: minMsg }
    )
    .refine(
      (val) => stripHtmlTags(val).length <= max,
      { message: maxMsg }
    )
}

export const CreateQuestionDto = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters"),
  content: z.preprocess(
    normalizeNewlines,
    contentLength(10, 3000, "Content must be at least 10 characters", "Content must be under 3000 characters")
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
    contentLength(10, 3000, "Content must be at least 10 characters", "Content must be under 3000 characters")
  ),
  category_id: z.coerce.number().int(),
})

export type UpdateQuestionDtoType = z.infer<typeof UpdateQuestionDto>

export const CreateAnswerDto = z.object({
  content: z.preprocess(
    normalizeNewlines,
    contentLength(15, 600, "Content must be at least 15 characters", "Content must be under 600 characters")
  ),
  user_id: z.coerce.number().int(),
  question_id: z.coerce.number().int(),
  parent_id: z.coerce.number().int().nullable().optional(),
})

export type CreateAnswerDtoType = z.infer<typeof CreateAnswerDto>

export const UpdateAnswerDto = z.object({
  content: z.preprocess(
    normalizeNewlines,
    contentLength(15, 600, "Content must be at least 15 characters", "Content must be under 600 characters")
  ),
  answer_id: z.coerce.number().int(),
  question_id: z.coerce.number().int(),
})

export type UpdateAnswerDtoType = z.infer<typeof UpdateAnswerDto>
