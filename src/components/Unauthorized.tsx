import { AlertCircle } from "lucide-react";

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 w-full h-full">
      <AlertCircle className="w-16 h-16 text-red-500" />
      <h1 className="text-2xl font-bold text-gray-800">Unauthorized Access</h1>
      <p className="text-gray-600">You don't have permission to access this page.</p>
    </div>
  );
};

export default Unauthorized;
