export interface ISalaryParameters {
  hraPercentage: number;
  daPercentage: number;
  taPercentage: number;
  pfPercentage: number;
  taxPercentage: number;
  insuranceFixed: number;
  additionalAllowances?: Record<string, number>;
  additionalDeductions?: Record<string, number>;
  userId?: string;
}
