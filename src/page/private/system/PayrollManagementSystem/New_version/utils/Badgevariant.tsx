import { PayrollStatus } from "@/interface/general";

export const getStatusBadgeVariant = (status: PayrollStatus): "default" | "destructive" | "success" | "secondary" | "outline" => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'secondary';
      case 'PROCESSING':
        return 'outline'; 
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };