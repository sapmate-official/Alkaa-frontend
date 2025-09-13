import { Holiday } from '../types/holiday.types';
import { getHolidayTypeColor, groupHolidaysByMonth } from '../utils/holiday.utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CalendarViewProps {
  holidays: Holiday[];
  year: number;
  setYear: (year: number) => void;
}

export const CalendarView = ({ holidays, year, setYear }: CalendarViewProps) => {
  const holidaysByMonth = groupHolidaysByMonth(holidays, year);
  const orderedMonths = Object.keys(holidaysByMonth).sort(
    (a, b) => new Date(`${a} 1, ${year}`).getTime() - new Date(`${b} 1, ${year}`).getTime()
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Company Holidays for {year}</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setYear(year - 1)} 
          >
            {year - 1}
          </Button>
          <Button 
            variant="default"
          >
            {year}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setYear(year + 1)} 
          >
            {year + 1}
          </Button>
        </div>
      </div>
      
      {orderedMonths.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">No holidays found for {year}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orderedMonths.map(month => (
            <Card key={month}>
              <CardHeader className="py-2">
                <CardTitle className="text-base">{month}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Holiday</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidaysByMonth[month].map(holiday => (
                      <TableRow key={holiday.id}>
                        <TableCell>
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{holiday.name}</TableCell>
                        <TableCell>
                          <Badge className={getHolidayTypeColor(holiday.holidayType?.name || 'Default')}>
                            {holiday.holidayType?.name || 'Default'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {holiday.isOptional ? 
                            "Optional Attendance" : 
                            "Office Closed"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Holiday Types:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {holidays.map(h => h.holidayType?.name).filter((value, index, self) => value && self.indexOf(value) === index).map((typeName, index) => (
              <div key={index} className="flex items-center">
                <Badge variant="outline" className={getHolidayTypeColor(typeName || 'Default')}>
                  {typeName}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
