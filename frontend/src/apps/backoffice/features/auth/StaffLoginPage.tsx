// Đăng nhập nội bộ và đăng nhập Manager. Chuyển từ Staffs/staff_login.html (+ staff_login.js) và Manager/manager_login.html.
// BE kiểm tra tài khoản và trả vai trò; FE chuyển vào đúng trang của vai trò đó.
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@shared/auth/AuthContext'
import { accountsApi } from '@shared/services/accounts'
import { setToken } from '@shared/lib/http'
import type { StaffRole } from '@shared/types/role'
import { AuthShell, authStyles as s } from '@shared/ui/AuthShell'
import { HOME_OF } from '../../layouts/staffMenus'

function LoginForm({ managerOnly }: { managerOnly: boolean }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = (data.get('email') as string).trim().toLowerCase()
    const auth = await accountsApi.authenticate(email, (data.get('password') as string) ?? '', 'staff').catch(e => ({ ok: false as const, reason: e instanceof Error ? e.message : 'Không đăng nhập được' }))
    if (!auth.ok) return setError(auth.reason)
    const role = auth.account.role as StaffRole
    setToken(auth.token)
    login({ role, name: auth.account.name, username: auth.account.email })
    navigate(HOME_OF[role])
  }

  return (
    <form onSubmit={submit}>
      {error && <div className={`alert alert-danger ${s.error}`}><i className="fa-solid fa-circle-exclamation" /><div>{error}</div></div>}
      <div className="form-group">
        <label htmlFor="email">{managerOnly ? 'Tên đăng nhập / Email' : 'Email'}</label>
        <input className="form-control" id="email" name="email" placeholder="email được cấp" required onChange={() => setError('')} />
      </div>
      <div className="form-group">
        <label htmlFor="password">Mật khẩu</label>
        <input className="form-control" id="password" name="password" type="password" placeholder="••••••••" required />
      </div>
      <p className="text-right small" style={{ marginBottom: 16 }}><a href="#" className="text-orange">Quên mật khẩu?</a></p>
      <button type="submit" className="btn btn-primary btn-full btn-lg">{managerOnly ? 'Đăng nhập Quản lý' : 'Đăng nhập'}</button>
    </form>
  )
}

export function StaffLoginPage() {
  return (
    <AuthShell title="Đăng nhập Nội bộ" subtitle="Vui lòng đăng nhập bằng email được cấp" heading="Hệ thống Nội bộ" tagline="Cổng đăng nhập dành cho nhân viên. Quản lý, tài xế, hộ tống và vận hành." homeHref="/" homeExternal back={<a href="/"><i className="fa-solid fa-arrow-left" /> Về Trang chủ</a>}>
      <LoginForm managerOnly={false} />
    </AuthShell>
  )
}

export function ManagerLoginPage() {
  return (
    <AuthShell title="Cổng Quản lý" subtitle="Vui lòng đăng nhập với tài khoản cấp quản lý" heading="Hệ thống Quản lý Vận hành" tagline="Nền tảng kiểm soát và điều phối toàn diện lộ trình vận chuyển ngựa đua an toàn, tiêu chuẩn." homeHref="/" homeExternal back={<a href="/"><i className="fa-solid fa-arrow-left" /> Về Trang chủ</a>}>
      <LoginForm managerOnly />
    </AuthShell>
  )
}
