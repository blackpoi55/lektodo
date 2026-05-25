'use client'

import { cn } from '@/lib/utils'
import {
  Briefcase,
  ChevronDown,
  GraduationCap,
  Heart,
  Home,
  MoreHorizontal,
  Phone,
  Plane,
  Rocket,
  ShoppingCart,
  Tag,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export const CATEGORY_OPTIONS: { value: string; icon: LucideIcon; color: string }[] = [
  { value: 'งาน', icon: Briefcase, color: 'text-indigo-500' },
  { value: 'ส่วนตัว', icon: User, color: 'text-violet-500' },
  { value: 'เรียน', icon: GraduationCap, color: 'text-sky-500' },
  { value: 'บ้าน', icon: Home, color: 'text-emerald-500' },
  { value: 'สุขภาพ', icon: Heart, color: 'text-rose-500' },
  { value: 'การเงิน', icon: Wallet, color: 'text-amber-500' },
  { value: 'ซื้อของ', icon: ShoppingCart, color: 'text-orange-500' },
  { value: 'เดินทาง', icon: Plane, color: 'text-cyan-500' },
  { value: 'โปรเจค', icon: Rocket, color: 'text-fuchsia-500' },
  { value: 'ติดต่อ', icon: Phone, color: 'text-teal-500' },
  { value: 'อื่นๆ', icon: MoreHorizontal, color: 'text-slate-500' },
]

export function getCategoryMeta(value: string | null | undefined) {
  if (!value) return null
  return CATEGORY_OPTIONS.find((o) => o.value === value) ?? null
}

type Props = {
  name: string
  defaultValue?: string | null
  placeholder?: string
}

export default function CategorySelect({
  name,
  defaultValue,
  placeholder = 'เลือกหมวดหมู่',
}: Props) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  // Include existing custom category if any
  const options = (() => {
    if (defaultValue && !CATEGORY_OPTIONS.some((o) => o.value === defaultValue)) {
      return [
        { value: defaultValue, icon: Tag, color: 'text-slate-500' as const },
        ...CATEGORY_OPTIONS,
      ]
    }
    return CATEGORY_OPTIONS
  })()

  useEffect(() => setMounted(true), [])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popH = 320
    const margin = 8
    const fitBelow = rect.bottom + margin + popH <= window.innerHeight
    const top = fitBelow ? rect.bottom + margin : Math.max(margin, rect.top - margin - popH)
    const width = Math.max(220, rect.width)
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin)
    setPos({ top, left, width })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false)
    }
    const onScroll = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return
      setOpen(false)
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

  const current = options.find((o) => o.value === value)
  const Icon = current?.icon ?? Tag

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 truncate">
          <Icon className={cn('h-4 w-4 shrink-0', current?.color ?? 'text-slate-400')} />
          <span
            className={cn(
              'truncate',
              value ? 'text-slate-900 dark:text-white' : 'text-slate-400',
            )}
          >
            {value || placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={popRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
            className="z-[70] glass max-h-80 overflow-y-auto rounded-2xl p-1.5 shadow-2xl shadow-indigo-500/20 animate-fade-in"
          >
            <button
              type="button"
              onClick={() => {
                setValue('')
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition',
                !value
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10',
              )}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/5">
                <Tag className="h-3.5 w-3.5" />
              </span>
              <span>— ไม่ระบุ —</span>
            </button>

            {options.map((o) => {
              const OptIcon = o.icon
              const active = value === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setValue(o.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition',
                    active
                      ? 'bg-gradient-brand text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-lg bg-slate-100 dark:bg-white/5',
                      active && '!bg-white/20',
                    )}
                  >
                    <OptIcon className={cn('h-3.5 w-3.5', active ? 'text-white' : o.color)} />
                  </span>
                  <span className="truncate">{o.value}</span>
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
