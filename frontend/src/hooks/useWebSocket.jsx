import { useEffect, useRef, useState } from 'react'

export const useWebSocket = (jobId) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!jobId) return

    const ws = new WebSocket(`ws://localhost:8000/ws/jobs/${jobId}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected for job:', jobId)
      setIsConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setMessages((prev) => [...prev, data])
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
        setError('Failed to parse message')
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
      setError('WebSocket connection error')
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected for job:', jobId)
      setIsConnected(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [jobId])

  const sendMessage = (message) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  return { 
    isConnected, 
    messages, 
    error,
    sendMessage, 
    clearMessages 
  }
}

export default useWebSocket