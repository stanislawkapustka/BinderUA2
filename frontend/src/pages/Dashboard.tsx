import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, addMonths, subMonths } from 'date-fns';
import api from '../lib/api';
import MonthCalendar from '../components/MonthCalendar';
import TimeEntryForm from '../components/TimeEntryForm';
import TimeEntryTable from '../components/TimeEntryTable';
import type { User, TimeEntry } from '../types';

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dayEntries, setDayEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const user = getUserFromStorage();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, []);

  const handleDayClick = async (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
    setLoadingEntries(true);
    
    try {
      // Fetch entries for selected day
      const dateStr = format(date, 'yyyy-MM-dd');
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const { data: allEntries } = await api.get<TimeEntry[]>('/time-entries', {
        params: { month, year }
      });
      
      // Filter entries for selected date
      const filteredEntries = allEntries.filter(entry => entry.date === dateStr);
      setDayEntries(filteredEntries);
    } catch (err) {
      console.error('Error fetching day entries:', err);
      setDayEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleFormSuccess = () => {
    // Refresh entries for selected day
    if (selectedDate) {
      handleDayClick(selectedDate);
    }
    // Refresh calendar
    setCalendarKey(prev => prev + 1);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedDate(null);
    setDayEntries([]);
  };

  const handleEntryUpdate = () => {
    // Refresh entries and calendar
    if (selectedDate) {
      handleDayClick(selectedDate);
    }
    setCalendarKey(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-dark-900 via-dark-800 to-primary-900 shadow-lg border-b-4 border-accent-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                BinderUA
              </h1>
              <div className="ml-4 px-3 py-1 bg-accent-500 text-white text-xs font-semibold rounded-full">
                Time Tracker
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-white font-semibold">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-dark-300">
                    {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm font-medium"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Month Navigation */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-accent-500">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousMonth}
                className="px-6 py-3 text-dark-700 bg-dark-100 hover:bg-dark-200 rounded-lg transition-all font-medium flex items-center gap-2 hover:shadow-md"
              >
                <span>←</span> Poprzedni miesiąc
              </button>
              
              <button
                onClick={handleToday}
                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                Dzisiaj
              </button>
              
              <button
                onClick={handleNextMonth}
                className="px-6 py-3 text-dark-700 bg-dark-100 hover:bg-dark-200 rounded-lg transition-all font-medium flex items-center gap-2 hover:shadow-md"
              >
                Następny miesiąc <span>→</span>
              </button>
            </div>
          </div>

          {/* Calendar */}
          <MonthCalendar
            key={calendarKey}
            currentDate={currentDate}
            onDayClick={handleDayClick}
            user={user}
          />
        </div>
      </main>

      {/* Modal for Time Entries */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {format(selectedDate, 'dd MMMM yyyy')}
                </h2>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Existing entries for this day */}
              {loadingEntries ? (
                <div className="mb-6 text-center py-4">
                  <p className="text-gray-500">{t('common.loading')}</p>
                </div>
              ) : dayEntries.length > 0 ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Istniejące wpisy</h3>
                  <TimeEntryTable 
                    entries={dayEntries}
                    currentUser={user}
                    onUpdate={handleEntryUpdate}
                  />
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-center">Brak wpisów czasu pracy dla tego dnia</p>
                </div>
              )}

              {/* Form to add new entry */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Dodaj nowy wpis</h3>
                <TimeEntryForm 
                  onSuccess={handleFormSuccess}
                  initialDate={selectedDate}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
