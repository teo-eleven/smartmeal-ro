import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DevicesSection } from '../DevicesSection';
import { DeviceInfo, listDevices, revokeDevice } from '../../services/devices';

jest.mock('../../services/devices', () => ({
  listDevices: jest.fn(),
  revokeDevice: jest.fn(),
}));

const list = listDevices as jest.Mock;
const revoke = revokeDevice as jest.Mock;

const THIS: DeviceInfo = {
  deviceId: 'acesta',
  name: 'iPhone',
  platform: 'ios',
  lastSeenAt: new Date().toISOString(),
  isCurrent: true,
};
const LAPTOP: DeviceInfo = {
  deviceId: 'laptop',
  name: 'Chrome pe Mac',
  platform: 'web',
  lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  isCurrent: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  list.mockReset().mockResolvedValue({ devices: [THIS, LAPTOP], error: null });
  revoke.mockReset().mockResolvedValue({ success: true, error: null });
});

/** Cont → Dispozitive: where the account is signed in, and signing one of them out. */
describe('dispozitivele contului', () => {
  test('arată dispozitivul ăsta, marcat, și pe celelalte', async () => {
    render(<DevicesSection isDark={false} />);

    await waitFor(() => expect(screen.getByText('Chrome pe Mac')).toBeTruthy());
    expect(screen.getByText('iPhone')).toBeTruthy();
    expect(screen.getByText(/Acest dispozitiv/)).toBeTruthy();
  });

  test('dispozitivul ăsta nu are buton de deconectare aici', async () => {
    render(<DevicesSection isDark={false} />);

    await waitFor(() => expect(screen.getByText('Chrome pe Mac')).toBeTruthy());
    expect(screen.queryByLabelText('Deconectează iPhone')).toBeNull();
    expect(screen.getByLabelText('Deconectează Chrome pe Mac')).toBeTruthy();
  });

  test('deconectarea cere confirmare și spune cât durează', async () => {
    render(<DevicesSection isDark={false} />);
    await waitFor(() => expect(screen.getByText('Chrome pe Mac')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Deconectează Chrome pe Mac'));

    expect(screen.getByText(/în cel mult o oră/)).toBeTruthy();
    expect(revoke).not.toHaveBeenCalled();
  });

  test('confirmată: deconectează dispozitivul și reîncarcă lista', async () => {
    render(<DevicesSection isDark={false} />);
    await waitFor(() => expect(screen.getByText('Chrome pe Mac')).toBeTruthy());
    list.mockResolvedValue({ devices: [THIS], error: null });

    fireEvent.press(screen.getByLabelText('Deconectează Chrome pe Mac'));
    fireEvent.press(screen.getByText('Deconectează-l'));

    await waitFor(() => expect(screen.queryByText('Chrome pe Mac')).toBeNull());
    expect(revoke).toHaveBeenCalledWith('laptop');
    expect(screen.getByText(/Chrome pe Mac a fost deconectat/)).toBeTruthy();
  });

  test('renunțată: nimic nu se deconectează', async () => {
    render(<DevicesSection isDark={false} />);
    await waitFor(() => expect(screen.getByText('Chrome pe Mac')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Deconectează Chrome pe Mac'));
    fireEvent.press(screen.getByText('Renunță'));

    expect(revoke).not.toHaveBeenCalled();
    expect(screen.getByText('Chrome pe Mac')).toBeTruthy();
  });

  test('o deconectare care n-a reușit spune de ce', async () => {
    revoke.mockResolvedValue({ success: false, error: 'Dispozitivul a fost deja deconectat.' });
    render(<DevicesSection isDark={false} />);
    await waitFor(() => expect(screen.getByText('Chrome pe Mac')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Deconectează Chrome pe Mac'));
    fireEvent.press(screen.getByText('Deconectează-l'));

    await waitFor(() =>
      expect(screen.getByText('Dispozitivul a fost deja deconectat.')).toBeTruthy()
    );
  });

  test('doar dispozitivul ăsta: o spune', async () => {
    list.mockResolvedValue({ devices: [THIS], error: null });

    render(<DevicesSection isDark={false} />);

    await waitFor(() => expect(screen.getByText(/Doar acest dispozitiv/)).toBeTruthy());
  });

  test('lista care nu s-a încărcat se poate cere din nou', async () => {
    list.mockResolvedValueOnce({ devices: [], error: 'Nu am putut încărca dispozitivele.' });
    render(<DevicesSection isDark={false} />);
    await waitFor(() => expect(screen.getByText(/Nu am putut încărca/)).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Încearcă din nou'));

    await waitFor(() => expect(screen.getByText('Chrome pe Mac')).toBeTruthy());
  });
});
