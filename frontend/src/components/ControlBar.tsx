import { useRef } from 'react'

interface ControlBarProps {
  isMicOn: boolean
  isCameraOn: boolean
  isScreenSharing: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onToggleScreen: () => void
  onImageUpload: (base64: string) => void
  onDisconnect: () => void
}

export default function ControlBar({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onImageUpload,
  onDisconnect,
}: ControlBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      onImageUpload(base64)
    }
    reader.readAsDataURL(file)
    // Reset so user can upload same file again
    e.target.value = ''
  }

  return (
    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 border-t border-slate-700">
      {/* Mic toggle */}
      <ControlButton
        active={isMicOn}
        onClick={onToggleMic}
        label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isMicOn ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </ControlButton>

      {/* Camera toggle */}
      <ControlButton
        active={isCameraOn}
        onClick={onToggleCamera}
        label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </ControlButton>

      {/* Screen share toggle */}
      <ControlButton
        active={isScreenSharing}
        onClick={onToggleScreen}
        label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
        activeColor="bg-green-600 hover:bg-green-700"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </ControlButton>

      {/* Image upload */}
      <ControlButton
        active={false}
        onClick={() => fileInputRef.current?.click()}
        label="Upload image"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </ControlButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Disconnect */}
      <button
        onClick={onDisconnect}
        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
        aria-label="End session"
        title="End session"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
        </svg>
      </button>
    </div>
  )
}

function ControlButton({
  active,
  onClick,
  label,
  activeColor = 'bg-blue-600 hover:bg-blue-700',
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  activeColor?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
        active
          ? `${activeColor} text-white`
          : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
      }`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
