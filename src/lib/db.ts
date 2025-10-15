//-------------- Để tối ưu hiệu suất thì ko dùng prisma, anh em chịu khó viết query -------------

//-------------- Không dùng pg, Neon có hỗ trợ serverless -------------

// import { Pool } from "pg";

// // Tạo connection pool
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }, // Neon yêu cầu SSL
// });

// // Hàm query DB
// export const query = async (text: string, params?: any[]) => {
//   const res = await pool.query(text, params);
//   return res;
// };
