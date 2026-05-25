import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-lg shadow-indigo-500/40">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                สร้างบัญชีใหม่
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                เริ่มต้นจัดการงานในไม่กี่วินาที
              </p>
            </div>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            มีบัญชีอยู่แล้ว?{' '}
            <Link
              href="/login"
              className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
