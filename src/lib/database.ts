import { neon } from "@neondatabase/serverless"
import { env } from "./config"

// Tạo 1 instance client duy nhất
// tránh lặp code
// kết nối đến database
export const sql = neon(env.DATABASE_URL)
