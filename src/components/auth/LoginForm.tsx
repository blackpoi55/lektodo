'use client'

import { loginAction, type ActionResult } from '@/actions/auth'
import { useFormState, useFormStatus } from 'react-dom'
import { Eye, EyeOff, Loader2, LogIn, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from '@/components/ui/toast'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3 text-base">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังเข้าสู่ระบบ…
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          เข้าสู่ระบบ
        </>
      )}
    </button>
  )
}

export default function LoginForm() {
  const [state, action] = useFormState<ActionResult | null, FormData>(loginAction, null)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (state && state.ok === false) toast.error(state.error)
  }, [state])

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">อีเมล</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input pl-10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">รหัสผ่าน</label>
        <div className="relative">
          <input
            name="password"
            type={showPw ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="แสดง/ซ่อนรหัสผ่าน"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <SubmitBtn />
    </form>
  )
}
