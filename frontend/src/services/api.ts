import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ---- Cities ----

export interface City {
  id: string
  name: string
  file_count: number
}

export async function getCities(): Promise<City[]> {
  const { data } = await api.get<City[]>('/cities')
  return data
}

export async function createCity(name: string): Promise<City> {
  const { data } = await api.post<City>('/cities', { name })
  return data
}

export async function deleteCity(cityId: string): Promise<void> {
  await api.delete(`/cities/${cityId}`)
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

export interface Source {
  filename: string
  page_content: string
}

export interface ChatResult {
  answer: string
  sources: Source[]
  session_id: string
}

export async function sendChat(
  cityId: string,
  question: string,
  sessionId?: string
): Promise<ChatResult> {
  const { data } = await api.post<ChatResult>('/chat', {
    city_id: cityId,
    question,
    session_id: sessionId,
  })
  return data
}
