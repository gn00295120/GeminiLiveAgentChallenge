import { useCallback, useRef, useState } from 'react'

interface UseCameraCaptureOptions {
  onFrame: (base64Data: string) => void
  fps?: number
  maxWidth?: number
  quality?: number
}

export function useCameraCapture({
  onFrame,
  fps = 1,
  maxWidth = 1024,
  quality = 0.7,
}: UseCameraCaptureOptions) {
  const [isActive, setIsActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  const startCamera = useCallback(async (videoElement: HTMLVideoElement): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      videoRef.current = videoElement
      videoElement.srcObject = stream
      await videoElement.play()

      // Create canvas for frame capture
      const canvas = document.createElement('canvas')
      canvasRef.current = canvas

      // Start capturing frames
      intervalRef.current = setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState < 2) return

        const video = videoRef.current
        let width = video.videoWidth
        let height = video.videoHeight

        // Resize if needed
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

      setIsActive(true)
      return true
    } catch (err) {
      console.error('Failed to start camera:', err)
      return false
    }
  }, [fps, maxWidth, quality])

  const stopCamera = useCallback(() => {
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
    setIsActive(false)
  }, [])

  return { isActive, startCamera, stopCamera }
}
