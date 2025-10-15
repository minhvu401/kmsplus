import { z } from "zod";

/**
 * Schema validation cho environment variables
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for security"),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Validate và parse environment variables
 * Throw error nếu thiếu hoặc không hợp lệ
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    });

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err) => {
        return `❌ ${err.path.join(".")}: ${err.message}`;
      });

      console.error("\nEnvironment Variables Validation Failed:\n");
      console.error(missingVars.join("\n"));
      console.error(
        "\n💡 Please check your .env.local file and make sure all required variables are set.\n"
      );

      throw new Error("Invalid environment variables");
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Sử dụng trong toàn bộ app thay vì process.env trực tiếp
 */
export const env = validateEnv();

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;
