import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { AlertCircle, CheckCircle2, CreditCard, Building2, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { APIV2Dictionary } from '@/api/v2/Api2Dicts';

interface BillDetails {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationLogo: string | null;
  month: number;
  monthName: string;
  year: number;
  activeUserCount: number;
  pricePerUser: number;
  totalAmount: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'CANCELLED';
  billDate: string;
  dueDate: string;
  subscriptionPlan: string;
  paidDate?: string;
  paymentReference?: string;
}

const BillPayment = () => {
  const { billId } = useParams<{ billId: string }>();
  const [bill, setBill] = useState<BillDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(APIV2Dictionary.billing.getPublicBill(billId || ''));
        setBill(response.data);
      } catch (err: any) {
        console.error('Error fetching bill details:', err);
        setError(err.response?.data?.message || 'Failed to load bill details');
      } finally {
        setLoading(false);
      }
    };

    if (billId) {
      fetchBillDetails();
    }
  }, [billId]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setPaymentError(null);
      
       await axios.post(APIV2Dictionary.billing.payPublicBill(billId || ''), {
        paymentMethod,
        paymentReference,
        notes
      });
      
      setPaymentSuccess(true);
      setBill(prev => prev ? { ...prev, status: 'PAID', paidDate: new Date().toISOString() } : null);
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setPaymentError(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'UNPAID':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Unpaid</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 w-full overflow-y-auto">
      <div className="w-full max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6 flex items-center">
          <h1 className="text-2xl font-bold flex-1">Alkaa Platform</h1>
          <p className="text-gray-500">Billing Portal</p>
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
              <Alert className="bg-green-50 text-green-800 border-green-200">
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
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bill Number:</span>
                    <span>{bill.id.substring(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Billing Period:</span>
                    <span>{bill.monthName} {bill.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bill Date:</span>
                    <span>{formatDate(bill.billDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date:</span>
                    <span className={bill.status === 'OVERDUE' ? 'text-red-500 font-semibold' : ''}>
                      {formatDate(bill.dueDate)}
                    </span>
                  </div>
                  {bill.status === 'PAID' && bill.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid Date:</span>
                      <span>{formatDate(bill.paidDate)}</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-medium mb-3">Organization Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Organization:</span>
                    <span>{bill.organizationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subscription Plan:</span>
                    <span>{bill.subscriptionPlan}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Billing Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span>{bill.activeUserCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Per User:</span>
                    <span>${bill.pricePerUser.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>${bill.totalAmount.toFixed(2)}</span>
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
                        <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-100">
                          <RadioGroupItem value="credit_card" id="credit_card" />
                          <Label htmlFor="credit_card" className="flex items-center cursor-pointer">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Credit Card
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-100">
                          <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                          <Label htmlFor="bank_transfer" className="flex items-center cursor-pointer">
                            <Building2 className="mr-2 h-4 w-4" />
                            Bank Transfer
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-100">
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
              <a href="/">Return to Dashboard</a>
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
                  `Pay $${bill.totalAmount.toFixed(2)}`
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
