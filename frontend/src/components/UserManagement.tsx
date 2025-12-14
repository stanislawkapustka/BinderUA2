import { useEffect, useState } from 'react';
import api from '../lib/api';
import type { User } from '../types';

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<{ content: User[] }>('/users');
      setUsers(data.content || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsCreating(false);
    setFormData({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      firstNameUa: user.firstNameUa || '',
      lastNameUa: user.lastNameUa || '',
      email: user.email,
      role: user.role,
      contractType: user.contractType,
      uopGrossRate: user.uopGrossRate,
      b2bHourlyNetRate: user.b2bHourlyNetRate,
      active: user.active ?? true,
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      firstNameUa: '',
      lastNameUa: '',
      email: '',
      role: 'PRACOWNIK',
      contractType: 'UOP',
      uopGrossRate: 0,
      b2bHourlyNetRate: 0,
      active: true,
    });
  };

  const handleSave = async () => {
    try {
      // Basic validation
      if (!formData.username && isCreating) {
        alert('Nazwa użytkownika jest wymagana');
        return;
      }
      if (!formData.firstName) {
        alert('Imię jest wymagane');
        return;
      }
      if (!formData.lastName) {
        alert('Nazwisko jest wymagane');
        return;
      }
      if (!formData.email) {
        alert('Email jest wymagany');
        return;
      }

      if (isCreating) {
        await api.post('/users', formData);
      } else if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      }
      await fetchUsers();
      setEditingUser(null);
      setIsCreating(false);
      setFormData({});
    } catch (err: any) {
      console.error('Error saving user:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Błąd podczas zapisywania użytkownika';
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setIsCreating(false);
    setFormData({});
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, {
        active: !user.active,
      });
      await fetchUsers();
    } catch (err) {
      console.error('Error toggling user active status:', err);
      alert('Błąd podczas zmiany statusu użytkownika');
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć użytkownika ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      await api.delete(`/users/${user.id}`);
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Błąd podczas usuwania użytkownika');
    }
  };
  const handleOpenPasswordModal = (user: User) => {
    setSelectedUserForPassword(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleSetPassword = async () => {
    if (!selectedUserForPassword) return;

    if (newPassword.length < 8) {
      alert('Has\u0142o musi mie\u0107 minimum 8 znak\u00f3w');
      return;
    }

    try {
      await api.post(`/users/${selectedUserForPassword.id}/password`, {
        newPassword: newPassword,
      });
      alert('Has\u0142o zosta\u0142o zmienione');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUserForPassword(null);
      await fetchUsers();
    } catch (err: any) {
      console.error('Error setting password:', err);
      const errorMessage = err.response?.data?.message || err.message || 'B\u0142\u0105d podczas ustawiania has\u0142a';
      alert(errorMessage);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-dark-600 text-lg">Ładowanie użytkowników...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-dark-900">Lista użytkowników</h2>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span className="text-xl">+</span> Dodaj użytkownika
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-dark-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y-2 divide-dark-200">
            <thead className="bg-gradient-to-r from-dark-900 to-primary-900">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Imię (UA)
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Nazwisko (UA)
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Imię
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Nazwisko
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Rola
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Rozliczenie
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Stawka
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-dark-100">
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  className={`hover:bg-primary-50 transition-colors ${
                    !user.active ? 'opacity-50 bg-dark-50' : ''
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-dark-900">
                    {user.firstNameUa || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-dark-900">
                    {user.lastNameUa || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-dark-700">
                    {user.firstName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-dark-700">
                    {user.lastName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-dark-600">
                    {user.email}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'DYREKTOR' 
                        ? 'bg-accent-100 text-accent-800 border border-accent-300'
                        : user.role === 'MANAGER'
                        ? 'bg-primary-100 text-primary-800 border border-primary-300'
                        : 'bg-dark-100 text-dark-800 border border-dark-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.contractType === 'UOP'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {user.contractType}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-dark-700 font-semibold">
                    {user.contractType === 'UOP' 
                      ? `${user.uopGrossRate || 0} PLN/mies. brutto`
                      : `${user.b2bHourlyNetRate || 0} PLN/h netto`
                    }
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        user.active ? 'bg-accent-500' : 'bg-dark-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          user.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => handleOpenPasswordModal(user)}
                        className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium shadow-sm hover:shadow-md"
                        title="Ustaw hasło"
                      >
                        Hasło
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow-md"
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {(editingUser || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-t-4 border-accent-500">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-dark-900 mb-6 border-b-2 border-dark-200 pb-3">
                {isCreating ? 'Tworzenie nowego użytkownika' : 'Edycja użytkownika'}
              </h2>

              <div className="space-y-4">
                {/* Username (only when creating) */}
                {isCreating && (
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Nazwa użytkownika *
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Login użytkownika"
                      required
                    />
                  </div>
                )}

                {/* Polish Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Imię
                    </label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Nazwisko
                    </label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Ukrainian Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Imię (UA)
                    </label>
                    <input
                      type="text"
                      value={formData.firstNameUa || ''}
                      onChange={(e) => setFormData({ ...formData, firstNameUa: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ім'я"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Nazwisko (UA)
                    </label>
                    <input
                      type="text"
                      value={formData.lastNameUa || ''}
                      onChange={(e) => setFormData({ ...formData, lastNameUa: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Прізвище"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Role and Contract Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Rola
                    </label>
                    <select
                      value={formData.role || ''}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="PRACOWNIK">PRACOWNIK</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="DYREKTOR">DYREKTOR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Rodzaj rozliczenia
                    </label>
                    <select
                      value={formData.contractType || ''}
                      onChange={(e) => setFormData({ ...formData, contractType: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="UOP">UoP</option>
                      <option value="B2B">B2B</option>
                    </select>
                  </div>
                </div>

                {/* Rates */}
                {formData.contractType === 'UOP' ? (
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Stawka miesięczna brutto (PLN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.uopGrossRate || ''}
                      onChange={(e) => setFormData({ ...formData, uopGrossRate: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 mb-2">
                      Stawka godzinowa netto (PLN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.b2bHourlyNetRate || ''}
                      onChange={(e) => setFormData({ ...formData, b2bHourlyNetRate: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Active Toggle */}
                <div className="flex items-center space-x-3 py-2">
                  <label className="block text-sm font-semibold text-dark-700">
                    Aktywny
                  </label>
                  <button
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.active ? 'bg-accent-500' : 'bg-dark-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t-2 border-dark-200">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-dark-200 text-dark-700 rounded-lg hover:bg-dark-300 transition-colors font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Zapisz zmiany
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border-t-4 border-accent-500">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-dark-900 mb-4 border-b-2 border-dark-200 pb-3">
                Ustaw hasło dla użytkownika
              </h2>
              
              <div className="mb-4">
                <p className="text-dark-700 font-medium">
                  {selectedUserForPassword.firstName} {selectedUserForPassword.lastName}
                </p>
                <p className="text-sm text-dark-500">{selectedUserForPassword.email}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-dark-700 mb-2">
                  Nowe hasło
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Minimum 8 znaków, litery i cyfry"
                  autoFocus
                />
                <p className="mt-2 text-xs text-dark-500">
                  Hasło musi zawierać minimum 8 znaków, w tym litery i cyfry.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setSelectedUserForPassword(null);
                  }}
                  className="px-6 py-3 bg-dark-200 text-dark-700 rounded-lg hover:bg-dark-300 transition-colors font-medium"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSetPassword}
                  className="px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Ustaw hasło
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
