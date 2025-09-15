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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all duration-300 hover:shadow-md">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-6 pb-6">
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
    const styles: Record<HighlightType, string> = {
      info: "bg-blue-50 border-blue-200 text-blue-900",
      warning: "bg-amber-50 border-amber-200 text-amber-900",
      success: "bg-green-50 border-green-200 text-green-900"
    };
    
    return (
      <div className={`p-4 rounded-lg border-l-4 ${styles[type]} my-4`}>
        {children}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Last updated: August 23, 2025</span>
              </div>
            </div>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed">
            This Privacy Policy describes our policies and procedures on the collection, use and disclosure of your information when you use our service and tells you about your privacy rights and how the law protects you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Quick Summary */}
        <HighlightBox type="info">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Quick Summary</h3>
              <p className="text-sm">
                We use your personal data to provide and improve our service. By using Alkaa, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </div>
          </div>
        </HighlightBox>

        {/* Definitions Section */}
        <CollapsibleSection id="definitions" title="Definitions & Terms" icon={FileText} defaultExpanded={false}>
          <div className="space-y-4">
            <p className="text-gray-700 mb-4">
              The words of which the initial letter is capitalized have meanings defined under the following conditions:
            </p>
            <div className="grid gap-4">
              {[
                { term: "Account", def: "A unique account created for you to access our service or parts of our service." },
                { term: "Company", def: 'Refers to Sapmate, located at Noida one sec 62 Noida Uttar pradesh-201309 India.' },
                { term: "Service", def: "Refers to the Alkaa website." },
                { term: "Personal Data", def: "Any information that relates to an identified or identifiable individual." },
                { term: "Usage Data", def: "Data collected automatically, either generated by the use of the service or from the service infrastructure itself." },
                { term: "Website", def: "Alkaa, accessible from https://www.alkaa.online" }
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <dt className="font-semibold text-gray-900 mb-1">{item.term}</dt>
                  <dd className="text-gray-700 text-sm">{item.def}</dd>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* Data Collection */}
        <CollapsibleSection id="data-collection" title="What Data We Collect" icon={Eye} defaultExpanded={true}>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <p className="text-gray-700 mb-3">
                We may ask you to provide certain personally identifiable information that can be used to contact or identify you:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {["Email address", "First name and last name", "Phone number", "Address, State, Province, ZIP/Postal code, City", "Usage Data"].map((item, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-3 text-sm text-blue-900">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Usage Data
              </h3>
              <p className="text-gray-700 mb-3">
                Usage Data is collected automatically and may include:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></div>
                  <span>Your device's IP address, browser type and version</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></div>
                  <span>Pages you visit, time and date of visits</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></div>
                  <span>Mobile device information and unique identifiers</span>
                </li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* How We Use Data */}
        <CollapsibleSection id="data-usage" title="How We Use Your Data" icon={Lock} defaultExpanded={true}>
          <div className="grid gap-4">
            {[
              { title: "Service Provision", desc: "To provide and maintain our service, including monitoring usage" },
              { title: "Account Management", desc: "To manage your registration and provide access to service features" },
              { title: "Communication", desc: "To contact you with updates, security alerts, and service information" },
              { title: "Improvement", desc: "To analyze usage trends and improve our service quality" },
              { title: "Marketing", desc: "To provide news and offers about similar services (opt-out available)" },
              { title: "Legal Compliance", desc: "To comply with legal obligations and protect our rights" }
            ].map((item, index) => (
              <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-100">
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Data Sharing */}
        <CollapsibleSection id="data-sharing" title="When We Share Data" icon={Users}>
          <HighlightBox type="warning">
            <p className="font-medium mb-2">We may share your information in these situations:</p>
          </HighlightBox>
          
          <div className="space-y-3">
            {[
              "With service providers to monitor and analyze our service usage",
              "During business transfers like mergers or acquisitions",
              "With affiliates who must honor this privacy policy",
              "With business partners for specific promotions or services",
              "With your explicit consent for other purposes"
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                <span className="text-sm text-amber-900">{item}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Your Rights */}
        <CollapsibleSection id="your-rights" title="Your Privacy Rights" icon={Shield}>
          <HighlightBox type="success">
            <h4 className="font-semibold mb-2">You have the right to:</h4>
          </HighlightBox>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Access", desc: "Request copies of your personal data" },
              { title: "Correction", desc: "Request correction of inaccurate data" },
              { title: "Deletion", desc: "Request deletion of your personal data" },
              { title: "Portability", desc: "Request transfer of your data" },
              { title: "Objection", desc: "Object to processing of your data" },
              { title: "Restriction", desc: "Request restriction of processing" }
            ].map((item, index) => (
              <div key={index} className="bg-white border border-green-200 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 mb-1">{item.title}</h5>
                <p className="text-sm text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Security */}
        <CollapsibleSection id="security" title="Data Security" icon={Lock}>
          <div className="flex items-start space-x-4 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
            <Shield className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Your Security Matters</h3>
              <p className="text-blue-100">
                The security of your personal data is important to us. While we use commercially acceptable means to protect your data, 
                no method of transmission over the internet is 100% secure. We continuously work to improve our security measures.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Children's Privacy */}
        <CollapsibleSection id="children-privacy" title="Children's Privacy" icon={Shield}>
          <HighlightBox type="warning">
            <p>
              <strong>Age Restriction:</strong> Our service does not address anyone under the age of 13. We do not knowingly collect 
              personally identifiable information from children under 13. If you're a parent and believe your child has provided us 
              with personal data, please contact us immediately.
            </p>
          </HighlightBox>
        </CollapsibleSection>

        {/* Updates */}
        <CollapsibleSection id="updates" title="Policy Updates" icon={Calendar}>
          <p className="text-gray-700 mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by:
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900">Email notification</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-purple-900">Prominent notice on our service</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white mt-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Questions?</h2>
              <p className="text-gray-300 mb-4">
                If you have any questions about this Privacy Policy, don't hesitate to reach out.
              </p>
              <a 
                href="mailto:support@alkaa.online" 
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors duration-200"
              >
                <Mail className="w-4 h-4" />
                <span>support@alkaa.online</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">
            © 2025 Alkaa by Sapmate. This privacy policy is effective as of August 23, 2025.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;