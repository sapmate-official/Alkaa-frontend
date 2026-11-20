import { PayrollStatus } from "@/types/general";

export const getStatusBadgeVariant = (
  status?: PayrollStatus | string
): "default" | "destructive" | "success" | "secondary" | "outline" | "warning" => {
  if (!status) return "outline";
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'APPROVED':
      return 'success';
    case 'PENDING':
    case 'AWAITING':
      return 'warning';
    case 'PROCESSING':
      return 'secondary';
    case 'FAILED':
    case 'CANCELLED':
    case 'REJECTED':
      return 'destructive';
    default:
      return 'outline';
  }
};
