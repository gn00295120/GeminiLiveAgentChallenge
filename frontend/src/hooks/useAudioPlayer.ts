import { useCallback, useRef } from 'react'

export function useAudioPlayer() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const initializedRef = useRef(false)

  const initialize = useCallback(async () => {
    if (initializedRef.current) return

    const audioContext = new AudioContext({ sampleRate: 24000 })
    audioContextRef.current = audioContext

    await audioContext.audioWorklet.addModule('/worklets/playback-worklet.js')

    const playbackNode = new AudioWorkletNode(audioContext, 'playback-worklet')
    playbackNode.connect(audioContext.destination)
    workletNodeRef.current = playbackNode

    initializedRef.current = true
  }, [])

  const playAudio = useCallback((data: ArrayBuffer) => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage(data, [data])
    }
  }, [])

  const clearBuffer = useCallback(() => {
    // Re-create the worklet node to clear the buffer
    if (audioContextRef.current && workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      const newNode = new AudioWorkletNode(audioContextRef.current, 'playback-worklet')
      newNode.connect(audioContextRef.current.destination)
      workletNodeRef.current = newNode
    }
  }, [])

  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    workletNodeRef.current = null
    initializedRef.current = false
  }, [])

  return { initialize, playAudio, clearBuffer, cleanup }
}
