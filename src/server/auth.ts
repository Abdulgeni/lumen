import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { env } from "../env";
import { removeStripeCustomer } from "./billing/cleanup";
import { db } from "./db";
import {
  sendAccountDeletionEmail,
  sendAccountExistsEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email";

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      sendPasswordResetEmail({ to: user.email, url });
    },
    onExistingUserSignUp: async ({ user }) => {
      sendAccountExistsEmail({ to: user.email });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      sendVerificationEmail({ to: user.email, url });
    },
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        sendAccountDeletionEmail({ to: user.email, url });
      },
      beforeDelete: async (user) => {
        await removeStripeCustomer(user.id);
      },
    },
  },

  rateLimit: {
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
      "/send-verification-email": { window: 300, max: 3 },
      "/delete-user": { window: 300, max: 3 },
    },
  },

  advanced: {
    // Vercel sets x-real-ip itself, so clients cannot spoof it.
    ipAddress: { ipAddressHeaders: ["x-real-ip"] },
  },

  plugins: [nextCookies()], // must be last
});
