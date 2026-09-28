import { PAGINATION } from '../config/validation.js'

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT))
  return { page, limit, skip: (page - 1) * limit }
}

export function paginatedResponse({ items, page, limit, total }) {
  return { items, page, limit, total }
}