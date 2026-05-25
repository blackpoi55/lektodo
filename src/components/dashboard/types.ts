import type { TaskPriority, TaskStatus } from '@prisma/client'

export type TaskLogDTO = {
  id: string
  taskId: string
  date: string
  note: string
  createdAt: string
}

export type TaskDTO = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  progress: number
  category: string | null
  pinned: boolean
  startDate: string | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  userId: string
  logs: TaskLogDTO[]
}

export const STATUS_PROGRESS: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 50,
  FOLLOW_UP: 75,
  DONE: 100,
}

// Status order for cycling and form display
export const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'FOLLOW_UP', 'DONE']

export function progressForStatus(s: TaskStatus): number {
  return STATUS_PROGRESS[s]
}

export const STATUS_META: Record<
  TaskStatus,
  { label: string; chip: string; dot: string; bar: string }
> = {
  TODO: {
    label: 'ยังไม่ทำ',
    chip: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
  },
  IN_PROGRESS: {
    label: 'กำลังทำ',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
  },
  FOLLOW_UP: {
    label: 'ติดตามผล',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
    dot: 'bg-violet-400',
    bar: 'bg-violet-400',
  },
  DONE: {
    label: 'เสร็จ',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400',
  },
}

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; chip: string; rank: number }
> = {
  LOW: {
    label: 'ต่ำ',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
    rank: 0,
  },
  MEDIUM: {
    label: 'ปานกลาง',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
    rank: 1,
  },
  HIGH: {
    label: 'สูง',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200',
    rank: 2,
  },
  URGENT: {
    label: 'ด่วน',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
    rank: 3,
  },
}
