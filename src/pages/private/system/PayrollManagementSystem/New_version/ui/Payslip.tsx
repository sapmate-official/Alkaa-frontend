import { Badge } from "@/components/ui/badge";
import { PayrollStatus, PayslipData } from "@/types/general";
import { cn } from "@/lib/utils";

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
    getStatusBadgeVariant: (status: PayrollStatus) => "default" | "destructive" | "success" | "secondary" | "outline" | "warning";
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
            className={cn(
                "p-3.5 rounded-lg border transition-colors cursor-pointer",
                isSelected
                    ? "bg-secondary/80 border-foreground/25"
                    : "bg-card border-border hover:bg-muted/40"
            )}
            onClick={() => onSelect(payslip)}
        >
            <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                    <h4 className="font-medium text-sm text-foreground">
                        {months.find((m) => m.value === payslip.month)?.label || `Month ${payslip.month}`} {payslip.year}
                    </h4>
                    <p className="text-sm font-semibold tabular-nums text-muted-foreground">
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
