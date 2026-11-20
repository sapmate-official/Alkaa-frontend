import { Info } from 'lucide-react';

export const PolicyView = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Company Holiday Policy</h2>
      
      <div className="bg-secondary/40 p-4 rounded-lg border border-border">
        <div className="flex items-start">
          <Info className="mr-2.5 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Company holidays are days when the office is closed and employees are not expected to work. 
            These are separate from an employee's personal leave allocation.
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
          <div className="bg-secondary/50 px-4 py-2.5 border-b border-border font-medium text-sm text-foreground">
            Public Holidays
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The company observes all federal public holidays. The office is closed on these days and employees are not expected to work.
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
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
        
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
          <div className="bg-secondary/50 px-4 py-2.5 border-b border-border font-medium text-sm text-foreground">
            Company Holidays
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              In addition to public holidays, the company designates additional days as company holidays. 
              The office is closed on these days and employees are not expected to work.
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
              <li>Day after Thanksgiving</li>
              <li>Christmas Eve (December 24)</li>
              <li>Company Foundation Day (March 15)</li>
              <li>Additional floating holidays may be announced by management</li>
            </ul>
          </div>
        </div>
        
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
          <div className="bg-secondary/50 px-4 py-2.5 border-b border-border font-medium text-sm text-foreground">
            Working During Holidays
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If business needs require an employee to work on a company holiday:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
              <li>Non-exempt employees will receive overtime compensation as per labor laws</li>
              <li>Exempt employees will receive an alternative day off to be taken within 30 days</li>
              <li>Any work on holidays requires prior approval from department management</li>
            </ul>
          </div>
        </div>
        
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
          <div className="bg-secondary/50 px-4 py-2.5 border-b border-border font-medium text-sm text-foreground">
            Holiday Calendar Updates
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The company holiday calendar is published annually by November 30th for the following year. 
              Any changes to the holiday schedule will be communicated to all employees with at least 30 days' notice whenever possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
