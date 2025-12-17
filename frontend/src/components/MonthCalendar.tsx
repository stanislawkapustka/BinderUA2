import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { pl, enUS, uk } from 'date-fns/locale';
import api from '../lib/api';
import type { TimeEntry, User } from '../types';

interface MonthCalendarProps {
  currentDate: Date;
  onDayClick: (date: Date) => void;
  user: User;
  selectedUserId?: number | null;
}

interface DayStatus {
  date: Date;
  hasEntry: boolean;
  isHoliday: boolean;
  totalHours?: number;
  status?: string;
  billingType?: 'HOURLY' | 'UNIT';
  unitName?: string;
}

interface Holiday {
  id: number;
  date: string;
  name: string;
}

/**
 * MonthCalendar Component
 * 
 * Displays a calendar view for the current month with time entry status indicators.
 * - Shows entries with total hours (HOURLY) or quantity (UNIT)
 * - Color-codes days by entry status: approved (green), submitted (blue), rejected (red)
 * - Fetches time entries on mount and when month/selectedUserId changes
 * - Supports viewing specific user's entries via selectedUserId prop
 */
export default function MonthCalendar({ currentDate, onDayClick, user, selectedUserId }: MonthCalendarProps) {
  const { t, i18n } = useTranslation();
  const [dayStatuses, setDayStatuses] = useState<Map<string, DayStatus>>(new Map());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const locale = i18n.language === 'pl' ? pl : i18n.language === 'ua' ? uk : enUS;

  /**
   * Fetch time entries for the current month and build day status map
   */
  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Fetch time entries for current month
      const { data: entries } = selectedUserId
        ? await api.get<TimeEntry[]>(`/time-entries/user/${selectedUserId}/month/${year}/${month}`)
        : await api.get<TimeEntry[]>('/time-entries', {
          params: { month, year }
        });

      // Fetch all projects and tasks to enrich entries with billing type
      let taskMap = new Map();
      try {
        const { data: projects } = await api.get('/projects');
        for (const project of projects) {
          try {
            const { data: tasks } = await api.get(`/tasks/project/${project.id}`);
            tasks.forEach((task: any) => {
              taskMap.set(task.id, task);
            });
          } catch (err) {
            // Ignore if tasks not available for this project
          }
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }

      // Enrich entries with billing type and unit name
      const enrichedEntries = entries.map(entry => ({
        ...entry,
        billingType: taskMap.get(entry.taskId)?.billingType || 'HOURLY',
        unitName: taskMap.get(entry.taskId)?.unitName
      }));

      // TODO: Add holidays endpoint in backend
      const holidayData: Holiday[] = [];
      setHolidays(holidayData);

      // Build day status map
      const statusMap = new Map<string, DayStatus>();

      // Initialize all days in month
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      let day = monthStart;
      while (day <= monthEnd) {
        const dateKey = format(day, 'yyyy-MM-dd');
        const holiday = holidayData.find(h => h.date === dateKey);

        statusMap.set(dateKey, {
          date: new Date(day),
          hasEntry: false,
          isHoliday: !!holiday,
          totalHours: 0,
        });
        day = addDays(day, 1);
      }

      // Add entry data to status map
      enrichedEntries.forEach(entry => {
        const dateKey = entry.date;
        const existing = statusMap.get(dateKey);
        if (existing) {
          // For HOURLY entries use totalHours, for UNIT entries use quantity
          const value = entry.totalHours !== undefined && entry.totalHours !== null
            ? Number(entry.totalHours)
            : (entry.quantity !== undefined && entry.quantity !== null ? Number(entry.quantity) : 0);

          // Store billing type from enriched entry
          const billingType = entry.billingType || 'HOURLY';

          statusMap.set(dateKey, {
            ...existing,
            hasEntry: true,
            totalHours: (existing.totalHours || 0) + value,
            status: entry.status,
            billingType: billingType,
            unitName: entry.unitName,
          });
        }
      });

      setDayStatuses(statusMap);
    } catch (error) {
      console.error('Failed to fetch month data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [currentDate, selectedUserId]);

  /**
   * Toggle a day as holiday (right-click). Only DYREKTOR can do this.
   */
  const toggleHoliday = async (date: Date) => {
    // TODO: Implement when backend has holidays endpoint
    if (user.role !== 'DYREKTOR') return;
    console.log('Holiday toggle not yet implemented - backend endpoint needed');
  };

  /**
   * Get all calendar days including padding days from adjacent months
   */
  const renderCalendarDays = (): Date[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale });
    const endDate = endOfWeek(monthEnd, { locale });

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }

    return days;
  };

  /**
   * Get CSS classes for a day cell based on its status
   */
  const getDayClassName = (date: Date): string => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayStatus = dayStatuses.get(dateKey);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isToday = isSameDay(date, new Date());

    let className = 'min-h-[72px] p-2 border rounded-md cursor-pointer transition-all duration-200 hover:shadow-md ';

    if (!isCurrentMonth) {
      className += 'bg-dark-50 text-dark-400 border-dark-200 ';
    } else if (dayStatus?.isHoliday) {
      className += 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-md ';
    } else if (dayStatus?.hasEntry) {
      if (dayStatus.status === 'ZATWIERDZONY') {
        className += 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 shadow-md ';
      } else if (dayStatus.status === 'ODRZUCONY') {
        className += 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 shadow-md ';
      } else {
        className += 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-md ';
      }
    } else {
      className += 'bg-white hover:bg-dark-50 border-dark-300 ';
    }

    if (isToday) {
      className += 'ring-4 ring-accent-500 ring-offset-2 ';
    }

    return className;
  };

  /**
   * Format the entry value display
   * HOURLY: "10h"
   * UNIT: "10 szt." or "10 {unitName}"
   */
  const formatEntryValue = (dayStatus: DayStatus): string => {
    if (!dayStatus.totalHours) return '';

    if (dayStatus.billingType === 'UNIT') {
      return `${dayStatus.totalHours} ${dayStatus.unitName || 'szt.'}`;
    }
    return `${dayStatus.totalHours}h`;
  };

  /**
   * Get status display text and color
   */
  const getStatusDisplay = (status?: string): { text: string; color: string } => {
    switch (status) {
      case 'ZATWIERDZONY':
        return { text: 'Zatwierdzony', color: 'text-green-600' };
      case 'ODRZUCONY':
        return { text: 'Odrzucony', color: 'text-red-600' };
      default:
        return { text: 'Zgłoszony', color: 'text-blue-600' };
    }
  };

  const handleDayClick = (date: Date) => {
    // Always open form on left click, regardless of role or status
    onDayClick(date);
  };

  const handleContextMenu = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    if (user.role === 'DYREKTOR') {
      toggleHoliday(date);
    }
  };

  const days = renderCalendarDays();
  const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border-t-4 border-primary-600">
      {/* Header with month/year */}
      <div className="mb-6 pb-4 border-b-2 border-dark-200">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-dark-900 to-primary-700 bg-clip-text text-transparent">
          {format(currentDate, 'LLLL yyyy', { locale })}
        </h2>
        {user.role === 'DYREKTOR' && (
          <p className="text-sm text-dark-600 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-accent-500 rounded-full"></span>
            Prawy klik na dzień aby oznaczyć jako święto
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded shadow-sm"></div>
          <span className="font-medium text-green-800">Zatwierdzony</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded shadow-sm"></div>
          <span className="font-medium text-blue-800">Zgłoszony</span>
        </div>
        <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded shadow-sm"></div>
          <span className="font-medium text-red-800">Odrzucony</span>
        </div>
        <div className="flex items-center gap-2 bg-dark-50 px-3 py-2 rounded-lg">
          <div className="w-4 h-4 bg-white border-2 border-dark-300 rounded shadow-sm"></div>
          <span className="font-medium text-dark-700">Brak wpisu</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-3">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div key={day} className="text-center font-bold text-dark-700 py-3 bg-dark-100 rounded-lg">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayStatus = dayStatuses.get(dateKey);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const statusDisplay = dayStatus ? getStatusDisplay(dayStatus.status) : { text: '', color: '' };

          return (
            <div
              key={dateKey}
              className={getDayClassName(date)}
              onClick={() => handleDayClick(date)}
              onContextMenu={(e) => handleContextMenu(e, date)}
            >
              <div className="flex flex-col h-full">
                <div className="font-semibold text-lg mb-1">
                  {format(date, 'd')}
                </div>

                {isCurrentMonth && dayStatus && (
                  <div className="flex-1 flex flex-col justify-between text-xs">
                    {dayStatus.isHoliday ? (
                      <div className="text-red-600 font-medium">🎉 Święto</div>
                    ) : dayStatus.hasEntry ? (
                      <div className="space-y-1">
                        <div className="font-medium text-gray-700">
                          ✓ {formatEntryValue(dayStatus)}
                        </div>
                        <div className={`text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.text}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs">Brak wpisu</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
