import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

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
  sessionId?: string
): Promise<ChatResult> {
  const { data } = await api.post<ChatResult>('/chat', {
    city_id: cityId,
    question,
    session_id: sessionId,
  })
  return data
}
