import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { IBankDetails } from '../../types/bankDetails';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/services/AuthContext';
import SalaryParameter from './SalaryParameter';
import { useParams, useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { permissionListAtom } from '../../store/atom';
import { Landmark, SaveIcon } from 'lucide-react';

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
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [permissionList] = useAtom(permissionListAtom);

  // Permission checks
  const isOwnProfile = !id || id === user?.id;
  const canEditOwnBank = permissionList.some(p => p.key === 'update_bank_own') && isOwnProfile;
  const canEditSubordinatesBank = permissionList.some(p => p.key === 'update_bank_subordinates');
  const canEditAllUserBank = permissionList.some(p => p.key === 'update_bank_all_user');
  
  // Check if user is the manager of the viewed profile
  const [isManager, setIsManager] = useState(false);
  
  // Determine if the current user is allowed to edit this bank info
  const canEditBankInfo = canEditOwnBank || canEditAllUserBank || (canEditSubordinatesBank && isManager);
  
  useEffect(() => {
    const checkManagerRelationship = async () => {
      if (id && id !== user?.id) {
        try {
          const response = await axios.get(APIDictionary.userProfile(id), { 
            withCredentials: true 
          });
          const userData = response.data?.user;
          setIsManager(userData?.managerId === user?.id);
        } catch (error) {
          console.error('Error checking manager relationship:', error);
        }
      }
    };
    
    if (!canEditOwnBank && !canEditSubordinatesBank && !canEditAllUserBank) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to edit bank details.",
        variant: "destructive"
      });
      navigate('/p/profile');
      return;
    }
    
    checkManagerRelationship();
    fetchBankDetails();
  }, [user, id]);

  const fetchBankDetails = async () => {
    try {
      let response;
      if(id){
        response = await axios.get(`${APIDictionary.bank}/${id}`);
        form.reset(response.data);
      }else if(user?.id){
        response = await axios.get(`${APIDictionary.bank}/${user?.id}`);
        form.reset(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bank details:', error);
    }
  }
  
  const onSubmit = async (data: IBankDetails) => {
    if (!canEditBankInfo) {
      toast({ 
        title: 'Permission denied', 
        description: "You don't have permission to update these bank details.",
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      const userId = id || user?.id;
      if(!userId) {
        toast({ title: 'User not found', variant: 'destructive' });
        return;
      }
      data = {...data, userId};
      const response = await axios.put(APIDictionary.bank, data, {withCredentials:true});
      if (response?.status === 200) {
        toast({ title: 'Bank details saved successfully' });
      }
    } catch (error) {
      toast({ title: 'Failed to save bank details', variant: 'destructive' });
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-8 px-2">
      <div className="mx-auto">
        <div className="bg-gradient-to-b from-muted/40 to-background rounded-lg p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Financial Information</h1>
          <p className="text-muted-foreground">Manage your banking and salary configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-fit border-l-4 border-l-primary/70">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Bank Details</CardTitle>
                  <CardDescription>Your banking information for payroll</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="accountHolder"
                      rules={{ required: 'Account holder name is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Account Holder Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!canEditBankInfo} 
                              className="bg-background border-slate-300 focus-visible:ring-primary/50" 
                              placeholder="Enter account holder name" 
                            />
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
                          <FormLabel className="font-medium">Bank Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!canEditBankInfo} 
                              className="bg-background border-slate-300 focus-visible:ring-primary/50" 
                              placeholder="Enter bank name" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
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
                          <FormLabel className="font-medium">Account Number</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!canEditBankInfo} 
                              className="bg-background border-slate-300 focus-visible:ring-primary/50" 
                              placeholder="Enter account number" 
                            />
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
                          <FormLabel className="font-medium">IFSC Code</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!canEditBankInfo} 
                              className="bg-background border-slate-300 focus-visible:ring-primary/50" 
                              placeholder="Enter IFSC code" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-6 flex items-center justify-center gap-2 transition-all duration-200 hover:bg-primary/90" 
                    disabled={!canEditBankInfo}
                  >
                    <SaveIcon className="h-4 w-4" />
                    Save Bank Details
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {id && (
            <div className="h-fit">
              <SalaryParameter userID={id} />
            </div>
          )}
          {
            !id && user?.id && (
              <div className="h-fit">
                <SalaryParameter userID={user?.id} />
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default BankDetails;