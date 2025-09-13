import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthContext';
import { useAtom } from 'jotai';
import { permissionListAtom } from '@/store/atom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingLibraryIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from 'framer-motion';
import { backendDomain } from '@/constants/Domain';
import { Link } from 'react-router-dom';

type BankDetail = {
  id: string;
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
};

interface BankDetailsProps {
  userId: string;
}

const BankDetails = ({ userId }: BankDetailsProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bankDetails, setBankDetails] = useState<BankDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [permissionList] = useAtom(permissionListAtom);

  const hasPermission = (permissionKey: string) => {
    return permissionList.some(permission => permission.key === permissionKey);
  };

  const canViewBankDetails = () => {
    const isOwnProfile = userId === user?.id;
    const isSubordinate = userId && user?.id && user.id !== userId 
      ? user.subordinates?.some(sub => sub.id === userId) 
      : false;

    if (isOwnProfile) {
      return true; // Users can always view their own bank details
    } else if (isSubordinate) {
      return hasPermission('view_bank_subordinates');
    } else {
      return hasPermission('view_bank_all_user');
    }
  };

  const toggleDetailsVisibility = () => {
    setShowFullDetails(!showFullDetails);
  };

  const formatAccountNumber = (accountNumber: string) => {
    if (showFullDetails) {
      return accountNumber;
    }
    return `••••${accountNumber.slice(-4)}`;
  };

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (!canViewBankDetails()) {
        setError("You don't have permission to view these bank details");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(`${backendDomain}/api/v2/bank-details/${userId}`, {
          withCredentials: true,
        });
        
        if (response.status === 200) {
          setBankDetails(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching bank details:', err);
        setError(err.response?.data?.error || 'Failed to fetch bank details');
        toast({
          title: 'Error',
          description: 'Could not load bank details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankDetails();
  }, [userId]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm bg-muted/30">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg text-muted-foreground">Bank Details Unavailable</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!bankDetails) {
    return (
      <Card className="shadow-sm bg-muted/30">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <BuildingLibraryIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg text-muted-foreground">No Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground">
            No bank account information has been added yet.
          </p>
          <Link to="/p/profile/edit/bank" className="text-primary hover:underline">
            Add Bank Details
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2 text-primary/90">
            <BuildingLibraryIcon className="w-5 h-5" />
            Bank Details
          </CardTitle>
          {canViewBankDetails() && bankDetails?.accountNumber && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDetailsVisibility}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              {showFullDetails ? (
                <>
                  <EyeSlashIcon className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" />
                  Show Details
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Account Holder</p>
            <p className="font-medium">{bankDetails?.accountHolder || 'Not provided'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Bank Name</p>
            <p className="font-medium">{bankDetails?.bankName || 'Not provided'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Account Number</p>
            <p className="font-medium">
              {bankDetails?.accountNumber ? formatAccountNumber(bankDetails.accountNumber) : 'Not provided'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">IFSC Code</p>
            <p className="font-medium">{bankDetails?.ifscCode || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BankDetails;
