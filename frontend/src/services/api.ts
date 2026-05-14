import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ---- Admin Auth ----

export async function adminLogin(password: string): Promise<boolean> {
  try {
    await api.post('/admin/login', { password })
    return true
  } catch {
    return false
  }
}

// ---- Cities ----

export interface City {
  id: string
  name: string
  file_count: number
  widget_id?: string | null
  folder_id?: string | null
}

export async function getCities(): Promise<City[]> {
  const { data } = await api.get<City[]>('/cities')
  return data
}

export async function createCity(
  name: string,
  widgetId?: string,
  folderId?: string
): Promise<City> {
  const { data } = await api.post<City>('/cities', {
    name,
    widget_id: widgetId || null,
    folder_id: folderId || null,
  })
  return data
}

export async function deleteCity(cityId: string): Promise<void> {
  await api.delete(`/cities/${cityId}`)
}

export async function updateCityConfig(
  cityId: string,
  config: { widget_id?: string; folder_id?: string }
): Promise<void> {
  await api.put(`/cities/${cityId}/config`, config)
}

// ---- Files ----

export interface FileInfo {
  filename: string
  size_bytes: number
  city_id: string
}

export async function getFiles(cityId: string): Promise<FileInfo[]> {
  const { data } = await api.get<FileInfo[]>(`/cities/${cityId}/files`)
  return data
}

export async function uploadFile(cityId: string, file: File): Promise<FileInfo> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<FileInfo>(`/cities/${cityId}/files`, form)
  return data
}

export async function deleteFile(cityId: string, filename: string): Promise<void> {
  await api.delete(`/cities/${cityId}/files/${filename}`)
}

// ---- Sync ----

export interface SyncResult {
  message: string
}

export async function syncCity(cityId: string): Promise<SyncResult> {
  const { data } = await api.post<SyncResult>(`/cities/${cityId}/sync`)
  return data
}

// ---- Chat ----

export interface ChatResult {
  answer: string
  session_id: string
}

export async function sendChat(
  cityId: string,
  question: string,
  sessionId?: string,
  userId?: string
): Promise<ChatResult> {
  const { data } = await api.post<ChatResult>('/chat', {
    city_id: cityId,
    question,
    session_id: sessionId,
    user_id: userId,
  })
  return data
}

export async function closeInquiry(sessionId: string, userId?: string): Promise<void> {
  await api.post('/chat/close', { session_id: sessionId, user_id: userId })
}

export interface ChatSession {
  session_id: string
  city_id: string
  title: string
  message_count: number
  opened_at: string
  closed_at: string | null
}

export interface ChatHistoryMessage {
  question: string
  answer: string
}

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  const { data } = await api.get<ChatSession[]>('/chat/sessions', { params: { user_id: userId } })
  return data
}

export async function getChatHistory(sessionId: string): Promise<ChatHistoryMessage[]> {
  const { data } = await api.get<ChatHistoryMessage[]>(`/chat/history/${sessionId}`)
  return data
}

// ---- Users ----

export interface User {
  id: string
  name: string
  created_at: string
}

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users')
  return data
}

export async function createUser(name: string): Promise<User> {
  const { data } = await api.post<User>('/users', { name })
  return data
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`)
}

// ---- Analytics ----

export interface AnalyticsSummary {
  total_inquiries: number
  total_today: number
  total_yesterday: number
  avg_duration_ms: number
  avg_response_ms: number
  open_inquiries: number
}

export interface TimeSeriesPoint {
  date: string
  count: number
}

export interface EmployeeDuration {
  employee: string
  avg_duration_ms: number
  count: number
}

export interface CityCount {
  city: string
  count: number
}

export interface HourlyPoint {
  hour: number
  count: number
}

export interface EmployeePerformance {
  user_id: string
  name: string
  total_inquiries: number
  avg_duration_ms: number
  total_messages: number
  today: number
}

export interface InquiryLogItem {
  session_id: string
  user_id: string | null
  user_name: string
  city_id: string
  message_count: number
  opened_at: string
  closed_at: string | null
  total_duration_ms: number | null
}

export interface InquiryLogPage {
  items: InquiryLogItem[]
  total: number
  page: number
  limit: number
}

export interface InquiryMessage {
  question: string
  answer: string
  started_at: string
  duration_ms: number
}

export async function getAnalyticsSummary(days = 7): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>('/analytics/summary', { params: { days } })
  return data
}

export async function getInquiriesOverTime(days = 30): Promise<TimeSeriesPoint[]> {
  const { data } = await api.get<TimeSeriesPoint[]>('/analytics/inquiries-over-time', { params: { days } })
  return data
}

export async function getDurationByEmployee(): Promise<EmployeeDuration[]> {
  const { data } = await api.get<EmployeeDuration[]>('/analytics/duration-by-employee')
  return data
}

export async function getInquiriesByCity(): Promise<CityCount[]> {
  const { data } = await api.get<CityCount[]>('/analytics/inquiries-by-city')
  return data
}

export async function getHourlyDistribution(days = 30): Promise<HourlyPoint[]> {
  const { data } = await api.get<HourlyPoint[]>('/analytics/hourly-distribution', { params: { days } })
  return data
}

export async function getEmployeePerformance(): Promise<EmployeePerformance[]> {
  const { data } = await api.get<EmployeePerformance[]>('/analytics/employee-performance')
  return data
}

export async function getInquiryLog(params: {
  page?: number
  limit?: number
  employee?: string
  city?: string
  status?: string
  date_from?: string
  date_to?: string
}): Promise<InquiryLogPage> {
  const { data } = await api.get<InquiryLogPage>('/analytics/inquiry-log', { params })
  return data
}

export async function getInquiryMessages(sessionId: string): Promise<InquiryMessage[]> {
  const { data } = await api.get<InquiryMessage[]>(`/analytics/inquiry-log/${sessionId}/messages`)
  return data
}
