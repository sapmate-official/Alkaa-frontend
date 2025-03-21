import { Info } from 'lucide-react';

export const PolicyView = () => {
  return (
    <div>
    <h2 className="text-xl font-semibold mb-4">Company Holiday Policy</h2>
    
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
      <div className="flex items-start">
        <Info className="mr-2 h-5 w-5 text-blue-500 mt-0.5" />
        <p className="text-blue-700 text-sm">
          Company holidays are days when the office is closed and employees are not expected to work. 
          These are separate from an employee's personal leave allocation.
        </p>
      </div>
    </div>
    
    <div className="space-y-6">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b font-medium">
          Public Holidays
        </div>
        <div className="p-4">
          <p className="text-gray-700 mb-3">
            The company observes all federal public holidays. The office is closed on these days and employees are not expected to work.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1 text-sm">
            <li>New Year's Day (January 1)</li>
            <li>Martin Luther King Jr. Day (Third Monday in January)</li>
            <li>President's Day (Third Monday in February)</li>
            <li>Memorial Day (Last Monday in May)</li>
            <li>Independence Day (July 4)</li>
            <li>Labor Day (First Monday in September)</li>
            <li>Thanksgiving Day (Fourth Thursday in November)</li>
            <li>Christmas Day (December 25)</li>
          </ul>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b font-medium">
          Company Holidays
        </div>
        <div className="p-4">
          <p className="text-gray-700 mb-3">
            In addition to public holidays, the company designates additional days as company holidays. 
            The office is closed on these days and employees are not expected to work.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1 text-sm">
            <li>Day after Thanksgiving</li>
            <li>Christmas Eve (December 24)</li>
            <li>Company Foundation Day (March 15)</li>
            <li>Additional floating holidays may be announced by management</li>
          </ul>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b font-medium">
          Working During Holidays
        </div>
        <div className="p-4">
          <p className="text-gray-700 mb-3">
            If business needs require an employee to work on a company holiday:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1 text-sm">
            <li>Non-exempt employees will receive overtime compensation as per labor laws</li>
            <li>Exempt employees will receive an alternative day off to be taken within 30 days</li>
            <li>Any work on holidays requires prior approval from department management</li>
          </ul>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b font-medium">
          Holiday Calendar Updates
        </div>
        <div className="p-4">
          <p className="text-gray-700">
            The company holiday calendar is published annually by November 30th for the following year. 
            Any changes to the holiday schedule will be communicated to all employees with at least 30 days' notice whenever possible.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};
