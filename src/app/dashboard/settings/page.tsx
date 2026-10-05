import type { Metadata } from "next";
import { DeleteAccount } from "@/components/settings/delete-account";
import { PasswordForm } from "@/components/settings/password-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { SettingsSection } from "@/components/settings/section";
import { toLanguageCode } from "@/lib/summary-options";
import { db } from "@/server/db";
import { getEntitlement } from "@/server/entitlements";
import { getPreferences } from "@/server/preferences";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const { user } = await requireSession();
  const [prefs, credential, entitlement] = await Promise.all([
    getPreferences(user.id),
    db.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    }),
    getEntitlement(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="font-display text-4xl font-light tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Your profile, defaults, and security.</p>
      </header>

      <SettingsSection title="Profile" description="How your name appears in Lumen.">
        <ProfileForm name={user.name} email={user.email} />
      </SettingsSection>

      <SettingsSection
        title="Summary defaults"
        description="Pre-selected whenever you start a new summary."
      >
        <PreferencesForm
          initial={{
            defaultMode: prefs.defaultMode,
            defaultLength: prefs.defaultLength,
            defaultTone: prefs.defaultTone,
            outputLanguage: toLanguageCode(prefs.outputLanguage),
          }}
        />
      </SettingsSection>

      <SettingsSection title="Password" description="Changing it signs out your other devices.">
        {credential ? (
          <PasswordForm />
        ) : (
          <p className="text-sm text-muted-foreground">
            You sign in with Google, so there is no password to change here.
          </p>
        )}
      </SettingsSection>

      <SettingsSection
        danger
        title="Delete account"
        description="Permanently remove your account, summaries, and subscription."
      >
        <DeleteAccount hasSubscription={entitlement.planId !== "free"} />
      </SettingsSection>
    </div>
  );
}
