export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Absolute date as DD/MM/YYYY */
export function formatDateDMY(timestamp: number) {
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/** e.g. "today", "3d ago", "2m ago", "1y ago" */
export function formatRelativeAgo(timestamp: number, now = Date.now()) {
  const diffMs = Math.max(0, now - timestamp)
  const dayMs = 86_400_000
  const days = Math.floor(diffMs / dayMs)

  if (days < 1) return 'today'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}m ago`
  return `${Math.floor(days / 365)}y ago`
}
