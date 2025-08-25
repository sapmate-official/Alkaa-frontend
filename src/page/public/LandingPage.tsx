import React, { useState, useCallback, memo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  ChartPie,
  Clock,
  Building2,
  MessageCircle,
  ArrowRight,
  Loader2,
  Users,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  Star,
  PlayCircle,
  Database,
  Lock,
  Smartphone,
  BarChart3,
  DollarSign,
  UserCheck,
  FileText,
  Settings,
  Bell,
  Target,
  Award,
  Briefcase,
  PieChart,
  Activity,
  Cpu,
  CloudLightning,
  Code2,
  GitBranch,
  Server,
  Layers,
  Workflow
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { backendDomain } from '@/lib/constant/Domain';
import { useToast } from '@/hooks/use-toast';
import RouteDict from '@/routes/RouteDict';

// interface FeatureCardProps {
//   title: string;
//   description: string;
//   icon: React.ReactNode;
//   category?: string;
// }

// const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, category }) => (
//   <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300 hover:scale-105 group">
//     <CardHeader className="pb-2">
//       <div className="mb-2 text-primary group-hover:scale-110 transition-transform duration-300">{icon}</div>
//       {category && <div className="text-xs text-primary font-medium mb-1">{category}</div>}
//       <CardTitle className="text-lg font-semibold">{title}</CardTitle>
//     </CardHeader>
//     <CardContent>
//       <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
//     </CardContent>
//   </Card>
// );

// interface MetricCardProps {
//   value: string;
//   label: string;
//   icon: React.ReactNode;
//   description?: string;
// }

// const MetricCard: React.FC<MetricCardProps> = ({ value, label, icon, description }) => (
//   <Card className="text-center border-border bg-card/50 backdrop-blur hover:bg-card transition-colors">
//     <CardContent className="p-6">
//       <div className="text-primary mb-3 flex justify-center">
//         {icon}
//       </div>
//       <div className="text-3xl font-bold text-primary mb-1">{value}</div>
//       <div className="text-sm font-medium text-foreground mb-1">{label}</div>
//       {description && <div className="text-xs text-muted-foreground">{description}</div>}
//     </CardContent>
//   </Card>
// );

interface TechStackItemProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const TechStackItem: React.FC<TechStackItemProps> = ({ name, description, icon, category }) => (
  <Card className="border border-border bg-card hover:shadow-md transition-all duration-300 hover:border-primary/50">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className="text-primary mt-1">{icon}</div>
        <div className="flex-1">
          <div className="text-xs text-primary font-medium mb-1">{category}</div>
          <h4 className="font-semibold text-sm mb-1">{name}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface SecurityFeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  compliance?: string[];
}

const SecurityFeature: React.FC<SecurityFeatureProps> = ({ title, description, icon, compliance }) => (
  <Card className="border border-border bg-card hover:shadow-md transition-all duration-300">
    <CardContent className="p-6">
      <div className="text-primary mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {compliance && (
        <div className="flex flex-wrap gap-1">
          {compliance.map((item, index) => (
            <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {item}
            </span>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

interface PricingTierProps {
  title: string;
  price: string;
  description: string;
  billingInfo: string;
  buttonText: string;
  highlighted?: boolean;
  popularTag?: boolean;
  onButtonClick?: () => void;
}

const PricingTier: React.FC<PricingTierProps> = ({ 
  title, 
  price, 
  description, 
  billingInfo,
  buttonText, 
  highlighted = false,
  popularTag = false,
  onButtonClick
}) => (
  <Card className={`border ${highlighted ? 'border-primary bg-secondary/50' : 'border-border bg-card'} h-full flex flex-col relative`}>
    {popularTag && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
        Most Popular
      </div>
    )}
    <CardHeader className="pb-2">
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-1 flex flex-col justify-between">
      <div>
        <div className="mb-6">
          <span className="text-4xl font-bold">{price}</span>
          {price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
          <p className="text-sm text-muted-foreground mt-1">{billingInfo}</p>
        </div>
        <div className="py-4">
          <p className="text-center font-medium">All Features Included</p>
        </div>
      </div>      <Button 
        onClick={onButtonClick}
        className={`w-full mt-4 ${highlighted ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
      >
        {buttonText}
      </Button>
    </CardContent>
  </Card>
);

interface DemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name: string;
    company: string;
    phoneNumber: string;
    email: string;
  };
  formErrors: {
    name: string;
    company: string;
    phoneNumber: string;
    email: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDemoRequest: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

// Memoized dialog component to prevent unnecessary re-renders
const DemoRequestDialog = memo(({
  open,
  onOpenChange,
  formData,
  formErrors,
  handleInputChange,
  handleDemoRequest,
  isSubmitting
}: DemoDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Request a Demo</DialogTitle>
        <DialogDescription>
          Fill out the form below and our team will contact you to schedule a personalized demo.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleDemoRequest} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="John Doe" 
            value={formData.name}
            onChange={handleInputChange}
            className={formErrors.name ? "border-red-500" : ""}
          />
          {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <Input 
            id="company" 
            name="company" 
            placeholder="Acme Inc." 
            value={formData.company}
            onChange={handleInputChange}
            className={formErrors.company ? "border-red-500" : ""}
          />
          {formErrors.company && <p className="text-sm text-red-500">{formErrors.company}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input 
            id="phoneNumber" 
            name="phoneNumber" 
            placeholder="+91 98765 43210" 
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className={formErrors.phoneNumber ? "border-red-500" : ""}
          />
          {formErrors.phoneNumber && <p className="text-sm text-red-500">{formErrors.phoneNumber}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="john@example.com" 
            value={formData.email}
            onChange={handleInputChange}
            className={formErrors.email ? "border-red-500" : ""}
          />
          {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
        </div>
        
        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : 'Request Demo'}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
));

DemoRequestDialog.displayName = "DemoRequestDialog";

const AlkaaLandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phoneNumber: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    company: '',
    phoneNumber: '',
    email: ''
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use useCallback to memoize handlers so they don't cause re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    setFormErrors(prevErrors => {
      if (prevErrors[name as keyof typeof prevErrors]) {
        return {
          ...prevErrors,
          [name]: ''
        };
      }
      return prevErrors;
    });
  }, []);
  
  const validateForm = useCallback(() => {
    let valid = true;
    const newErrors = { ...formErrors };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
      valid = false;
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      valid = false;
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      valid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  }, [formData, formErrors]);
  
  const handleDemoRequest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${backendDomain}/api/v2/public/demo-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Demo Request Submitted",
          description: "We'll contact you soon to schedule your demo!",
          variant: "default"
        });
        setDemoDialogOpen(false);
        setFormData({
          name: '',
          company: '',
          phoneNumber: '',
          email: ''
        });
      } else {
        toast({
          title: "Submission Failed",
          description: data.error || "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error submitting demo request:", error);
      toast({
        title: "Submission Error",
        description: "Unable to submit your request. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, toast, validateForm]);

  return (
    <div className="min-h-screen flex flex-col" style={{ scrollBehavior: 'smooth' }}>
      <style>
        {`
          html {
            scroll-behavior: smooth;
          }
        `}
      </style>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-xl items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo_icon.svg" alt="Alkaa Logo" className="h-8 w-8" />
            <span className="text-xl font-bold">Alkaa</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <Button onClick={()=>navigate(RouteDict.SignInPage)} variant="outline">Log in</Button>
            <Button onClick={()=>setDemoDialogOpen(true)}>Get Started</Button>
          </nav>
          
          <div className="md:hidden">
            <Button 
              variant="outline" 
              className="h-10 w-10 p-0" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </>
                )}
              </svg>
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden p-4 border-t border-border/40 bg-background">
            <nav className="flex flex-col gap-4">
              <a 
                href="#features" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#testimonials" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <a 
                href="#pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={()=>navigate(RouteDict.SignInPage)} variant="outline">Log in</Button>
                <Button onClick={()=>navigate(RouteDict.SignUpPage)}>Get Started</Button>
              </div>
            </nav>
          </div>        )}      </header>      <main className="flex-1">
        {/* Hero Section - Enhanced with modern design */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20"></div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-secondary/30 rounded-full blur-3xl opacity-50"></div>
          
          <div className="container max-w-screen-xl px-4 md:px-8 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="max-w-4xl space-y-8">
                {/* Main Heading */}
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    From HR Chaos to{" "}
                    <span className="text-primary relative">
                      Perfect Harmony
                      <div className="absolute -inset-1 bg-primary/20 rounded-lg blur opacity-30"></div>
                    </span>
                  </h1>
                  <div className="text-xl md:text-2xl text-muted-foreground font-medium">
                    Streamline Your Workforce with Alkaa
                  </div>
                </div>

                {/* Description */}
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                  Streamline your workforce management with our <span className="text-primary font-semibold">cloud-native HR platform</span>. 
                  From employee onboarding to payroll processing, manage everything in one comprehensive, secure system.
                </p>

                {/* Value Propositions */}
                <div className="grid sm:grid-cols-3 gap-4 py-4 max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/50">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">80% Time Saved</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/50">
                    <Globe className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Multi-Tenant</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/50">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Enterprise Security</span>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center">
                  <Button 
                    onClick={()=>navigate(RouteDict.SignUpPage)} 
                    className="text-base px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-base px-8 py-6 border-2 hover:bg-secondary/50 transition-all duration-300"
                    onClick={() => setDemoDialogOpen(true)}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-muted-foreground font-medium">14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-muted-foreground font-medium">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-muted-foreground font-medium">Setup in 24 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full p-1">
              <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mx-auto animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Mission & Overview Section */}
        <section className="py-24 bg-secondary/20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Our Mission</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Simplifying HR for the Digital Age
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                To simplify and digitize HR processes while providing organizations with powerful tools for 
                workforce management, compliance tracking, and <span className="text-primary font-semibold">data-driven decision making</span>.
              </p>
            </div>

            {/* Key Benefits Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-2">80%</h3>
                <p className="text-sm font-medium mb-2">Automation</p>
                <p className="text-xs text-muted-foreground">Reduce manual HR tasks</p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-green-500 mb-2">100%</h3>
                <p className="text-sm font-medium mb-2">Compliance</p>
                <p className="text-xs text-muted-foreground">Built-in audit trails</p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-blue-500 mb-2">1000+</h3>
                <p className="text-sm font-medium mb-2">Scalability</p>
                <p className="text-xs text-muted-foreground">Support for large orgs</p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-card/50 border border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-orange-500 mb-2">Real-time</h3>
                <p className="text-sm font-medium mb-2">Analytics</p>
                <p className="text-xs text-muted-foreground">Insights & reporting</p>
              </div>
            </div>

            {/* Complete Employee Lifecycle */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl p-12 border border-border/50">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4">Complete Employee Lifecycle Management</h3>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  From recruitment to exit, Alkaa covers every aspect of employee management with integrated modules.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="h-10 w-10 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Onboarding & Management</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Complete employee data management with document handling, verification processes, 
                    and automated workflows for seamless onboarding.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Activity className="h-10 w-10 text-green-500" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Tracking & Analytics</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Real-time attendance monitoring with location verification, performance tracking, 
                    and comprehensive reporting for data-driven insights.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <DollarSign className="h-10 w-10 text-blue-500" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Payroll & Benefits</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Comprehensive salary calculation with tax management, payment processing, 
                    and automated compliance with regulatory requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Platform Architecture */}
        <section className="py-24">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Three-Platform <span className="text-primary">Ecosystem</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                Alkaa is architected as a modern SaaS platform with three specialized components 
                working together to provide comprehensive HR management solutions.
              </p>
            </div>

            {/* Platform Components */}
            <div className="grid lg:grid-cols-3 gap-8 mb-16">
              <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 hover:shadow-xl transition-all duration-500 group">
                <div className="text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Main Platform</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Core HR system for day-to-day operations including employee management, 
                  attendance tracking, and payroll processing with comprehensive dashboards.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Employee self-service portal</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Manager dashboards & workflows</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">HR admin comprehensive controls</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Real-time analytics & reporting</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-background to-blue-500/10 hover:shadow-xl transition-all duration-500 group">
                <div className="text-blue-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Admin Platform</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Super administrator system for platform-level management and 
                  multi-tenant organization control with comprehensive oversight.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Multi-tenant organization management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Subscription plan administration</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Billing & payment processing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">System-wide analytics & monitoring</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 via-background to-green-500/10 hover:shadow-xl transition-all duration-500 group">
                <div className="text-green-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Mobile PWA</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Progressive Web Application optimized for mobile workforce with 
                  offline capabilities and native app-like experience.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Check-in/check-out functionality</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Leave application & approval</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Push notifications & alerts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Offline capability for critical functions</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Architecture Highlights */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card/50 rounded-2xl p-8 border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Multi-Tenant Architecture</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Data Isolation</p>
                      <p className="text-xs text-muted-foreground">Complete separation of organizational data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Scalability</p>
                      <p className="text-xs text-muted-foreground">Efficient resource utilization across tenants</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Customization</p>
                      <p className="text-xs text-muted-foreground">Organization-specific configurations</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card/50 rounded-2xl p-8 border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CloudLightning className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Cloud-Native Design</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Server className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Microservices</p>
                      <p className="text-xs text-muted-foreground">Scalable microservices architecture</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Auto-scaling</p>
                      <p className="text-xs text-muted-foreground">Dynamic resource allocation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Global CDN</p>
                      <p className="text-xs text-muted-foreground">Worldwide performance optimization</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comprehensive HR Suite */}
        <section id="features" className="py-24 bg-secondary/20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Complete Feature Set</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Everything You Need for <span className="text-primary">HR Excellence</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                Every tool you need to manage your workforce efficiently. From onboarding to payroll, 
                handle the complete employee lifecycle with ease and precision.
              </p>
            </div>
            
            {/* Feature Categories */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Employee Management */}
              <div className="group">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-xs text-primary font-semibold mb-2 uppercase tracking-wider">Employee Management</div>
                  <h3 className="text-xl font-bold mb-4">User & Organization</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Complete employee directory with hierarchical organizational structure, 
                    department management, and role-based access control.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Employee directory & profiles</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Department hierarchy</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Role-based permissions</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Time & Attendance */}
              <div className="group">
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-8 border border-green-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="text-xs text-green-600 font-semibold mb-2 uppercase tracking-wider">Time Tracking</div>
                  <h3 className="text-xl font-bold mb-4">Attendance System</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Real-time check-in/check-out with location verification, session tracking, 
                    and automated attendance reports with verification workflows.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>GPS location tracking</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Multiple session support</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Attendance verification</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Leave Management */}
              <div className="group">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl p-8 border border-blue-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wider">Leave Management</div>
                  <h3 className="text-xl font-bold mb-4">Advanced Leave System</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Configurable leave types, balance tracking, approval workflows, 
                    and calendar integration with carryover support.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Flexible leave types</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Approval workflows</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Balance carryover</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Payroll */}
              <div className="group">
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl p-8 border border-orange-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-orange-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="text-xs text-orange-600 font-semibold mb-2 uppercase tracking-wider">Payroll</div>
                  <h3 className="text-xl font-bold mb-4">Automated Processing</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Complete salary calculation with tax management, allowances, 
                    deductions, and automated payslip generation.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Tax calculations</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Payslip generation</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Payment processing</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Performance & Analytics */}
              <div className="group">
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-8 border border-purple-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ChartPie className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="text-xs text-purple-600 font-semibold mb-2 uppercase tracking-wider">Performance</div>
                  <h3 className="text-xl font-bold mb-4">Analytics & Insights</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Track employee performance with comprehensive analytics, 
                    reporting, and data-driven insights for better decisions.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Performance tracking</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Advanced reporting</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Data insights</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Onboarding */}
              <div className="group">
                <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-2xl p-8 border border-pink-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-pink-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="h-8 w-8 text-pink-500" />
                  </div>
                  <div className="text-xs text-pink-600 font-semibold mb-2 uppercase tracking-wider">Onboarding</div>
                  <h3 className="text-xl font-bold mb-4">Employee Onboarding</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Structured onboarding workflows with document management, 
                    verification processes, and automated communications.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Document management</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Workflow automation</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Verification processes</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Communication */}
              <div className="group">
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-2xl p-8 border border-cyan-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-cyan-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Bell className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div className="text-xs text-cyan-600 font-semibold mb-2 uppercase tracking-wider">Communication</div>
                  <h3 className="text-xl font-bold mb-4">Notification System</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Multi-channel notifications with email, push, and in-app messaging. 
                    Customizable templates and user preferences.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Multi-channel delivery</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Custom templates</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>User preferences</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Compliance */}
              <div className="group">
                <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-8 border border-red-500/20 hover:shadow-xl transition-all duration-500 h-full">
                  <div className="w-16 h-16 mb-6 bg-red-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="text-xs text-red-600 font-semibold mb-2 uppercase tracking-wider">Compliance</div>
                  <h3 className="text-xl font-bold mb-4">Audit & Compliance</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    Complete audit trails, activity logging, and compliance features 
                    for regulatory requirements and data governance.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Activity logging</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Audit trails</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Compliance reporting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology & Architecture Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Scale & Performance</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Enterprise-grade architecture with modern technologies ensuring scalability, security, and performance.
              </p>
            </div>

            {/* Tech Stack Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <TechStackItem
                category="Frontend"
                name="React + TypeScript"
                description="Modern React 18 with TypeScript for type-safe development"
                icon={<Code2 className="h-5 w-5" />}
              />
              <TechStackItem
                category="Backend"
                name="Node.js + Express"
                description="High-performance Node.js backend with Express framework"
                icon={<Server className="h-5 w-5" />}
              />
              <TechStackItem
                category="Database"
                name="PostgreSQL + Redis"
                description="ACID-compliant PostgreSQL with Redis caching layer"
                icon={<Database className="h-5 w-5" />}
              />
              <TechStackItem
                category="Infrastructure"
                name="Cloud-Native"
                description="Docker containers with Kubernetes orchestration"
                icon={<CloudLightning className="h-5 w-5" />}
              />
            </div>

            {/* Architecture Highlights */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border-border bg-card">
                <div className="text-primary mb-4">
                  <Layers className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">Multi-Tenant Architecture</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Complete data isolation between organizations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Scalable resource allocation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Organization-specific configurations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Tenant-level security controls
                  </li>
                </ul>
              </Card>

              <Card className="p-8 border-border bg-card">
                <div className="text-primary mb-4">
                  <Workflow className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">API-First Design</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    RESTful APIs with OpenAPI 3.0 specification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Versioned APIs (v2, v3) for backward compatibility
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Comprehensive third-party integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Auto-generated documentation and SDKs
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* Security & Compliance Section */}
        <section className="py-20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise Security & Compliance</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Bank-grade security with comprehensive compliance features to protect your data and meet regulatory requirements.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <SecurityFeature
                title="Data Protection"
                description="AES-256 encryption for data at rest, TLS 1.3 for data in transit, with secure key management and rotation."
                icon={<Lock className="h-6 w-6" />}
                compliance={["GDPR", "CCPA", "SOC 2"]}
              />
              <SecurityFeature
                title="Access Control"
                description="Multi-factor authentication, role-based permissions, and session management with comprehensive audit trails."
                icon={<Shield className="h-6 w-6" />}
                compliance={["RBAC", "MFA", "SSO"]}
              />
              <SecurityFeature
                title="Compliance Features"
                description="Built-in compliance tools for various regulations with automated reporting and data governance."
                icon={<Award className="h-6 w-6" />}
                compliance={["SOX", "HIPAA", "ISO 27001"]}
              />
            </div>

            {/* Security Stats */}
            <div className="grid sm:grid-cols-4 gap-6 mt-12">
              <div className="text-center p-6 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary mb-2">256-bit</div>
                <div className="text-sm text-muted-foreground">Encryption</div>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </div>
              <div className="text-center p-6 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary mb-2">30 days</div>
                <div className="text-sm text-muted-foreground">Backup Retention</div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Success Stories */}
        <section id="testimonials" className="py-20 bg-secondary/30">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Leading Organizations</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how companies across industries are transforming their HR operations with Alkaa.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border-border bg-card">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-4">
                  "Alkaa transformed our HR operations completely. What used to take hours now takes minutes. 
                  The automated payroll and attendance tracking have been game-changers for our 200+ employee organization."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-sm text-muted-foreground">HR Director, TechFlow Solutions</div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-border bg-card">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-4">
                  "The onboarding process is now seamless. New employees love the self-service portal, 
                  and our HR team can focus on strategic initiatives instead of paperwork."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Michael Rodriguez</div>
                    <div className="text-sm text-muted-foreground">People Operations, GrowthCorp</div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-border bg-card">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-4">
                  "Security and compliance were our top concerns. Alkaa's enterprise-grade security 
                  and audit features give us complete confidence in our data protection."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Dr. Emily Watson</div>
                    <div className="text-sm text-muted-foreground">CHRO, MedCare Systems</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Success Metrics */}
            <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">80%</div>
                <div className="text-lg font-semibold mb-1">Time Reduction</div>
                <div className="text-sm text-muted-foreground">in HR administrative tasks</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">95%</div>
                <div className="text-lg font-semibold mb-1">User Satisfaction</div>
                <div className="text-sm text-muted-foreground">from employees and HR teams</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-lg font-semibold mb-1">Data Accuracy</div>
                <div className="text-sm text-muted-foreground">with automated calculations</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">24hrs</div>
                <div className="text-lg font-semibold mb-1">Implementation</div>
                <div className="text-sm text-muted-foreground">average setup time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section - Enhanced */}
        <section id="pricing" className="py-20 bg-secondary/30">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that scales with your organization. All plans include the complete HR suite.
              </p>
              
              {/* Highlight the key pricing */}
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-8 mt-8 mb-8 border-2 border-primary/30">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-4">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Special Offer</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-2">
                    <span className="text-primary">₹1 per day</span> per employee
                  </h3>
                  <p className="text-lg text-muted-foreground mb-4">
                    For complete HR management solution • Annual subscription
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">One-time implementation charge: ₹4,999</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
              <PricingTier
                title="Small Team"
                price="₹7,300"
                description="Perfect for small teams"
                billingInfo="20 employees • ₹1/day/employee • Annual billing"
                buttonText="Start Free Trial"
                onButtonClick={() => navigate(RouteDict.SignUpPage)}
              />
              <PricingTier
                title="Growing Business"
                price="₹18,250"
                description="Ideal for growing companies"
                billingInfo="50 employees • ₹1/day/employee • Annual billing"
                buttonText="Start Free Trial"
                highlighted={true}
                popularTag={true}
                onButtonClick={() => navigate(RouteDict.SignUpPage)}
              />
              <PricingTier
                title="Enterprise"
                price="Custom"
                description="For large organizations"
                billingInfo="50+ employees • Custom pricing • Dedicated support"
                buttonText="Contact Sales"
                onButtonClick={() => setDemoDialogOpen(true)}
              />
            </div>

            {/* Feature Comparison */}
            <div className="bg-card rounded-lg border border-border p-8 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-center mb-6">What's Included in Every Plan</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">Core HR Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Employee Management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Attendance Tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Leave Management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Payroll Processing
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">Advanced Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Performance Analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Role-Based Access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Document Management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Audit Trails
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">Support & Security</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      24/7 Support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Enterprise Security
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      API Access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Mobile App
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-12 max-w-2xl mx-auto">
              <div className="bg-card/80 rounded-xl p-6 border border-border mb-6">
                <h4 className="font-semibold mb-3">Implementation & Setup</h4>
                <div className="text-2xl font-bold text-primary mb-2">₹4,999</div>
                <p className="text-sm text-muted-foreground">
                  One-time setup fee includes data migration, system configuration, and training
                </p>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Start with a <span className="font-medium text-foreground">14-day free trial</span> - 
                no credit card required. Implementation begins after trial approval.
              </p>
              <p className="text-sm text-muted-foreground">
                Need custom features or integrations? 
                <button onClick={() => setDemoDialogOpen(true)} className="text-primary hover:underline ml-1">
                  Contact our sales team
                </button> for personalized solutions.
              </p>
            </div>
          </div>
        </section>

        {/* Future Roadmap Section */}
        <section className="py-20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Innovation Roadmap</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                We're constantly evolving. Here's what's coming next to make your HR operations even more powerful.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Q1-Q2 2025 */}
              <Card className="p-8 border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-background">
                <div className="text-primary mb-4">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Q1-Q2 2025</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    <span>Native Mobile Apps (iOS/Android)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span>Advanced HR Analytics Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-green-500" />
                    <span>SSO & Enterprise Integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span>Predictive Analytics</span>
                  </div>
                </div>
              </Card>

              {/* Q3-Q4 2025 */}
              <Card className="p-8 border-2 border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-background">
                <div className="text-blue-500 mb-4">
                  <Cpu className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Q3-Q4 2025</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span>AI-Powered HR Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span>Performance Management 2.0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Recruitment & Applicant Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-blue-500" />
                    <span>Learning Management System</span>
                  </div>
                </div>
              </Card>

              {/* 2026 & Beyond */}
              <Card className="p-8 border-2 border-green-500/20 bg-gradient-to-b from-green-500/5 to-background">
                <div className="text-green-500 mb-4">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">2026 & Beyond</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-green-500" />
                    <span>Microservices Architecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Blockchain Credentials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>Global Multi-Region Deployment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-green-500" />
                    <span>Industry-Specific Solutions</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-6">
                Want to influence our roadmap? We'd love to hear from you.
              </p>
              <Button variant="outline" onClick={() => setDemoDialogOpen(true)}>
                Share Your Feedback
                <MessageCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="py-20 bg-gradient-to-r from-primary via-primary to-blue-600">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-white text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your HR Operations?
              </h2>
              <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">
                Join 10,000+ companies using Alkaa to streamline their workforce management, 
                reduce administrative overhead, and focus on what matters most - their people.
              </p>
              
              {/* Value Props */}
              <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">80%</div>
                  <div className="text-sm opacity-90">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">24hrs</div>
                  <div className="text-sm opacity-90">Quick Setup</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">14 days</div>
                  <div className="text-sm opacity-90">Free Trial</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button 
                  onClick={()=>navigate(RouteDict.SignUpPage)} 
                  className="bg-white text-primary hover:bg-white/90 text-base px-8 py-6 font-semibold"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  className="bg-transparent border-2 border-white hover:bg-white/10 text-base px-8 py-6"
                  onClick={() => setDemoDialogOpen(true)}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Schedule a Demo
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Full feature access</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-secondary/50 border-t border-border py-16">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo_icon.svg" alt="Alkaa Logo" className="h-8 w-8" />
                <span className="text-xl font-bold">Alkaa</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Complete HR Management System designed for modern businesses. 
                Streamline your workforce management with our cloud-native platform.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Enterprise-grade security & compliance</span>
              </div>
            </div>
            
            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Documentation</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mobile App</a></li>
              </ul>
            </div>
            
            {/* Solutions */}
            <div>
              <h3 className="font-semibold mb-4">Solutions</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Small Business</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Enterprise</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Remote Teams</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Healthcare</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Technology</a></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Press Kit</a></li>
              </ul>
            </div>
          </div>

          {/* Additional Footer Content */}
          <div className="grid md:grid-cols-2 gap-8 mb-8 pt-8 border-t border-border">
            {/* Security & Compliance */}
            <div>
              <h3 className="font-semibold mb-4">Security & Compliance</h3>
              <div className="flex flex-wrap gap-2">
                {["SOC 2", "GDPR", "HIPAA", "ISO 27001", "CCPA"].map((cert) => (
                  <span key={cert} className="text-xs bg-secondary text-foreground px-2 py-1 rounded border border-border">
                    {cert}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your data is protected with enterprise-grade security measures.
              </p>
            </div>

            {/* Support & Resources */}
            <div>
              <h3 className="font-semibold mb-4">Support & Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Status Page</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Community Forum</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Footer */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Alkaa. All rights reserved.
              </p>
              <div className="flex gap-4 text-sm">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="YouTube">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <DemoRequestDialog 
        open={demoDialogOpen}
        onOpenChange={setDemoDialogOpen}
        formData={formData}
        formErrors={formErrors}
        handleInputChange={handleInputChange}
        handleDemoRequest={handleDemoRequest}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AlkaaLandingPage;