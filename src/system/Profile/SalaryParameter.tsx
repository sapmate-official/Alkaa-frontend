import  { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ISalaryParameters } from '../../types/salaryParameters';
import { APIDictionary } from '../../api/v2/APIdict';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/services/AuthContext';

const SalaryParameter = () => {
  const form = useForm<ISalaryParameters>({
    defaultValues: {
      hraPercentage: 40,
      daPercentage: 10,
      taPercentage: 10,
      pfPercentage: 12,
      taxPercentage: 10,
      insuranceFixed: 1000,
    }
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchSalaryParameters();
    }
  }, [user]);

  const fetchSalaryParameters = async () => {
    try {
      if (!user?.id) return;
      const response = await axios.get(APIDictionary?.payrollParameters?.(user?.id));
      if (response?.data) {
        form?.reset?.(response?.data);
      }
    } catch (error) {
      console.error('Failed to fetch salary parameters:', error);
    }
  };

  const onSubmit = async (data: ISalaryParameters) => {
    try {
      if (!user?.id) return;
      const numericData = {
        ...data,
        hraPercentage: parseFloat(data?.hraPercentage?.toString() ?? '0'),
        daPercentage: parseFloat(data?.daPercentage?.toString() ?? '0'),
        taPercentage: parseFloat(data?.taPercentage?.toString() ?? '0'),
        pfPercentage: parseFloat(data?.pfPercentage?.toString() ?? '0'),
        taxPercentage: parseFloat(data?.taxPercentage?.toString() ?? '0'),
        insuranceFixed: parseFloat(data?.insuranceFixed?.toString() ?? '0'),
        userId: user?.id
      };
      const response = await axios.post(APIDictionary?.payrollParameters?.(user?.id), numericData);
      if (response?.status === 200) {
        toast?.({ title: 'Salary parameters saved successfully' });
      }
    } catch (error) {
      toast?.({ title: 'Failed to save salary parameters', variant: 'destructive' });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Salary Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form?.handleSubmit?.(onSubmit)} className="space-y-6">
            {[
              { name: "hraPercentage", label: "HRA Percentage" },
              { name: "daPercentage", label: "DA Percentage" },
              { name: "taPercentage", label: "TA Percentage" },
              { name: "pfPercentage", label: "PF Percentage" },
              { name: "taxPercentage", label: "Tax Percentage" },
              { name: "insuranceFixed", label: "Insurance Amount" },
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
                    <FormLabel>{field?.label}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...fieldProps} 
                        value={fieldProps?.value?.toString() ?? ''}
                        onChange={(e) => fieldProps?.onChange?.(Number(e?.target?.value))}
                        step="0.01"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" className="w-full">
              Save Salary Parameters
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SalaryParameter;