import { Badge } from "@/components/ui/badge";
import { PayrollStatus, PayslipData } from "@/types/general";



interface Month {
    value: number;
    label: string;
}

interface PayslipItemProps {
    payslip: PayslipData;
    isSelected: boolean;
    onSelect: (payslip: PayslipData) => void;
    months: Month[];
    formatCurrency: (amount: number) => string;
    getStatusBadgeVariant: (status: PayrollStatus) => "default" | "destructive" | "success" | "secondary" | "outline";
}

export const PayslipListItem = ({ 
    payslip, 
    isSelected, 
    onSelect, 
    months, 
    formatCurrency,
    getStatusBadgeVariant 
}: PayslipItemProps) => {
    return (
        <div
            key={payslip.id}
            className={`p-4 rounded-md cursor-pointer transition-colors ${
                isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
            }`}
            onClick={() => onSelect(payslip)}
        >
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium">
                        {months.find((m) => m.value === payslip.month)?.label} {payslip.year}
                    </h4>
                    <p className="text-sm opacity-90">
                        {formatCurrency(payslip.netSalary)}
                    </p>
                </div>
                <Badge variant={getStatusBadgeVariant(payslip.status)}>
                    {payslip.status}
                </Badge>
            </div>
        </div>
    );
};