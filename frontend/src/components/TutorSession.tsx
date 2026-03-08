import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocket, ConnectionStatus } from '../hooks/useWebSocket'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useCameraCapture } from '../hooks/useCameraCapture'
import { useScreenShare } from '../hooks/useScreenShare'
import CameraView from './CameraView'
import ControlBar from './ControlBar'
import AudioPulse from './AudioPulse'
import TranscriptPanel from './TranscriptPanel'

interface TranscriptEntry {
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

export default function TutorSession() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [isMicOn, setIsMicOn] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '')
  const videoRef = useRef<HTMLVideoElement>(null)

  const { initialize: initAudio, playAudio, clearBuffer, cleanup: cleanupAudio } = useAudioPlayer()

  const { status, connect, disconnect, sendBinary, sendJson } = useWebSocket({
    onBinaryMessage: (data) => {
      playAudio(data)
    },
    onJsonMessage: (msg) => {
      if (msg.type === 'transcript') {
        setTranscript((prev) => [
          ...prev,
          {
            role: msg.role as 'user' | 'assistant',
            text: msg.text as string,
            timestamp: Date.now(),
          },
        ])
      } else if (msg.type === 'status' && msg.status === 'interrupted') {
        clearBuffer()
      }
    },
  })

  const { isRecording, audioLevel, startRecording, stopRecording } = useAudioRecorder({
    onAudioData: (data) => {
      sendBinary(data)
    },
  })

  const sendFrame = useCallback((base64Data: string) => {
    sendJson({ type: 'video_frame', data: base64Data })
  }, [sendJson])

  const { isActive: isCameraActive, startCamera, stopCamera } = useCameraCapture({
    onFrame: sendFrame,
  })

  const { isSharing: isScreenSharing, startSharing, stopSharing } = useScreenShare({
    onFrame: sendFrame,
  })

  const handleConnect = useCallback(async () => {
    if (!apiKey.trim()) return
    localStorage.setItem('gemini_api_key', apiKey)
    try {
      await initAudio()
      await connect(apiKey.trim())
    } catch (err) {
      console.error('Failed to start session:', err)
    }
  }, [initAudio, connect, apiKey])

  const handleDisconnect = useCallback(() => {
    stopRecording()
    stopCamera()
    stopSharing()
    disconnect()
    cleanupAudio()
    setIsMicOn(false)
    setIsCameraOn(false)
  }, [stopRecording, stopCamera, stopSharing, disconnect, cleanupAudio])

  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      stopRecording()
      setIsMicOn(false)
    } else {
      try {
        await startRecording()
        setIsMicOn(true)
      } catch {
        // getUserMedia denied or failed
      }
    }
  }, [isMicOn, startRecording, stopRecording])

  const toggleCamera = useCallback(async () => {
    if (isCameraOn) {
      stopCamera()
      setIsCameraOn(false)
    } else if (videoRef.current) {
      // Stop screen share if active — they use the same video element
      if (isScreenSharing) stopSharing()
      const started = await startCamera(videoRef.current)
      if (started) setIsCameraOn(true)
    }
  }, [isCameraOn, isScreenSharing, startCamera, stopCamera, stopSharing])

  const toggleScreen = useCallback(async () => {
    if (isScreenSharing) {
      stopSharing()
    } else if (videoRef.current) {
      // Stop camera if active — they use the same video element
      if (isCameraOn) {
        stopCamera()
        setIsCameraOn(false)
      }
      await startSharing(videoRef.current)
    }
  }, [isScreenSharing, isCameraOn, startSharing, stopSharing, stopCamera])

  const handleImageUpload = useCallback((base64: string) => {
    sendJson({ type: 'video_frame', data: base64 })
    setTranscript((prev) => [
      ...prev,
      { role: 'user', text: '[Uploaded an image]', timestamp: Date.now() },
    ])
  }, [sendJson])

  // Cleanup resources on unexpected disconnect
  useEffect(() => {
    if (status === 'disconnected' || status === 'error') {
      stopRecording()
      stopCamera()
      stopSharing()
      cleanupAudio()
      setIsMicOn(false)
      setIsCameraOn(false)
    }
  }, [status, stopRecording, stopCamera, stopSharing, cleanupAudio])

  // Cleanup on unmount only
  const handleDisconnectRef = useRef(handleDisconnect)
  handleDisconnectRef.current = handleDisconnect

  useEffect(() => {
    return () => {
      handleDisconnectRef.current()
    }
  }, [])

  const isConnected = status === 'connected'
  const isVideoActive = isCameraActive || isScreenSharing

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl">
            <span role="img" aria-label="tutor">🎓</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Vision Tutor</h1>
            <p className="text-xs text-slate-400">AI-powered learning assistant</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Left: Camera/Screen + Audio visualization */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {!isConnected ? (
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                <span className="text-6xl">🎓</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Learn?</h2>
                <p className="text-slate-400 max-w-md">
                  Talk with your AI tutor using voice. Share your screen, camera, or upload images
                  to get help with homework, code, or any subject.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-3">
                <input
                  type="password"
                  placeholder="Enter your Gemini API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <p className="text-xs text-slate-500">
                  Get your key at{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    aistudio.google.com/apikey
                  </a>
                  {' '} — your key stays in your browser.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={status === 'connecting' || !apiKey.trim()}
                  className={`w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-medium transition-colors ${
                    status === 'connecting' || !apiKey.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {status === 'connecting' ? 'Connecting...' : 'Start Session'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <CameraView
                videoRef={videoRef}
                isActive={isVideoActive}
                label={isScreenSharing ? 'Screen sharing' : undefined}
              />
              <AudioPulse level={audioLevel} isActive={isRecording} />
            </>
          )}
        </div>

        {/* Right: Transcript */}
        {isConnected && (
          <div className="w-full sm:w-96 border-t sm:border-t-0 sm:border-l border-slate-700 flex flex-col max-h-64 sm:max-h-none">
            <TranscriptPanel entries={transcript} />
          </div>
        )}
      </div>

      {/* Bottom: Controls */}
      {isConnected && (
        <ControlBar
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          isScreenSharing={isScreenSharing}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onToggleScreen={toggleScreen}
          onImageUpload={handleImageUpload}
          onDisconnect={handleDisconnect}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    disconnected: { color: 'bg-slate-500', text: 'Disconnected' },
    connecting: { color: 'bg-yellow-500 animate-pulse', text: 'Connecting...' },
    connected: { color: 'bg-green-500', text: 'Connected' },
    error: { color: 'bg-red-500', text: 'Error' },
  }
  const { color, text } = config[status]

  return (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      {text}
    </div>
  )
}
