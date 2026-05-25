'use client'

import { deleteTaskAction, setTaskStatusAction } from '@/actions/tasks'
import { cn, formatDateShort, isOverdueAt } from '@/lib/utils'
import { Check, ChevronDown, ChevronRight, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { Fragment, useState, useTransition } from 'react'
import { TaskStatus } from '@prisma/client'
import { confirmDelete, toast } from '@/components/ui/toast'
import { Donut } from './Sidebar'
import TaskLogs from './TaskLogs'
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
  showDaysLeft = false,
  showProgress = false,
  accent = 'brand',
}: {
  title: string
  tasks?: TaskDTO[]
  now: number
  onEdit: (t: TaskDTO) => void
  onAdd?: () => void
  emptyText?: string
  showDaysLeft?: boolean
  showProgress?: boolean
  accent?: 'brand' | 'amber'
}) {
  const taskList = Array.isArray(tasks) ? tasks : []
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
    accent === 'amber' ? 'text-amber-700 dark:text-amber-200' : 'text-brand-700 dark:text-brand-200'

  const colCount = 5 + (showProgress ? 1 : 0) + 1

  return (
    <section className="glass overflow-hidden rounded-2xl">
      <div className={cn('flex items-center justify-between px-4 py-3', headerBg)}>
        <div className="flex items-center gap-2">
          <ChevronRight className={cn('h-4 w-4', titleColor)} />
          <h2 className={cn('text-sm font-bold sm:text-base', titleColor)}>{title}</h2>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-white/15 dark:text-slate-200">
            {taskList.length}
          </span>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="btn-primary !px-3 !py-1.5 !text-xs"
            data-tooltip-id="tt"
            data-tooltip-content="เพิ่มงานใหม่"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มงาน
          </button>
        )}
      </div>

      {taskList.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">{emptyText}</div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <th className="w-14 px-3 py-3 text-center">ลำดับ</th>
                  <th className="w-10 px-3 py-3"></th>
                  <th className="px-3 py-3">งาน</th>
                  <th className="w-48 px-3 py-3">กำหนดการ</th>
                  <th className="w-32 px-3 py-3">สถานะ</th>
                  {showProgress && <th className="w-24 px-3 py-3 text-center">ความคืบหน้า</th>}
                  <th className="w-28 px-3 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {taskList.map((t, i) => {
                  const isOpen = expanded.has(t.id)
                  const overdue = isOverdueAt(t.dueDate, t.status === 'DONE', now)
                  const status = STATUS_META[t.status]
                  const prio = PRIORITY_META[t.priority]
                  const daysLeft = t.dueDate ? Math.ceil((new Date(t.dueDate).getTime() - now) / DAY) : null
                  const progress = progressForStatus(t.status)

                  return (
                    <Fragment key={t.id}>
                      <tr
                        onClick={() => toggleExpand(t.id)}
                        className={cn(
                          'cursor-pointer border-b border-slate-100 transition dark:border-white/5',
                          isOpen
                            ? 'border-b-0 bg-brand-50/40 dark:bg-brand-500/10'
                            : 'hover:bg-slate-50/70 dark:hover:bg-white/5',
                          pending && 'opacity-60',
                        )}
                      >
                        <td className="px-3 py-4 text-center text-xs font-bold text-slate-500">{i + 1}</td>
                        <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
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
                        <td className="px-3 py-4">
                          <div className="flex items-start gap-2">
                            <ChevronDown
                              className={cn(
                                'mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
                                isOpen && 'rotate-180 text-brand-500',
                              )}
                            />
                            <div className="min-w-0 space-y-2">
                              <div className="flex items-start gap-2">
                                <p
                                  className={cn(
                                    'text-sm font-semibold text-slate-900 dark:text-white',
                                    t.status === 'DONE' && 'line-through text-slate-400 dark:text-slate-500',
                                  )}
                                >
                                  {t.title}
                                </p>
                                {t.logs && t.logs.length > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                                    data-tooltip-id="tt"
                                    data-tooltip-content={`มี ${t.logs.length} บันทึก`}
                                  >
                                    <NotebookPen className="h-2.5 w-2.5" />
                                    {t.logs.length}
                                  </span>
                                )}
                              </div>
                              {t.description && (
                                <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                  {t.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {t.category && (
                                  <span className="chip bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                                    {t.category}
                                  </span>
                                )}
                                <span className={cn('chip', prio.chip)}>{prio.label}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="space-y-1.5 text-xs">
                            {t.startDate && (
                              <p className="text-slate-500 dark:text-slate-400">
                                เริ่ม <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateShort(t.startDate)}</span>
                              </p>
                            )}
                            {t.dueDate ? (
                              <p className={cn('font-semibold', overdue ? 'text-rose-600 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200')}>
                                ครบกำหนด {formatDateShort(t.dueDate)}
                              </p>
                            ) : (
                              <p className="text-slate-400">ยังไม่กำหนด Deadline</p>
                            )}
                            {showDaysLeft && daysLeft !== null && t.status !== 'DONE' && (
                              <div className="pt-1">
                                <DaysLeftPill days={daysLeft} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
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
                          <td className="px-3 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Donut percent={progress} size={28} stroke={4} />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{progress}%</span>
                            </div>
                          </td>
                        )}
                        <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => toggleExpand(t.id)}
                              className={cn(
                                'grid h-7 w-7 place-items-center rounded-lg transition',
                                isOpen || (t.logs && t.logs.length > 0)
                                  ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300'
                                  : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-500/15',
                              )}
                              data-tooltip-id="tt"
                              data-tooltip-content="เพิ่ม / ดูบันทึก"
                              aria-label="บันทึก"
                            >
                              <NotebookPen className="h-3.5 w-3.5" />
                            </button>
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
                      {isOpen && (
                        <tr className="border-b border-slate-200 bg-brand-50/40 dark:border-white/5 dark:bg-brand-500/10">
                          <td colSpan={colCount} className="px-4 pb-4 pt-0">
                            <div className="animate-slide-up rounded-xl border border-brand-200/50 bg-white/60 p-3 shadow-inner dark:border-white/10 dark:bg-slate-900/40">
                              <div className="mb-2 flex items-center gap-2">
                                <NotebookPen className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-200">
                                  บันทึกประจำวัน
                                </h4>
                                <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                  {t.logs?.length ?? 0}
                                </span>
                              </div>
                              <TaskLogs taskId={t.id} logs={t.logs ?? []} autoFocus />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-white/5 md:hidden">
            {taskList.map((t, i) => {
              const isOpen = expanded.has(t.id)
              const overdue = isOverdueAt(t.dueDate, t.status === 'DONE', now)
              const status = STATUS_META[t.status]
              const prio = PRIORITY_META[t.priority]
              const daysLeft = t.dueDate ? Math.ceil((new Date(t.dueDate).getTime() - now) / DAY) : null
              const progress = progressForStatus(t.status)

              return (
                <li
                  key={t.id}
                  className={cn('p-4 transition', isOpen && 'bg-brand-50/40 dark:bg-brand-500/10', pending && 'opacity-60')}
                >
                  <div className="flex items-start gap-3">
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

                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => toggleExpand(t.id)} className="w-full text-left">
                        <div className="flex items-start gap-2">
                          <ChevronDown
                            className={cn(
                              'mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
                              isOpen && 'rotate-180 text-brand-500',
                            )}
                          />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="pt-0.5 text-[10px] font-bold text-slate-400">#{i + 1}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-2">
                                  <p
                                    className={cn(
                                      'text-sm font-semibold leading-6 text-slate-900 dark:text-white',
                                      t.status === 'DONE' && 'line-through text-slate-400 dark:text-slate-500',
                                    )}
                                  >
                                    {t.title}
                                  </p>
                                  {t.logs && t.logs.length > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-1 py-0.5 text-[9px] font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                                      <NotebookPen className="h-2 w-2" />
                                      {t.logs.length}
                                    </span>
                                  )}
                                </div>
                                {t.description && (
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              {t.category && <MetaTile label="ประเภท" value={t.category} />}
                              <MetaTile label="ความสำคัญ" value={prio.label} tone={prio.chip} />
                              {t.startDate && <MetaTile label="วันเริ่ม" value={formatDateShort(t.startDate)} />}
                              {t.dueDate && (
                                <MetaTile
                                  label="Deadline"
                                  value={formatDateShort(t.dueDate)}
                                  valueClassName={overdue ? 'font-semibold text-rose-600 dark:text-rose-300' : ''}
                                />
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className={cn('chip', status.chip)}>
                                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                                {status.label}
                              </span>
                              {showDaysLeft && daysLeft !== null && t.status !== 'DONE' && <DaysLeftPill days={daysLeft} />}
                              {showProgress && (
                                <div className="flex items-center gap-2 rounded-xl bg-white/40 px-2 py-1 dark:bg-white/5">
                                  <Donut percent={progress} size={24} stroke={4} />
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{progress}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-1">
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

                  {isOpen && (
                    <div className="mt-4 animate-slide-up rounded-xl border border-brand-200/50 bg-white/60 p-3 dark:border-white/10 dark:bg-slate-900/40">
                      <div className="mb-2 flex items-center gap-2">
                        <NotebookPen className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-200">
                          บันทึกประจำวัน
                        </h4>
                        <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                          {t.logs?.length ?? 0}
                        </span>
                      </div>
                      <TaskLogs taskId={t.id} logs={t.logs ?? []} autoFocus />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

function MetaTile({
  label,
  value,
  tone,
  valueClassName,
}: {
  label: string
  value: string
  tone?: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-xl bg-white/40 px-2.5 py-2 dark:bg-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {tone ? (
        <span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold', tone)}>
          {value}
        </span>
      ) : (
        <p className={cn('mt-1 text-[11px] font-medium text-slate-700 dark:text-slate-200', valueClassName)}>
          {value}
        </p>
      )}
    </div>
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
  const label = overdue ? `เลย ${Math.abs(days)} วัน` : days === 0 ? 'วันนี้' : `เหลือ ${days} วัน`

  return <span className={cn('inline-flex rounded-lg px-2 py-1 text-[10px] font-bold', tone)}>{label}</span>
}
