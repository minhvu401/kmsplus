"use server"

import { requireAuth } from "@/lib/serverAuth"
import { getAllArticlesAction } from "@/service/articlesManagement.service"

export async function getAllArticles() {
//   await requireAuth()
  return getAllArticlesAction()
}


