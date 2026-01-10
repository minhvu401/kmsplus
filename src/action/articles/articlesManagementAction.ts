"use server"

import { requireAuth } from "@/lib/auth"
import {
  getAllArticlesAction,
  filterByTagAction,
  getAllTagsAction,
} from "@/service/articles.service"

export async function getAllArticles() {
  await requireAuth()
  return getAllArticlesAction()
}

export async function getAllTags() {
  await requireAuth()
  return getAllTagsAction()
}

export async function filterByTag(searchQuery: string, tagFilter?: string) {
  await requireAuth()
  return filterByTagAction(searchQuery, tagFilter)
}
