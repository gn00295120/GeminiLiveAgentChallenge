import { useCallback, useRef, useState } from 'react'

interface UseAudioRecorderOptions {
  onAudioData: (data: ArrayBuffer) => void
}

export function useAudioRecorder({ onAudioData }: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const onAudioDataRef = useRef(onAudioData)
  onAudioDataRef.current = onAudioData

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      // Load the capture worklet
      await audioContext.audioWorklet.addModule('/worklets/capture-worklet.js')

      const source = audioContext.createMediaStreamSource(stream)
      const captureNode = new AudioWorkletNode(audioContext, 'capture-worklet')

      // Receive PCM data from worklet
      captureNode.port.onmessage = (event) => {
        onAudioDataRef.current(event.data)
      }

      // Set up analyser for audio level visualization
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      source.connect(analyser)
      source.connect(captureNode)

      // Connect to destination via silent gain for Safari compatibility
      const silentGain = audioContext.createGain()
      silentGain.gain.value = 0
      captureNode.connect(silentGain)
      silentGain.connect(audioContext.destination)

      // Monitor audio level
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length
        setAudioLevel(avg / 255)
        animFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setIsRecording(false)
    setAudioLevel(0)
  }, [])

  return { isRecording, audioLevel, startRecording, stopRecording }
}
