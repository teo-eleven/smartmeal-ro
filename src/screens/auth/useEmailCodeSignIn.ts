import { useState } from 'react';
import { requestLoginCode, verifyLoginCode } from '../../services/authCode';
import { AuthFormState } from './useAuthForm';

/** After this many wrong codes in a row, that code is done with: a new one must be asked for. */
export const MAX_CODE_ATTEMPTS = 5;

const TOO_MANY = 'Prea multe coduri greșite. Cere un cod nou.';
const SENT = 'Dacă adresa are cont, îți trimitem un cod pe email în câteva minute.';

/**
 * Signing in with a code emailed to the address. Shares the form's messages, busy state and
 * finish, so it reads and behaves like the password sign-in beside it.
 *
 * `fixedEmail` is for the monthly lock, where the account is already known.
 *
 * The attempt limit is for the person, not a defence: Supabase limits code checks on the
 * server. It stops somebody typing at a code that has long expired, and says what to do.
 */
export function useEmailCodeSignIn(form: AuthFormState, fixedEmail?: string) {
  const [email, setEmail] = useState(fixedEmail ?? '');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [failures, setFailures] = useState(0);
  const address = (fixedEmail ?? email).trim();

  const editEmail = (value: string) => {
    form.clearMessages();
    setEmail(value);
  };
  const editCode = (value: string) => {
    form.clearMessages();
    setCode(value);
  };

  const requestCode = () =>
    form.run(async () => {
      if (!address) {
        form.showError('Scrie adresa de email a contului.');
        return;
      }
      const { success, error } = await requestLoginCode(address);
      if (!success) {
        form.showError(error ?? 'Codul nu a putut fi trimis.');
        return;
      }
      setFailures(0);
      setCode('');
      setStep('code');
      // The same words whether the address has an account or not.
      form.showSuccess(SENT);
    });

  const verifyCode = () =>
    form.run(async () => {
      const { email: signedIn, error } = await verifyLoginCode(address, code);
      if (signedIn) {
        form.completeSignIn(signedIn, 'Te-ai conectat cu succes!');
        return;
      }
      const attempts = failures + 1;
      setFailures(attempts);
      setCode('');
      if (attempts >= MAX_CODE_ATTEMPTS) {
        setStep('email');
        form.showError(TOO_MANY);
        return;
      }
      form.showError(error ?? 'Codul nu este valid sau a expirat. Cere altul.');
    });

  /** Back to typing the address (or, at the lock, to asking again). */
  const restart = () => {
    form.clearMessages();
    setCode('');
    setStep('email');
  };

  return { email, editEmail, code, editCode, step, address, requestCode, verifyCode, restart };
}

export type EmailCodeState = ReturnType<typeof useEmailCodeSignIn>;
