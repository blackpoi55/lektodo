'use client'

import {
  deleteTaskAction,
  setTaskStatusAction,
} from '@/actions/tasks'
import { cn, formatDate, isOverdueAt } from '@/lib/utils'
import { Check, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { TaskStatus } from '@prisma/client'
import { confirmDelete, toast } from '@/components/ui/toast'
import { Donut } from './Sidebar'
import {
  PRIORITY_META,
  STATUS_META,
  STATUS_ORDER,
  progressForStatus,
  type TaskDTO,
} from './types'

const DAY = 86400000

export default function TaskTable({
  title,
  tasks,
  now,
  onEdit,
  onAdd,
  emptyText = 'ยังไม่มีงาน',
  showCreated = false,
  showDaysLeft = false,
  showProgress = false,
  accent = 'brand',
}: {
  title: string
  tasks: TaskDTO[]
  now: number
  onEdit: (t: TaskDTO) => void
  onAdd?: () => void
  emptyText?: string
  showCreated?: boolean
  showDaysLeft?: boolean
  showProgress?: boolean
  accent?: 'brand' | 'amber'
}) {
  const [pending, startTransition] = useTransition()

  const toggleDone = (t: TaskDTO) => {
    const next: TaskStatus = t.status === 'DONE' ? 'TODO' : 'DONE'
    startTransition(async () => {
      const res = await setTaskStatusAction(t.id, next)
      if (res.ok) toast.success(next === 'DONE' ? 'เสร็จแล้ว!' : 'กลับเป็นรอทำ')
      else toast.error(res.error)
    })
  }

  const handleDelete = async (t: TaskDTO) => {
    const ok = await confirmDelete(`ต้องการลบงาน "${t.title}" ใช่หรือไม่`)
    if (!ok) return
    startTransition(async () => {
      const res = await deleteTaskAction(t.id)
      if (res.ok) toast.success('ลบงานเรียบร้อย')
      else toast.error(res.error)
    })
  }

  const cycleStatus = (t: TaskDTO) => {
    const idx = STATUS_ORDER.indexOf(t.status)
    const next: TaskStatus = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
    startTransition(async () => {
      const res = await setTaskStatusAction(t.id, next)
      if (res.ok) toast.success(`เปลี่ยนเป็น "${STATUS_META[next].label}"`)
      else toast.error(res.error)
    })
  }

  const headerBg =
    accent === 'amber'
      ? 'bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-amber-500/15 dark:to-orange-500/15'
      : 'bg-gradient-to-r from-brand-100/80 to-violet-100/80 dark:from-brand-500/15 dark:to-violet-500/15'

  const titleColor =
    accent === 'amber'
      ? 'text-amber-700 dark:text-amber-200'
      : 'text-brand-700 dark:text-brand-200'

  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className={cn('flex items-center justify-between px-4 py-3', headerBg)}>
        <div className="flex items-center gap-2">
          <ChevronRight className={cn('h-4 w-4', titleColor)} />
          <h2 className={cn('text-sm font-bold sm:text-base', titleColor)}>{title}</h2>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-white/15 dark:text-slate-200">
            {tasks.length}
          </span>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="btn-primary !py-1.5 !px-3 !text-xs"
            data-tooltip-id="tt"
            data-tooltip-content="เพิ่มงานใหม่"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มงาน
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">{emptyText}</div>
      ) : (
        <>
          {/* Desktop / Tablet table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <th className="px-3 py-2.5 w-14 text-center">ลำดับ</th>
                  <th className="px-3 py-2.5 w-10"></th>
                  <th className="px-3 py-2.5">การกิจ / งาน</th>
                  {showCreated && (
                    <th className="px-3 py-2.5 w-32">วันที่เพิ่มงาน</th>
                  )}
                  <th className="px-3 py-2.5 w-36">ประเภทงาน</th>
                  <th className="px-3 py-2.5 w-28">ความสำคัญ</th>
                  <th className="px-3 py-2.5 w-36">วันที่ Deadline</th>
                  {showDaysLeft && (
                    <th className="px-3 py-2.5 w-24 text-center">เหลือกี่วัน</th>
                  )}
                  <th className="px-3 py-2.5 w-28">สถานะ</th>
                  {showProgress && (
                    <th className="px-3 py-2.5 w-20 text-center">%</th>
                  )}
                  <th className="px-3 py-2.5 w-24 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => {
                  const overdue = isOverdueAt(t.dueDate, t.status === 'DONE', now)
                  const status = STATUS_META[t.status]
                  const prio = PRIORITY_META[t.priority]
                  const daysLeft = t.dueDate
                    ? Math.ceil((new Date(t.dueDate).getTime() - now) / DAY)
                    : null
                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        'border-b border-slate-100 transition hover:bg-slate-50/70 dark:border-white/5 dark:hover:bg-white/5',
                        pending && 'opacity-60',
                      )}
                    >
                      <td className="px-3 py-2.5 text-center text-xs font-bold text-slate-500">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleDone(t)}
                          className={cn(
                            'grid h-5 w-5 place-items-center rounded-md border-2 transition',
                            t.status === 'DONE'
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 hover:border-emerald-500 dark:border-white/20',
                          )}
                          data-tooltip-id="tt"
                          data-tooltip-content={t.status === 'DONE' ? 'ยกเลิกเสร็จ' : 'ทำเสร็จ'}
                          aria-label="toggle done"
                        >
                          {t.status === 'DONE' && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>
                      </td>
                      <td
                        className="px-3 py-2.5 cursor-pointer"
                        onClick={() => onEdit(t)}
                      >
                        <p
                          className={cn(
                            'font-medium text-slate-900 dark:text-white',
                            t.status === 'DONE' &&
                              'line-through text-slate-400 dark:text-slate-500',
                          )}
                        >
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                            {t.description}
                          </p>
                        )}
                      </td>
                      {showCreated && (
                        <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(t.createdAt)}
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        {t.category ? (
                          <span className="chip bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                            {t.category}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('chip', prio.chip)}>{prio.label}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {t.dueDate ? (
                          <span
                            className={cn(
                              'text-xs',
                              overdue
                                ? 'font-bold text-rose-600 dark:text-rose-300'
                                : 'text-slate-700 dark:text-slate-200',
                            )}
                          >
                            {formatDate(t.dueDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      {showDaysLeft && (
                        <td className="px-3 py-2.5 text-center">
                          {daysLeft === null || t.status === 'DONE' ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <DaysLeftPill days={daysLeft} />
                          )}
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => cycleStatus(t)}
                          className={cn('chip cursor-pointer transition hover:opacity-80', status.chip)}
                          data-tooltip-id="tt"
                          data-tooltip-content="คลิกเพื่อเปลี่ยนสถานะ"
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                          {status.label}
                        </button>
                      </td>
                      {showProgress && (
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <Donut percent={progressForStatus(t.status)} size={26} stroke={4} />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {progressForStatus(t.status)}%
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(t)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-500/15"
                            data-tooltip-id="tt"
                            data-tooltip-content="แก้ไข"
                            aria-label="แก้ไข"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/15"
                            data-tooltip-id="tt"
                            data-tooltip-content="ลบ"
                            aria-label="ลบ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
            {tasks.map((t, i) => {
              const overdue = isOverdueAt(t.dueDate, t.status === 'DONE', now)
              const status = STATUS_META[t.status]
              const prio = PRIORITY_META[t.priority]
              const daysLeft = t.dueDate
                ? Math.ceil((new Date(t.dueDate).getTime() - now) / DAY)
                : null
              return (
                <li key={t.id} className={cn('p-3', pending && 'opacity-60')}>
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleDone(t)}
                      className={cn(
                        'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition',
                        t.status === 'DONE'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-white/20',
                      )}
                      aria-label="toggle"
                    >
                      {t.status === 'DONE' && <Check className="h-3 w-3" strokeWidth={3} />}
                    </button>
                    <div className="min-w-0 flex-1" onClick={() => onEdit(t)}>
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-slate-400">#{i + 1}</span>
                        <p
                          className={cn(
                            'flex-1 text-sm font-semibold text-slate-900 dark:text-white',
                            t.status === 'DONE' &&
                              'line-through text-slate-400 dark:text-slate-500',
                          )}
                        >
                          {t.title}
                        </p>
                        {showProgress && (
                          <Donut percent={progressForStatus(t.status)} size={26} stroke={4} showLabel />
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className={cn('chip', status.chip)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                          {status.label}
                        </span>
                        <span className={cn('chip', prio.chip)}>{prio.label}</span>
                        {t.category && (
                          <span className="chip bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                            {t.category}
                          </span>
                        )}
                        {t.dueDate && (
                          <span
                            className={cn(
                              'text-[11px]',
                              overdue
                                ? 'font-bold text-rose-600 dark:text-rose-300'
                                : 'text-slate-500 dark:text-slate-400',
                            )}
                          >
                            {formatDate(t.dueDate)}
                          </span>
                        )}
                        {showDaysLeft && daysLeft !== null && t.status !== 'DONE' && (
                          <DaysLeftPill days={daysLeft} />
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => onEdit(t)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-500/15"
                        aria-label="แก้ไข"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/15"
                        aria-label="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

function DaysLeftPill({ days }: { days: number }) {
  const overdue = days < 0
  const tone = overdue
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200'
    : days === 0
      ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200'
      : days <= 3
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
        : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
  const label = overdue
    ? `เลย ${Math.abs(days)} วัน`
    : days === 0
      ? 'วันนี้'
      : `เหลือ ${days} วัน`
  return (
    <span className={cn('inline-flex rounded-lg px-2 py-1 text-[10px] font-bold', tone)}>
      {label}
    </span>
  )
}
