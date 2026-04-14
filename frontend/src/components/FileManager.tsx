import { useEffect, useRef, useState } from 'react'
import { getFiles, uploadFile, deleteFile } from '../services/api'

interface FileInfo {
  filename: string
  size_bytes: number
  city_id: string
}

interface Props {
  cityId: string
}

export default function FileManager({ cityId }: Props) {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    if (!cityId) return
    getFiles(cityId).then(setFiles)
  }

  useEffect(() => {
    setFiles([])
    load()
  }, [cityId])

  const handleUpload = async () => {
    const input = fileRef.current
    if (!input?.files?.length || !cityId) return

    setUploading(true)
    try {
      for (const file of Array.from(input.files)) {
        await uploadFile(cityId, file)
      }
      input.value = ''
      load()
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (filename: string) => {
    if (!confirm(`למחוק את הקובץ ${filename}?`)) return
    await deleteFile(cityId, filename)
    load()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!cityId) {
    return (
      <div className="text-gray-400 text-sm text-center py-12">
        יש לבחור יישוב תחילה
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Upload area */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <input
          ref={fileRef}
          type="file"
          accept=".docx,.txt"
          multiple
          aria-label="בחירת קבצים להעלאה"
          className="text-sm text-gray-600 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-600 file:text-white file:text-sm file:font-medium file:cursor-pointer file:transition-colors hover:file:bg-brand-700 file:shadow-sm"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:scale-[0.97] transition-all duration-150 disabled:opacity-40"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              מעלה...
            </span>
          ) : 'העלה'}
        </button>
      </div>

      {/* File list */}
      {files.length === 0 ? (
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-gray-200 mx-auto mb-2">
            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
          </svg>
          <p className="text-gray-400 text-sm">אין קבצים עדיין.</p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-right py-3 px-4 font-semibold">שם קובץ</th>
                <th className="text-right py-3 px-4 font-semibold">גודל</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {files.map((f) => (
                <tr key={f.filename} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-300 shrink-0">
                        <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Z" />
                      </svg>
                      {f.filename}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 tabular-nums">{formatSize(f.size_bytes)}</td>
                  <td className="py-3 px-4 text-left">
                    <button
                      onClick={() => handleDelete(f.filename)}
                      aria-label={`מחק ${f.filename}`}
                      className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
