import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    DollarSign, 
    CreditCard, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Send,
    RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CashfreePayoutManager = () => {
    const [salaryRecords, setSalaryRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingPayouts, setProcessingPayouts] = useState(new Set());
    const [accountBalance, setAccountBalance] = useState(null);
    const { toast } = useToast();

    // Fetch pending salary records
    const fetchPendingSalaries = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v2/payroll/pending-salaries', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setSalaryRecords(data.data || []);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch salary records",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch Cashfree account balance
    const fetchAccountBalance = async () => {
        try {
            const response = await fetch('/api/v2/payroll/cashfree/balance', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setAccountBalance(data.balance);
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        }
    };

    // Initiate single payout
    const initiatePayout = async (salaryRecordId, incentive = 0, bonus = 0) => {
        setProcessingPayouts(prev => new Set([...prev, salaryRecordId]));
        
        try {
            const response = await fetch('/api/v2/payroll/cashfree/initiate-payout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    salaryRecordId,
                    incentive,
                    bonus,
                    remarks: `Salary payment via Cashfree`
                })
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Payout Initiated",
                    description: `Transfer ID: ${result.transferId}`,
                    variant: "default"
                });
                
                // Update local state
                setSalaryRecords(prev => 
                    prev.map(record => 
                        record.id === salaryRecordId 
                            ? { ...record, status: 'PROCESSING', paymentRef: result.transferId }
                            : record
                    )
                );
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                title: "Payout Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setProcessingPayouts(prev => {
                const newSet = new Set(prev);
                newSet.delete(salaryRecordId);
                return newSet;
            });
        }
    };

    // Initiate bulk payout
    const initiateBulkPayout = async (selectedRecords) => {
        setLoading(true);
        
        try {
            const response = await fetch('/api/v2/payroll/cashfree/bulk-payout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    salaryRecords: selectedRecords.map(record => ({
                        salaryRecordId: record.id,
                        incentive: 0,
                        bonus: 0
                    }))
                })
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Bulk Payout Initiated",
                    description: `${result.successful} out of ${result.totalProcessed} payouts successful`,
                    variant: "default"
                });
                
                // Refresh the salary records
                fetchPendingSalaries();
            } else {
                throw new Error('Bulk payout failed');
            }
        } catch (error) {
            toast({
                title: "Bulk Payout Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Check payout status
    const checkPayoutStatus = async (transferId) => {
        try {
            const response = await fetch(`/api/v2/payroll/cashfree/status/${transferId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            
            if (result.success) {
                toast({
                    title: "Status Updated",
                    description: `Transfer ${transferId} is ${result.status}`,
                    variant: "default"
                });
                
                // Update local state if needed
                fetchPendingSalaries();
            }
        } catch (error) {
            toast({
                title: "Status Check Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'PENDING': { variant: 'secondary', icon: Clock, text: 'Pending' },
            'PROCESSING': { variant: 'default', icon: RefreshCw, text: 'Processing' },
            'PAID': { variant: 'success', icon: CheckCircle, text: 'Paid' },
            'FAILED': { variant: 'destructive', icon: XCircle, text: 'Failed' }
        };
        
        const config = statusConfig[status] || statusConfig['PENDING'];
        const IconComponent = config.icon;
        
        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <IconComponent className="w-3 h-3" />
                {config.text}
            </Badge>
        );
    };

    useEffect(() => {
        fetchPendingSalaries();
        fetchAccountBalance();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Cashfree Payout Manager</h1>
                <Button onClick={fetchAccountBalance} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Balance
                </Button>
            </div>

            {/* Account Balance Card */}
            {accountBalance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Account Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ₹{accountBalance.availableBalance || '0.00'}
                        </div>
                        <p className="text-sm text-gray-500">
                            Available for payouts
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Bulk Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => {
                                const pendingRecords = salaryRecords.filter(r => r.status === 'PENDING');
                                if (pendingRecords.length > 0) {
                                    initiateBulkPayout(pendingRecords);
                                } else {
                                    toast({
                                        title: "No Pending Records",
                                        description: "No pending salary records found for bulk payout",
                                        variant: "destructive"
                                    });
                                }
                            }}
                            disabled={loading || salaryRecords.filter(r => r.status === 'PENDING').length === 0}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Pay All Pending ({salaryRecords.filter(r => r.status === 'PENDING').length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Salary Records */}
            <Card>
                <CardHeader>
                    <CardTitle>Salary Records</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                            Loading salary records...
                        </div>
                    ) : salaryRecords.length === 0 ? (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                No salary records found. Generate some salary records first.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-4">
                            {salaryRecords.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-medium">
                                                {record.user?.firstName} {record.user?.lastName}
                                            </h3>
                                            {getStatusBadge(record.status)}
                                        </div>
                                        <div className="text-sm text-gray-500 space-x-4">
                                            <span>Employee ID: {record.user?.employeeId}</span>
                                            <span>Month: {record.month}/{record.year}</span>
                                            <span>Net Salary: ₹{record.netSalary}</span>
                                            {record.paymentRef && (
                                                <span>Ref: {record.paymentRef}</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {record.status === 'PENDING' && (
                                            <Button
                                                onClick={() => initiatePayout(record.id)}
                                                disabled={processingPayouts.has(record.id)}
                                                size="sm"
                                            >
                                                {processingPayouts.has(record.id) ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                        Processing
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Pay Now
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        
                                        {record.status === 'PROCESSING' && record.paymentRef && (
                                            <Button
                                                variant="outline"
                                                onClick={() => checkPayoutStatus(record.paymentRef)}
                                                size="sm"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Check Status
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CashfreePayoutManager;
