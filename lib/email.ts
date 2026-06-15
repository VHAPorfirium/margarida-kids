/**
 * Envio de e-mails via Resend.
 * Instale: npm install resend
 * Configure RESEND_API_KEY e EMAIL_FROM no .env.local
 */

const FROM = process.env.EMAIL_FROM ?? "Margarida Kids <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// ── Template base ────────────────────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Margarida Kids</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:'Nunito',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF9;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#F9A8D4 0%,#F472B6 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🌸</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">Margarida Kids</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Moda infantil com amor</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F5F5F4;padding:20px 40px;text-align:center;border-top:1px solid #EDE8EA;">
            <p style="margin:0;font-size:11px;color:#A8A29E;line-height:1.6;">
              Margarida Kids — Moda Infantil<br/>
              Você recebeu este e-mail porque possui cadastro em nossa loja.<br/>
              <a href="${APP_URL}" style="color:#F472B6;text-decoration:none;">Visitar a loja</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Template: boas-vindas ────────────────────────────────────────────────────
function boasVindasHtml(nome: string): string {
  const primeiroNome = nome.split(" ")[0]
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1C1917;">
      Olá, ${primeiroNome}! 👋
    </h2>
    <p style="margin:0 0 20px;color:#78716C;font-size:15px;line-height:1.6;">
      Seja muito bem-vinda à <strong style="color:#F472B6;">Margarida Kids</strong>! 
      Que alegria ter você aqui! 🌸
    </p>
    <p style="margin:0 0 20px;color:#78716C;font-size:14px;line-height:1.7;">
      Aqui você encontra roupinhas lindas e com muito carinho para os pequenos. 
      Trabalhamos com peças de qualidade para todas as faixas etárias, 
      desde bebê até juvenil.
    </p>
    <div style="background:#FDF2F8;border:1px solid #F9A8D4;border-radius:12px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 12px;font-weight:800;color:#1C1917;font-size:14px;">Com sua conta você pode:</p>
      <ul style="margin:0;padding:0 0 0 18px;color:#78716C;font-size:13px;line-height:2;">
        <li>Acompanhar seus pedidos em tempo real</li>
        <li>Ver o histórico de compras completo</li>
        <li>Receber atualizações sobre seus pedidos</li>
      </ul>
    </div>
    <div style="text-align:center;margin:28px 0 4px;">
      <a href="${APP_URL}/catalago"
         style="display:inline-block;background:#F472B6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;letter-spacing:-0.2px;">
        Ver o catálogo 🛍️
      </a>
    </div>
    <p style="margin:24px 0 0;text-align:center;color:#A8A29E;font-size:13px;">
      Qualquer dúvida, entre em contato pelo WhatsApp. Estamos aqui! 💕
    </p>
  `)
}

// ── Template: redefinição de senha ──────────────────────────────────────────
function resetSenhaHtml(nome: string, link: string): string {
  const primeiroNome = nome.split(" ")[0]
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1C1917;">
      Redefinir senha 🔑
    </h2>
    <p style="margin:0 0 20px;color:#78716C;font-size:15px;line-height:1.6;">
      Olá, <strong>${primeiroNome}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>
    <p style="margin:0 0 24px;color:#78716C;font-size:14px;line-height:1.7;">
      Clique no botão abaixo para criar uma nova senha. 
      Este link é válido por <strong style="color:#1C1917;">30 minutos</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}"
         style="display:inline-block;background:#1C1917;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;">
        Redefinir minha senha
      </a>
    </div>
    <div style="background:#FEF9C3;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin:24px 0;">
      <p style="margin:0;color:#92400E;font-size:12px;line-height:1.6;">
        ⚠️ Se você não solicitou a redefinição de senha, ignore este e-mail. 
        Sua senha continuará a mesma e nenhuma alteração será feita.
      </p>
    </div>
    <p style="margin:16px 0 0;color:#A8A29E;font-size:12px;line-height:1.6;">
      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br/>
      <a href="${link}" style="color:#F472B6;word-break:break-all;font-size:11px;">${link}</a>
    </p>
  `)
}

// ── Função de envio ──────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === "re_your_api_key_here") {
    // Em desenvolvimento sem chave configurada: apenas loga
    console.log(`[EMAIL DEV] Para: ${to} | Assunto: ${subject}`)
    console.log(`[EMAIL DEV] HTML omitido - configure RESEND_API_KEY para enviar de verdade`)
    return { ok: true, dev: true }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[EMAIL] Erro ao enviar:", err)
    return { ok: false, error: err }
  }

  return { ok: true }
}

// ── Exports públicos ─────────────────────────────────────────────────────────
export async function enviarBoasVindas(nome: string, email: string) {
  return sendEmail({
    to: email,
    subject: "Bem-vinda à Margarida Kids! 🌸",
    html: boasVindasHtml(nome),
  })
}

export async function enviarResetSenha(nome: string, email: string, token: string) {
  const link = `${APP_URL}/redefinir-senha?token=${token}`
  return sendEmail({
    to: email,
    subject: "Redefinir senha — Margarida Kids",
    html: resetSenhaHtml(nome, link),
  })
}
