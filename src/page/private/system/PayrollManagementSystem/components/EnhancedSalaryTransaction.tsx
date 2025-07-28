import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader, CreditCard, Building2, Zap } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import PayoutStatusChecker from './PayoutStatusChecker';

interface SalaryTransactionProps {
  salaryRecord: SalaryRecord;
  onTransactionComplete: () => void;
}

type PaymentMode = 'manual' | 'cashfree' | null;
type TransactionStep = 'confirm' | 'mode' | 'manual' | 'cashfree' | 'processing';

const EnhancedSalaryTransaction = ({ salaryRecord, onTransactionComplete }: SalaryTransactionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [incentive, setIncentive] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(null);
  const [step, setStep] = useState<TransactionStep>('confirm');
  const [cashfreeResponse, setCashfreeResponse] = useState<any>(null);

  const totalAmount = salaryRecord.netSalary + (incentive || 0) + (bonus || 0);

  const handleInitiateTransaction = () => {
    setStep('mode');
  };

  const handleSelectMode = (mode: PaymentMode) => {
    setPaymentMode(mode);
    if (mode === 'manual') {
      setStep('manual');
    } else if (mode === 'cashfree') {
      setStep('cashfree');
    }
  };

  const handleManualTransaction = async () => {
    if (!transactionId.trim()) {
      setError('Please enter a valid transaction ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${APIDictionary.payroll}/complete-transaction`, {
        salaryRecordId: salaryRecord.id,
        transactionId,
        mode: 'manual',
        incentive: incentive || 0,
        bonus: bonus || 0,
        remarks: remarks || ''
      }, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      setSuccess(true);
      setStep('processing');
      
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

  const handleCashfreeTransaction = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${APIDictionary.payroll}/cashfree/initiate-payout`, {
        salaryRecordId: salaryRecord.id,
        incentive: incentive || 0,
        bonus: bonus || 0,
        remarks: remarks || ''
      }, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      setCashfreeResponse(response.data);
      setSuccess(true);
      setStep('processing');
      
      // Don't auto-close for Cashfree payments so users can monitor status
      if (paymentMode !== 'cashfree') {
        setTimeout(() => {
          setIsDialogOpen(false);
          onTransactionComplete();
        }, 3000);
      } else {
        // Just call onTransactionComplete to refresh the parent component
        onTransactionComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate Cashfree payout');
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep('confirm');
    setPaymentMode(null);
    setTransactionId('');
    setIncentive(0);
    setBonus(0);
    setRemarks('');
    setError(null);
    setSuccess(false);
    setCashfreeResponse(null);
  };

  const renderConfirmationStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-900 mb-2">Employee Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-600">Name:</span>
              <span className="ml-2 font-medium">{salaryRecord.user.firstName} {salaryRecord.user.lastName}</span>
            </div>
            <div>
              <span className="text-slate-600">Employee ID:</span>
              <span className="ml-2 font-medium">{salaryRecord.user.employeeId}</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Payment Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Base Salary:</span>
              <span className="font-medium">₹{salaryRecord.netSalary.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <div>
                <Label htmlFor="incentive" className="text-green-700">Incentive (Optional)</Label>
                <Input
                  id="incentive"
                  type="number"
                  value={incentive}
                  onChange={(e) => setIncentive(Number(e.target.value))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="bonus" className="text-green-700">Bonus (Optional)</Label>
                <Input
                  id="bonus"
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-medium text-green-900">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="remarks" className="text-slate-700">Remarks (Optional)</Label>
          <Textarea
            id="remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any additional notes..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    </motion.div>
  );

  const renderModeSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h4 className="font-semibold text-lg mb-2">Choose Payment Method</h4>
        <p className="text-slate-600 text-sm">Select how you want to process this salary payment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
          onClick={() => handleSelectMode('cashfree')}
        >
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-lg">Automated Payout</CardTitle>
            <Badge variant="secondary" className="w-fit mx-auto">Recommended</Badge>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Instant bank transfer via Cashfree. Fast, secure, and automated processing.
            </CardDescription>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Instant processing
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Real-time status updates
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Automatic notifications
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-200"
          onClick={() => handleSelectMode('manual')}
        >
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-lg">Manual Transfer</CardTitle>
            <Badge variant="outline">Traditional</Badge>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-center">
              Manual bank transfer with transaction ID entry. Requires manual verification.
            </CardDescription>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center">
                <Building2 className="h-4 w-4 text-blue-500 mr-2" />
                Use existing bank setup
              </li>
              <li className="flex items-center">
                <Building2 className="h-4 w-4 text-blue-500 mr-2" />
                Manual verification
              </li>
              <li className="flex items-center">
                <Building2 className="h-4 w-4 text-blue-500 mr-2" />
                Transaction ID required
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderManualStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-4">
          <CreditCard className="h-6 w-6 text-orange-600" />
        </div>
        <h4 className="font-semibold text-lg mb-2">Manual Bank Transfer</h4>
        <p className="text-slate-600 text-sm">Complete the bank transfer and enter the transaction ID</p>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg">
        <h5 className="font-medium mb-2">Transfer Details</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Amount to Transfer:</span>
            <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Account:</span>
            <span className="font-medium">{salaryRecord.user.bankDetails?.accountNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>IFSC:</span>
            <span className="font-medium">{salaryRecord.user.bankDetails?.ifscCode || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="transactionId">Transaction ID</Label>
        <Input
          id="transactionId"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter bank transaction ID"
          className="mt-1"
        />
      </div>
    </motion.div>
  );

  const renderCashfreeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
          <Zap className="h-6 w-6 text-blue-600" />
        </div>
        <h4 className="font-semibold text-lg mb-2">Automated Payout via Cashfree</h4>
        <p className="text-slate-600 text-sm">The payment will be processed automatically</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="font-medium mb-2 text-blue-900">Payment Summary</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">Total Amount:</span>
            <span className="font-medium text-blue-900">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Processing Method:</span>
            <span className="font-medium text-blue-900">Instant Bank Transfer</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Expected Time:</span>
            <span className="font-medium text-blue-900">2-5 minutes</span>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The payment will be processed immediately. Please ensure all details are correct before proceeding.
        </AlertDescription>
      </Alert>
    </motion.div>
  );

  const renderProcessingStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {success ? (
        <div className="space-y-6">
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-full w-fit mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-lg text-green-900 mb-2">
                {paymentMode === 'cashfree' ? 'Payout Initiated Successfully!' : 'Transaction Completed!'}
              </h4>
              <p className="text-green-700 text-sm">
                {paymentMode === 'cashfree' 
                  ? 'The automated payout has been initiated. You can track the status below.'
                  : 'The salary has been marked as paid in the system.'
                }
              </p>
            </div>
          </div>
          
          {/* Show PayoutStatusChecker for Cashfree payments */}
          {paymentMode === 'cashfree' && cashfreeResponse?.transferId && (
            <div className="mt-6">
              <PayoutStatusChecker 
                transferId={cashfreeResponse.transferId}
                autoRefresh={true}
                initialData={{
                  success: true,
                  transferId: cashfreeResponse.transferId,
                  status: 'PENDING',
                  details: {
                    amount: totalAmount,
                    beneDetails: {
                      name: `${salaryRecord.user.firstName} ${salaryRecord.user.lastName}`,
                      bankAccount: salaryRecord.user.bankDetails?.accountNumber || '',
                      ifsc: salaryRecord.user.bankDetails?.ifscCode || '',
                    }
                  }
                }}
              />
            </div>
          )}
          
          {/* Manual payment confirmation */}
          {paymentMode === 'manual' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                Transaction ID: <span className="font-mono font-medium">{transactionId}</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto">
            <Loader className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">Processing...</h4>
            <p className="text-slate-600 text-sm">
              {paymentMode === 'cashfree' 
                ? 'Initiating automated payout...'
                : 'Completing transaction...'
              }
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );

  const getStepButtons = () => {
    switch (step) {
      case 'confirm':
        return (
          <Button onClick={handleInitiateTransaction} className="w-full">
            Continue to Payment Method
          </Button>
        );
      case 'mode':
        return (
          <Button variant="outline" onClick={() => setStep('confirm')} className="w-full">
            Back to Details
          </Button>
        );
      case 'manual':
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('mode')} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={handleManualTransaction} 
              disabled={loading || !transactionId.trim()}
              className="flex-1"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
              Complete Transaction
            </Button>
          </div>
        );
      case 'cashfree':
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('mode')} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={handleCashfreeTransaction} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
              Initiate Payout
            </Button>
          </div>
        );
      case 'processing':
        return success ? (
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                resetDialog();
              }}
              className="flex-1"
            >
              Close
            </Button>
            {paymentMode === 'cashfree' && (
              <Button 
                onClick={() => {
                  // Keep dialog open to continue monitoring
                }}
                className="flex-1"
              >
                Continue Monitoring
              </Button>
            )}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        variant="default"
        className="w-full"
      >
        Process Salary Payment
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open && step !== 'processing') {
          setIsDialogOpen(false);
          resetDialog();
        }
      }}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${
          success && paymentMode === 'cashfree' ? 'max-w-4xl' : 'max-w-2xl'
        }`}>
          <DialogHeader>
            <DialogTitle>
              {step === 'confirm' && 'Salary Payment'}
              {step === 'mode' && 'Select Payment Method'}
              {step === 'manual' && 'Manual Bank Transfer'}
              {step === 'cashfree' && 'Automated Payout'}
              {step === 'processing' && 'Processing Payment'}
            </DialogTitle>
            <DialogDescription>
              {step === 'confirm' && 'Review the salary details and add any additional payments'}
              {step === 'mode' && 'Choose your preferred payment processing method'}
              {step === 'manual' && 'Complete the bank transfer manually and provide transaction details'}
              {step === 'cashfree' && 'Confirm automated payout via Cashfree payment gateway'}
              {step === 'processing' && 'Please wait while we process your payment'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'confirm' && renderConfirmationStep()}
            {step === 'mode' && renderModeSelection()}
            {step === 'manual' && renderManualStep()}
            {step === 'cashfree' && renderCashfreeStep()}
            {step === 'processing' && renderProcessingStep()}
          </AnimatePresence>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            {getStepButtons()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedSalaryTransaction;
