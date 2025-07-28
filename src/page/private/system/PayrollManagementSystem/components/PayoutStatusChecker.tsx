import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Clock, RefreshCw, ExternalLink, DollarSign, Calendar, User } from 'lucide-react';
import { APIDictionary } from '@/api/v2/APIdict';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface PayoutStatusProps {
  transferId: string;
  salaryRecordId?: string;
  onStatusUpdate?: (status: string) => void;
  autoRefresh?: boolean;
  initialData?: PayoutStatusData;
}

interface PayoutStatusData {
  success: boolean;
  transferId: string;
  status: string;
  details: {
    amount: number;
    utr?: string;
    bankReference?: string;
    processedAt?: string;
    failureReason?: string;
    beneDetails?: {
      name: string;
      bankAccount: string;
      ifsc: string;
    };
  };
}

const PayoutStatusChecker = ({ 
  transferId, 
  salaryRecordId, 
  onStatusUpdate, 
  autoRefresh: autoRefreshProp = true,
  initialData
}: PayoutStatusProps) => {
  const [statusData, setStatusData] = useState<PayoutStatusData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(autoRefreshProp);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${APIDictionary.payroll}/cashfree/status/${transferId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setStatusData(response.data);
        onStatusUpdate?.(response.data.status);
        
        // Stop auto-refresh if payment is completed or failed
        if (['SUCCESS', 'FAILED', 'CANCELLED'].includes(response.data.status)) {
          setAutoRefresh(false);
        }
      } else {
        setError(response.data.message || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payout status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Set up auto-refresh for pending payments
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchStatus, 10000); // Check every 10 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transferId, autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'FAILED':
      case 'CANCELLED':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'PENDING':
      case 'PROCESSING':
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case 'PENDING':
      case 'PROCESSING':
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Payment has been successfully transferred to the employee\'s account. You can track this transaction using the UTR number provided by the bank.';
      case 'FAILED':
        return 'Payment failed to process. This could be due to incorrect bank details, insufficient balance, or network issues. Please verify details and try again.';
      case 'CANCELLED':
        return 'Payment was cancelled before processing. No funds have been transferred.';
      case 'PENDING':
      case 'PROCESSING':
      default:
        return 'Payment is being processed by Cashfree and the bank. This usually takes 2-5 minutes during business hours.';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'green';
      case 'FAILED':
        return 'red';
      case 'CANCELLED':
        return 'gray';
      default:
        return 'blue';
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!statusData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          <span>Loading payment status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(statusData.status)}
              <div>
                <CardTitle className="text-lg">Cashfree Payout Status</CardTitle>
                <CardDescription className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                  {statusData.transferId}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(statusData.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Description */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <p className="text-sm text-slate-700 leading-relaxed">
              {getStatusDescription(statusData.status)}
            </p>
          </div>
          
          {/* Payment Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                Transfer Amount
              </span>
              <p className="text-xl font-bold text-green-600">
                ₹{statusData.details.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            {statusData.details.processedAt && (
              <div className="bg-white p-4 rounded-lg border">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                  Processed At
                </span>
                <p className="text-sm font-medium">
                  {new Date(statusData.details.processedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            )}
            
            {statusData.details.utr && (
              <div className="bg-white p-4 rounded-lg border">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                  UTR Number
                </span>
                <p className="text-sm font-mono font-medium text-blue-600">
                  {statusData.details.utr}
                </p>
              </div>
            )}
          </div>
          
          {/* Bank Details */}
          {statusData.details.beneDetails && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Beneficiary Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Account Holder:</span>
                  <p className="text-blue-800">{statusData.details.beneDetails.name}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Account Number:</span>
                  <p className="text-blue-800 font-mono">
                    ****{statusData.details.beneDetails.bankAccount?.slice(-4)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">IFSC Code:</span>
                  <p className="text-blue-800 font-mono">{statusData.details.beneDetails.ifsc}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Bank Reference */}
          {statusData.details.bankReference && (
            <div className="bg-white p-3 rounded-lg border">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                Bank Reference
              </span>
              <p className="text-sm font-mono">{statusData.details.bankReference}</p>
            </div>
          )}
          
          {/* Failure Reason */}
          {statusData.details.failureReason && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Failure Reason:</span> {statusData.details.failureReason}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </Button>

            <div className="flex gap-2">
              {statusData.details.utr && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => {
                    navigator.clipboard.writeText(statusData.details.utr || '');
                    // You could add a toast notification here
                  }}
                >
                  <span>Copy UTR</span>
                </Button>
              )}
              
              {statusData.details.utr && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => {
                    window.open(`https://www.google.com/search?q=UTR+track+${statusData.details.utr}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Track UTR</span>
                </Button>
              )}
            </div>
          </div>

          {/* Auto Refresh Indicator */}
          {autoRefresh && ['PENDING', 'PROCESSING'].includes(statusData.status) && (
            <div className="text-center py-2">
              <div className="inline-flex items-center space-x-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Auto-refreshing every 10 seconds...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PayoutStatusChecker;
