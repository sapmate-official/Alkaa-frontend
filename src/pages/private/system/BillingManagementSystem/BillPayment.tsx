import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, CreditCard, Building2, Wallet, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePublicBill, usePayPublicBill } from '@/hooks/queries/useBilling';

const BillPayment = () => {
  const { billId } = useParams<{ billId: string }>();
  const { data: bill, isLoading: loading, error: queryError } = usePublicBill(billId || '');
  const payPublicBillMutation = usePayPublicBill();
  const processing = payPublicBillMutation.isPending;

  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const error = queryError 
    ? ((queryError as { response?: { data?: { message?: string } } }).response?.data?.message || (queryError as Error).message || 'Failed to load bill details')
    : null;

  const handlePayment = async () => {
    if (!billId) return;
    try {
      setPaymentError(null);
      await payPublicBillMutation.mutateAsync({
        billId,
        data: {
          paymentMethod,
          paymentReference: paymentReference || undefined,
          notes: notes || undefined
        }
      });
      setPaymentSuccess(true);
    } catch (err: unknown) {
      console.error('Error processing payment:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setPaymentError(error.response?.data?.message || error.message || 'Failed to process payment');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Paid</Badge>;
      case 'UNPAID':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Unpaid</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border/40">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || 'Bill not found'}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/">Return to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="w-full">
        <div className="bg-card border border-border p-6 rounded-xl shadow-xs mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alkaa Platform</h1>
          <p className="text-sm text-muted-foreground">Billing Portal</p>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <span>Billing Statement</span>
                  <span className="ml-3">{getStatusBadge(bill.status)}</span>
                </CardTitle>
                <CardDescription>
                  {bill.organizationName} - {bill.monthName} {bill.year}
                </CardDescription>
              </div>
              {bill.organizationLogo && (
                <img 
                  src={bill.organizationLogo} 
                  alt={`${bill.organizationName} logo`}
                  className="h-16 w-auto object-contain"
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentSuccess && (
              <Alert className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Payment Successful</AlertTitle>
                <AlertDescription>
                  Your payment has been processed successfully.
                </AlertDescription>
              </Alert>
            )}
            
            {paymentError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Payment Error</AlertTitle>
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-3">Bill Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Number:</span>
                    <span className="font-mono">{bill.id.substring(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Period:</span>
                    <span>{bill.monthName} {bill.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Date:</span>
                    <span>{bill.billDate ? formatDate(bill.billDate) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className={bill.status === 'OVERDUE' ? 'text-destructive font-semibold' : ''}>
                      {bill.dueDate ? formatDate(bill.dueDate) : 'N/A'}
                    </span>
                  </div>
                  {bill.status === 'PAID' && bill.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid Date:</span>
                      <span>{formatDate(bill.paidDate)}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium mb-3">Organization Details</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization:</span>
                    <span>{bill.organizationName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subscription Plan:</span>
                    <span>{typeof bill.subscriptionPlan === 'string' ? bill.subscriptionPlan : bill.subscriptionPlan?.name || 'Standard'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/40 border border-border p-4 rounded-xl">
                <h3 className="text-lg font-medium mb-3">Billing Summary</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Users:</span>
                    <span className="tabular-nums font-medium">{bill.activeUserCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Per User:</span>
                    <span className="tabular-nums font-medium">₹{(bill.pricePerUser ?? 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total Amount:</span>
                    <span className="tabular-nums text-foreground">₹{(bill.totalAmount ?? bill.amount ?? 0).toFixed(2)}</span>
                  </div>
                </div>

                {bill.status !== 'PAID' && (
                  <>
                    <Separator className="my-4" />
                    
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-3">Payment Method</h3>
                      
                      <RadioGroup
                        value={paymentMethod} 
                        onValueChange={setPaymentMethod}
                        className="gap-4"
                      >
                        <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/60 transition-colors">
                          <RadioGroupItem value="credit_card" id="credit_card" />
                          <Label htmlFor="credit_card" className="flex items-center cursor-pointer">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Credit Card
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/60 transition-colors">
                          <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                          <Label htmlFor="bank_transfer" className="flex items-center cursor-pointer">
                            <Building2 className="mr-2 h-4 w-4" />
                            Bank Transfer
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/60 transition-colors">
                          <RadioGroupItem value="wallet" id="wallet" />
                          <Label htmlFor="wallet" className="flex items-center cursor-pointer">
                            <Wallet className="mr-2 h-4 w-4" />
                            Digital Wallet
                          </Label>
                        </div>
                      </RadioGroup>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <Label htmlFor="reference">Payment Reference (Optional)</Label>
                          <Input 
                            id="reference" 
                            value={paymentReference} 
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Transaction ID or reference"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea 
                            id="notes" 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional payment notes"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link to="/">Return to Dashboard</Link>
            </Button>
            {bill.status !== 'PAID' && (
              <Button 
                onClick={handlePayment} 
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="animate-spin mr-2">⊚</span>
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₹${(bill.totalAmount ?? bill.amount ?? 0).toFixed(2)}`
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BillPayment;
