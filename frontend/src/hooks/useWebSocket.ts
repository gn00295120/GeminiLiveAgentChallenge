import { useCallback, useEffect, useRef, useState } from 'react'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface WebSocketMessage {
  type: string
  [key: string]: unknown
}

interface UseWebSocketOptions {
  onBinaryMessage?: (data: ArrayBuffer) => void
  onJsonMessage?: (data: WebSocketMessage) => void
  onStatusChange?: (status: ConnectionStatus) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus)
    optionsRef.current.onStatusChange?.(newStatus)
  }, [])

  const connect = useCallback(async (apiKey?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    updateStatus('connecting')

    try {
      // Get a session ID from the backend
      const res = await fetch('/api/session')
      if (!res.ok) {
        throw new Error(`Failed to create session: ${res.status} ${res.statusText}`)
      }
      const { session_id } = await res.json()
      if (!session_id) {
        throw new Error('Server returned empty session ID')
      }

      // Build WebSocket URL with optional API key
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const keyParam = apiKey ? `?api_key=${encodeURIComponent(apiKey)}` : ''
      const wsUrl = `${protocol}//${host}/ws/${session_id}${keyParam}`

      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        updateStatus('connected')
        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }))
          }
        }, 30000)
      }

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          optionsRef.current.onBinaryMessage?.(event.data)
        } else {
          try {
            const data = JSON.parse(event.data)
            optionsRef.current.onJsonMessage?.(data)
          } catch {
            console.warn('Failed to parse WS message:', event.data)
          }
        }
      }

      ws.onerror = () => {
        updateStatus('error')
      }

      ws.onclose = () => {
        updateStatus('disconnected')
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current)
          heartbeatRef.current = null
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Failed to connect:', err)
      updateStatus('error')
    }
  }, [updateStatus])

  const disconnect = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    updateStatus('disconnected')
  }, [updateStatus])

  const sendBinary = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
    }
  }, [])

  const sendJson = useCallback((data: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return { status, connect, disconnect, sendBinary, sendJson }
}
