import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RouteDict from '@/routes/RouteDict';
import { useBill, useMarkBillAsPaid } from '@/hooks/queries/useBilling';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  AlertCircle,
  Download,
  CreditCard,
  CheckCircle,
  Building,
  Landmark,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { APIV2Dictionary } from '@/services/api/v2/Api2Dicts';

const BillDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: bill, isLoading: loading, error: queryError } = useBill(id || '');
  const markBillAsPaidMutation = useMarkBillAsPaid();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paymentReference, setPaymentReference] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const error = queryError ? ((queryError as { message?: string }).message || 'Failed to load bill details') : null;

  const handlePayBill = async () => {
    if (!bill) return;
    
    try {
      setProcessingPayment(true);
      await markBillAsPaidMutation.mutateAsync({
        billId: bill.id,
        paymentDetails: {
          paymentMethod,
          paymentReference: paymentReference || undefined,
        },
      });
      setPaymentDialogOpen(false);
      toast({
        title: 'Payment successful',
        description: 'Your payment has been processed successfully.',
        variant: 'default',
      });
    } catch (err: unknown) {
      console.error('Error processing payment:', err);
      const e = err as { response?: { data?: { message?: string } } };
      toast({
        title: 'Payment failed',
        description: e.response?.data?.message || 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const downloadInvoice = () => {
    if (!bill) return;
    
    window.open(APIV2Dictionary.billing.getInvoice(bill.id), '_blank');
  };

  const getBillStatusBadge = (status: string) => {
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-[250px]" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[150px]" />
            <Skeleton className="h-5 w-[250px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[200px]" />
              <Skeleton className="h-[200px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Bill not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(RouteDict.Billing.History)} className="mr-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bill Details</h1>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">
                {bill.monthName} {bill.year}
              </span>
              <span>•</span>
              <div>{getBillStatusBadge(bill.status)}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadInvoice}>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
          {(bill.status === 'UNPAID' || bill.status === 'OVERDUE') && (
            <Button onClick={() => setPaymentDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Bill
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing Statement</CardTitle>
              <CardDescription>
                Invoice #{bill.id.substring(0, 8)}
              </CardDescription>
            </div>
            {bill.organizationLogo && (
              <img 
                src={bill.organizationLogo} 
                alt={`${bill.organizationName} logo`}
                className="h-12 w-auto object-contain"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Bill Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Organization:</span>
                  <span className="font-medium">{bill.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bill Date:</span>
                  <span>{formatDate(bill.billDate || bill.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span className={bill.status === 'OVERDUE' ? 'text-red-500 font-semibold' : ''}>
                    {formatDate(bill.dueDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span>{getBillStatusBadge(bill.status)}</span>
                </div>
                {bill.status === 'PAID' && bill.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid Date:</span>
                    <span>{formatDate(bill.paidDate)}</span>
                  </div>
                )}
                {bill.status === 'PAID' && bill.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reference:</span>
                    <span className="max-w-[200px] truncate">{bill.paymentReference}</span>
                  </div>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-4">Subscription</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan:</span>
                  <span className="capitalize">
                    {(typeof bill.subscriptionPlan === 'string'
                      ? bill.subscriptionPlan
                      : bill.subscriptionPlan?.name || 'Standard'
                    ).toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary/40 border border-border p-6 rounded-xl">
              <h3 className="text-lg font-medium mb-4 text-foreground">Payment Summary</h3>
              
              <div className="space-y-3 mb-6 text-sm">
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
                  <span className="tabular-nums text-foreground">₹{(bill.totalAmount ?? 0).toFixed(2)}</span>
                </div>
              </div>
              
              {bill.status === 'PAID' ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-3 shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-700 dark:text-emerald-300 text-sm">Payment Complete</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Paid on {bill.paidDate ? formatDate(bill.paidDate) : 'Unknown date'}
                    </p>
                  </div>
                </div>
              ) : bill.status === 'OVERDUE' ? (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center">
                  <AlertTriangle className="h-5 w-5 text-destructive mr-3 shrink-0" />
                  <div>
                    <p className="font-medium text-destructive text-sm">Payment Overdue</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due date was {formatDate(bill.dueDate)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-300 text-sm">Payment Pending</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due by {formatDate(bill.dueDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {bill.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <p className="text-gray-700 dark:text-gray-300">{bill.notes}</p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between gap-2 pt-6 border-t">
          <Button variant="outline" onClick={() => navigate(RouteDict.Billing.Base)}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="space-x-2">
            {(bill.status === 'UNPAID' || bill.status === 'OVERDUE') && (
              <Button onClick={() => setPaymentDialogOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            )}
            <Button variant="outline" onClick={downloadInvoice}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pay Bill</DialogTitle>
            <DialogDescription>
              Select a payment method to process your payment of ₹{(bill.totalAmount ?? 0).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Credit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="wire_transfer">
                    <div className="flex items-center">
                      <Landmark className="mr-2 h-4 w-4" />
                      Wire Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">
                Payment Reference (Optional)
              </Label>
              <Input
                id="reference"
                placeholder="Transaction ID or reference number"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Add your transaction ID or reference if you've already made this payment.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayBill}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <span className="animate-spin mr-2">⊚</span>
                  Processing...
                </>
              ) : (
                <>Pay ₹{(bill.totalAmount ?? 0).toFixed(2)}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillDetails;
