import { useEffect, useRef } from 'react'

interface TranscriptEntry {
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

interface TranscriptPanelProps {
  entries: TranscriptEntry[]
}

export default function TranscriptPanel({ entries }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-300">Transcript</h2>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 text-center mt-8">
            Start speaking to see the conversation here...
          </p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={i}
              className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  entry.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-700 text-slate-200 rounded-bl-md'
                }`}
              >
                {entry.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
