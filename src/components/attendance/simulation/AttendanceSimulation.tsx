import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { userAtom } from '../../../store/atom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Play, 
  Users, 
  Calculator, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  FileText
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { SimulationService } from '../../../services/AttendanceService';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  rules: {
    lateArrival: { enabled: boolean; thresholdMinutes: number; penaltyAmount: number };
    earlyDeparture: { enabled: boolean; thresholdMinutes: number; penaltyAmount: number };
    minimumHours: { enabled: boolean; minimumHours: number; penaltyPerHour: number };
    breakViolation: { enabled: boolean; maxBreakMinutes: number; penaltyAmount: number };
    geofenceViolation: { enabled: boolean; penaltyAmount: number };
  };
  geofences: Array<{
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    type: string;
  }>;
  employees: Array<{
    id: string;
    name: string;
    monthlySalary: number;
    attendancePattern: 'perfect' | 'late_arrival' | 'early_departure' | 'break_violations' | 'geofence_violations' | 'mixed';
  }>;
  simulationPeriod: {
    month: number;
    year: number;
    workingDays: number;
  };
}

const AttendanceSimulation: React.FC<{ orgId: string }> = ({ orgId: _orgId }) => {
  const { toast } = useToast();
  const [user] = useAtom(userAtom);
  
  // Get orgId from user atom or fallback to prop
  const orgId = user?.orgId || _orgId;
  
  // Show error if orgId is not available
  if (!orgId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Organization ID is required to run simulations. Please ensure you are logged in with a valid organization.
        </AlertDescription>
      </Alert>
    );
  }
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('comprehensive');

  // Pre-defined simulation scenarios
  const scenarios: Record<string, SimulationScenario> = {
    comprehensive: {
      id: 'comprehensive',
      name: 'Comprehensive Test',
      description: 'Tests all attendance rules, break policies, and geofencing with various employee patterns',
      rules: {
        lateArrival: { enabled: true, thresholdMinutes: 15, penaltyAmount: 100 },
        earlyDeparture: { enabled: true, thresholdMinutes: 30, penaltyAmount: 150 },
        minimumHours: { enabled: true, minimumHours: 8, penaltyPerHour: 50 },
        breakViolation: { enabled: true, maxBreakMinutes: 60, penaltyAmount: 25 },
        geofenceViolation: { enabled: true, penaltyAmount: 200 }
      },
      geofences: [
        { name: 'Main Office', latitude: 28.6139, longitude: 77.2090, radius: 100, type: 'MAIN_OFFICE' },
        { name: 'Branch Office', latitude: 28.7041, longitude: 77.1025, radius: 150, type: 'BRANCH_OFFICE' }
      ],
      employees: [
        { id: 'emp1', name: 'Perfect Employee', monthlySalary: 50000, attendancePattern: 'perfect' },
        { id: 'emp2', name: 'Late Comer', monthlySalary: 45000, attendancePattern: 'late_arrival' },
        { id: 'emp3', name: 'Early Leaver', monthlySalary: 48000, attendancePattern: 'early_departure' },
        { id: 'emp4', name: 'Break Violator', monthlySalary: 42000, attendancePattern: 'break_violations' },
        { id: 'emp5', name: 'Location Violator', monthlySalary: 46000, attendancePattern: 'geofence_violations' },
        { id: 'emp6', name: 'Mixed Issues', monthlySalary: 44000, attendancePattern: 'mixed' }
      ],
      simulationPeriod: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        workingDays: 22
      }
    },
    basicTest: {
      id: 'basicTest',
      name: 'Basic Attendance Test',
      description: 'Simple test with just late arrival and early departure rules',
      rules: {
        lateArrival: { enabled: true, thresholdMinutes: 10, penaltyAmount: 50 },
        earlyDeparture: { enabled: true, thresholdMinutes: 20, penaltyAmount: 75 },
        minimumHours: { enabled: false, minimumHours: 8, penaltyPerHour: 0 },
        breakViolation: { enabled: false, maxBreakMinutes: 60, penaltyAmount: 0 },
        geofenceViolation: { enabled: false, penaltyAmount: 0 }
      },
      geofences: [
        { name: 'Test Office', latitude: 28.6139, longitude: 77.2090, radius: 200, type: 'MAIN_OFFICE' }
      ],
      employees: [
        { id: 'emp1', name: 'Good Employee', monthlySalary: 30000, attendancePattern: 'perfect' },
        { id: 'emp2', name: 'Problematic Employee', monthlySalary: 30000, attendancePattern: 'mixed' }
      ],
      simulationPeriod: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        workingDays: 22
      }
    }
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setSimulationResults(null);
    const scenario = scenarios[selectedScenario];

    try {
      setCurrentStep('Initializing simulation...');
      
      // Call the backend simulation API
      const response = await SimulationService.runSimulation(orgId, {
        scenario: selectedScenario,
        month: scenario.simulationPeriod.month,
        year: scenario.simulationPeriod.year
      });

      if (response.success) {
        setSimulationResults(response.data);
        setCurrentStep('Simulation completed successfully!');
        
        toast({
          title: "Simulation Completed",
          description: `Processed ${response.data.summary.totalEmployees} employees with ${response.data.summary.totalViolations} violations`,
        });
      } else {
        throw new Error(response.message || 'Simulation failed');
      }

    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : "An error occurred during simulation",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!simulationResults) return;
    
    const report = {
      scenario: simulationResults.scenario,
      timestamp: new Date().toISOString(),
      summary: simulationResults.summary,
      employees: simulationResults.employees
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-simulation-${Date.now()}.json`;
    a.click();
  };

  const cleanupSimulation = async () => {
    try {
      await SimulationService.cleanupSimulation(orgId);
      toast({
        title: "Cleanup Completed",
        description: "All simulation data has been removed from the system",
      });
      setSimulationResults(null);
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "Failed to clean up simulation data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance & Payroll Simulation</h2>
          <p className="text-gray-600">Test attendance rules, break policies, and payroll calculations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runSimulation} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run Simulation'}
          </Button>
          {simulationResults && (
            <Button 
              onClick={downloadReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Download Report
            </Button>
          )}
          {simulationResults && (
            <Button 
              onClick={cleanupSimulation}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Cleanup Data
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Scenario</CardTitle>
              <CardDescription>Choose a pre-configured simulation scenario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scenario">Select Scenario</Label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(scenarios).map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedScenario && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold">{scenarios[selectedScenario].name}</h4>
                    <p className="text-sm text-muted-foreground">{scenarios[selectedScenario].description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Active Rules</h5>
                        <div className="space-y-1">
                          {Object.entries(scenarios[selectedScenario].rules).map(([key, rule]) => (
                            rule.enabled && (
                              <Badge key={key} variant="secondary" className="mr-2">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">Test Employees</h5>
                        <p className="text-sm text-muted-foreground">
                          {scenarios[selectedScenario].employees.length} employees with different attendance patterns
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Progress</CardTitle>
              <CardDescription>Live status of the running simulation</CardDescription>
            </CardHeader>
            <CardContent>
              {isRunning && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium">{currentStep}</span>
                  </div>
                </div>
              )}
              
              {simulationResults && (
                <div className="space-y-2">
                  {simulationResults.steps.map((step: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {simulationResults ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Summary</CardTitle>
                  <CardDescription>Overall results for {simulationResults.scenario}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Employees</span>
                      </div>
                      <p className="text-2xl font-bold">{simulationResults.summary.totalEmployees}</p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Violations</span>
                      </div>
                      <p className="text-2xl font-bold">{simulationResults.summary.totalViolations}</p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Total Penalties</span>
                      </div>
                      <p className="text-2xl font-bold">₹{simulationResults.summary.totalPenalties}</p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        <span className="text-sm font-medium">Payroll Status</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {simulationResults.summary.payrollGenerated ? '✅' : '❌'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {simulationResults.employees && simulationResults.employees.map((empData: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{empData.name}</span>
                        <Badge variant={empData.violations.length > 0 ? "destructive" : "secondary"}>
                          {empData.violations.length} violations
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Salary: ₹{empData.monthlySalary} → ₹{empData.finalSalary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Penalties:</span>
                          <span className="font-medium">₹{empData.totalPenalties}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Final Salary:</span>
                          <span className="font-medium">₹{empData.finalSalary}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Salary Reduction:</span>
                          <span className="font-medium">
                            {((empData.totalPenalties / empData.monthlySalary) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No simulation results yet. Run a simulation to see the results here.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceSimulation;
