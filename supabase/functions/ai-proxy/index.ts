// supabase/functions/ai-proxy/index.ts
// Edge Function: AI Proxy for OpenAI (Whisper transcription + GPT-4o text professionalization)
// Keeps the OPENAI_API_KEY secure server-side — never exposed to the frontend.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // Verify API key is configured
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in Edge Function secrets')
    return jsonResponse({ error: 'AI service not configured. Please set OPENAI_API_KEY in Supabase secrets.' }, 500)
  }

  // Verify user is authenticated via Supabase JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized — missing or invalid token' }, 401)
  }

  // Determine action from URL path or body
  const url = new URL(req.url)
  const pathAction = url.pathname.split('/').pop() // "transcribe" or "professionalize"
  const contentType = req.headers.get('content-type') || ''

  try {
    // For multipart/form-data (transcribe), read action from form field or path
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const bodyAction = formData.get('action')?.toString()
      const action = bodyAction || pathAction

      if (action === 'transcribe') {
        return await handleTranscribe(formData)
      }
      return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }

    // For JSON body (professionalize), read action from body or path
    const body = await req.json()
    const action = body.action || pathAction

    switch (action) {
      case 'professionalize':
        return await handleProfessionalize(body)
      case 'transcribe':
        return jsonResponse({ error: 'Transcribe requires multipart/form-data with audio' }, 400)
      default:
        return jsonResponse({ error: `Unknown action: ${action}. Use "transcribe" or "professionalize"` }, 400)
    }
  } catch (err) {
    console.error('ai-proxy error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: `AI processing failed: ${message}` }, 500)
  }
})

// ─── /transcribe — Whisper STT ───────────────────────────────────────────────

async function handleTranscribe(formData: FormData): Promise<Response> {
  const audioFile = formData.get('audio')
  if (!audioFile || !(audioFile instanceof File || audioFile instanceof Blob)) {
    return jsonResponse({ error: 'Missing "audio" field in form data' }, 400)
  }
  const audioBlob = audioFile as Blob

  // Validate size (max 25 MB — OpenAI limit)
  if (audioBlob.size > 25 * 1024 * 1024) {
    return jsonResponse({ error: 'Audio file too large. Maximum size is 25 MB.' }, 400)
  }

  // Prepare FormData for Whisper API
  const whisperForm = new FormData()
  whisperForm.append('file', audioBlob, 'audio.webm')
  whisperForm.append('model', 'whisper-1')
  whisperForm.append('language', 'pl')
  whisperForm.append('response_format', 'text')

  console.log(`Transcribing audio: ${(audioBlob.size / 1024).toFixed(1)} KB`)

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: whisperForm,
  })

  if (!whisperRes.ok) {
    const errorBody = await whisperRes.text()
    console.error('Whisper API error:', whisperRes.status, errorBody)
    return jsonResponse({
      error: `Transcription failed (${whisperRes.status})`,
      details: errorBody,
    }, whisperRes.status)
  }

  // Whisper with response_format=text returns plain text
  const transcription = (await whisperRes.text()).trim()

  console.log(`Transcription result: ${transcription.length} characters`)

  return jsonResponse({ transcription })
}

// ─── /professionalize — GPT-4o text rewrite ──────────────────────────────────

async function handleProfessionalize(body: { text?: string; context?: string }): Promise<Response> {
  const { text, context } = body

  if (!text || text.trim().length === 0) {
    return jsonResponse({ error: 'Missing "text" field in request body' }, 400)
  }

  if (text.length > 3000) {
    return jsonResponse({ error: 'Tekst zbyt długi (maks. 3000 znaków). Podziel na kilka krótszych wpisów.' }, 400)
  }

  const systemPrompt = `Jesteś narzędziem do przepisywania tekstu dla polskich inspektorów budowlanych.
Twoje jedyne zadanie: zamienić potoczny, nieformalny opis w profesjonalny zapis protokolarny — BEZ dodawania jakichkolwiek informacji spoza oryginału.

═══ ŻELAZNE ZASADY (nigdy nie łam) ═══

ZAKAZ HALUCYNACJI
Nie dodajesz przyczyn, diagnoz, zaleceń ani wymiarów, których NIE MA w tekście źródłowym.
Jeśli inspektor nie wskazał przyczyny — nie wskazujesz jej Ty. Używasz zwrotów opisowych: "o niezidentyfikowanym pochodzeniu", "przyczyna nieustalona".

ZAKAZ SPEKULACJI
Słowa wyrażające domysł ("chyba", "pewnie", "może", "zdaje się", "sądzę") — usuwasz wraz z całą spekulatywną treścią po nich. Jeśli inspektor spekuluje o przyczynie — pomijasz tę spekulację w całości.

TYLKO PRZEPISANY TEKST
Nie poprzedzasz odpowiedzi żadnym komentarzem. Nie dodajesz wyjaśnień po tekście. Odpowiadasz WYŁĄCZNIE przepisanym tekstem i niczym więcej.

NEUTRALIZACJA EMOCJI I SLANGU
Emocje, wulgaryzmy, slang i wartościowania zastępujesz neutralnymi terminami technicznymi. "Strasznie cieknie" → "intensywny wyciek". "Odwalona robota" → opis stanu faktycznego bez oceny wykonawcy.

NIEOKREŚLONE ELEMENTY
Gdy inspektor mówi o czymś niespecyficznie ("to coś", "ta rzecz", "jakaś rura") — używasz ogólnego terminu: "element", "podzespół", "przewód", "detal". Nigdy nie zgadujesz co to jest.

STYL I TERMINOLOGIA
- Formy bezosobowe i strona bierna: "Stwierdzono…", "Zaobserwowano…", "Ujawniono…", "Odnotowano…", "Wykazano…"
- Właściwa terminologia: "zarysowanie" (nie "pęknięcie"), "zawilgocenie przegrody" (nie "mokra ściana"), "korozja powierzchniowa" (nie "rdza"), "nieszczelność" (nie "cieknie"), "deformacja" (nie "wygięcie")
- Zachowaj WSZYSTKIE podane liczby, wymiary i lokalizacje z oryginału

═══ PRZYKŁADY (ucz się wzorca) ═══

ŹRÓDŁO: "No kurde, woda leci z rury pod zlewem, cała szafka mokra i chyba spuchła."
WYNIK: "Stwierdzono nieszczelność instalacji odpływowej pod zlewozmywakiem. Wyciek spowodował zawilgocenie oraz deformację struktury szafki podzlewozmywakowej."

ŹRÓDŁO: "Farba odchodzi płatami przy oknie, chyba od wilgoci, bo ściana jest zimna i mokra."
WYNIK: "Stwierdzono degradację powłoki malarskiej w obrębie otworu okiennego. Odnotowano zawilgocenie oraz obniżoną temperaturę przegrody w miejscu usterki."

ŹRÓDŁO: "Ktoś tu odwalił manianę, kable wystają ze ściany bez żadnego zabezpieczenia, można dostać prądem."
WYNIK: "Ujawniono niezabezpieczone przewody elektryczne wyprowadzone bezpośrednio z przegrody ściennej. Stan instalacji stwarza bezpośrednie zagrożenie porażeniem."

ŹRÓDŁO: "Na suficie jest taka żółta plama, wielkości talerza, pewnie sąsiad z góry go zalał."
WYNIK: "Na powierzchni sufitu widoczne jest punktowe zawilgocenie (wykwit o żółtym zabarwieniu, średnica porównywalna z talerzem)."

ŹRÓDŁO: "Winda dziwnie stuka jak jedzie do góry, strach tym jechać."
WYNIK: "Podczas pracy dźwigu w cyklu podnoszenia odnotowano niepokojące sygnały akustyczne (stuki) o niezidentyfikowanym pochodzeniu."`

  const fieldLabel = context || 'protokół z inspekcji budowlanej'
  const userMessage = `Sekcja dokumentu: ${fieldLabel}\n\n<tekst_źródłowy>\n${text.trim()}\n</tekst_źródłowy>`

  console.log(`Professionalizing text: ${text.length} characters`)

  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  })

  if (!chatRes.ok) {
    const errorBody = await chatRes.text()
    console.error('GPT-4o API error:', chatRes.status, errorBody)
    return jsonResponse({
      error: `Text professionalization failed (${chatRes.status})`,
      details: errorBody,
    }, chatRes.status)
  }

  const chatData = await chatRes.json()
  const professionalText = chatData.choices?.[0]?.message?.content?.trim() ?? ''

  if (!professionalText) {
    return jsonResponse({ error: 'AI returned empty response' }, 500)
  }

  console.log(`Professional text: ${professionalText.length} characters`)

  return jsonResponse({
    professional_text: professionalText,
    usage: chatData.usage, // token count for monitoring
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
