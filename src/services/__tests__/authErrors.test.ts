import { describeAuthError } from '../authErrors';

/**
 * Supabase's error text is English ("Invalid login credentials"), and the service used to
 * pass it straight to a Romanian screen. The translation goes by error code, which is
 * stable, not by the English text, which is not.
 */
describe('mesajele de eroare de la autentificare', () => {
  test('parola greșită', () => {
    expect(
      describeAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' })
    ).toBe('Adresa sau parola nu sunt corecte.');
  });

  test('emailul neconfirmat spune ce e de făcut', () => {
    expect(describeAuthError({ code: 'email_not_confirmed' })).toMatch(/confirm/i);
  });

  test('adresa deja folosită', () => {
    expect(describeAuthError({ code: 'user_already_exists' })).toMatch(/există deja un cont/i);
    expect(describeAuthError({ code: 'email_exists' })).toMatch(/există deja un cont/i);
  });

  test('prea multe încercări', () => {
    expect(describeAuthError({ code: 'over_request_rate_limit' })).toMatch(/prea multe/i);
    expect(describeAuthError({ code: 'over_email_send_rate_limit' })).toMatch(/prea multe/i);
  });

  test('parola slabă respinsă de server', () => {
    expect(describeAuthError({ code: 'weak_password' })).toMatch(/parol/i);
  });

  /** Anything unforeseen still reads as Romanian, never as the raw English text. */
  test('un cod necunoscut primește un mesaj general, nu textul în engleză', () => {
    const message = describeAuthError({ code: 'something_new', message: 'Something went wrong' });
    expect(message).not.toMatch(/Something went wrong/);
    expect(message).toMatch(/Încearcă din nou/);
  });

  test('fără cod deloc, la fel', () => {
    expect(describeAuthError({ message: 'Network down' })).not.toMatch(/Network down/);
  });
});
