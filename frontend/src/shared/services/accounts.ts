// Service tài khoản và đăng nhập. Chỉ gọi API của BE.
import type { Account } from '../types/account'
import type { Role } from '../types/role'
import { http } from '../lib/http'

export interface AccountInput { name: string; email: string; phone: string; role: Role }
// BE trả token JWT khi đăng nhập thành công; lỗi nghiệp vụ (sai mật khẩu, bị khóa) trả ok=false kèm lý do
export type AuthResult = { ok: true; account: Account; token: string } | { ok: false; reason: string }

const OPS: Role[] = ['specialist', 'coordinator', 'driver', 'escort'] // tên gắn với đơn và lịch phân công nên không đổi sau khi tạo
export const isOpsRole = (r: Role) => OPS.includes(r)

export const accountsApi = {
  list: (): Promise<Account[]> => http.get<Account[]>('/accounts'),
  authenticate: (email: string, password: string, portal: 'staff' | 'customer'): Promise<AuthResult> => http.post<AuthResult>('/auth/login', { email, password, portal }),
  create: (input: AccountInput, actor: string): Promise<{ account: Account; password: string }> => http.post<{ account: Account; password: string }>('/accounts', { ...input, actor }),
  update: (id: string, patch: Pick<AccountInput, 'name' | 'email' | 'phone'>, actor: string): Promise<Account> => http.patch<Account>(`/accounts/${id}`, { ...patch, actor }),
  setLocked: (id: string, locked: boolean, actor: { name: string; email: string }, reason = ''): Promise<Account> => http.post<Account>(`/accounts/${id}/set-locked`, { locked, actor, reason }),
  resetPassword: (id: string, actor: string): Promise<string> => http.post<string>(`/accounts/${id}/reset-password`, { actor }),
}
