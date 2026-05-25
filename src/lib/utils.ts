import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TH_MONTHS_FULL = [
  '\u0e21\u0e01\u0e23\u0e32\u0e04\u0e21',
  '\u0e01\u0e38\u0e21\u0e20\u0e32\u0e1e\u0e31\u0e19\u0e18\u0e4c',
  '\u0e21\u0e35\u0e19\u0e32\u0e04\u0e21',
  '\u0e40\u0e21\u0e29\u0e32\u0e22\u0e19',
  '\u0e1e\u0e24\u0e29\u0e20\u0e32\u0e04\u0e21',
  '\u0e21\u0e34\u0e16\u0e38\u0e19\u0e32\u0e22\u0e19',
  '\u0e01\u0e23\u0e01\u0e0e\u0e32\u0e04\u0e21',
  '\u0e2a\u0e34\u0e07\u0e2b\u0e32\u0e04\u0e21',
  '\u0e01\u0e31\u0e19\u0e22\u0e32\u0e22\u0e19',
  '\u0e15\u0e38\u0e25\u0e32\u0e04\u0e21',
  '\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19',
  '\u0e18\u0e31\u0e19\u0e27\u0e32\u0e04\u0e21',
]

const TH_MONTHS_SHORT = [
  '\u0e21.\u0e04.',
  '\u0e01.\u0e1e.',
  '\u0e21\u0e35.\u0e04.',
  '\u0e40\u0e21.\u0e22.',
  '\u0e1e.\u0e04.',
  '\u0e21\u0e34.\u0e22.',
  '\u0e01.\u0e04.',
  '\u0e2a.\u0e04.',
  '\u0e01.\u0e22.',
  '\u0e15.\u0e04.',
  '\u0e1e.\u0e22.',
  '\u0e18.\u0e04.',
]

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`
}

export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function relativeTimeAt(date: Date | string | null | undefined, now: number) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const diff = d.getTime() - now
  const abs = Math.abs(diff)
  const sec = Math.floor(abs / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const prefix = diff < 0 ? '\u0e40\u0e25\u0e22\u0e01\u0e33\u0e2b\u0e19\u0e14' : '\u0e40\u0e2b\u0e25\u0e37\u0e2d'
  const suffix = diff < 0 ? '\u0e17\u0e35\u0e48\u0e41\u0e25\u0e49\u0e27' : ''

  if (day > 0) return `${prefix} ${day} \u0e27\u0e31\u0e19 ${suffix}`.trim()
  if (hr > 0) return `${prefix} ${hr} \u0e0a\u0e21. ${suffix}`.trim()
  if (min > 0) return `${prefix} ${min} \u0e19\u0e32\u0e17\u0e35 ${suffix}`.trim()
  return diff < 0
    ? '\u0e40\u0e1e\u0e34\u0e48\u0e07\u0e40\u0e25\u0e22\u0e01\u0e33\u0e2b\u0e19\u0e14'
    : '\u0e2d\u0e35\u0e01\u0e1b\u0e23\u0e30\u0e40\u0e14\u0e35\u0e4b\u0e22\u0e27'
}

export function relativeTime(date: Date | string | null | undefined) {
  return relativeTimeAt(date, Date.now())
}

export function isOverdueAt(
  date: Date | string | null | undefined,
  isDone: boolean,
  now: number,
) {
  if (!date || isDone) return false
  return new Date(date).getTime() < now
}

export function isOverdue(date: Date | string | null | undefined, isDone: boolean) {
  return isOverdueAt(date, isDone, Date.now())
}
