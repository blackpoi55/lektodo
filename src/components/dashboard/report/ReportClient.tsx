'use client'

import ThaiDatePicker from '@/components/ui/ThaiDatePicker'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import {
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  Clock,
  ListChecks,
  Printer,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PRIORITY_META, STATUS_META, progressForStatus, type TaskDTO } from '../types'

type DateMode = 'created' | 'completed' | 'due'
type GroupMode = 'none' | 'day' | 'month'
type StatusFilter = 'all' | 'done' | 'pending'

const TH_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

function toISO(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfDay(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0)
}
function endOfDay(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999)
}

function pickDate(t: TaskDTO, mode: DateMode): string | null {
  if (mode === 'created') return t.createdAt
  if (mode === 'completed') return t.completedAt
  return t.dueDate
}

export default function ReportClient({
  user,
  tasks,
}: {
  user: { name: string; email: string }
  tasks: TaskDTO[]
}) {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [from, setFrom] = useState(toISO(firstOfMonth))
  const [to, setTo] = useState(toISO(today))
  const [mode, setMode] = useState<DateMode>('created')
  const [group, setGroup] = useState<GroupMode>('day')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [printedAt] = useState(() => new Date())

  const fromD = startOfDay(from)
  const toD = endOfDay(to)

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (status === 'done' && t.status !== 'DONE') return false
      if (status === 'pending' && t.status === 'DONE') return false
      const dateStr = pickDate(t, mode)
      if (!dateStr) return false
      const d = new Date(dateStr)
      if (fromD && d < fromD) return false
      if (toD && d > toD) return false
      return true
    })
  }, [tasks, mode, status, fromD, toD])

  const summary = useMemo(() => {
    const total = filtered.length
    const done = filtered.filter((t) => t.status === 'DONE').length
    const pending = total - done
    const overdue = filtered.filter(
      (t) =>
        t.status !== 'DONE' &&
        t.dueDate &&
        new Date(t.dueDate).getTime() < Date.now(),
    ).length
    const avg = total
      ? Math.round(filtered.reduce((s, t) => s + progressForStatus(t.status), 0) / total)
      : 0
    return { total, done, pending, overdue, avg }
  }, [filtered])

  const groups = useMemo(() => {
    if (group === 'none') return [{ label: '', tasks: filtered }]
    const map = new Map<string, { label: string; tasks: TaskDTO[]; sortKey: string }>()
    filtered.forEach((t) => {
      const ds = pickDate(t, mode)
      if (!ds) return
      const d = new Date(ds)
      let key: string
      let label: string
      if (group === 'day') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        label = `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        label = `${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
      }
      if (!map.has(key)) map.set(key, { label, tasks: [], sortKey: key })
      map.get(key)!.tasks.push(t)
    })
    return Array.from(map.values()).sort((a, b) =>
      a.sortKey > b.sortKey ? -1 : a.sortKey < b.sortKey ? 1 : 0,
    )
  }, [filtered, group, mode])

  const preset = (kind: 'today' | 'week' | 'month' | 'lastMonth' | 'year') => {
    const now = new Date()
    let f: Date, t: Date
    switch (kind) {
      case 'today':
        f = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        t = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        f = new Date(now)
        f.setDate(f.getDate() - 6)
        t = now
        break
      case 'month':
        f = new Date(now.getFullYear(), now.getMonth(), 1)
        t = now
        break
      case 'lastMonth':
        f = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        t = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'year':
        f = new Date(now.getFullYear(), 0, 1)
        t = now
        break
    }
    setFrom(toISO(f))
    setTo(toISO(t))
  }

  const modeLabel = mode === 'created' ? 'วันที่เพิ่ม' : mode === 'completed' ? 'วันที่เสร็จ' : 'วันที่ Deadline'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white">
      {/* Toolbar - hidden when printing */}
      <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
              aria-label="กลับ"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                ออกรายงาน (PDF)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เลือกช่วงวันที่แล้วกดปุ่ม "พิมพ์ / บันทึก PDF"
              </p>
            </div>
          </div>
          <button onClick={() => window.print()} className="btn-primary">
            <Printer className="h-4 w-4" />
            พิมพ์ / บันทึก PDF
          </button>
        </div>

        {/* Filters */}
        <div className="mx-auto max-w-5xl border-t border-slate-200 px-4 py-3 dark:border-white/10 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                จากวันที่
              </label>
              <ThaiDatePicker name="from" value={from} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                ถึงวันที่
              </label>
              <ThaiDatePicker name="to" value={to} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                ตามวันที่
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as DateMode)}
                className="input py-2 text-sm"
              >
                <option value="created">วันที่เพิ่มงาน</option>
                <option value="completed">วันที่เสร็จ</option>
                <option value="due">วันที่ Deadline</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                จัดกลุ่ม
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as GroupMode)}
                className="input py-2 text-sm"
              >
                <option value="none">ไม่จัดกลุ่ม</option>
                <option value="day">รายวัน</option>
                <option value="month">รายเดือน</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              ช่วงด่วน:
            </span>
            {(
              [
                ['today', 'วันนี้'],
                ['week', '7 วัน'],
                ['month', 'เดือนนี้'],
                ['lastMonth', 'เดือนก่อน'],
                ['year', 'ปีนี้'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => preset(k)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
              >
                {l}
              </button>
            ))}

            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                สถานะ:
              </span>
              {(
                [
                  ['all', 'ทั้งหมด'],
                  ['done', 'เสร็จเท่านั้น'],
                  ['pending', 'ค้างเท่านั้น'],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setStatus(k)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold transition',
                    status === k
                      ? 'bg-gradient-brand text-white shadow'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report sheet (A4) */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 print:p-0 print:max-w-none">
        <article className="report-sheet mx-auto bg-white text-slate-900 shadow-xl print:shadow-none">
          {/* Header */}
          <header className="border-b-2 border-slate-900/10 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Smart To-Do List · รายงาน
                </p>
                <h1 className="mt-1 text-2xl font-bold">รายงานสรุปงาน</h1>
                <p className="mt-1 text-sm text-slate-600">
                  ผู้ใช้: <span className="font-semibold">{user.name}</span> · {user.email}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <p>
                  พิมพ์เมื่อ <span className="font-semibold">{formatDateTime(printedAt)}</span>
                </p>
                <p className="mt-0.5">
                  ทั้งหมด <span className="font-semibold">{summary.total}</span> รายการ
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 print:border print:border-slate-300 print:bg-white">
              <CalendarRange className="h-4 w-4 text-brand-600" />
              <span className="text-sm">
                ช่วง <span className="font-semibold">{modeLabel}</span>: ตั้งแต่{' '}
                <span className="font-semibold">{formatDate(fromD)}</span> ถึง{' '}
                <span className="font-semibold">{formatDate(toD)}</span>
              </span>
            </div>
          </header>

          {/* Summary */}
          <section className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatBox icon={ListChecks} label="ทั้งหมด" value={summary.total} tone="brand" />
            <StatBox icon={CheckCircle2} label="เสร็จแล้ว" value={summary.done} tone="emerald" />
            <StatBox icon={Clock} label="ค้าง" value={summary.pending} tone="amber" />
            <StatBox icon={Clock} label="เลยกำหนด" value={summary.overdue} tone="rose" />
            <StatBox
              icon={TrendingUp}
              label="ความคืบหน้ารวม"
              value={`${summary.avg}%`}
              tone="violet"
            />
          </section>

          {/* Tasks */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
              ไม่มีข้อมูลในช่วงที่เลือก
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <section key={g.label || 'all'} className="break-inside-avoid">
                  {g.label && (
                    <h3 className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-1 text-sm font-bold text-brand-700">
                      <CalendarRange className="h-3.5 w-3.5" />
                      {g.label}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {g.tasks.length} งาน
                      </span>
                    </h3>
                  )}
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600 print:bg-slate-100">
                        <th className="px-2 py-1.5 w-8 text-center">#</th>
                        <th className="px-2 py-1.5">การกิจ / งาน</th>
                        <th className="px-2 py-1.5 w-24">ประเภท</th>
                        <th className="px-2 py-1.5 w-20">ความสำคัญ</th>
                        <th className="px-2 py-1.5 w-24">Deadline</th>
                        <th className="px-2 py-1.5 w-20">วันที่เสร็จ</th>
                        <th className="px-2 py-1.5 w-20">สถานะ</th>
                        <th className="px-2 py-1.5 w-12 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.tasks.map((t, i) => {
                        const status = STATUS_META[t.status]
                        const prio = PRIORITY_META[t.priority]
                        return (
                          <tr
                            key={t.id}
                            className="border-b border-slate-200 align-top"
                          >
                            <td className="px-2 py-1.5 text-center font-bold text-slate-500">
                              {i + 1}
                            </td>
                            <td className="px-2 py-1.5">
                              <p
                                className={cn(
                                  'font-medium text-slate-900',
                                  t.status === 'DONE' && 'line-through text-slate-500',
                                )}
                              >
                                {t.title}
                              </p>
                              {t.description && (
                                <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">
                                  {t.description}
                                </p>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-slate-700">
                              {t.category || '—'}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={cn(
                                  'inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                  prio.chip,
                                )}
                              >
                                {prio.label}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-slate-700">
                              {t.dueDate ? formatDate(t.dueDate) : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-slate-700">
                              {t.completedAt ? formatDate(t.completedAt) : '—'}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={cn(
                                  'inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                  status.chip,
                                )}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right font-bold text-slate-700">
                              {progressForStatus(t.status)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          )}

          <footer className="mt-6 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">
            สร้างโดย Smart To-Do List · {formatDateTime(printedAt)}
          </footer>
        </article>
      </main>
    </div>
  )
}

function StatBox({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  tone: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet'
}) {
  const tones = {
    brand: 'border-brand-200 bg-brand-50 text-brand-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
  }
  return (
    <div className={cn('rounded-xl border p-2.5', tones[tone])}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-0.5 text-xl font-bold">{value}</p>
    </div>
  )
}
