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
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MonthOption {
  value: number;
  label?: string;
  name?: string;
}

interface MonthYearPickerProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  className?: string;
  color?: string; // Kept for backwards-compatibility
}

const DEFAULT_MONTHS: MonthOption[] = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ 
  month, 
  year, 
  onMonthChange, 
  onYearChange,
  className
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={month.toString()}
        onValueChange={(val) => onMonthChange(Number(val))}
      >
        <SelectTrigger className="w-[130px] h-9 text-xs font-medium">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="text-xs">Month</SelectLabel>
            {DEFAULT_MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value.toString()} className="text-xs">
                {m.label || m.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={year.toString()}
        onValueChange={(val) => onYearChange(Number(val))}
      >
        <SelectTrigger className="w-[95px] h-9 text-xs font-medium">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="text-xs">Year</SelectLabel>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()} className="text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export const MonthAndYearSelector = ({ 
  selectedMonth, 
  setSelectedMonth, 
  months = DEFAULT_MONTHS, 
  selectedYear, 
  setSelectedYear, 
  years,
  className
}: {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  months?: MonthOption[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  years?: number[];
  className?: string;
}) => {
  const currentYear = new Date().getFullYear();
  const yearList = years || Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Payroll Period</h3>
            <p className="text-xs text-muted-foreground">Select month and year to inspect payslip records</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setSelectedMonth(parseInt(val))}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()} className="text-xs">
                  {m.label || m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => setSelectedYear(parseInt(val))}
          >
            <SelectTrigger className="w-[95px] h-9 text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearList.map((y) => (
                <SelectItem key={y} value={y.toString()} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthYearPicker;
