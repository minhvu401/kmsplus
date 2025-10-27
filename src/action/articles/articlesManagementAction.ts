"use server"

import { requireAuth } from "@/lib/serverAuth"
import { getAllArticlesAction, searchArticleAction } from "@/service/articles.service"

export async function getAllArticles() {
//   await requireAuth()
  return getAllArticlesAction()
}

export async function searchArticle(searchQuery: string) {
//   await requireAuth()
  return searchArticleAction(searchQuery)
}


