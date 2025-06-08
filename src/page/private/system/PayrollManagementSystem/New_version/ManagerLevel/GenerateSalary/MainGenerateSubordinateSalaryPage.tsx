import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarIcon, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { APIV3Dictionary } from '@/api/v3/Api3Dicts';
import { APIV2Dictionary } from '@/api/v2/Api2Dicts';

interface Subordinate {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  email: string;
  department?: {
    name: string;
  };
  salaryGenerated?: boolean;
}

const MainGenerateSubordinateSalaryPage = () => {
  // States
  const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedSubordinates, setSelectedSubordinates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Generate array of months
  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];
  
  // Generate array of years (last 2 years, current year, next year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => (currentYear - 2 + i).toString());
  
  // Fetch subordinates list with API dictionary
  const fetchSubordinates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await axios.get(APIV2Dictionary.user.getSubordinateList(),{
        withCredentials: true,
      });
      
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setSubordinates(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setSubordinates([]);
        setErrorMessage('Received invalid data format from server');
      }
    } catch (error) {
      console.error('Error fetching subordinates:', error);
      setSubordinates([]);
      setErrorMessage('Failed to fetch subordinates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check which subordinates already have salaries generated
  const checkExistingSalaries = async () => {
    if (!subordinates.length) return;
    
    setIsLoading(true);
    const updatedSubordinates = [...subordinates];
    const month = parseInt(selectedMonth) + 1; // Adjusting for API which expects 1-12
    
    try {
      // Check each subordinate
      for (const subordinate of updatedSubordinates) {
        try {
          const response = await axios.get(
            APIV3Dictionary.payroll.getPayslip(month, selectedYear, subordinate.id),{
              withCredentials: true,
            }
          );
          // If payslip exists for this month/year, mark as generated
          subordinate.salaryGenerated = response.data.data && response.data.data.length > 0;
        } catch (error) {
          // If error is 404, it means no salary record found
          subordinate.salaryGenerated = false;
        }
      }
      
      setSubordinates(updatedSubordinates);
      // Clear selected subordinates that already have salaries generated
      setSelectedSubordinates(prev => 
        prev.filter(id => 
          !updatedSubordinates.find(sub => sub.id === id)?.salaryGenerated
        )
      );
    } catch (error) {
      console.error('Error checking existing salaries:', error);
      setErrorMessage('Error verifying existing salary records');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load subordinates on mount
  useEffect(() => {
    fetchSubordinates();
  }, []);
  
  // Check for existing salaries when month/year changes
  useEffect(() => {
    if (subordinates.length > 0) {
      checkExistingSalaries();
    }
  }, [selectedMonth, selectedYear, subordinates.length]);
  
  // Handle subordinate selection
  const handleSubordinateSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSubordinates(prev => [...prev, id]);
    } else {
      setSelectedSubordinates(prev => prev.filter(subId => subId !== id));
    }
  };
  
  // Handle select all subordinates
  const handleSelectAll = () => {
    // Ensure subordinates is an array before using filter
    if (!Array.isArray(subordinates)) {
      console.error('Subordinates is not an array:', subordinates);
      return;
    }
    
    const availableSubordinates = subordinates
      .filter(sub => !sub.salaryGenerated)
      .map(sub => sub.id);
    
    // If all available are already selected, unselect all
    if (availableSubordinates.length === selectedSubordinates.length) {
      setSelectedSubordinates([]);
    } else {
      // Otherwise select all available
      setSelectedSubordinates(availableSubordinates);
    }
  };
  
  // Generate salary for selected subordinates
  const handleGenerateSalary = async () => {
    if (selectedSubordinates.length === 0) {
      toast({
        title: "No subordinates selected",
        description: "Please select at least one subordinate to generate salary.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    const month = parseInt(selectedMonth) + 1; // Adjusting for API which expects 1-12
    const results = { success: 0, failed: 0 };
    
    try {
      // Process each selected subordinate
      for (const subordinateId of selectedSubordinates) {
        try {
          await axios.post(
            APIV3Dictionary.payroll.generateSalary(month, selectedYear, subordinateId)
          );
          results.success++;
        } catch (error) {
          console.error(`Error generating salary for user ${subordinateId}:`, error);
          results.failed++;
        }
      }
      
      // Show results toast
      toast({
        title: "Salary Generation Complete",
        description: `Successfully generated ${results.success} salaries. Failed: ${results.failed}`,
        variant: results.failed > 0 ? "destructive" : "default"
      });
      
      // Refresh data
      await checkExistingSalaries();
      
    } catch (error) {
      console.error('Error in salary generation process:', error);
      toast({
        title: "Process Error",
        description: "An unexpected error occurred during salary generation.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Safe access to filtered subordinates
  const getAvailableSubordinates = () => {
    if (!Array.isArray(subordinates)) return [];
    return subordinates.filter(s => !s.salaryGenerated);
  };
  
  const availableSubordinates = getAvailableSubordinates();
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Generate Subordinate Salary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Month and Year selection */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-1">Month</label>
              <Select
                value={selectedMonth}
                onValueChange={(value) => setSelectedMonth(value)}
                disabled={isLoading || isGenerating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-1">Year</label>
              <Select
                value={selectedYear}
                onValueChange={(value) => setSelectedYear(value)}
                disabled={isLoading || isGenerating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Period display */}
          <div className="flex items-center mb-6">
            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
            <span className="text-sm text-muted-foreground">
              Generating salary for {months[parseInt(selectedMonth)].label} {selectedYear}
            </span>
          </div>
          
          {/* Error message */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {/* Subordinates list */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Subordinates</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={isLoading || isGenerating || availableSubordinates.length === 0}
              >
                {selectedSubordinates.length === availableSubordinates.length && 
                  availableSubordinates.length > 0 
                  ? "Unselect All" : "Select All"}
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !Array.isArray(subordinates) || subordinates.length === 0 ? (
              <Alert className="mb-6">
                <AlertTitle>No subordinates found</AlertTitle>
                <AlertDescription>
                  You don't have any subordinates assigned to you.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-4">
                  {subordinates.map((subordinate) => (
                    <div key={subordinate.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`subordinate-${subordinate.id}`}
                            checked={selectedSubordinates.includes(subordinate.id)}
                            onCheckedChange={(checked) => 
                              handleSubordinateSelect(subordinate.id, checked as boolean)
                            }
                            disabled={isLoading || isGenerating || subordinate.salaryGenerated}
                          />
                          <div>
                            <label
                              htmlFor={`subordinate-${subordinate.id}`}
                              className={`font-medium ${subordinate.salaryGenerated ? 'text-muted-foreground' : ''}`}
                            >
                              {subordinate.firstName} {subordinate.lastName}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {subordinate.employeeId} • {subordinate.email}
                            </p>
                            {subordinate.department && (
                              <p className="text-xs text-muted-foreground">
                                {subordinate.department.name}
                              </p>
                            )}
                          </div>
                        </div>
                        {subordinate.salaryGenerated && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Salary Generated
                          </Badge>
                        )}
                      </div>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          {/* Summary and action */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">
                <span className="font-medium">
                  {selectedSubordinates.length} of {availableSubordinates.length}
                </span> subordinates selected for salary generation
              </p>
            </div>
            <Button 
              onClick={handleGenerateSalary}
              disabled={isLoading || isGenerating || selectedSubordinates.length === 0}
              className="w-full md:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : "Generate Salary"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainGenerateSubordinateSalaryPage;