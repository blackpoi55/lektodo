'use client'

import { cn, formatDate, isOverdueAt } from '@/lib/utils'
import { CalendarClock, ChevronRight, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { PRIORITY_META, type TaskDTO } from './types'

const DAY = 86400000

export default function Sidebar({
  tasks,
  now,
  completion,
  onEdit,
}: {
  tasks: TaskDTO[]
  now: number
  completion: number
  onEdit: (t: TaskDTO) => void
}) {
  const upcoming = useMemo(() => {
    const arr = tasks
      .filter((t) => t.status !== 'DONE' && t.dueDate)
      .map((t) => ({
        ...t,
        msLeft: new Date(t.dueDate as string).getTime() - now,
      }))
      .sort((a, b) => a.msLeft - b.msLeft)
    return arr
  }, [tasks, now])

  const within3Days = upcoming.filter((t) => t.msLeft >= 0 && t.msLeft <= 3 * DAY).length
  const list = upcoming.slice(0, 6)

  const doneCount = tasks.filter((t) => t.status === 'DONE').length

  return (
    <div className="space-y-3">
      {/* Top: 2 mini cards */}
      <div className="grid grid-cols-2 gap-3">
        <DeadlineCard count={within3Days} />
        <ProgressCard percent={completion} done={doneCount} total={tasks.length} />
      </div>

      {/* Upcoming deadline list */}
      <section className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 bg-gradient-to-r from-pink-100/80 to-rose-100/80 px-4 py-3 dark:from-pink-500/15 dark:to-rose-500/15">
          <ChevronRight className="h-4 w-4 text-pink-600 dark:text-pink-300" />
          <h2 className="text-sm font-bold text-pink-700 dark:text-pink-200 sm:text-base">
            งานใกล้ Deadline
          </h2>
          <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-white/15 dark:text-slate-200">
            {list.length}
          </span>
        </div>
        {list.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            ไม่มีงานที่ใกล้ครบกำหนด 🎉
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {list.map((t) => {
              const overdue = isOverdueAt(t.dueDate, false, now)
              const daysLeft = Math.ceil(t.msLeft / DAY)
              return (
                <li key={t.id}>
                  <button
                    onClick={() => onEdit(t)}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50/70 dark:hover:bg-white/5"
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        overdue ? 'bg-rose-500' : PRIORITY_META[t.priority].chip,
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(t.dueDate)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold',
                        overdue
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200'
                          : daysLeft <= 1
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200'
                            : daysLeft <= 3
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                              : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
                      )}
                    >
                      {overdue
                        ? `เลย ${Math.abs(daysLeft)} วัน`
                        : daysLeft === 0
                          ? 'วันนี้'
                          : `เหลือ ${daysLeft} วัน`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function DeadlineCard({ count }: { count: number }) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-fuchsia-50 p-4 dark:from-pink-500/10 dark:to-fuchsia-500/10">
      <div className="absolute -right-3 -top-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30">
        <CalendarClock className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        งานใกล้ Deadline
      </p>
      <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{count}</p>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">ภายใน 3 วัน</p>
    </div>
  )
}

function ProgressCard({
  percent,
  done,
  total,
}: {
  percent: number
  done: number
  total: number
}) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-4 dark:from-violet-500/10 dark:to-indigo-500/10">
      <div className="flex items-center gap-3">
        <Donut percent={percent} size={64} stroke={8} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            ความคืบหน้ารวม
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {percent}
            <span className="text-sm text-slate-400">%</span>
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            {done} จาก {total}
          </p>
        </div>
      </div>
    </div>
  )
}

export function Donut({
  percent,
  size = 80,
  stroke = 10,
  showLabel = false,
}: {
  percent: number
  size?: number
  stroke?: number
  showLabel?: boolean
}) {
  const radius = (size - stroke) / 2
  const c = 2 * Math.PI * radius
  const off = c * (1 - Math.max(0, Math.min(100, percent)) / 100)
  const gradId = `donut-grad-${size}`
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-slate-200 dark:text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-100">
            {percent}%
          </span>
        </div>
      )}
    </div>
  )
}
