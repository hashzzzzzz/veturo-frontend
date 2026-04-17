import nodemailer from "nodemailer";

function getClientUrl() {
  return (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
}

function getServerUrl() {
  return (process.env.SERVER_URL || "http://localhost:5000").replace(/\/$/, "");
}

function getEmailFromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.GMAIL_USER) return `Veturo <${process.env.GMAIL_USER}>`;
  if (process.env.EMAIL_USER) return `Veturo <${process.env.EMAIL_USER}>`;

  return "Veturo <noreply@example.com>";
}

function createTransporter() {
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const gmailAppPassword =
    process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  if (!gmailUser || !gmailAppPassword) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

function buildVerificationHtml(name, verifyUrl) {
  const firstName = name?.trim()?.split(/\s+/)?.[0] || "there";

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f4f5;padding:28px;color:#18181b;">
      <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:22px;padding:28px;box-shadow:0 18px 50px rgba(0,0,0,.12);">
        <h1 style="margin:0 0 12px;font-size:26px;">Verify your Veturo account</h1>
        <p style="margin:0 0 22px;line-height:1.55;color:#52525b;">Hi ${firstName}, thanks for signing up for Veturo. Click the button below to verify your email and finish setting up your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 22px;font-weight:700;">Verify email</a>
        <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#71717a;">This link expires in 30 minutes and can only be used once.</p>
        <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#71717a;">If the button does not work, paste this link in your browser:<br>${verifyUrl}</p>
      </div>
    </div>
  `;
}

function buildPasswordResetHtml(name, resetUrl) {
  const firstName = name?.trim()?.split(/\s+/)?.[0] || "there";

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f4f5;padding:28px;color:#18181b;">
      <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:22px;padding:28px;box-shadow:0 18px 50px rgba(0,0,0,.12);">
        <h1 style="margin:0 0 12px;font-size:26px;">Reset your Veturo password</h1>
        <p style="margin:0 0 22px;line-height:1.55;color:#52525b;">Hi ${firstName}, use this link to set a new password. It expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 22px;font-weight:700;">Set new password</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#71717a;">If the button does not work, paste this link in your browser:<br>${resetUrl}</p>
      </div>
    </div>
  `;
}

export function getEmailVerificationUrl(token) {
  return `${getClientUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export function getPasswordResetUrl(token) {
  return `${getClientUrl()}/reset-password/${token}`;
}

export function getApiBaseUrl() {
  return getServerUrl();
}

export async function sendVerificationEmail({ to, name, verifyUrl }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("Email verification link:", verifyUrl);
    return {
      sent: false,
      reason: "GMAIL_USER or GMAIL_APP_PASSWORD is not configured.",
    };
  }

  await transporter.sendMail({
    from: getEmailFromAddress(),
    to,
    subject: "Verify your Veturo account",
    html: buildVerificationHtml(name, verifyUrl),
    text: [
      "Verify your Veturo account",
      "",
      `Hi ${name?.trim()?.split(/\s+/)?.[0] || "there"},`,
      "Thanks for signing up for Veturo. Use the link below to verify your email.",
      "",
      verifyUrl,
      "",
      "This link expires in 30 minutes and can only be used once.",
    ].join("\n"),
  });

  return { sent: true };
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("Password reset link:", resetUrl);
    return {
      sent: false,
      reason: "GMAIL_USER or GMAIL_APP_PASSWORD is not configured.",
    };
  }

  await transporter.sendMail({
    from: getEmailFromAddress(),
    to,
    subject: "Reset your Veturo password",
    html: buildPasswordResetHtml(name, resetUrl),
    text: `Reset your Veturo password: ${resetUrl}`,
  });

  return { sent: true };
}
