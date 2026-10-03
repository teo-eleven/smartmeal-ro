import { useState } from 'react';
import { cloudSyncService } from '../../services/supabase';
import { SignUpConsent as Consent } from '../../types';
import { describeWeakPassword } from '../../utils/passwordPolicy';
import { describeMissingConsent } from '../../utils/signUpConsent';

const NO_CONSENT: Consent = { isAtLeast16: false, healthDataConsent: false };
/** Long enough to read "Te-ai conectat", short enough not to wait for it. */
const CLOSE_AFTER_MS = 800;

export type AuthMode = 'signin' | 'signup';
export type ResetStep = 'off' | 'email' | 'code' | 'password';

interface AuthFormOptions {
  /** A session now exists for this address (or null after signing out). */
  onUserChanged: (email: string | null) => void;
  /** Called a moment after a successful sign-in, so the success message can be read. */
  onSignedIn: () => void;
}

/**
 * The state and actions of the sign-in forms: password sign-in, a new account, and the
 * password reset. Shared by the account window and the full-screen login, so both validate
 * and report the same way.
 */
export function useAuthForm({ onUserChanged, onSignedIn }: AuthFormOptions) {
  const [mode, setMode] = useState<AuthMode>('signin');
  // The reset runs as its own little machine: ask for the address, take the emailed code,
  // then set the password. Each step only unlocks once the one before it succeeded.
  const [resetStep, setResetStep] = useState<ResetStep>('off');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState<Consent>(NO_CONSENT);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Once someone is signed in, nothing they typed stays behind. The form used to keep the
  // password and the ticked consent boxes, and signing out showed them again, ready for
  // whoever used the phone next.
  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConsent(NO_CONSENT);
    setMode('signin');
  };

  // Any edit clears the last error. One left on screen after the person has fixed the field
  // it was about reads as a second, new error.
  const editEmail = (value: string) => {
    setErrorMessage(null);
    setEmail(value);
  };
  const editPassword = (value: string) => {
    setErrorMessage(null);
    setPassword(value);
  };
  const editConsent = (value: Consent) => {
    setErrorMessage(null);
    setConsent(value);
  };

  const finishSignIn = (signedInEmail: string, message: string) => {
    onUserChanged(signedInEmail);
    clearForm();
    setSuccessMessage(message);
    // Closed a moment later. Left open, the window came back on its own over the plan once
    // the main screen mounted.
    setTimeout(onSignedIn, CLOSE_AFTER_MS);
  };

  const signIn = async () => {
    const { user, error } = await cloudSyncService.signInWithEmail(email.trim(), password);
    if (error) {
      setErrorMessage(error);
      return;
    }
    finishSignIn(user?.email || email.trim(), 'Te-ai conectat cu succes!');
  };

  const signUp = async () => {
    const weak = describeWeakPassword(password);
    if (weak) {
      setErrorMessage(weak);
      return;
    }
    const missing = describeMissingConsent(consent);
    if (missing) {
      setErrorMessage(missing);
      return;
    }
    const { user, error, needsConfirmation } = await cloudSyncService.signUpWithEmail(
      email.trim(),
      password,
      consent
    );
    if (error) {
      setErrorMessage(error);
    } else if (needsConfirmation) {
      // No session until the address is confirmed, so nobody is signed in yet. The
      // sign-in tab is where they come back to, with the address already filled in.
      setMode('signin');
      setPassword('');
      setSuccessMessage(
        'Cont creat. Verifică emailul și apasă linkul de confirmare, apoi conectează-te aici.'
      );
    } else {
      finishSignIn(user?.email || email.trim(), 'Cont creat. Te-ai conectat.');
    }
  };

  const handleAuth = async () => {
    clearMessages();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Te rugăm să completezi atât adresa de email, cât și parola.');
      return;
    }

    setLoading(true);
    try {
      await (mode === 'signin' ? signIn() : signUp());
    } catch {
      setErrorMessage('A apărut o problemă la comunicarea cu serverul.');
    } finally {
      setLoading(false);
    }
  };

  const startReset = () => {
    clearMessages();
    setResetStep('email');
  };

  const leaveReset = () => {
    setResetStep('off');
    setResetCode('');
    setNewPassword('');
    setErrorMessage(null);
  };

  const handleRequestReset = async () => {
    clearMessages();
    if (!email.trim()) {
      setErrorMessage('Scrie adresa de email a contului.');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await cloudSyncService.requestPasswordReset(email);
      if (!success) {
        setErrorMessage(error ?? 'Codul nu a putut fi trimis.');
        return;
      }
      // Deliberately the same message whether the address has an account or not: anything
      // else turns this into a way of finding out who is registered.
      setSuccessMessage('Dacă adresa are cont, îți trimitem un cod pe email în câteva minute.');
      setResetStep('code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    clearMessages();
    if (resetCode.trim().length < 6) {
      setErrorMessage('Codul din email are cel puțin 6 cifre.');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await cloudSyncService.verifyPasswordResetCode(email, resetCode);
      if (!success) {
        setErrorMessage(error ?? 'Codul nu este valid.');
        return;
      }
      setResetStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    clearMessages();
    const weak = describeWeakPassword(newPassword);
    if (weak) {
      setErrorMessage(weak);
      return;
    }

    setLoading(true);
    try {
      // The address is needed by the local simulation, which has no session to hang the new
      // password on; the real backend ignores it and uses the session the code produced.
      const { success, error } = await cloudSyncService.updatePassword(newPassword, email.trim());
      if (!success) {
        setErrorMessage(error ?? 'Parola nu a putut fi schimbată.');
        return;
      }
      onUserChanged(email.trim());
      clearForm();
      leaveReset();
      setSuccessMessage('Parola a fost schimbată. Ești conectat.');
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    setMode,
    email,
    password,
    consent,
    editEmail,
    editPassword,
    editConsent,
    resetStep,
    resetCode,
    setResetCode,
    newPassword,
    setNewPassword,
    loading,
    setLoading,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    clearForm,
    handleAuth,
    startReset,
    leaveReset,
    handleRequestReset,
    handleVerifyCode,
    handleSetNewPassword,
  };
}

export type AuthFormState = ReturnType<typeof useAuthForm>;
