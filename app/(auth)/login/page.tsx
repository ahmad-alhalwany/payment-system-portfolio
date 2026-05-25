'use client'

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useAuth } from '@/app/hooks/useAuth'
import { siteConfig } from '@/lib/site-config'
import { getDashboardForRole, findDemoAccount } from '@/lib/demo-auth'
import { useLocale } from '@/components/providers/LocaleProvider'
import LanguageToggle from '@/components/ui/LanguageToggle'
import ThemeToggle from '@/components/ui/ThemeToggle'

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, demoLogin } = useAuth()
  const { t } = useLocale()

  const loginSchema = useMemo(() => z.object({
    username: z.string().min(1, t.login.errors.usernameRequired),
    password: z.string().min(1, t.login.errors.passwordRequired),
  }), [t])

  type LoginFormData = z.infer<typeof loginSchema>

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: siteConfig.demoPassword },
  })

  const performLogin = useCallback(async (username: string, password: string) => {
    setError('')
    setStatus(t.login.verifying)
    setProgress(10)
    setIsLoading(true)
    try {
      setStatus(t.login.connecting)
      setProgress(30)
      const response = await login({ username, password })
      setProgress(100)
      setStatus(t.login.connected)
      toast.success(t.login.success)
      setTimeout(() => {
        router.push(getDashboardForRole(response.role))
      }, 400)
    } catch {
      setError(t.login.errors.serverError)
      setStatus('')
      setProgress(0)
      toast.error(t.login.errors.serverError)
    } finally {
      setIsLoading(false)
    }
  }, [login, router, t])

  const handleDemoLogin = (role: string) => {
    void performDemoLogin(role)
  }

  const performDemoLogin = useCallback(async (role: string) => {
    setError('')
    setStatus(t.login.verifying)
    setProgress(10)
    setIsLoading(true)
    try {
      setStatus(t.login.connecting)
      setProgress(30)
      const response = await demoLogin(role)
      setProgress(100)
      setStatus(t.login.connected)
      toast.success(t.login.success)
      setTimeout(() => {
        router.push(getDashboardForRole(response.role))
      }, 400)
    } catch {
      setError(t.login.errors.serverError)
      setStatus('')
      setProgress(0)
      toast.error(t.login.errors.serverError)
    } finally {
      setIsLoading(false)
    }
  }, [demoLogin, router, t])

  useEffect(() => {
    const username = searchParams.get('username')
    const role = searchParams.get('role')
    if (!username) return

    setLoginValue('username', username)
    setLoginValue('password', siteConfig.demoPassword)

    const account =
      siteConfig.demoAccounts.find((a) => a.username === username) ||
      (role ? findDemoAccount(role) : undefined)

    if (account && searchParams.get('auto') !== '0') {
      void performDemoLogin(account.role)
    }
  }, [searchParams, setLoginValue, performDemoLogin])

  const onSubmit = async (data: LoginFormData) => {
    await performLogin(data.username, data.password)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50'

  const roleLabels: Record<string, string> = {
    director: t.demo.roles.director,
    branch_manager: t.demo.roles.branch_manager,
    employee: t.demo.roles.employee,
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 relative overflow-hidden transition-colors">
      <div className="absolute top-4 start-4 flex gap-2 z-20">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-grid-pattern opacity-20 dark:opacity-30" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors mb-6">
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {t.login.backHome}
          </Link>
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-primary-500/30">
              <Image src="/payment-system.jpg" alt="Logo" fill className="object-cover" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.login.title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.login.subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {siteConfig.demoAccounts.map((account) => (
            <button
              key={account.role}
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoLogin(account.role)}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-br ${account.color} hover:opacity-90 transition-opacity disabled:opacity-60`}
            >
              {account.icon} {roleLabels[account.role]}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-8 bg-white/90 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
          <form className="space-y-4" onSubmit={handleSubmitLogin(onSubmit)}>
            <input {...registerLogin('username')} type="text" className={inputClass} placeholder={t.login.username} />
            {loginErrors.username && <p className="text-sm text-red-400">{loginErrors.username.message}</p>}

            <div className="relative">
              <input {...registerLogin('password')} type={showPassword ? 'text' : 'password'} className={inputClass} placeholder={t.login.password} />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {loginErrors.password && <p className="text-sm text-red-400">{loginErrors.password.message}</p>}

            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
            {status && <div className="text-slate-500 text-sm text-center">{status}</div>}
            {progress > 0 && (
              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-gradient-to-l from-primary-500 to-primary-600 text-white font-bold hover:from-primary-400 hover:to-primary-500 transition shadow-lg shadow-primary-500/20">
              {isLoading ? t.login.submitting : t.login.submit}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-4">
            {t.login.demoPassword} <code className="text-primary-600 dark:text-primary-400">{siteConfig.demoPassword}</code>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { t } = useLocale()

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">{t.login.loading}</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
