import { getDictionary, Language } from '../i18n';

type FirebaseLikeError = {
  code?: string;
  message?: string;
};

function getCurrentDictionary() {
  if (typeof window === 'undefined') return getDictionary('de');
  const stored = window.localStorage.getItem('ui-language') as Language | null;
  const language: Language = stored === 'en' || stored === 'de' || stored === 'zh' || stored === 'ja' || stored === 'fr' ? stored : 'de';
  return getDictionary(language);
}

export function mapFirebaseAuthError(error: unknown): string {
  const t = getCurrentDictionary();
  const err = error as FirebaseLikeError | null | undefined;
  const code = err?.code ?? '';

  switch (code) {
    case 'auth/invalid-credential':
      return t.authErrors.invalidCredential;
    case 'auth/wrong-password':
      return t.authErrors.wrongPassword;
    case 'auth/user-not-found':
      return t.authErrors.userNotFound;
    case 'auth/email-already-in-use':
      return t.authErrors.emailAlreadyInUse;
    case 'auth/weak-password':
      return t.authErrors.weakPassword;
    case 'auth/invalid-email':
      return t.authErrors.invalidEmail;
    case 'auth/too-many-requests':
      return t.authErrors.tooManyRequests;
    case 'auth/network-request-failed':
      return t.authErrors.networkError;
    case 'auth/requires-recent-login':
    case 'auth/credential-too-old-login-again':
      return t.authErrors.requiresRecentLogin;
    default:
      return err?.message || t.authErrors.generic;
  }
}