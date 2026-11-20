import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Eye, Lock, Users, FileText, Mail, Calendar, ExternalLink } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Partial<Record<string, boolean>>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  type CollapsibleSectionProps = {
    id: string;
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    children?: React.ReactNode;
    defaultExpanded?: boolean;
  };

  const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ id, title, icon: Icon, children, defaultExpanded = false }) => {
    const isExpanded = expandedSections[id] ?? defaultExpanded;
    
    return (
      <div className="bg-card rounded-xl shadow-xs border border-border overflow-hidden mb-5 transition-all duration-200">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-2 bg-secondary text-foreground rounded-lg">
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    );
  };

  type HighlightType = "info" | "warning" | "success";

  interface HighlightBoxProps {
    children: React.ReactNode;
    type?: HighlightType;
  }

  const HighlightBox: React.FC<HighlightBoxProps> = ({ children, type = "info" }) => {
    const borderStyles: Record<HighlightType, string> = {
      info: "border-l-primary",
      warning: "border-l-amber-500",
      success: "border-l-emerald-500"
    };
    
    return (
      <div className={`p-4 rounded-lg border-l-4 ${borderStyles[type]} bg-secondary/40 my-4 text-foreground text-sm`}>
        {children}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-secondary rounded-xl text-foreground">
              <Shield className="w-8 h-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
              <div className="flex items-center space-x-2 mt-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Last updated: August 23, 2025</span>
              </div>
            </div>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            This Privacy Policy describes our policies and procedures on the collection, use, and disclosure of your information when you use our service, explaining your privacy rights and statutory protections.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Quick Summary */}
        <HighlightBox type="info">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Quick Summary</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We use your personal data exclusively to provide, maintain, and enhance the Alkaa platform. By using Alkaa, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </div>
          </div>
        </HighlightBox>

        {/* Definitions Section */}
        <CollapsibleSection id="definitions" title="Definitions & Terms" icon={FileText} defaultExpanded={false}>
          <div className="space-y-4">
            <p className="text-muted-foreground mb-4">
              Capitalized terms in this document hold specific legal meanings defined below:
            </p>
            <div className="grid gap-3">
              {[
                { term: "Account", def: "A unique authenticated profile provisioned for an organization or employee to access the service." },
                { term: "Company", def: 'ShapeNXT, located at Noida One, Sector 62, Noida, Uttar Pradesh - 201309, India.' },
                { term: "Service", def: "The Alkaa Workforce & People Management platform." },
                { term: "Personal Data", def: "Any information relating to an identified or identifiable natural person." },
                { term: "Usage Data", def: "Telemetry and diagnostic metrics generated automatically through interaction with the service." },
                { term: "Website", def: "Alkaa, accessible from https://www.alkaa.online" }
              ].map((item, index) => (
                <div key={index} className="bg-secondary/40 border border-border/50 rounded-lg p-3.5">
                  <dt className="font-semibold text-foreground mb-0.5">{item.term}</dt>
                  <dd className="text-muted-foreground text-xs leading-relaxed">{item.def}</dd>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* Data Collection */}
        <CollapsibleSection id="data-collection" title="What Data We Collect" icon={Eye} defaultExpanded={true}>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                Personal Information
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                During account creation, onboarding, or administrative management, we may collect:
              </p>
              <div className="grid md:grid-cols-2 gap-2.5">
                {[
                  "Email address & authentication tokens",
                  "First name and last name",
                  "Phone numbers & emergency contacts",
                  "Address, State, Postal Code, Country",
                  "Department, role, and manager mappings",
                  "Attendance coordinates & check-in timestamps"
                ].map((item, index) => (
                  <div key={index} className="bg-secondary/40 border border-border/50 rounded-lg p-3 text-xs text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <h3 className="text-base font-semibold text-foreground mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                Usage & Telemetry Data
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                Operational data collected automatically to safeguard system integrity:
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>IP address, user agent, browser engine, and operating system</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Page visits, navigation duration, and interaction timestamps</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Audit trails of administrative updates and access token validations</span>
                </li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* How We Use Data */}
        <CollapsibleSection id="data-usage" title="How We Use Your Data" icon={Lock} defaultExpanded={true}>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { title: "Service Delivery", desc: "Core payroll, live attendance verification, and role-based permissions." },
              { title: "Account & Organization", desc: "Managing multi-tenant separation, user provisioning, and role governance." },
              { title: "System Communication", desc: "Transmitting security alerts, password resets, and critical workflow notices." },
              { title: "Reliability & Analytics", desc: "Monitoring platform stability, eliminating errors, and diagnosing latency." },
              { title: "Compliance", desc: "Fulfilling tax withholding records, statutory audit trails, and legal duties." },
              { title: "Data Security", desc: "Preventing unauthorized access, fraudulent logins, and malicious abuse." }
            ].map((item, index) => (
              <div key={index} className="bg-secondary/40 rounded-lg p-4 border border-border/50">
                <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Data Sharing */}
        <CollapsibleSection id="data-sharing" title="When We Share Data" icon={Users}>
          <HighlightBox type="warning">
            <p className="font-medium text-xs">We do not sell personal data. Information is disclosed solely in these scenarios:</p>
          </HighlightBox>
          
          <div className="space-y-2.5">
            {[
              "With enterprise cloud infrastructure and verified database providers strictly for hosting",
              "During corporate transactions such as a merger, asset restructuring, or acquisition",
              "With authorized administrators inside your employer's tenant organization",
              "When required by applicable statutory regulations, subpoenas, or lawful orders",
              "With your express, verifiable consent for integrated third-party extensions"
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-secondary/30 border border-border/40 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span className="text-xs text-foreground leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Your Rights */}
        <CollapsibleSection id="your-rights" title="Your Privacy Rights" icon={Shield}>
          <HighlightBox type="success">
            <h4 className="font-medium text-xs">Under data privacy regulations, you retain enforceable rights:</h4>
          </HighlightBox>
          
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { title: "Right of Access", desc: "Request an export of all personal information retained on your profile." },
              { title: "Right to Rectification", desc: "Correct inaccurate or incomplete profile and bank information." },
              { title: "Right to Erasure", desc: "Request deletion of non-statutory records upon contract conclusion." },
              { title: "Data Portability", desc: "Export your attendance and compensation history in standardized format." },
              { title: "Right to Object", desc: "Challenge processing based on legitimate interests or automated decisions." },
              { title: "Consent Withdrawal", desc: "Revoke optional permissions such as push notifications at any time." }
            ].map((item, index) => (
              <div key={index} className="bg-secondary/40 border border-border/50 rounded-lg p-3.5">
                <h5 className="font-semibold text-foreground text-xs mb-1">{item.title}</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Security */}
        <CollapsibleSection id="security" title="Data Security" icon={Lock}>
          <div className="flex items-start space-x-4 p-5 bg-card border border-border rounded-xl">
            <Shield className="w-7 h-7 flex-shrink-0 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1.5">Defense in Depth Architecture</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We protect your data with TLS 1.3 encryption in transit, AES-256 encryption at rest, secure HTTP-only cookies, strict CORS controls, and role-based tenant isolation. While no online storage is impenetrable, our infrastructure undergoes routine vulnerability reviews and automated testing.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Contact Information */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 mt-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Have Questions?</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                Our security and compliance team is available to assist with data access requests or privacy questions.
              </p>
            </div>
            <a 
              href="mailto:support@alkaa.online" 
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>support@alkaa.online</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-6 mt-12 bg-card/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-muted-foreground text-xs">
            © 2025 Alkaa by ShapeNXT. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
