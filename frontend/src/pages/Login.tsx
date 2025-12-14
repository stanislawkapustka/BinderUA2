import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { AuthResponse } from '../types';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { username, password });
      const { data } = await api.post<AuthResponse>('/auth/login', {
        username,
        password,
      });

      console.log('Login response:', data);
      console.log('Token:', data.token);
      console.log('User:', data.user);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Saved to localStorage:', {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Nieprawidłowa nazwa użytkownika lub hasło');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-primary-900 to-dark-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white p-10 rounded-2xl shadow-2xl border-t-4 border-accent-500">
          <div>
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
              <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-4xl font-extrabold bg-gradient-to-r from-dark-900 to-primary-700 bg-clip-text text-transparent">
              BinderUA
            </h2>
            <p className="mt-2 text-center text-sm text-dark-600 font-medium">
              System rejestracji czasu pracy
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border-l-4 border-red-500 shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-dark-700 mb-2">
                  Nazwa użytkownika
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 border-2 border-dark-300 rounded-lg placeholder-dark-400 text-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm font-medium"
                  placeholder="Wpisz nazwę użytkownika"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-dark-700 mb-2">
                  Hasło
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                required
                className="appearance-none block w-full px-4 py-3 border-2 border-dark-300 rounded-lg placeholder-dark-400 text-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm font-medium"
                placeholder="Wpisz hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Trwa logowanie...
                </span>
              ) : (
                'Zaloguj się'
              )}
            </button>
          </div>

          <div className="mt-6 text-center bg-dark-50 p-3 rounded-lg">
            <p className="text-xs text-dark-600 font-medium">
              Demo: <span className="font-bold text-primary-700">admin</span> / <span className="font-bold text-primary-700">admin123</span>
            </p>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
