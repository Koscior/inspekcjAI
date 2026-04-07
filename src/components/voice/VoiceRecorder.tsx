import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, Loader2, Wand2 } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useTranscribeAudio, useProfessionalizeText } from '@/hooks/useVoiceNotes'

interface VoiceRecorderProps {
  inspectionId?: string
  defectId?: string
  onTranscription: (text: string) => void
  context?: string
  className?: string
}

type State = 'idle' | 'recording' | 'transcribing' | 'professionalizing' | 'can_professionalize'

const SpeechRecognitionCtor =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined

const hasSpeechRecognition = !!SpeechRecognitionCtor

export function VoiceRecorder({
  onTranscription,
  context,
  className,
}: VoiceRecorderProps) {
  const addToast = useUiStore((s) => s.addToast)

  const [state, setState] = useState<State>('idle')
  const [duration, setDuration] = useState(0)
  const [lastRawText, setLastRawText] = useState('')
  const [interimText, setInterimText] = useState('')

  // Refs for Web Speech API
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const manualStopRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Refs for MediaRecorder fallback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const transcribeAudio = useTranscribeAudio()
  const professionalizeText = useProfessionalizeText()

  const isSupported =
    hasSpeechRecognition ||
    (typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) {
        manualStopRef.current = true
        recognitionRef.current.abort()
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  // ─── Timer helpers ──────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    setDuration(0)
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // ─── Web Speech API path ───────────────────────────────────────────────────

  const startSpeechRecognition = useCallback(() => {
    if (!SpeechRecognitionCtor) return

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'pl-PL'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    finalTranscriptRef.current = ''
    manualStopRef.current = false
    setInterimText('')

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalPart = ''
      let interimPart = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalPart += result[0].transcript
        } else {
          interimPart += result[0].transcript
        }
      }

      finalTranscriptRef.current = finalPart
      setInterimText(interimPart)

      // Update form field in real-time
      const fullText = (finalPart + ' ' + interimPart).trim()
      if (fullText) {
        onTranscription(fullText)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        // Silence — ignore, recognition will restart via onend
        return
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        addToast({ type: 'error', message: 'Brak dostępu do mikrofonu' })
        stopTimer()
        setState('idle')
        return
      }
      if (event.error === 'aborted') {
        // Manual abort — handled in onend
        return
      }
      addToast({ type: 'error', message: `Błąd rozpoznawania mowy: ${event.error}` })
      stopTimer()
      setState('idle')
    }

    recognition.onend = () => {
      if (manualStopRef.current) {
        // User stopped — finalize
        const finalText = finalTranscriptRef.current.trim()
        if (finalText) {
          setLastRawText(finalText)
          onTranscription(finalText)
          setState('can_professionalize')
        } else {
          setState('idle')
        }
        setInterimText('')
        return
      }

      // Chrome auto-stopped (silence/timeout) — restart if still recording
      try {
        recognition.start()
      } catch {
        // Already stopped or error — finalize
        const finalText = finalTranscriptRef.current.trim()
        if (finalText) {
          setLastRawText(finalText)
          onTranscription(finalText)
          setState('can_professionalize')
        } else {
          setState('idle')
        }
        setInterimText('')
        stopTimer()
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      setState('recording')
      startTimer()
    } catch {
      addToast({ type: 'error', message: 'Nie udało się uruchomić rozpoznawania mowy' })
    }
  }, [onTranscription, addToast, startTimer, stopTimer])

  const stopSpeechRecognition = useCallback(() => {
    stopTimer()
    manualStopRef.current = true
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [stopTimer])

  // ─── MediaRecorder fallback path (for Firefox etc.) ────────────────────────

  const handleFallbackComplete = useCallback(
    async (blob: Blob) => {
      setState('transcribing')
      try {
        const raw = await transcribeAudio.mutateAsync({ audioBlob: blob })
        setLastRawText(raw)
        onTranscription(raw)
        setState('can_professionalize')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Błąd transkrypcji'
        addToast({ type: 'error', message: msg })
        setState('idle')
      }
    },
    [transcribeAudio, onTranscription, addToast],
  )

  const startFallbackRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        handleFallbackComplete(blob)
      }

      recorder.start()
      setState('recording')
      startTimer()
      setLastRawText('')
    } catch {
      addToast({ type: 'error', message: 'Brak dostępu do mikrofonu' })
    }
  }, [addToast, handleFallbackComplete, startTimer])

  const stopFallbackRecording = useCallback(() => {
    stopTimer()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [stopTimer])

  // ─── Unified start/stop ────────────────────────────────────────────────────

  const startRecording = hasSpeechRecognition ? startSpeechRecognition : startFallbackRecording
  const stopRecording = hasSpeechRecognition ? stopSpeechRecognition : stopFallbackRecording

  // ─── Professionalize ──────────────────────────────────────────────────────

  const handleProfessionalize = useCallback(async () => {
    if (!lastRawText) return
    setState('professionalizing')
    try {
      const professional = await professionalizeText.mutateAsync({
        text: lastRawText,
        context: context || 'opis usterki lub uwagi z inspekcji budowlanej',
      })
      onTranscription(professional)
      addToast({ type: 'success', message: 'Tekst profesjonalny wstawiony' })
      setState('idle')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Błąd AI'
      addToast({ type: 'error', message: msg })
      setState('can_professionalize')
    }
  }, [lastRawText, professionalizeText, context, onTranscription, addToast])

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!isSupported) return null

  // ─── Idle ─────────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={startRecording}
        className={`p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors ${className || ''}`}
        title="Dyktuj tekst"
      >
        <Mic size={16} />
      </button>
    )
  }

  // ─── Recording ────────────────────────────────────────────────────────────
  if (state === 'recording') {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <button
          type="button"
          onClick={stopRecording}
          className="p-1.5 bg-red-500 text-white rounded-full animate-pulse"
          title="Zatrzymaj i transkrybuj"
        >
          <Square size={14} />
        </button>
        <span className="text-xs text-red-600 font-mono font-medium">
          {formatTime(duration)}
        </span>
        {hasSpeechRecognition && interimText ? (
          <span className="text-xs text-gray-400 italic truncate max-w-[200px]">
            {interimText}
          </span>
        ) : (
          <span className="text-xs text-red-500">Nagrywam...</span>
        )}
      </div>
    )
  }

  // ─── Transcribing (fallback only) ─────────────────────────────────────────
  if (state === 'transcribing') {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <Loader2 size={16} className="text-purple-600 animate-spin" />
        <span className="text-xs text-purple-600 font-medium">Transkrybuję...</span>
      </div>
    )
  }

  // ─── Professionalizing ────────────────────────────────────────────────────
  if (state === 'professionalizing') {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <Loader2 size={16} className="text-purple-600 animate-spin" />
        <span className="text-xs text-purple-600 font-medium">AI profesjonalizuje...</span>
      </div>
    )
  }

  // ─── Can professionalize ──────────────────────────────────────────────────
  if (state === 'can_professionalize') {
    return (
      <div className={`flex items-center gap-1 ${className || ''}`}>
        <button
          type="button"
          onClick={startRecording}
          className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title="Dyktuj ponownie"
        >
          <Mic size={16} />
        </button>
        <button
          type="button"
          onClick={handleProfessionalize}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100 font-medium transition-colors"
          title="Zamień na profesjonalny tekst budowlany"
        >
          <Wand2 size={12} />
          Profesjonalizuj
        </button>
      </div>
    )
  }

  return null
}
