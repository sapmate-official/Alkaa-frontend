import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { IBankDetails } from '../../types/bankDetails';
import { APIDictionary } from '../../api/APIdict';
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
import SalaryParameter from './SalaryParameter';


const BankDetails = () => {
  const form = useForm<IBankDetails>({
    defaultValues: {
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      userId:''
    }
  });
  const {user} = useAuth()
  const { toast } = useToast();

  useEffect(()=>{
    if(user){
      fetchBankDetails()
    }
  },[user])
  
  const fetchBankDetails = async () => {
    try {
      const response = await axios.get(`${APIDictionary.bank}/${user?.id}`);
      form.reset(response.data);
    } catch (error) {
      console.error('Failed to fetch bank details:', error);
    }
  }
  const onSubmit = async (data: IBankDetails) => {
    try {
        if(!user?.id) return;
        data = {...data, userId: user?.id}
      const response = await axios.post(APIDictionary.bank, data,{withCredentials:true});
      if (response.status === 201) {
        toast({ title: 'Bank details saved successfully' });
      }
    } catch (error) {
      toast({ title: 'Failed to save bank details', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 w-full h-full overflow-y-scroll">
      <Card className="max-w-2xl mx-auto ">
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accountHolder"
                rules={{ required: 'Account holder name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                rules={{
                  required: 'Account number is required',
                  pattern: {
                    value: /^\d{9,18}$/,
                    message: 'Please enter a valid account number'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ifscCode"
                rules={{
                  required: 'IFSC code is required',
                  pattern: {
                    value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                    message: 'Please enter a valid IFSC code'
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                rules={{ required: 'Bank name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Save Bank Details
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <SalaryParameter />
    </div>
  );
};

export default BankDetails;