import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthModal } from '../AuthModal';
import { cloudSyncService } from '../../services/supabase';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    signInWithEmail: jest.fn(),
    signUpWithEmail: jest.fn(),
    signOut: jest.fn(),
    deleteAccount: jest.fn(),
    requestPasswordReset: jest.fn(),
    verifyPasswordResetCode: jest.fn(),
    updatePassword: jest.fn(),
  },
}));

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  isDark: false,
  userEmail: null,
  onUserChanged: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

/** The screen in front of every cloud sync: whatever it says is what the user believes. */
describe('AuthModal', () => {
  test('cere ambele câmpuri înainte să atingă serverul', async () => {
    render(<AuthModal {...baseProps} />);

    fireEvent.press(screen.getByText('Conectare'));

    await waitFor(() => expect(screen.getByText(/completezi atât adresa/i)).toBeTruthy());
    expect(cloudSyncService.signInWithEmail).not.toHaveBeenCalled();
  });

  test('arată eroarea venită de la server, nu una inventată', async () => {
    (cloudSyncService.signInWithEmail as jest.Mock).mockResolvedValue({
      user: null,
      error: 'Parolă greșită',
    });
    render(<AuthModal {...baseProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('exemplu@email.ro'), 'a@b.ro');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'parola');
    fireEvent.press(screen.getByText('Conectare'));

    await waitFor(() => expect(screen.getByText('Parolă greșită')).toBeTruthy());
    expect(baseProps.onUserChanged).not.toHaveBeenCalled();
  });

  test('anunță aplicația după o conectare reușită', async () => {
    (cloudSyncService.signInWithEmail as jest.Mock).mockResolvedValue({
      user: { email: 'a@b.ro' },
      error: null,
    });
    render(<AuthModal {...baseProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('exemplu@email.ro'), ' a@b.ro ');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'parola');
    fireEvent.press(screen.getByText('Conectare'));

    await waitFor(() => expect(baseProps.onUserChanged).toHaveBeenCalledWith('a@b.ro'));
    expect(cloudSyncService.signInWithEmail).toHaveBeenCalledWith('a@b.ro', 'parola');
  });

  test('înregistrarea folosește alt apel și spune să confirmi emailul', async () => {
    (cloudSyncService.signUpWithEmail as jest.Mock).mockResolvedValue({
      user: { email: 'nou@b.ro' },
      error: null,
    });
    render(<AuthModal {...baseProps} />);

    fireEvent.press(screen.getByText('Creează cont'));
    fireEvent.changeText(screen.getByPlaceholderText('exemplu@email.ro'), 'nou@b.ro');
    // Has to satisfy the policy now, or it never reaches the server.
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'Muntele7Verde');
    fireEvent.press(screen.getByText('Înregistrare'));

    await waitFor(() => expect(screen.getByText(/Verifică email-ul/i)).toBeTruthy());
    expect(cloudSyncService.signUpWithEmail).toHaveBeenCalled();
  });

  test('o excepție de rețea devine un mesaj, nu un ecran alb', async () => {
    (cloudSyncService.signInWithEmail as jest.Mock).mockRejectedValue(new Error('offline'));
    render(<AuthModal {...baseProps} />);

    fireEvent.changeText(screen.getByPlaceholderText('exemplu@email.ro'), 'a@b.ro');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'parola');
    fireEvent.press(screen.getByText('Conectare'));

    await waitFor(() => expect(screen.getByText(/problemă la comunicarea cu serverul/i)).toBeTruthy());
  });

  test('deconectarea anunță aplicația', async () => {
    (cloudSyncService.signOut as jest.Mock).mockResolvedValue(undefined);
    render(<AuthModal {...baseProps} userEmail="a@b.ro" />);

    fireEvent.press(screen.getByText(/Deconectare/i));

    await waitFor(() => expect(baseProps.onUserChanged).toHaveBeenCalledWith(null));
  });

  test('conectat, oferă sincronizarea și arată ultima oră de sincronizare', () => {
    const onSyncTriggered = jest.fn().mockResolvedValue(undefined);
    render(
      <AuthModal
        {...baseProps}
        userEmail="a@b.ro"
        onSyncTriggered={onSyncTriggered}
        lastSyncedAt="12:30:00"
      />
    );

    expect(screen.getByText('a@b.ro')).toBeTruthy();
    expect(screen.getByText(/12:30:00/)).toBeTruthy();
  });

  test('conectat, oferă ambele direcții de sincronizare', () => {
    const onSyncTriggered = jest.fn().mockResolvedValue(undefined);
    const onDownloadTriggered = jest.fn().mockResolvedValue(undefined);
    render(
      <AuthModal
        {...baseProps}
        userEmail="a@b.ro"
        onSyncTriggered={onSyncTriggered}
        onDownloadTriggered={onDownloadTriggered}
      />
    );

    fireEvent.press(screen.getByLabelText('Urcă planul în cloud'));
    fireEvent.press(screen.getByLabelText('Adu planul din cloud'));

    expect(onSyncTriggered).toHaveBeenCalled();
    expect(onDownloadTriggered).toHaveBeenCalled();
  });

  test('în timpul unei sincronizări nu se poate porni a doua', () => {
    const onDownloadTriggered = jest.fn().mockResolvedValue(undefined);
    render(
      <AuthModal
        {...baseProps}
        userEmail="a@b.ro"
        onDownloadTriggered={onDownloadTriggered}
        isSyncing
      />
    );

    fireEvent.press(screen.getByLabelText('Adu planul din cloud'));

    expect(onDownloadTriggered).not.toHaveBeenCalled();
  });

  test('neconectat, nu apare niciun buton de sincronizare', () => {
    render(<AuthModal {...baseProps} onDownloadTriggered={jest.fn()} onSyncTriggered={jest.fn()} />);

    expect(screen.queryByLabelText('Adu planul din cloud')).toBeNull();
    expect(screen.queryByLabelText('Urcă planul în cloud')).toBeNull();
  });

  test('ștergerea contului cere o confirmare separată', () => {
    render(<AuthModal {...baseProps} userEmail="a@b.ro" />);

    expect(screen.queryByLabelText(/Confirmă ștergerea/i)).toBeNull();
    fireEvent.press(screen.getByLabelText('Șterge contul'));
    expect(screen.getByLabelText(/Confirmă ștergerea/i)).toBeTruthy();
    expect(cloudSyncService.deleteAccount).not.toHaveBeenCalled();
  });

  test('se poate renunța la ștergere', () => {
    render(<AuthModal {...baseProps} userEmail="a@b.ro" />);

    fireEvent.press(screen.getByLabelText('Șterge contul'));
    fireEvent.press(screen.getByLabelText(/Renunță la ștergerea/i));

    expect(screen.getByLabelText('Șterge contul')).toBeTruthy();
    expect(cloudSyncService.deleteAccount).not.toHaveBeenCalled();
  });

  test('confirmată, șterge contul și deconectează aplicația', async () => {
    (cloudSyncService.deleteAccount as jest.Mock).mockResolvedValue({ success: true, error: null });
    render(<AuthModal {...baseProps} userEmail="a@b.ro" />);

    fireEvent.press(screen.getByLabelText('Șterge contul'));
    fireEvent.press(screen.getByLabelText(/Confirmă ștergerea/i));

    await waitFor(() => expect(baseProps.onUserChanged).toHaveBeenCalledWith(null));
  });

  test('un eșec la ștergere este spus, nu înghițit', async () => {
    (cloudSyncService.deleteAccount as jest.Mock).mockResolvedValue({
      success: false,
      error: 'serverul nu răspunde',
    });
    render(<AuthModal {...baseProps} userEmail="a@b.ro" />);

    fireEvent.press(screen.getByLabelText('Șterge contul'));
    fireEvent.press(screen.getByLabelText(/Confirmă ștergerea/i));

    await waitFor(() => expect(screen.getByText('serverul nu răspunde')).toBeTruthy());
    expect(baseProps.onUserChanged).not.toHaveBeenCalledWith(null);
  });

  test('nu cere parola de două ori: parola este mascată', () => {
    render(<AuthModal {...baseProps} />);

    expect(screen.getByPlaceholderText('••••••••').props.secureTextEntry).toBe(true);
  });
});

/**
 * Three steps, each unlocking only once the one before it succeeded. The code is the only
 * proof the person reaches the mailbox, so nothing changes before it is verified.
 */
describe('resetarea parolei', () => {
  function openReset() {
    render(<AuthModal {...baseProps} />);
    fireEvent.press(screen.getByLabelText('Am uitat parola'));
  }

  test('cere adresa înainte să trimită ceva', async () => {
    openReset();

    fireEvent.press(screen.getByLabelText('Trimite codul pe email'));

    await waitFor(() => expect(screen.getByText(/Scrie adresa contului/i)).toBeTruthy());
    expect(cloudSyncService.requestPasswordReset).not.toHaveBeenCalled();
  });

  test('răspunde la fel indiferent dacă adresa are cont', async () => {
    (cloudSyncService.requestPasswordReset as jest.Mock).mockResolvedValue({
      success: true,
      error: null,
    });
    openReset();

    fireEvent.changeText(screen.getByLabelText('Adresa de email pentru resetare'), 'a@b.ro');
    fireEvent.press(screen.getByLabelText('Trimite codul pe email'));

    await waitFor(() => expect(screen.getByText(/Dacă adresa are cont/i)).toBeTruthy());
  });

  test('un cod prea scurt nu ajunge la server', async () => {
    (cloudSyncService.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true, error: null });
    openReset();
    fireEvent.changeText(screen.getByLabelText('Adresa de email pentru resetare'), 'a@b.ro');
    fireEvent.press(screen.getByLabelText('Trimite codul pe email'));
    await waitFor(() => screen.getByLabelText('Codul primit pe email'));

    fireEvent.changeText(screen.getByLabelText('Codul primit pe email'), '123');
    fireEvent.press(screen.getByLabelText('Verifică codul'));

    await waitFor(() => expect(screen.getByText(/șase cifre/i)).toBeTruthy());
    expect(cloudSyncService.verifyPasswordResetCode).not.toHaveBeenCalled();
  });

  test('un cod greșit nu deschide pasul parolei', async () => {
    (cloudSyncService.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true, error: null });
    (cloudSyncService.verifyPasswordResetCode as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Codul nu este valid sau a expirat. Cere altul.',
    });
    openReset();
    fireEvent.changeText(screen.getByLabelText('Adresa de email pentru resetare'), 'a@b.ro');
    fireEvent.press(screen.getByLabelText('Trimite codul pe email'));
    await waitFor(() => screen.getByLabelText('Codul primit pe email'));

    fireEvent.changeText(screen.getByLabelText('Codul primit pe email'), '000000');
    fireEvent.press(screen.getByLabelText('Verifică codul'));

    await waitFor(() => expect(screen.getByText(/nu este valid/i)).toBeTruthy());
    expect(screen.queryByLabelText('Parola nouă')).toBeNull();
    expect(cloudSyncService.updatePassword).not.toHaveBeenCalled();
  });

  test('o parolă slabă este refuzată înainte de server', async () => {
    (cloudSyncService.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true, error: null });
    (cloudSyncService.verifyPasswordResetCode as jest.Mock).mockResolvedValue({ success: true, error: null });
    openReset();
    fireEvent.changeText(screen.getByLabelText('Adresa de email pentru resetare'), 'a@b.ro');
    fireEvent.press(screen.getByLabelText('Trimite codul pe email'));
    await waitFor(() => screen.getByLabelText('Codul primit pe email'));
    fireEvent.changeText(screen.getByLabelText('Codul primit pe email'), '123456');
    fireEvent.press(screen.getByLabelText('Verifică codul'));
    await waitFor(() => screen.getByLabelText('Parola nouă'));

    fireEvent.changeText(screen.getByLabelText('Parola nouă'), 'parola');
    fireEvent.press(screen.getByLabelText('Salvează parola nouă'));

    await waitFor(() => expect(screen.getByText(/cel puțin 10 caractere/i)).toBeTruthy());
    expect(cloudSyncService.updatePassword).not.toHaveBeenCalled();
  });

  test('parcursul complet schimbă parola și conectează utilizatorul', async () => {
    (cloudSyncService.requestPasswordReset as jest.Mock).mockResolvedValue({ success: true, error: null });
    (cloudSyncService.verifyPasswordResetCode as jest.Mock).mockResolvedValue({ success: true, error: null });
    (cloudSyncService.updatePassword as jest.Mock).mockResolvedValue({ success: true, error: null });
    openReset();
    fireEvent.changeText(screen.getByLabelText('Adresa de email pentru resetare'), 'a@b.ro');
    fireEvent.press(screen.getByLabelText('Trimite codul pe email'));
    await waitFor(() => screen.getByLabelText('Codul primit pe email'));
    fireEvent.changeText(screen.getByLabelText('Codul primit pe email'), '123456');
    fireEvent.press(screen.getByLabelText('Verifică codul'));
    await waitFor(() => screen.getByLabelText('Parola nouă'));

    fireEvent.changeText(screen.getByLabelText('Parola nouă'), 'Muntele7Verde');
    fireEvent.press(screen.getByLabelText('Salvează parola nouă'));

    await waitFor(() => expect(baseProps.onUserChanged).toHaveBeenCalledWith('a@b.ro'));
  });

  test('se poate renunța și se revine la autentificare', async () => {
    openReset();

    fireEvent.press(screen.getByLabelText('Renunță la resetarea parolei'));

    expect(screen.getByLabelText('Am uitat parola')).toBeTruthy();
  });

  test('înregistrarea refuză o parolă slabă înainte de server', async () => {
    render(<AuthModal {...baseProps} />);
    fireEvent.press(screen.getByText('Creează cont'));
    fireEvent.changeText(screen.getByPlaceholderText('exemplu@email.ro'), 'nou@b.ro');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), '123456');
    fireEvent.press(screen.getByText('Înregistrare'));

    await waitFor(() => expect(screen.getByText(/cel puțin 10 caractere/i)).toBeTruthy());
    expect(cloudSyncService.signUpWithEmail).not.toHaveBeenCalled();
  });
});
