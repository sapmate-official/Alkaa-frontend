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
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion'; // Added Framer Motion import
import axios from 'axios';

interface SalaryTransactionProps {
  salaryRecord: SalaryRecord;
  onTransactionComplete: () => void;
}

const SalaryTransaction = ({ salaryRecord, onTransactionComplete }: SalaryTransactionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  // Add these near your other state variables
const [incentive, setIncentive] = useState<number>(0);
const [bonus, setBonus] = useState<number>(0);
const [remarks, setRemarks] = useState<string>('');
  const [transactionMode, setTransactionMode] = useState<'manual' | 'razorpay' | null>(null);
  const [step, setStep] = useState('confirm'); // confirm, bank, mode, manual, processing

  const handleInitiateTransaction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      
      setStep('bank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMode = (mode: 'manual' | 'razorpay') => {
    setTransactionMode(mode);
    if (mode === 'manual') {
      setStep('manual');
    } else {
      setError('Razorpay integration is ongoing. Please use the manual option for now.');
    }
  };

  const handleCompleteTransaction = async () => {
    if (!transactionId.trim()) {
      setError('Please enter a valid transaction ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call your API to complete the transaction
      const response = await axios.post(`${APIDictionary.payroll}/complete-transaction`, {
        salaryRecordId: salaryRecord.id,
        transactionId,
        mode: transactionMode,
        incentive: incentive || 0,
        bonus: bonus || 0,
        remarks: remarks || ''
      }, {
        withCredentials: true
      });

      const data = response.data;


      if (!response.status) throw new Error(data.message);

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

  // Animation variants for reuse
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  const stepTransition = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <>
      <motion.div 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
      >
        <Button 
          onClick={() => setIsDialogOpen(true)}
          disabled={salaryRecord.status === 'PAID'}
          variant={salaryRecord.status === 'PAID' ? 'secondary' : 'default'}
        >
          {salaryRecord.status === 'PAID' ? 'Paid' : 'Process Payment'}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isDialogOpen && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
              >
                <DialogHeader>
                  <DialogTitle>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {step === 'confirm' && 'Confirm Salary Transaction'}
                        {step === 'bank' && 'Bank Details'}
                        {step === 'mode' && 'Payment Mode'}
                        {step === 'manual' && 'Enter Transaction Details'}
                        {step === 'processing' && 'Processing Transaction'}
                      </motion.span>
                    </AnimatePresence>
                  </DialogTitle>
                  <DialogDescription>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={step}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {step === 'confirm' && 'Please verify the transaction details before proceeding'}
                        {step === 'bank' && 'Please confirm the bank details for the transaction'}
                        {step === 'mode' && 'Choose how you want to process this payment'}
                        {step === 'manual' && 'Enter the transaction ID from your bank'}
                      </motion.span>
                    </AnimatePresence>
                  </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                  {step === 'confirm' && (
                    <motion.div 
                      key="confirm"
                      variants={stepTransition}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-4"
                    >
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

                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Net Salary Amount</span>
                          <span className="text-xl font-bold">
                            ₹{salaryRecord?.netSalary?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'bank' && (
                    <motion.div 
                      key="bank"
                      variants={stepTransition}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-4"
                    >
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
                    </motion.div>
                  )}

                  {step === 'mode' && (
                    <motion.div 
                      key="mode"
                      variants={stepTransition}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-4"
                    >
                      <p className="text-sm text-gray-500">
                        Choose the mode of transaction
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Card className="p-4 cursor-pointer hover:bg-foreground/50" onClick={() => handleSelectMode('manual')}>
                            <div className="text-center">
                              <h3 className="font-medium">Manual Payment</h3>
                              <p className="text-sm text-gray-500">Process payment manually through your bank</p>
                              <p className="mt-2 font-medium">
                                ₹{salaryRecord?.netSalary?.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </Card>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Card className="p-4 cursor-pointer hover:bg-foreground/50" onClick={() => handleSelectMode('razorpay')}>
                            <div className="text-center">
                              <h3 className="font-medium">RazorPay</h3>
                              <p className="text-sm text-gray-500">Automatic payment (2% extra charges)</p>
                              <p className="mt-2 font-medium">
                                ₹{((salaryRecord?.netSalary || 0) * 1.02).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </Card>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'manual' && (
                    <motion.div 
                      key="manual"
                      variants={stepTransition}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-4"
                    >
                      <p className="text-sm text-gray-500">
                        Please enter the transaction details after completing the payment manually through your bank
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Transaction ID</label>
                          <Input
                            type="text"
                            placeholder="Enter Transaction ID"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Incentive (₹)</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={incentive}
                            onChange={(e) => setIncentive(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Bonus (₹)</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={bonus}
                            onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Remarks</label>
                          <Input
                            type="text"
                            placeholder="Optional remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>
                        
                        <div className="mt-4 p-3 bg-background rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Base Salary</span>
                            <span>₹{salaryRecord?.netSalary?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Incentive</span>
                            <span>₹{incentive.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Bonus</span>
                            <span>₹{bonus.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t">
                            <span>Total Amount</span>
                            <span>₹{((salaryRecord?.netSalary || 0) + incentive + bonus).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'processing' && success && (
                    <motion.div 
                      key="processing"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="py-8 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" as const, stiffness: 300 }}
                      >
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      </motion.div>
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg font-medium text-green-700"
                      >
                        Transaction Successful!
                      </motion.h3>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-gray-500"
                      >
                        The salary has been successfully transferred to the employee's account
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring" as const, stiffness: 500 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <DialogFooter>
                  <AnimatePresence mode="wait">
                    {step === 'confirm' && (
                      <motion.div 
                        key="confirm-button"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="w-full"
                      >
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
                            'Continue'
                          )}
                        </Button>
                      </motion.div>
                    )}

                    {step === 'bank' && (
                      <motion.div 
                        key="bank-button"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="w-full"
                      >
                        <Button 
                          onClick={() => setStep('mode')} 
                          className="w-full"
                        >
                          Confirm Bank Details
                        </Button>
                      </motion.div>
                    )}

                    {step === 'manual' && (
                      <motion.div 
                        key="manual-button"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="w-full"
                      >
                        <Button 
                          onClick={handleCompleteTransaction} 
                          disabled={loading || !transactionId.trim()}
                          className="w-full"
                        >
                          {loading ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Processing
                            </>
                          ) : (
                            'Complete Transaction'
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};

export default SalaryTransaction;