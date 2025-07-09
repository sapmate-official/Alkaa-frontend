import { Holiday, HolidaysByMonth } from '../types/holiday.types';

export const getHolidayTypeColor = (type: string) => {
  switch(type) {
    case 'Public Holiday': return 'bg-blue-100 text-blue-800';
    case 'Company Holiday': return 'bg-green-100 text-green-800';
    case 'Company Event': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
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
