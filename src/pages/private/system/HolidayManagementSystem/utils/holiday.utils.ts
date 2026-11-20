import { Holiday, HolidaysByMonth } from '../types/holiday.types';

export const getHolidayTypeColor = (type: string) => {
  switch(type) {
    case 'Public Holiday': 
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    case 'Company Holiday': 
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    case 'Company Event': 
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20';
    default: 
      return 'bg-secondary text-secondary-foreground border border-border/40';
  }
};

export const getMonthName = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long' });
};

export const groupHolidaysByMonth = (holidays: Holiday[], year: number): HolidaysByMonth => {
  // Filter holidays for the current year
  const filteredHolidays = holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.getFullYear() === year;
  });

  const holidaysByMonth = filteredHolidays.reduce<HolidaysByMonth>((acc, holiday) => {
    const month = getMonthName(holiday.date);
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(holiday);
    return acc;
  }, {});

  Object.keys(holidaysByMonth).forEach(month => {
    holidaysByMonth[month].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  });

  return holidaysByMonth;
};

// Format date to YYYY-MM-DD string
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Parse date from API
export const parseAPIDate = (dateString: string): Date => {
  return new Date(dateString);
};
