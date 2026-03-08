import { useCallback, useRef, useState } from 'react'

interface UseScreenShareOptions {
  onFrame: (base64Data: string) => void
  fps?: number
  maxWidth?: number
  quality?: number
}

export function useScreenShare({
  onFrame,
  fps = 1,
  maxWidth = 1024,
  quality = 0.7,
}: UseScreenShareOptions) {
  const [isSharing, setIsSharing] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  const startSharing = useCallback(async (videoElement: HTMLVideoElement): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      videoRef.current = videoElement
      videoElement.srcObject = stream
      await videoElement.play()

      // Handle user clicking "Stop sharing" in the browser UI
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.onended = () => {
          stopSharing()
        }
      }

      const canvas = document.createElement('canvas')
      canvasRef.current = canvas

      intervalRef.current = setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState < 2) return

        const video = videoRef.current
        let width = video.videoWidth
        let height = video.videoHeight

        // Skip zero-size frames (stream not ready yet)
        if (width === 0 || height === 0) return

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, width, height)

        const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1]
        onFrameRef.current(base64)
      }, 1000 / fps)

      setIsSharing(true)
      return true
    } catch (err) {
      console.error('Failed to start screen sharing:', err)
      return false
    }
  }, [fps, maxWidth, quality])

  const stopSharing = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current = null
    }
    setIsSharing(false)
  }, [])

  return { isSharing, startSharing, stopSharing }
}
