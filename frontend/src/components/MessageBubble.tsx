interface Source {
  filename: string
  page_content: string
}

interface Props {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

export default function MessageBubble({ role, content, sources }: Props) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex items-start gap-2.5 max-w-[78%] ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
            isUser
              ? 'bg-brand-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
          aria-hidden="true"
        >
          {isUser ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 0 1 .672 0 41.059 41.059 0 0 1 8.198 5.424.75.75 0 0 1-.254 1.285 31.372 31.372 0 0 0-7.86 3.83.75.75 0 0 1-.84 0 31.508 31.508 0 0 0-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 0 1 3.305-2.033.75.75 0 0 0-.714-1.319 37 37 0 0 0-3.446 2.12A2.216 2.216 0 0 0 6 9.393v.38a31.293 31.293 0 0 0-4.28-1.746.75.75 0 0 1-.254-1.285 41.059 41.059 0 0 1 8.198-5.424ZM6 11.459a29.848 29.848 0 0 0-2.455-1.158 41.029 41.029 0 0 0-.39 3.114.75.75 0 0 0 .419.74c.528.256 1.046.53 1.554.82-.21.324-.455.63-.739.914a.75.75 0 1 0 1.06 1.06c.37-.369.69-.77.96-1.193a26.61 26.61 0 0 1 3.095 2.348.75.75 0 0 0 .992 0 26.547 26.547 0 0 1 5.93-3.95.75.75 0 0 0 .42-.739 41.053 41.053 0 0 0-.39-3.114 29.925 29.925 0 0 0-5.199 2.801 2.25 2.25 0 0 1-2.514 0c-.41-.275-.826-.541-1.25-.797a6.985 6.985 0 0 1-1.084 3.45 26.503 26.503 0 0 0-1.281-.78A5.487 5.487 0 0 0 6 12v-.54Z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-md shadow-md shadow-brand-600/15'
              : 'bg-white text-gray-800 rounded-tl-md shadow-sm border border-gray-100'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>

          {sources && sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 mb-1.5">מקורות:</p>
              {sources.map((s, i) => (
                <details key={i} className="text-xs text-gray-400 mt-1 group">
                  <summary className="cursor-pointer hover:text-brand-600 transition-colors">
                    <span className="mr-1">{s.filename}</span>
                  </summary>
                  <p className="mt-1.5 text-gray-400 pr-4 leading-relaxed">{s.page_content}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
