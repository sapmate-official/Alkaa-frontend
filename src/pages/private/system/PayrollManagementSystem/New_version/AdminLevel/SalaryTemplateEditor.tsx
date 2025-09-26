import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthContext'
import axios from 'axios'
import { APIV3Dictionary } from '@/services/api/v3/Api3Dicts'
import { toast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings,
  Plus,
  Calculator,
  Building2
} from 'lucide-react'
import { CalculationRule, SalaryTemplate } from '../types/payroll'
import { mockCalculationRules, mockSalaryTemplates } from '../utils/mockData'

const SalaryTemplateEditor = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [calculationRules, setCalculationRules] = useState<CalculationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchTemplateData = useCallback(async () => {
    if (!user?.id) return;

    let fallbackUsed = false;

    try {
      setIsLoading(true);

      const [templatesResponse, rulesResponse] = await Promise.allSettled([
        axios.get(APIV3Dictionary.payroll.templates.list, { withCredentials: true }),
        axios.get(APIV3Dictionary.payroll.templates.rules, { withCredentials: true })
      ]);

      if (templatesResponse.status === 'fulfilled' && templatesResponse.value.data.success) {
        setTemplates(templatesResponse.value.data.data || []);
      } else {
        console.warn('Falling back to mock salary templates:', templatesResponse);
        setTemplates(mockSalaryTemplates);
        fallbackUsed = true;
      }

      if (rulesResponse.status === 'fulfilled' && rulesResponse.value.data.success) {
        setCalculationRules(rulesResponse.value.data.data || []);
      } else {
        console.warn('Falling back to mock calculation rules:', rulesResponse);
        setCalculationRules(mockCalculationRules);
        fallbackUsed = true;
      }
    } catch (error) {
      console.error('Error fetching templates and rules:', error);
      setTemplates(mockSalaryTemplates);
      setCalculationRules(mockCalculationRules);
      fallbackUsed = true;
    } finally {
      setIsLoading(false);

      if (fallbackUsed && !usingMockData) {
        toast({
          title: 'Demo data loaded',
          description: 'Template APIs are not ready yet. Showing local examples temporarily.'
        });
        setUsingMockData(true);
      }

      if (!fallbackUsed && usingMockData) {
        setUsingMockData(false);
      }
    }
  }, [user?.id, usingMockData]);

  // Load templates and rules
  useEffect(() => {
    fetchTemplateData();
  }, [fetchTemplateData]);

  if (isLoading) {
    return (
      <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Please log in to access template editor</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Template Editor</h1>
          <p className="text-muted-foreground">Manage salary structures and calculation rules</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="rules">Calculation Rules</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Salary Templates
              </CardTitle>
              <CardDescription>Create and manage salary calculation templates</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No salary templates available</p>
                  <p className="text-sm">Template management APIs are not yet implemented</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculation Rules
              </CardTitle>
              <CardDescription>Define formulas for salary calculations</CardDescription>
            </CardHeader>
            <CardContent>
              {calculationRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No calculation rules available</p>
                  <p className="text-sm">Rules management APIs are not yet implemented</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {calculationRules.map((rule) => (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">{rule.formula}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Card>
            <CardHeader>
              <CardTitle>Template Assignments</CardTitle>
              <CardDescription>Assign templates to employees or departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No template assignments</p>
                <p className="text-sm">Assignment management APIs are not yet implemented</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalaryTemplateEditor;
