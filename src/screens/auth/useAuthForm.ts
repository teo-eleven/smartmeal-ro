import { useEffect, useRef, useState } from 'react';
import { cloudSyncService } from '../../services/supabase';
import { SignUpConsent as Consent } from '../../types';
import { describeWeakPassword } from '../../utils/passwordPolicy';
import { describeMissingConsent } from '../../utils/signUpConsent';
import { normalizeDisplayName } from '../../utils/displayName';

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

const SIGNED_OUT_MESSAGE = 'Te-ai deconectat.';

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
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState<Consent>(NO_CONSENT);

  // The delayed close runs after the screen may have gone: the full-screen login is replaced
  // the moment somebody signs in. It is cancelled with the screen, and calls the latest
  // callback rather than the one from the render that started it.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

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
    setDisplayName('');
    setConsent(NO_CONSENT);
    setMode('signin');
  };

  // Any edit clears the last error. One left on screen after the person has fixed the field
  // it was about reads as a second, new error.
  const editEmail = (value: string) => {
    setErrorMessage(null);
    setEmail(value);
  };
  const editDisplayName = (value: string) => {
    setErrorMessage(null);
    setDisplayName(value);
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
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onSignedInRef.current();
    }, CLOSE_AFTER_MS);
  };

  /**
   * Every action that talks to the server goes through here: the old messages go, the button
   * spins, and it stops spinning however the action ends.
   */
  const isBusy = useRef(false);
  const run = async (action: () => Promise<void>) => {
    // One at a time: Face ID offered on its own while a password is already being checked
    // would otherwise race it, and whichever ended first re-enabled the buttons.
    if (isBusy.current) return;
    isBusy.current = true;
    clearMessages();
    setLoading(true);
    try {
      await action();
    } finally {
      isBusy.current = false;
      setLoading(false);
    }
  };

  const showError = (message: string) => setErrorMessage(message);
  const showSuccess = (message: string) => setSuccessMessage(message);

  const signIn = async () => {
    const { user, error } = await cloudSyncService.signInWithEmail(email.trim(), password);
    if (error) {
      setErrorMessage(error);
      return;
    }
    finishSignIn(user?.email || email.trim(), 'Te-ai conectat cu succes!');
  };

  const signUp = async () => {
    // Checked in the order the fields stand: the name, then the password, then the consent.
    const named = normalizeDisplayName(displayName);
    if (!named.name) {
      setErrorMessage(named.error);
      return;
    }
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
      consent,
      named.name
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

  const handleSignOut = () =>
    run(async () => {
      await cloudSyncService.signOut();
      onUserChanged(null);
      clearForm();
      setSuccessMessage(SIGNED_OUT_MESSAGE);
    });

  const handleDeleteAccount = () =>
    run(async () => {
      const { success, error } = await cloudSyncService.deleteAccount();
      if (!success) {
        setErrorMessage(error ?? 'Contul nu a putut fi șters.');
        return;
      }
      onUserChanged(null);
      setSuccessMessage('Contul și datele lui au fost șterse.');
    });

  return {
    mode,
    setMode,
    email,
    password,
    displayName,
    consent,
    editEmail,
    editDisplayName,
    editPassword,
    editConsent,
    resetStep,
    resetCode,
    setResetCode,
    newPassword,
    setNewPassword,
    loading,
    errorMessage,
    successMessage,
    run,
    showError,
    showSuccess,
    clearMessages,
    /** For the other ways in (an emailed code): the same finish as a password sign-in. */
    completeSignIn: finishSignIn,
    handleAuth,
    handleSignOut,
    handleDeleteAccount,
    startReset,
    leaveReset,
    handleRequestReset,
    handleVerifyCode,
    handleSetNewPassword,
  };
}

export type AuthFormState = ReturnType<typeof useAuthForm>;
