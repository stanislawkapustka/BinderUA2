import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Hasło musi mieć minimum 8 znaków';
    }
    if (!/[0-9]/.test(password)) {
      return 'Hasło musi zawierać co najmniej jedną cyfrę';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'Hasło musi zawierać co najmniej jedną literę';
    }
    if (!/[!@#$%^&*()]/.test(password)) {
      return 'Hasło musi zawierać co najmniej jeden znak specjalny (!@#$%^&*())';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Nowe hasła nie są identyczne');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await api.put('/users/me/password', {
        oldPassword,
        newPassword,
      });

      // Update user in localStorage to clear passwordChangeRequired flag
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.passwordChangeRequired = false;
        localStorage.setItem('user', JSON.stringify(user));
      }

      alert('Hasło zostało zmienione pomyślnie');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error changing password:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Błąd podczas zmiany hasła';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-primary-900 to-dark-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border-t-4 border-accent-500 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-dark-900 text-center">
            Zmiana hasła wymagana
          </h2>
          <p className="mt-3 text-center text-dark-600">
            Musisz zmienić hasło tymczasowe przed pierwszym logowaniem
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="oldPassword" className="block text-sm font-semibold text-dark-700 mb-2">
              Hasło tymczasowe
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Wpisz hasło tymczasowe"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-semibold text-dark-700 mb-2">
              Nowe hasło
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Wpisz nowe hasło"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-dark-700 mb-2">
              Potwierdź nowe hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Potwierdź nowe hasło"
              required
            />
          </div>

          <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
            <p className="text-xs text-dark-700 font-medium">Wymagania dotyczące hasła:</p>
            <ul className="mt-2 text-xs text-dark-600 list-disc list-inside space-y-1">
              <li>Minimum 8 znaków</li>
              <li>Co najmniej jedna litera</li>
              <li>Co najmniej jedna cyfra</li>
              <li>Co najmniej jeden znak specjalny (!@#$%^&*())</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 px-6 py-3 bg-dark-200 text-dark-700 rounded-lg hover:bg-dark-300 transition-colors font-medium"
            >
              Wyloguj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Zmiana...' : 'Zmień hasło'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
