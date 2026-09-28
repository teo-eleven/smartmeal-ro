import React from 'react';
import { Share } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { DataExportButton } from '../DataExportButton';
import { collectDataExport } from '../../services/dataExport';

jest.mock('../../services/dataExport', () => ({ collectDataExport: jest.fn() }));

const mockedCollect = collectDataExport as jest.Mock;

beforeEach(() => {
  jest.restoreAllMocks();
  mockedCollect.mockReset();
});

describe('butonul de export', () => {
  test('dă omului un fișier JSON cu datele lui', async () => {
    mockedCollect.mockResolvedValue({
      format: 'smartmeal-ro-export',
      onThisPhone: { preferences: { avoidedAllergens: ['arahide'] } },
    });
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    render(<DataExportButton isDark={false} />);

    fireEvent.press(screen.getByLabelText('Descarcă datele mele'));

    await waitFor(() => expect(share).toHaveBeenCalled());
    const message = share.mock.calls[0][0] as { message: string };
    expect(JSON.parse(message.message).onThisPhone.preferences.avoidedAllergens).toEqual([
      'arahide',
    ]);
  });

  test('o eroare devine un mesaj, nu un buton mort', async () => {
    mockedCollect.mockRejectedValue(new Error('offline'));
    render(<DataExportButton isDark={false} />);

    fireEvent.press(screen.getByLabelText('Descarcă datele mele'));

    await waitFor(() => expect(screen.getByText(/nu am putut pregăti/i)).toBeTruthy());
  });
});
