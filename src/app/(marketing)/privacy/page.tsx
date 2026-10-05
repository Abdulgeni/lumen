import type { Metadata } from "next";
import { LegalPage, LegalSection, SupportLink } from "@/components/marketing/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Lumen collects, why, who processes it, and how you can control it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <LegalSection title="Who we are">
        <p>
          Lumen is operated by <strong>{LEGAL.operatorName}</strong> ({LEGAL.operatorCountry}). For
          any privacy question or request, contact <SupportLink />.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <ul>
          <li>
            <strong>Account details:</strong> your name and email address. If you sign in with a
            password we store only a salted hash of it. If you sign in with Google we receive your
            name and email from Google.
          </li>
          <li>
            <strong>Content you submit:</strong> the text, web links, and files you ask us to
            summarize. We save the resulting summary, its settings, and a short excerpt (up to 500
            characters) of the source. We do not keep your full original text or uploaded files.
          </li>
          <li>
            <strong>Usage data:</strong> how many summaries you create in each billing period and
            how much text the AI processed, so we can enforce plan limits.
          </li>
          <li>
            <strong>Billing data:</strong> payments are handled by Stripe. We store your Stripe
            customer reference, plan, subscription status, and billing dates. We never see or store
            your card number.
          </li>
          <li>
            <strong>Technical data:</strong> your IP address and browser details are recorded with
            your sign-in session and are used to limit abuse. Our hosting provider also keeps
            standard request logs.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          To provide the service, keep it secure, enforce limits, process payments, and send
          messages you need, such as email verification, password reset, and account deletion
          confirmation. We do not send marketing email, and we do not sell your data.
        </p>
      </LegalSection>

      <LegalSection title="Who processes your data">
        <p>
          We use these providers to run Lumen. They process data only to provide their service to
          us.
        </p>
        <ul>
          <li>Google (Gemini API): generates summaries from the content you submit.</li>
          <li>Vercel: hosts the application.</li>
          <li>Neon: hosts our database, in the European Union (Frankfurt).</li>
          <li>Upstash: stores short-lived rate-limit counters linked to your account.</li>
          <li>Resend: delivers our transactional email.</li>
          <li>Stripe: processes payments and manages subscriptions.</li>
        </ul>
        <p>
          Some of these providers may process data outside your country, including in the United
          States.
        </p>
      </LegalSection>

      <LegalSection title="AI processing">
        <p>
          To create a summary, the content you submit is sent to Google&rsquo;s Gemini API. AI can
          make mistakes, so check important details against the original. {LEGAL.aiProviderNote}
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <ul>
          <li>Summaries are kept until you delete them or delete your account.</li>
          <li>Failed or cancelled attempts are deleted within about a week.</li>
          <li>Expired sessions and verification tokens are removed automatically.</li>
          <li>
            When you delete your account we delete your profile, summaries, and usage data, and
            cancel your subscription. Stripe keeps payment records as the law requires.
          </li>
          <li>
            Backups held by our database provider are overwritten on that provider&rsquo;s normal
            schedule.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <p>
          You can delete any summary, change your name and defaults, and delete your account from
          Settings. You may also ask us to access, correct, export, or delete your personal data, or
          object to how we use it, by contacting <SupportLink />. Depending on where you live, you
          may also have the right to complain to your data protection authority.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We use one essential cookie to keep you signed in. We do not use advertising or analytics
          cookies.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Data is encrypted in transit, passwords are hashed, access to your content is restricted
          to your account, and we limit and monitor abuse. No system is perfectly secure, so please
          use a strong, unique password.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Lumen is not intended for anyone under 16, and we do not knowingly collect their data.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy. If the changes are significant we will tell you in the app or
          by email before they take effect.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
