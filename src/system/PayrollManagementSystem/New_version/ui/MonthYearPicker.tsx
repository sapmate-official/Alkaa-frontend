import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthYearPickerProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  color?: string;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ 
  month, 
  year, 
  onMonthChange, 
  onYearChange, 
  color = 'inherit' 
}) => {
  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  // Generate years (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Define styles based on color
  const selectStyles = {
    color: color === 'white' ? 'white' : undefined,
    borderColor: color === 'white' ? 'rgba(255, 255, 255, 0.5)' : undefined,
  };

  return (
    <div className="flex gap-2">
      <Select
        value={month.toString()}
        onValueChange={(value) => onMonthChange(Number(value))}
      >
        <SelectTrigger 
          className="w-[120px]"
          style={selectStyles}
        >
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Month</SelectLabel>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value.toString()}>
                {m.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={year.toString()}
        onValueChange={(value) => onYearChange(Number(value))}
      >
        <SelectTrigger 
          className="w-[100px]"
          style={selectStyles}
        >
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Year</SelectLabel>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
export const MonthAndYearSelector = ({ selectedMonth, setSelectedMonth, months, selectedYear, setSelectedYear, years }:
  {
    selectedMonth: number,
    setSelectedMonth: (month: number) => void,
    months: { value: number; label: string }[],
    selectedYear: number,
    setSelectedYear: (year: number) => void,
    years: number[]
  }
) => {
  return (<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card className="md:col-span-4">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <CardTitle>Payslip Selection</CardTitle>
          <CardDescription>Select month and year to view payslip</CardDescription>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
    </Card>
  </div>)
}