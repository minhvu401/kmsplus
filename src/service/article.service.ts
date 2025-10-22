"use server"

import { sql } from "@/lib/neonClient"

export type Article = {
  id: number;
  category_id: number;
  author_id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  status: string;
  view_count: number;
  approved_by: number;
  approved_at: string;
  published_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAllArticleAction(): Promise<Article[]> {
  const articles = await sql`
    SELECT id, category_id, author_id, title, slug, content, summary, status, view_count, approved_by, approved_at, published_at, is_deleted, deleted_at, created_at, updated_at 
    FROM articles 
    ORDER BY approved_at DESC
  `
  console.log("Fetched users:", articles) // Debug log
  return articles as Article[]
}