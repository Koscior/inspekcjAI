// supabase/functions/send-report-email/index.ts
// Edge Function: wysyłka raportu PDF emailem przez Resend API

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  if (!RESEND_API_KEY) {
    return jsonResponse({ error: 'Email service not configured. Set RESEND_API_KEY in Supabase secrets.' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')

  let userId: string
  try {
    const base64Payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64Payload))
    userId = payload.sub
    if (!userId) throw new Error('brak sub w tokenie')
  } catch {
    return jsonResponse({ error: 'Invalid token payload' }, 401)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let body: { reportId: string; recipientEmail: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const { reportId, recipientEmail, message } = body

  if (!reportId || !recipientEmail) {
    return jsonResponse({ error: 'Missing required fields: reportId, recipientEmail' }, 400)
  }

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select(`*, inspections ( title, address, type, inspection_date, clients ( full_name, email ) )`)
    .eq('id', reportId)
    .single()

  if (reportError || !report) {
    return jsonResponse({ error: 'Report not found' }, 404)
  }

  const { data: inspection } = await supabase
    .from('inspections')
    .select('user_id')
    .eq('id', report.inspection_id)
    .single()

  if (inspection?.user_id !== userId) {
    return jsonResponse({ error: 'Forbidden' }, 403)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company_name, phone, email, license_number')
    .eq('id', userId)
    .single()

  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('report-pdfs')
    .createSignedUrl(report.pdf_path, 7 * 24 * 60 * 60)

  if (urlError || !signedUrlData?.signedUrl) {
    return jsonResponse({ error: 'Failed to generate download URL for PDF' }, 500)
  }

  const inspectionData = report.inspections as {
    title: string
    address: string
    type: string
    inspection_date: string | null
    clients: { full_name: string; email: string | null } | null
  } | null

  const inspectorName = profile?.full_name || 'Inspektor'
  const companyName = profile?.company_name || ''
  const inspectionTitle = inspectionData?.title || 'Inspekcja'
  const inspectionAddress = inspectionData?.address || ''
  const reportTypeLabel = REPORT_TYPE_LABELS[report.report_type as string] || report.report_type

  // Zbuduj HTML emaila
  const emailHtml = buildEmailHtml({
    inspectionTitle,
    inspectionAddress,
    reportTypeLabel,
    reportNumber: report.report_number,
    inspectorName,
    companyName,
    phone: profile?.phone || null,
    licenseNumber: profile?.license_number || null,
    downloadUrl: signedUrlData.signedUrl,
    customMessage: message || null,
  })

  // Wyślij email przez Resend
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'InspekcjAI <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `Raport inspekcji: ${inspectionTitle}`,
      html: emailHtml,
    }),
  })

  if (!resendRes.ok) {
    const errBody = await resendRes.text()
    console.error('Resend error:', resendRes.status, errBody)
    return jsonResponse({ error: `Email sending failed (${resendRes.status})` }, 500)
  }

  // Zaktualizuj rekord raportu — zapisz datę i odbiorcę
  await supabase
    .from('reports')
    .update({
      sent_at: new Date().toISOString(),
      recipient_email: recipientEmail,
    })
    .eq('id', reportId)

  // Zaktualizuj status inspekcji → sent
  await supabase
    .from('inspections')
    .update({ status: 'sent' })
    .eq('id', report.inspection_id)

  console.log(`Report ${reportId} sent to ${recipientEmail} by user ${userId}`)

  return jsonResponse({ success: true })
})

// ─── Email template ──────────────────────────────────────────────────────────

const REPORT_TYPE_LABELS: Record<string, string> = {
  techniczny: 'Raport Techniczny',
  zadania: 'Raport Zadań',
  protokol: 'Protokół Przeglądu',
}

function buildEmailHtml(opts: {
  inspectionTitle: string
  inspectionAddress: string
  reportTypeLabel: string
  reportNumber: string
  inspectorName: string
  companyName: string
  phone: string | null
  licenseNumber: string | null
  downloadUrl: string
  customMessage: string | null
}): string {
  const {
    inspectionTitle, inspectionAddress, reportTypeLabel, reportNumber,
    inspectorName, companyName, phone, licenseNumber, downloadUrl, customMessage,
  } = opts

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Raport inspekcji</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">InspekcjAI</span>
                  </td>
                  <td align="right">
                    <span style="color:#bfdbfe;font-size:13px;">${reportTypeLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 4px 0;color:#6b7280;font-size:13px;">Numer raportu</p>
              <p style="margin:0 0 20px 0;color:#111827;font-size:15px;font-weight:600;">${reportNumber}</p>

              <p style="margin:0 0 4px 0;color:#6b7280;font-size:13px;">Obiekt</p>
              <p style="margin:0 0 4px 0;color:#111827;font-size:16px;font-weight:700;">${inspectionTitle}</p>
              <p style="margin:0 0 24px 0;color:#6b7280;font-size:14px;">${inspectionAddress}</p>

              ${customMessage ? `
              <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;color:#0c4a6e;font-size:14px;line-height:1.6;">${customMessage.replace(/\n/g, '<br>')}</p>
              </div>
              ` : ''}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f3f4f6;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 4px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Inspektor</p>
                    <p style="margin:0 0 2px 0;color:#111827;font-size:14px;font-weight:600;">${inspectorName}</p>
                    ${companyName ? `<p style="margin:0 0 2px 0;color:#6b7280;font-size:13px;">${companyName}</p>` : ''}
                    ${licenseNumber ? `<p style="margin:0 0 2px 0;color:#6b7280;font-size:13px;">Uprawnienia: ${licenseNumber}</p>` : ''}
                    ${phone ? `<p style="margin:0;color:#6b7280;font-size:13px;">Tel: ${phone}</p>` : ''}
                  </td>
                </tr>
              </table>

              <a href="${downloadUrl}" target="_blank"
                 style="display:block;text-align:center;background:#2563eb;color:#ffffff;text-decoration:none;
                        padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600;">
                Pobierz raport PDF
              </a>

              <p style="margin:16px 0 0 0;text-align:center;color:#9ca3af;font-size:12px;">
                Link jest aktywny przez 7 dni
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Wygenerowano przez <strong>InspekcjAI</strong> — profesjonalne inspekcje budowlane
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
