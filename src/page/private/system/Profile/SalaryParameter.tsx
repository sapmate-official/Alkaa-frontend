import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ISalaryParameters } from '@/interface/salaryParameters';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/services/AuthContext';
import { BanknoteIcon, PercentIcon, SaveIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSalaryParametersQuery, useUpdateSalaryParametersMutation } from '@/hooks/queries/useProfile';

const SalaryParameter = ({ userID }: { userID: string }) => {
  const form = useForm<ISalaryParameters>({
    defaultValues: {
      hraPercentage: 0,
      daPercentage: 0,
      taPercentage: 0,
      pfPercentage: 0,
      taxPercentage: 0,
      insuranceFixed: 0,
    }
  });
  const { user } = useAuth();

  // Use TanStack Query hooks
  const { 
    data: salaryParameters, 
    error: parametersError 
  } = useSalaryParametersQuery(userID)
  
  const updateParametersMutation = useUpdateSalaryParametersMutation()

  // Update form when salary parameters load
  useEffect(() => {
    if (salaryParameters) {
      form.reset(salaryParameters);
    }
  }, [salaryParameters, form]);

  // Handle parameters error
  if (parametersError) {
    console.error('Failed to fetch salary parameters:', parametersError);
  }

  const onSubmit = async (data: ISalaryParameters) => {
    try {
      if (!user?.id) return;
      updateParametersMutation.mutate({ userId: userID, data });
    } catch (error) {
      console.error('Error in onSubmit:', error);
    }
  };

  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-primary/70">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <BanknoteIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Salary Parameters</CardTitle>
            <CardDescription>Configure salary calculation parameters</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form?.handleSubmit?.(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <PercentIcon className="h-4 w-4" />
                Percentage-based Parameters
              </h3>
              <Separator className="bg-slate-200" />
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {[
                  { name: "hraPercentage", label: "HRA Percentage", desc: "House Rent Allowance" },
                  { name: "daPercentage", label: "DA Percentage", desc: "Dearness Allowance" },
                  { name: "taPercentage", label: "TA Percentage", desc: "Travel Allowance" },
                  { name: "pfPercentage", label: "PF Percentage", desc: "Provident Fund" },
                  { name: "taxPercentage", label: "Tax Percentage", desc: "Income Tax" },
                ].map((field) => (
                  <FormField
                    key={field?.name}
                    control={form?.control}
                    name={field?.name as keyof ISalaryParameters}
                    rules={{
                      required: `${field?.label} is required`
                    }}
                    render={({ field: fieldProps }) => (
                      <FormItem>
                        <FormLabel className="font-medium">{field?.label}</FormLabel>
                        <FormDescription className="text-xs">{field?.desc}</FormDescription>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              {...fieldProps}
                              value={fieldProps?.value?.toString() ?? ''}
                              onChange={(e) => fieldProps?.onChange?.(Number(e?.target?.value))}
                              step="0.01"
                              className="bg-background pl-3 pr-7 border-slate-300 focus-visible:ring-primary/50"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <BanknoteIcon className="h-4 w-4" />
                Fixed Amount Parameters
              </h3>
              <Separator className="bg-slate-200" />
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                <FormField
                  control={form?.control}
                  name="insuranceFixed"
                  rules={{
                    required: "Insurance amount is required"
                  }}
                  render={({ field: fieldProps }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Insurance Amount</FormLabel>
                      <FormDescription className="text-xs">Fixed amount for insurance</FormDescription>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            {...fieldProps}
                            value={fieldProps?.value?.toString() ?? ''}
                            onChange={(e) => fieldProps?.onChange?.(Number(e?.target?.value))}
                            step="0.01"
                            className="bg-background pl-7 border-slate-300 focus-visible:ring-primary/50"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 flex items-center justify-center gap-2 transition-all duration-200 hover:bg-primary/90"
              disabled={updateParametersMutation.isPending}
            >
              <SaveIcon className="h-4 w-4" />
              {updateParametersMutation.isPending ? "Saving..." : "Save Salary Parameters"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SalaryParameter;