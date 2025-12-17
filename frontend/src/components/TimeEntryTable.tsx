import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import api from '../lib/api';
import type { TimeEntry, User } from '../types';

interface TimeEntryTableProps {
  entries: TimeEntry[];
  currentUser: User;
  onUpdate: () => void;
}

export default function TimeEntryTable({ entries, currentUser, onUpdate }: TimeEntryTableProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ hours: '', description: '' });

  const handleDelete = async (id: number) => {
    if (!confirm(t('timeEntry.confirmDelete'))) return;

    try {
      await api.delete(`/time-entries/${id}`);
      onUpdate();
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert(t('errors.deleteFailed'));
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEditData({
      hours: (entry.totalHours || entry.hours || 0).toString(),
      description: entry.description || '',
    });
  };

  const handleSave = async (id: number, entry: TimeEntry) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not found');
      const user = JSON.parse(userStr);

      await api.put(`/time-entries/${id}`, {
        userId: user.id,
        projectId: entry.projectId,
        date: entry.date,
        totalHours: parseFloat(editData.hours),
        description: editData.description,
      });
      setEditingId(null);
      onUpdate();
    } catch (err) {
      console.error('Error updating entry:', err);
      alert(t('errors.saveFailed'));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({ hours: '', description: '' });
  };

  const canEdit = (entry: TimeEntry) => {
    if (!currentUser) return false;
    return entry.userId === currentUser.id || currentUser.role === 'DYREKTOR';
  };

  if (!currentUser) {
    return null;
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        {t('timeEntry.noEntries')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('timeEntry.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('timeEntry.project')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Godziny / Jednostki
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('timeEntry.description')}
              </th>
              {currentUser.role === 'DYREKTOR' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('timeEntry.user')}
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(entry.date), 'yyyy-MM-dd')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.projectName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === entry.id ? (
                    <input
                      type="number"
                      step="0.5"
                      value={editData.hours}
                      onChange={(e) => setEditData({ ...editData, hours: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : entry.billingType === 'UNIT' ? (
                    `${entry.quantity || 0} ${entry.unitName || 'szt.'}`
                  ) : (
                    `${entry.totalHours || entry.hours || 0}h`
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {editingId === entry.id ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows={2}
                    />
                  ) : (
                    entry.description || '-'
                  )}
                </td>
                {currentUser.role === 'DYREKTOR' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.userName}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === entry.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSave(entry.id, entry)}
                        className="text-green-600 hover:text-green-900"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    canEdit(entry) && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          {entries.some(e => e.billingType === 'HOURLY') && (
            <>
              <strong>Razem godzin:</strong>{' '}
              {entries
                .filter(e => e.billingType !== 'UNIT')
                .reduce((sum, entry) => sum + (entry.totalHours || entry.hours || 0), 0)
                .toFixed(1)}
              h
              {entries.some(e => e.billingType === 'UNIT') && <br />}
            </>
          )}
          {entries.some(e => e.billingType === 'UNIT') && (
            <>
              <strong>Razem jednostek:</strong>{' '}
              {entries
                .filter(e => e.billingType === 'UNIT')
                .reduce((sum, entry) => sum + (entry.quantity || 0), 0)
                .toFixed(1)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
