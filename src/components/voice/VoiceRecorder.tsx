import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'

interface VoiceRecorderProps {
  /** Called with transcribed text (future — AI integration) */
  onTranscription?: (text: string) => void
  className?: string
}

export function VoiceRecorder({ onTranscription, className }: VoiceRecorderProps) {
  const addToast = useUiStore((s) => s.addToast)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Check if MediaRecorder is available
  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setIsRecording(false)

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      addToast({ type: 'error', message: 'Brak dostępu do mikrofonu' })
    }
  }, [addToast])

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  function handleDiscard() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setIsPlaying(false)
  }

  function handleTranscribe() {
    addToast({ type: 'info', message: 'Transkrypcja AI — wkrótce' })
  }

  function togglePlay() {
    if (!audioRef.current || !audioUrl) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!isSupported) return null

  // No recording, no audio — just show mic button
  if (!isRecording && !audioBlob) {
    return (
      <button
        type="button"
        onClick={startRecording}
        className={`p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors ${className || ''}`}
        title="Nagraj notatkę głosową"
      >
        <Mic size={16} />
      </button>
    )
  }

  // Recording in progress
  if (isRecording) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <button
          type="button"
          onClick={stopRecording}
          className="p-1.5 bg-red-500 text-white rounded-full animate-pulse"
          title="Zatrzymaj nagrywanie"
        >
          <Square size={14} />
        </button>
        <span className="text-xs text-red-600 font-mono font-medium">
          {formatTime(duration)}
        </span>
        <span className="text-xs text-red-500">Nagrywam...</span>
      </div>
    )
  }

  // Audio recorded
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className || ''}`}>
      <audio
        ref={audioRef}
        src={audioUrl!}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <button
        type="button"
        onClick={togglePlay}
        className="p-1.5 bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
        title={isPlaying ? 'Pauza' : 'Odtwórz'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <span className="text-xs text-gray-500 font-mono">{formatTime(duration)}</span>

      <button
        type="button"
        onClick={handleTranscribe}
        className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 font-medium transition-colors"
      >
        Transkrybuj
      </button>

      <button
        type="button"
        onClick={handleDiscard}
        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
        title="Usuń nagranie"
      >
        <Trash2 size={14} />
      </button>

      <button
        type="button"
        onClick={startRecording}
        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
        title="Nagraj ponownie"
      >
        <Mic size={14} />
      </button>
    </div>
  )
}
