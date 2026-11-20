import { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Holiday, HolidayType } from './types/holiday.types';
import { CalendarView } from './components/CalendarView';
import { AdminView } from './components/AdminView';
import { PolicyView } from './components/PolicyView';
import { 
  useHolidaysByOrg, 
  useHolidayTypesByOrg, 
  useCreateHoliday, 
  useDeleteHoliday,
  useCreateHolidayType,
  useUpdateHolidayType,
  useDeleteHolidayType
} from '@/hooks/queries/useHolidays';
import { useAuth } from '@/providers/AuthContext';
import { usePermissions } from '@/store/useAuthStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';

const HolidayManagementSystem = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');
  const [year, setYear] = useState(new Date().getFullYear());
  const orgId = user?.orgId || '';
  const { toast } = useToast();
  const permissionList = usePermissions();
  const canManageHolidays = permissionList.some(p => p.key === 'holiday_manage');

  // TanStack Query hooks for server state
  const { data: rawHolidays = [], isLoading: holidaysLoading, error: holidaysError } = useHolidaysByOrg(orgId);
  const { data: rawTypes = [], isLoading: typesLoading } = useHolidayTypesByOrg(orgId);

  // TanStack Query mutations
  const createHolidayMutation = useCreateHoliday();
  const deleteHolidayMutation = useDeleteHoliday();
  const createTypeMutation = useCreateHolidayType();
  const updateTypeMutation = useUpdateHolidayType();
  const deleteTypeMutation = useDeleteHolidayType();

  const loading = holidaysLoading || typesLoading;
  const error = holidaysError ? 'Failed to load holiday data. Please try again later.' : null;

  const holidays = (rawHolidays as unknown as Holiday[]) || [];
  const holidayTypes = (rawTypes as unknown as HolidayType[]) || [];

  // Set default tab based on permissions
  useEffect(() => {
    if (!canManageHolidays && activeTab === 'admin') {
      setActiveTab('calendar');
    }
  }, [canManageHolidays, activeTab]);

  const handleAddHoliday = async (holidayData: Omit<Holiday, 'id'>) => {
    try {
      await createHolidayMutation.mutateAsync({
        name: holidayData.name,
        date: holidayData.date,
        typeId: holidayData.type,
        description: holidayData.description,
        isOptional: holidayData.isOptional,
        organizationId: orgId,
      });
      toast({
        title: 'Success',
        description: 'Holiday added successfully',
      });
    } catch (err) {
      console.error('Error adding holiday:', err);
      toast({
        title: 'Error',
        description: 'Failed to add holiday. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHolidayMutation.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Holiday deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting holiday:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete holiday. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddHolidayType = async (holidayType: Omit<HolidayType, 'id'>) => {
    try {
      await createTypeMutation.mutateAsync({
        name: holidayType.name,
        policy: holidayType.policy,
        organizationId: orgId,
      });
      toast({
        title: 'Success',
        description: 'Holiday type added successfully',
      });
    } catch (err) {
      console.error('Error adding holiday type:', err);
      toast({
        title: 'Error',
        description: 'Failed to add holiday type',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateHolidayType = async (id: string, holidayType: Partial<HolidayType>) => {
    try {
      await updateTypeMutation.mutateAsync({
        id,
        data: {
          name: holidayType.name,
          policy: holidayType.policy,
        },
      });
      toast({
        title: 'Success',
        description: 'Holiday type updated successfully',
      });
    } catch (err) {
      console.error('Error updating holiday type:', err);
      toast({
        title: 'Error',
        description: 'Failed to update holiday type',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHolidayType = async (id: string) => {
    try {
      await deleteTypeMutation.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Holiday type deleted successfully',
      });
    } catch (err: unknown) {
      console.error('Error deleting holiday type:', err);
      const error = err as { response?: { status?: number; data?: { error?: string } } };
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete holiday type',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-muted-foreground" />
            Company Holidays
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Annual company holiday schedule, observances, and policies
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64 border rounded-xl bg-card">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className={`grid ${canManageHolidays ? 'w-full sm:w-[480px] grid-cols-3' : 'w-full sm:w-[320px] grid-cols-2'}`}>
            <TabsTrigger value="calendar">Holiday Calendar</TabsTrigger>
            {canManageHolidays && (
              <TabsTrigger value="admin">Manage Holidays</TabsTrigger>
            )}
            <TabsTrigger value="policy">Holiday Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <CalendarView 
              holidays={holidays} 
              year={year} 
              setYear={setYear}
            />
          </TabsContent>
          
          {canManageHolidays && (
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
          )}

          <TabsContent value="policy">
            <PolicyView />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default HolidayManagementSystem;


