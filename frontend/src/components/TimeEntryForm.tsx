import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import api from '../lib/api';
import type { Project } from '../types';

interface TimeEntryFormProps {
  onSuccess: () => void;
  initialDate?: Date;
}

export default function TimeEntryForm({ onSuccess, initialDate }: TimeEntryFormProps) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  
  const formatDateForInput = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };
  
  const [formData, setFormData] = useState({
    projectId: '',
    date: initialDate ? formatDateForInput(initialDate) : formatDateForInput(new Date()),
    hours: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get<Project[]>('/projects');
      setProjects(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, projectId: data[0].id.toString() }));
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found');
      }
      const user = JSON.parse(userStr);

      await api.post('/time-entries', {
        userId: user.id,
        projectId: parseInt(formData.projectId),
        date: formData.date,
        totalHours: parseFloat(formData.hours),
        description: formData.description,
      });

      setFormData({
        projectId: projects[0]?.id.toString() || '',
        date: initialDate ? formatDateForInput(initialDate) : formatDateForInput(new Date()),
        hours: '',
        description: '',
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error creating time entry:', err);
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-primary-600">
      <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-dark-900 to-primary-700 bg-clip-text text-transparent">
        {t('timeEntry.addNew')}
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-dark-700 mb-2">
            {t('timeEntry.project')}
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            required
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark-700 mb-2">
            {t('timeEntry.date')}
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark-700 mb-2">
            {t('timeEntry.hours')}
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            placeholder="8.0"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-dark-700 mb-2">
            {t('timeEntry.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
            rows={3}
            placeholder={t('timeEntry.descriptionPlaceholder')}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          {loading ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </form>
  );
}
