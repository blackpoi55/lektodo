'use client'

import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const TH_MONTHS_FULL = [
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

const TH_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
]

const TH_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export function formatThaiDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) return ''
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`
}

export function formatThaiDateFull(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) return ''
  return `${d.getDate()} ${TH_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`
}

function toISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

type Props = {
  name: string
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export default function ThaiDatePicker({
  name,
  value,
  defaultValue,
  onChange,
  placeholder = 'เลือกวันที่',
  className,
}: Props) {
  const [internal, setInternal] = useState<string>(value ?? defaultValue ?? '')
  const [open, setOpen] = useState(false)
  const [yearView, setYearView] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, flipped: false })
  const [viewDate, setViewDate] = useState<Date>(() =>
    internal ? new Date(internal) : new Date(),
  )
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (value !== undefined) {
      setInternal(value ?? '')
      if (value) setViewDate(new Date(value))
    }
  }, [value])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popH = 340
    const margin = 8
    const fitBelow = rect.bottom + margin + popH <= window.innerHeight
    const top = fitBelow ? rect.bottom + margin : Math.max(margin, rect.top - margin - popH)
    const width = Math.max(280, rect.width)
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin)
    setPosition({ top, left, width, flipped: !fitBelow })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !popoverRef.current?.contains(t)) {
        setOpen(false)
        setYearView(false)
      }
    }
    const onScroll = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return
      setOpen(false)
      setYearView(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = internal ? new Date(internal) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  const pickDay = (day: number) => {
    const d = new Date(year, month, day)
    const iso = toISODate(d)
    setInternal(iso)
    onChange?.(iso)
    setOpen(false)
    setYearView(false)
  }

  const clear = () => {
    setInternal('')
    onChange?.('')
  }

  const setToday = () => {
    const d = new Date()
    const iso = toISODate(d)
    setInternal(iso)
    onChange?.(iso)
    setViewDate(d)
    setOpen(false)
  }

  const handlePrev = () => {
    if (yearView) setViewDate(new Date(year - 12, month, 1))
    else setViewDate(new Date(year, month - 1, 1))
  }
  const handleNext = () => {
    if (yearView) setViewDate(new Date(year + 12, month, 1))
    else setViewDate(new Date(year, month + 1, 1))
  }

  return (
    <div className={cn('relative', className)}>
      <input type="hidden" name={name} value={internal} />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span
          className={cn(
            'flex items-center gap-2 truncate',
            internal ? 'text-slate-900 dark:text-white' : 'text-slate-400',
          )}
        >
          <Calendar className="h-4 w-4 text-slate-400" />
          {internal ? formatThaiDate(internal) : placeholder}
        </span>
        {internal ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              clear()
            }}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-white/10"
            aria-label="ล้างวันที่"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="z-[70] glass rounded-2xl p-3 shadow-2xl shadow-indigo-500/20 animate-fade-in"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                aria-label="ก่อนหน้า"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setYearView((v) => !v)}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
              >
                {yearView
                  ? `${year + 543 - 6} — ${year + 543 + 5}`
                  : `${TH_MONTHS_FULL[month]} ${year + 543}`}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                aria-label="ถัดไป"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {yearView ? (
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => year - 6 + i).map((y) => {
                  const active = selected?.getFullYear() === y
                  const currentYear = new Date().getFullYear() === y
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(y, month, 1))
                        setYearView(false)
                      }}
                      className={cn(
                        'rounded-lg px-2 py-2 text-sm font-medium transition',
                        active
                          ? 'bg-gradient-brand text-white shadow'
                          : currentYear
                            ? 'ring-1 ring-brand-500 text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10',
                      )}
                    >
                      {y + 543}
                    </button>
                  )
                })}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold">
                  {TH_DAYS.map((d, i) => (
                    <div
                      key={d}
                      className={cn(
                        'py-1.5 text-slate-400',
                        i === 0 && '!text-rose-500',
                        i === 6 && '!text-sky-500',
                      )}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {cells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />
                    const d = new Date(year, month, day)
                    d.setHours(0, 0, 0, 0)
                    const isToday = d.getTime() === today.getTime()
                    const isSelected =
                      !!selected &&
                      selected.getDate() === day &&
                      selected.getMonth() === month &&
                      selected.getFullYear() === year
                    const dow = d.getDay()
                    return (
                      <button
                        key={`d-${day}`}
                        type="button"
                        onClick={() => pickDay(day)}
                        className={cn(
                          'aspect-square rounded-lg text-sm font-medium transition',
                          isSelected
                            ? 'bg-gradient-brand text-white shadow-md shadow-indigo-500/40'
                            : isToday
                              ? 'ring-1 ring-brand-500 text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10'
                              : cn(
                                  'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10',
                                  dow === 0 && '!text-rose-500',
                                  dow === 6 && '!text-sky-500',
                                ),
                        )}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-white/10">
              <button
                type="button"
                onClick={setToday}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                วันนี้
              </button>
              {internal && (
                <button
                  type="button"
                  onClick={() => {
                    clear()
                    setOpen(false)
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
