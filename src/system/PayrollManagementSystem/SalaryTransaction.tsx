import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APIDictionary } from '@/api/v2/APIdict';
import { SalaryRecord } from '@/interface/general';



interface SalaryTransactionProps {
  salaryRecord: SalaryRecord;
  onTransactionComplete: () => void;
}

const SalaryTransaction = ({ salaryRecord, onTransactionComplete }: SalaryTransactionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('confirm'); // confirm, otp, processing

  const handleInitiateTransaction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call your API to initiate the transaction
      const response = await fetch(`${APIDictionary.payroll}/initiate-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaryRecordId: salaryRecord?.id,
          userId: salaryRecord?.userId,
          amount: salaryRecord?.netSalary,
          bankDetails: salaryRecord?.user?.bankDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call your API to verify OTP and process the transaction
      const response = await fetch(`${APIDictionary.payroll}/verify-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaryRecordId: salaryRecord.id,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setSuccess(true);
      setStep('processing');
      
      // Wait for 2 seconds to show success message
      setTimeout(() => {
        setIsDialogOpen(false);
        onTransactionComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        disabled={salaryRecord.status === 'PAID'}
        variant={salaryRecord.status === 'PAID' ? 'secondary' : 'default'}
      >
        {salaryRecord.status === 'PAID' ? 'Paid' : 'Process Payment'}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === 'confirm' && 'Confirm Salary Transaction'}
              {step === 'otp' && 'Enter OTP'}
              {step === 'processing' && 'Processing Transaction'}
            </DialogTitle>
            <DialogDescription>
              {step === 'confirm' && 'Please verify the transaction details before proceeding'}
            </DialogDescription>
          </DialogHeader>

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Employee Name</label>
                  <p className="text-lg">{`${salaryRecord?.user?.firstName ?? ''} ${salaryRecord?.user?.lastName ?? ''}`}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Employee ID</label>
                  <p className="text-lg">{salaryRecord?.user?.employeeId}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-medium">Bank Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-gray-500">Account Holder</label>
                    <p>{salaryRecord?.user?.bankDetails?.accountHolder}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Bank Name</label>
                    <p>{salaryRecord?.user?.bankDetails?.bankName}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Account Number</label>
                    <p>{salaryRecord?.user?.bankDetails?.accountNumber}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">IFSC Code</label>
                    <p>{salaryRecord.user?.bankDetails?.ifscCode}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Net Salary Amount</span>
                  <span className="text-xl font-bold">
                    ₹{salaryRecord?.netSalary?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Enter the OTP sent to your registered mobile number and email
              </p>
              <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center text-lg"
              />
            </div>
          )}

          {step === 'processing' && success && (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-700">Transaction Successful!</h3>
              <p className="text-sm text-gray-500">
                The salary has been successfully transferred to the employee's account
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            {step === 'confirm' && (
              <Button 
                onClick={handleInitiateTransaction} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Initiating Transaction
                  </>
                ) : (
                  'Proceed with Transaction'
                )}
              </Button>
            )}

            {step === 'otp' && (
              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading || otp.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Verifying
                  </>
                ) : (
                  'Verify & Process'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalaryTransaction;