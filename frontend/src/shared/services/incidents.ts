import type { Incident } from '../types/ops'
import { http } from '../lib/http'

export const incidentsApi = {
  list: (): Promise<Incident[]> => http.get<Incident[]>('/incidents'),
  update: (id: string, patch: Partial<Incident>): Promise<Incident> => http.patch<Incident>(`/incidents/${id}`, patch),
  create: (data: Omit<Incident, 'id'>): Promise<Incident> => http.post<Incident>('/incidents', data),
}
export type { Incident }
