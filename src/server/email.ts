import { after } from "next/server";
import { Resend } from "resend";
import { env } from "../env";

let client: Resend | undefined;
const getClient = () => (client ??= new Resend(env.RESEND_API_KEY));

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

type Template = {
  subject: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  footnote: string;
};

function render({ subject, heading, paragraphs, cta, footnote }: Template) {
  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#A8A398;">${escapeHtml(p)}</p>`,
    )
    .join("");
  const button = cta
    ? `<p style="margin:28px 0;"><a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:13px 28px;border-radius:12px;background:#C8A96A;color:#0A0A0B;font-weight:600;font-size:15px;text-decoration:none;">${escapeHtml(cta.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0A0A0B;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0B;padding:40px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111114;border:1px solid #26262b;border-radius:16px;padding:40px;font-family:Inter,Arial,sans-serif;"><tr><td><p style="margin:0 0 28px;font-family:Georgia,serif;font-size:22px;letter-spacing:0.3em;text-transform:uppercase;color:#C8A96A;">Lumen</p><h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#F5F1E8;">${escapeHtml(heading)}</h1>${body}${button}<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6f6b62;">${escapeHtml(footnote)}</p></td></tr></table></td></tr></table></body></html>`;
  const text = [
    heading,
    "",
    ...paragraphs,
    ...(cta ? ["", `${cta.label}: ${cta.url}`] : []),
    "",
    footnote,
  ].join("\n");
  return { subject, html, text };
}

async function deliver(to: string, template: Template) {
  const { subject, html, text } = render(template);
  const { error } = await getClient().emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
  // Never log the recipient address.
  if (error) console.error("[email] delivery failed:", error.name, error.message);
}

/** Runs after the response is sent, so the request is not slowed and cannot leak timing. */
function inBackground(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    void task();
  }
}

export function sendVerificationEmail({ to, url }: { to: string; url: string }) {
  inBackground(() =>
    deliver(to, {
      subject: "Verify your email for Lumen",
      heading: "Confirm your email",
      paragraphs: [
        "Welcome to Lumen. Confirm your email address to finish creating your account.",
        "This link expires in 24 hours.",
      ],
      cta: { label: "Confirm email", url },
      footnote: "If you did not create a Lumen account, you can safely ignore this email.",
    }),
  );
}

export function sendPasswordResetEmail({ to, url }: { to: string; url: string }) {
  inBackground(() =>
    deliver(to, {
      subject: "Reset your Lumen password",
      heading: "Reset your password",
      paragraphs: ["We received a request to reset your password. This link expires in 1 hour."],
      cta: { label: "Choose a new password", url },
      footnote: "If you did not request this, ignore this email. Your password will not change.",
    }),
  );
}

export function sendAccountExistsEmail({ to }: { to: string }) {
  inBackground(() =>
    deliver(to, {
      subject: "Someone tried to sign up with your email",
      heading: "You already have an account",
      paragraphs: [
        "Someone tried to create a Lumen account with this email address. If it was you, sign in or reset your password instead.",
      ],
      cta: { label: "Go to sign in", url: `${env.NEXT_PUBLIC_APP_URL}/sign-in` },
      footnote: "If this was not you, no action is needed.",
    }),
  );
}
