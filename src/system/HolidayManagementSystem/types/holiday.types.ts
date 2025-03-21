export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  description?: string;
  isOptional: boolean;
  orgId: string;
  holidayType?: HolidayType;
}

export interface HolidaysByMonth {
  [key: string]: Holiday[];
}

export interface HolidayType {
  id: string;
  name: string;
  policy?: string;
  orgId: string;
}

export interface HolidayFormData {
  name: string;
  date: string;
  type: string;
  description?: string;
  isOptional: boolean;
  orgId: string;
}
