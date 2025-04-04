import { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Holiday, HolidayType } from './types/holiday.types';
import { CalendarView } from './components/CalendarView';
import { AdminView } from './components/AdminView';
import { 
  getHolidaysByOrg, 
  createHoliday, 
  deleteHoliday,
  getHolidayTypesByOrg
} from './services/holiday.service';
import { useAuth } from '@/services/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { holidayTypeService } from './services/holidayType.service';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';

const HolidayManagementSystem = () => {
  const {user} = useAuth()
  const [activeTab, setActiveTab] = useState('calendar');
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setholidays] = useState<Holiday[]>([]);
  const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string>('');
  const {toast} = useToast();
  const [permissionList]  = useAtom(permissionListAtom);
  const canManageHolidays = permissionList.some(permission => permission.key === 'holiday_manage');
  const canViewHolidays = permissionList.some(permission => permission.key === 'holiday_view');
  // Set default tab based on permissions
  useEffect(() => {
    if (!canManageHolidays && activeTab === 'admin') {
      setActiveTab('calendar');
    }
  }, [canManageHolidays, activeTab]);

  useEffect(() => {
    setOrgId(user?.orgId || '');
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [holidays, types] = await Promise.all([
          getHolidaysByOrg(orgId),
          getHolidayTypesByOrg(orgId)
        ]);
        
        setholidays(holidays);
        setHolidayTypes(types);
        setError(null);
      } catch (err) {
        console.error('Error loading holiday data:', err);
        setError('Failed to load holiday data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    if(orgId) fetchData();
  }, [orgId]);

  const handleAddHoliday = async (holidayData: Omit<Holiday, 'id'>) => {
    try {
      const newHoliday = await createHoliday(holidayData);
      setholidays([...holidays, newHoliday]);
    } catch (err) {
      console.error('Error adding holiday:', err);
      setError('Failed to add holiday. Please try again.');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday(id);
      setholidays(holidays.filter(holiday => holiday.id !== id));
    } catch (err) {
      console.error('Error deleting holiday:', err);
      setError('Failed to delete holiday. Please try again.');
    }
  };
  const handleAddHolidayType = async (holidayType: Omit<HolidayType, 'id'>) => {
    try {
      const newHolidayType = await holidayTypeService.createHolidayType(holidayType);
      
      // Update the local state with the new holiday type
      setHolidayTypes(prevTypes => [...prevTypes, newHolidayType]);
      toast({
        title: 'Success',
        description: 'Holiday type added successfully'
      });
    } catch (err) {
      console.error('Error adding holiday type:', err);
      toast({
        title: 'Error',
        description: 'Failed to add holiday type'
      });
    }
  };

  // Handler for updating a holiday type
  const handleUpdateHolidayType = async (id: string, holidayType: Partial<HolidayType>) => {
    try {
      const updatedHolidayType = await holidayTypeService.updateHolidayType(id, holidayType);
      
      // Update the local state with the updated holiday type
      setHolidayTypes(prevTypes => 
        prevTypes.map(type => type.id === id ? updatedHolidayType : type)
      );
      
      // Also update the holiday objects that use this type
      setholidays(prevHolidays => 
        prevHolidays.map(holiday => {
          if (holiday.type === id) {
            return {
              ...holiday,
              holidayType: updatedHolidayType
            };
          }
          return holiday;
        })
      );
      
      toast({
        title: 'Success',
        description: 'Holiday type updated successfully'
      });
    } catch (err) {
      console.error('Error updating holiday type:', err);
      toast({
        title: 'Error',
        description: 'Failed to update holiday type'
      });
    }
  };

  // Handler for deleting a holiday type
  const handleDeleteHolidayType = async (id: string) => {
    try {
      await holidayTypeService.deleteHolidayType(id);
      
      // Update the local state by removing the deleted holiday type
      setHolidayTypes(prevTypes => prevTypes.filter(type => type.id !== id));
      
      // Check if any holidays were using this type and update them
      const affectedHolidays = holidays.filter(holiday => holiday.type === id);
      if (affectedHolidays.length > 0) {
        toast({
            title: 'Warning',
            description: `${affectedHolidays.length} holidays were using this type and will need to be updated`
        });
      }
      
      toast({
        title: 'Success',
        description: 'Holiday type deleted successfully'
      });
    } catch (err: any) {
      console.error('Error deleting holiday type:', err);
      if (err.response && err.response.status === 400) {
        // This likely means the holiday type is in use
        toast({
            title: 'Error',
            description: err.response.data.error || 'This holiday type is in use and cannot be deleted'
        });
      } else {
        toast({
            title: 'Error',
            description: 'Failed to delete holiday type'
        });
      }
    }
  };

  return (
    <Card className="w-full bg-background shadow-md overflow-y-scroll">
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-foreground flex items-center">
          <Calendar className="mr-2" /> Company Holiday Calendar
        </h1>
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Show tabs only when user has manage permissions */}
            {canManageHolidays ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-1/2 grid-cols-2">
                  <TabsTrigger value="calendar">Holiday Calendar</TabsTrigger>
                  <TabsTrigger value="admin">Manage Holidays</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar">
                  <CalendarView 
                    holidays={holidays} 
                    year={year} 
                    setYear={setYear}
                  />
                </TabsContent>
                
                <TabsContent value="admin">
                  <AdminView
                    holidays={holidays}
                    holidayTypes={holidayTypes}
                    orgId={orgId || ''}
                    onAddHoliday={handleAddHoliday}
                    onDeleteHoliday={handleDeleteHoliday}
                    onAddHolidayType={handleAddHolidayType}
                    onUpdateHolidayType={handleUpdateHolidayType}
                    onDeleteHolidayType={handleDeleteHolidayType}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              /* Directly render calendar view when only one tab is available */
              <CalendarView 
                holidays={holidays} 
                year={year} 
                setYear={setYear}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HolidayManagementSystem;


