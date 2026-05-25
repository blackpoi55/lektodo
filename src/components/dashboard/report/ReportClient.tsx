'use client'

import ThaiDatePicker from '@/components/ui/ThaiDatePicker'
import { cn, formatDate, formatDateShort } from '@/lib/utils'
import {
  ArrowLeft,
  CheckSquare,
  NotebookPen,
  Printer,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { STATUS_META, progressForStatus, type TaskDTO } from '../types'

type DateMode = 'worked' | 'start' | 'completed' | 'due'
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

const REPORT_STATUS_CHIP: Record<keyof typeof STATUS_META, string> = {
  TODO: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  FOLLOW_UP: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  DONE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
}

function formatDateTimeShort(date: Date | string | null | undefined) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${formatDateShort(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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

function isDateInRange(
  date: string | null | undefined,
  fromD: Date | null,
  toD: Date | null,
) {
  if (!date) return false
  const d = new Date(date)
  if (isNaN(d.getTime())) return false
  if (fromD && d < fromD) return false
  if (toD && d > toD) return false
  return true
}

function pickDate(
  t: TaskDTO,
  mode: DateMode,
  fromD: Date | null,
  toD: Date | null,
): string | null {
  if (mode === 'worked') {
    // Prefer first log inside range
    const matchedLog = (t.logs ?? [])
      .filter((log) => isDateInRange(log.date, fromD, toD))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    if (matchedLog) return matchedLog.date

    // No log in range — use the task's working-period anchor.
    // anchor = max(startDate ?? createdAt, fromD) so the task is placed at the
    // beginning of its overlap with the selected range, not at a date outside it.
    const startSrc = t.startDate ?? t.createdAt
    if (!startSrc) return null
    const start = new Date(startSrc).getTime()
    const anchor = fromD ? Math.max(start, fromD.getTime()) : start
    return new Date(anchor).toISOString()
  }
  if (mode === 'start') return t.startDate
  if (mode === 'completed') return t.completedAt
  return t.dueDate
}

// For mode='worked': task is "active" if its working period
// [start, end] overlaps the filter window [fromD, toD],
// OR it has a log inside the window.
function isTaskWorkedInRange(
  t: TaskDTO,
  fromD: Date | null,
  toD: Date | null,
): boolean {
  // Logs in range — already counts
  if ((t.logs ?? []).some((log) => isDateInRange(log.date, fromD, toD))) return true

  // Period overlap: start ≤ toD AND (end ≥ fromD or end is null)
  const startSrc = t.startDate ?? t.createdAt
  if (!startSrc) return false
  const start = new Date(startSrc).getTime()

  // end = explicit due > completed > createdAt → if task still active, treat as far future
  let end: number | null = null
  if (t.dueDate) end = new Date(t.dueDate).getTime()
  else if (t.completedAt) end = new Date(t.completedAt).getTime()
  // if neither, treat as ongoing (infinite future)

  if (toD && start > toD.getTime()) return false
  if (fromD && end !== null && end < fromD.getTime()) return false
  return true
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
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [from, setFrom] = useState(toISO(firstOfMonth))
  const [to, setTo] = useState(toISO(lastOfMonth))
  const [mode, setMode] = useState<DateMode>('worked')
  const [group, setGroup] = useState<GroupMode>('day')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [showLogs, setShowLogs] = useState(true)
  const [printedAt] = useState(() => new Date())

  const fromD = startOfDay(from)
  const toD = endOfDay(to)

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (status === 'done' && t.status !== 'DONE') return false
      if (status === 'pending' && t.status === 'DONE') return false

      // "วันที่ทำงาน" mode: include task if its work period overlaps the range,
      // or any log falls in the range — even without notes.
      if (mode === 'worked') {
        return isTaskWorkedInRange(t, fromD, toD)
      }

      const dateStr = pickDate(t, mode, fromD, toD)
      if (!dateStr) return false
      return isDateInRange(dateStr, fromD, toD)
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
      const ds = pickDate(t, mode, fromD, toD)
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
        t = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        f = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        t = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'year':
        f = new Date(now.getFullYear(), 0, 1)
        t = new Date(now.getFullYear(), 11, 31)
        break
    }
    setFrom(toISO(f))
    setTo(toISO(t))
  }

  const modeLabel =
    mode === 'worked'
      ? '\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e17\u0e33\u0e07\u0e32\u0e19'
      : mode === 'start'
        ? '\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e40\u0e23\u0e34\u0e48\u0e21'
        : mode === 'completed'
          ? '\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e40\u0e2a\u0e23\u0e47\u0e08'
          : '\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 Deadline'

  // Stable document reference per print render — RPT-DDMMYYYY-HHMM
  const docRef = useMemo(() => {
    const d = printedAt
    const pad = (n: number) => String(n).padStart(2, '0')
    return `RPT-${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear() + 543}-${pad(d.getHours())}${pad(d.getMinutes())}`
  }, [printedAt])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white">
      {/* Toolbar - hidden when printing */}
      <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl pt-safe dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
              aria-label="กลับ"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                ออกรายงาน (PDF)
              </h1>
              <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
                เลือกช่วงวันที่แล้วกดปุ่ม "พิมพ์ / บันทึก PDF"
              </p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="btn-primary shrink-0 !px-2.5 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
          >
            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">พิมพ์ / บันทึก PDF</span>
            <span className="sm:hidden">พิมพ์</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mx-auto max-w-5xl border-t border-slate-200 px-3 py-2.5 dark:border-white/10 sm:px-6 sm:py-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                จากวันที่
              </label>
              <ThaiDatePicker name="from" value={from} onChange={setFrom} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                ถึงวันที่
              </label>
              <ThaiDatePicker name="to" value={to} onChange={setTo} />
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
                <option value="worked">{'\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e17\u0e33\u0e07\u0e32\u0e19'}</option>
                <option value="start">{'\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e40\u0e23\u0e34\u0e48\u0e21'}</option>
                <option value="completed">{'\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e40\u0e2a\u0e23\u0e47\u0e08'}</option>
                <option value="due">{'\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48 Deadline'}</option>
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

              <label className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15">
                <input
                  type="checkbox"
                  checked={showLogs}
                  onChange={(e) => setShowLogs(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                />
                <NotebookPen className="h-3 w-3" />
                แสดงบันทึก
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Report sheet (A4) */}
      <main className="mx-auto max-w-5xl px-2 py-4 sm:px-6 sm:py-6 print:p-0 print:max-w-none">
        <article className="report-sheet mx-auto bg-white text-slate-900 shadow-2xl shadow-slate-900/10 print:shadow-none">
          <div className="flex h-full flex-col">
            {/* === Modern Header with gradient accent === */}
            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-6 print:rounded-2xl">
              {/* Decorative gradient bar */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-200/40 to-pink-200/40 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white shadow-lg shadow-indigo-500/40">
                    <CheckSquare className="h-7 w-7" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-600">
                      Smart To-Do List
                    </p>
                    <h1 className="mt-0.5 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-3xl font-extrabold leading-tight tracking-tight text-transparent">
                      รายงานสรุปงาน
                    </h1>
                    <p className="text-[11px] font-medium tracking-wider text-slate-500">
                      Task Summary Report
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                    {docRef}
                  </span>
                  <p className="mt-2 text-[10px] text-slate-500">พิมพ์เมื่อ</p>
                  <p className="whitespace-nowrap text-xs font-semibold text-slate-900">
                    {formatDateTimeShort(printedAt)}
                  </p>
                </div>
              </div>
            </header>

            {/* === Meta info cards === */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MetaCard label="ผู้จัดทำ" value={user.name} />
              <MetaCard label="อีเมล" value={user.email} muted />
              <MetaCard
                label="ช่วงเวลา"
                value={
                  <>
                    <span className="whitespace-nowrap">{formatDateShort(fromD)}</span>
                    <span className="mx-1.5 text-slate-300">—</span>
                    <span className="whitespace-nowrap">{formatDateShort(toD)}</span>
                    <span className="ml-2 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-semibold text-indigo-700">
                      {modeLabel}
                    </span>
                  </>
                }
              />
            </div>

            {/* === Stats — modern soft cards === */}
            <div className="mt-3 grid grid-cols-5 gap-3">
              <StatPill label="งานทั้งหมด" value={summary.total} tone="indigo" />
              <StatPill label="เสร็จแล้ว" value={summary.done} tone="emerald" />
              <StatPill label="ค้าง" value={summary.pending} tone="amber" />
              <StatPill label="เลยกำหนด" value={summary.overdue} tone="rose" />
              <StatPill label="ความคืบหน้า" value={`${summary.avg}%`} tone="violet" />
            </div>

            {/* === Section header === */}
            <div className="mt-5 mb-3 flex items-center gap-3">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500" />
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                รายการงาน
              </h2>
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                {filtered.length} รายการ
              </span>
            </div>

            {/* === Tasks === */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-12 text-center text-sm text-slate-400">
                ไม่มีข้อมูลในช่วงที่เลือก
              </div>
            ) : (
              <div className="space-y-5">
                {groups.map((g) => (
                  <section key={g.label || 'all'}>
                    {g.label && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
                          {g.tasks.length}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800">{g.label}</h3>
                        <div className="ml-1 h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                      </div>
                    )}
                    <div className="rounded-2xl ring-1 ring-slate-200/80 print:rounded-xl">
                      <div className="overflow-x-auto rounded-2xl print:overflow-visible">
                        <table className="w-full min-w-[640px] border-collapse text-[10.5px] print:min-w-0">
                        <thead>
                          <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-left text-[9px] font-bold uppercase tracking-wider text-slate-600">
                            <th className="w-8 px-3 py-2.5 text-center">#</th>
                            <th className="px-3 py-2.5">การกิจ / งาน</th>
                            <th className="w-20 px-3 py-2.5">Deadline</th>
                            <th className="w-20 px-3 py-2.5">วันที่เสร็จ</th>
                            <th className="w-20 px-3 py-2.5">สถานะ</th>
                            <th className="w-12 px-3 py-2.5 text-right">%</th>
                          </tr>
                        </thead>
                        {g.tasks.map((t, i) => {
                          const status = STATUS_META[t.status]
                          const logsInRange = showLogs
                            ? (t.logs ?? [])
                                .filter((log) => {
                                  const ld = new Date(log.date)
                                  if (fromD && ld < fromD) return false
                                  if (toD && ld > toD) return false
                                  return true
                                })
                                .sort(
                                  (a, b) =>
                                    new Date(a.date).getTime() - new Date(b.date).getTime(),
                                )
                            : []
                          const isLast = i === g.tasks.length - 1
                          return (
                            <tbody key={t.id} className="task-row">
                              <tr
                                className={cn(
                                  'align-top transition',
                                  !isLast || logsInRange.length > 0
                                    ? 'border-b border-slate-100'
                                    : '',
                                )}
                              >
                                <td className="px-3 py-2.5 text-center font-bold text-slate-400">
                                  {String(i + 1).padStart(2, '0')}
                                </td>
                                <td className="px-3 py-2.5">
                                  <p
                                    className={cn(
                                      'font-semibold text-slate-900',
                                      t.status === 'DONE' &&
                                        'line-through text-slate-400',
                                    )}
                                  >
                                    {t.title}
                                  </p>
                                  {t.description && (
                                    <p className="mt-0.5 line-clamp-2 text-[9.5px] text-slate-500">
                                      {t.description}
                                    </p>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                                  {t.dueDate ? formatDateShort(t.dueDate) : '—'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                                  {t.completedAt ? formatDateShort(t.completedAt) : '—'}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold',
                                      REPORT_STATUS_CHIP[t.status],
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'h-1.5 w-1.5 rounded-full',
                                        t.status === 'TODO' && 'bg-slate-400',
                                        t.status === 'IN_PROGRESS' && 'bg-amber-500',
                                        t.status === 'FOLLOW_UP' && 'bg-violet-500',
                                        t.status === 'DONE' && 'bg-emerald-500',
                                      )}
                                    />
                                    {status.label}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  <span
                                    className={cn(
                                      'inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                                      progressForStatus(t.status) === 100
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : progressForStatus(t.status) >= 50
                                          ? 'bg-indigo-50 text-indigo-700'
                                          : 'bg-slate-50 text-slate-600',
                                    )}
                                  >
                                    {progressForStatus(t.status)}%
                                  </span>
                                </td>
                              </tr>
                              {logsInRange.length > 0 && (
                                <tr
                                  className={cn(
                                    !isLast && 'border-b border-slate-100',
                                  )}
                                >
                                  <td></td>
                                  <td colSpan={5} className="px-3 pb-3 pt-0">
                                    <div className="rounded-xl bg-gradient-to-br from-indigo-50/70 to-pink-50/40 p-3">
                                      <p className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-indigo-700">
                                        <NotebookPen className="h-3 w-3" />
                                        บันทึกประจำวัน
                                        <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] text-indigo-600">
                                          {logsInRange.length}
                                        </span>
                                      </p>
                                      <ul className="space-y-1">
                                        {logsInRange.map((log) => (
                                          <li
                                            key={log.id}
                                            className="flex gap-2 text-[10px] leading-snug"
                                          >
                                            <span className="shrink-0 whitespace-nowrap rounded-md bg-white/70 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 shadow-sm">
                                              {formatDateShort(log.date)}
                                            </span>
                                            <span className="text-slate-700 whitespace-pre-wrap pt-0.5">
                                              {log.note}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          )
                        })}
                        </table>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div className="flex-1" />

            {/* === Footer === */}
            <footer className="mt-6 pt-4">
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <div className="mt-3 flex items-center justify-between text-[9.5px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="grid h-4 w-4 place-items-center rounded bg-gradient-to-br from-indigo-500 to-pink-500 text-[8px] font-bold text-white">
                    ✓
                  </span>
                  <span className="font-semibold text-slate-700">Smart To-Do List</span>
                  <span className="text-slate-300">·</span>
                  <span>{docRef}</span>
                </div>
                <div>
                  <span>{user.name}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>{formatDateTimeShort(printedAt)}</span>
                </div>
              </div>
            </footer>
          </div>
        </article>
      </main>
    </div>
  )
}

function MetaCard({
  label,
  value,
  muted = false,
}: {
  label: string
  value: React.ReactNode
  muted?: boolean
}) {
  return (
    <div className="rounded-2xl bg-slate-50/80 px-4 py-2.5 ring-1 ring-slate-200/70 print:rounded-xl">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-[11px] font-semibold leading-snug',
          muted ? 'text-slate-600' : 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet'
}) {
  const tones = {
    indigo: 'from-indigo-50 to-indigo-100/40 ring-indigo-200/60 text-indigo-700',
    emerald: 'from-emerald-50 to-emerald-100/40 ring-emerald-200/60 text-emerald-700',
    amber: 'from-amber-50 to-amber-100/40 ring-amber-200/60 text-amber-700',
    rose: 'from-rose-50 to-rose-100/40 ring-rose-200/60 text-rose-700',
    violet: 'from-violet-50 to-violet-100/40 ring-violet-200/60 text-violet-700',
  }
  return (
    <div
      className={cn(
        'rounded-2xl bg-gradient-to-br px-3 py-3 text-center ring-1 print:rounded-xl',
        tones[tone],
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  )
}
