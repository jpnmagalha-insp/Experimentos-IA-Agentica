import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const appUrl = process.env.APP_URL ?? 'http://localhost:8081'
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'no-reply@nutriia.app',
    to,
    subject: 'Redefinição de senha — Nutri IA',
    html: `
      <p>Você solicitou a redefinição de senha da sua conta Nutri IA.</p>
      <p><a href="${resetUrl}">Clique aqui para redefinir sua senha</a></p>
      <p>O link expira em 1 hora. Se você não solicitou isso, ignore este e-mail.</p>
    `,
  })
}
