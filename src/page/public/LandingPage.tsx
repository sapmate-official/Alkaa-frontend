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
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedDashboardPreview from './DashboardPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { backendDomain } from '@/lib/constant/Domain';
import { useToast } from '@/hooks/use-toast';
import ProductIntroSection from '@/components/intro/ProductIntroSection';
import InteractiveDemoSection from '@/components/intro/InteractiveDemoSection';
import ProblemSolutionSection from '@/components/intro/ProblemSolutionSection';
import CustomerSuccessSection from '@/components/intro/CustomerSuccessSection';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => (
  <Card className="border border-border bg-card hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <div className="mb-2 text-primary">{icon}</div>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
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
}

const PricingTier: React.FC<PricingTierProps> = ({ 
  title, 
  price, 
  description, 
  billingInfo,
  buttonText, 
  highlighted = false,
  popularTag = false
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
      </div>
      <Button 
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
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">A</div>
            <span className="text-xl font-bold">Alkaa</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <Button onClick={()=>navigate("/auth/signin")} variant="outline">Log in</Button>
            <Button onClick={()=>navigate("/auth/signup")}>Get Started</Button>
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
                <Button onClick={()=>navigate("/auth/signin")} variant="outline">Log in</Button>
                <Button onClick={()=>navigate("/auth/signup")}>Get Started</Button>
              </div>
            </nav>
          </div>        )}      </header>      <main className="flex-1">
        {/* New Enhanced Product Introduction */}
        <ProductIntroSection />
        
        {/* Problem-Solution Storytelling */}
        <ProblemSolutionSection />

        {/* Interactive Demo Section */}
        <InteractiveDemoSection />

        {/* Enhanced Customer Success Stories */}
        <CustomerSuccessSection />

        {/* Original Hero Section - Enhanced */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2 space-y-6">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Live Dashboard Preview</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Experience the <span className="text-primary">Future of HR</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  See exactly how your HR operations will look with Alkaa's comprehensive dashboard and management tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button onClick={()=>navigate("/auth/signup")} className="text-base px-8 py-6">Get Started Free</Button>
                  <Button 
                    variant="outline" 
                    className="text-base px-8 py-6"
                    onClick={() => setDemoDialogOpen(true)}
                  >
                    Book a Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <p className="text-sm text-muted-foreground">Enterprise-grade security</p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-sm text-muted-foreground">Full HR suite</p>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden bg-secondary shadow-2xl border border-border">
                  <div className="scale-[0.7] origin-top-left h-[143%] w-[143%]">
                    <EnhancedDashboardPreview />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-secondary/30">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Modern HR Teams</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your workforce efficiently in one place.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                title="Employee Directory"
                description="Maintain a comprehensive database of all employee information, accessible and searchable in seconds."
                icon={<Users className="h-6 w-6" />}
              />
              <FeatureCard
                title="Attendance Tracking"
                description="Monitor employee attendance, time-off requests, and work hours with automated reporting."
                icon={<Clock className="h-6 w-6" />}
              />
              <FeatureCard
                title="Performance Management"
                description="Set goals, conduct reviews, and track performance metrics to help employees grow."
                icon={<ChartPie className="h-6 w-6" />}
              />
              <FeatureCard
                title="Leave Management"
                description="Streamline leave requests, approvals, and balance tracking with customizable policies."
                icon={<Calendar className="h-6 w-6" />}
              />
              <FeatureCard
                title="Onboarding & Offboarding"
                description="Create structured workflows for new hires and departing employees to ensure smooth transitions."
                icon={<Building2 className="h-6 w-6" />}
              />
              <FeatureCard
                title="Internal Communications"
                description="Keep your team connected with built-in messaging, announcements, and feedback channels."
                icon={<MessageCircle className="h-6 w-6" />}
              />
            </div>
          </div>
        </section>        <section id="testimonials" className="py-20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            {/* Replace the old testimonials section with the new CustomerSuccessSection */}
            <CustomerSuccessSection />
          </div>
        </section>

        <section id="pricing" className="py-20 bg-secondary/30">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that works best for your organization size.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <PricingTier
                title="Basic"
                price="₹499"
                description="Up to 20 employees"
                billingInfo="₹5,988 billed annually"
                buttonText="Get Started"
              />
              <PricingTier
                title="Growth"
                price="₹899"
                description="Up to 100 employees"
                billingInfo="₹10,788 billed annually"
                buttonText="Get Started"
                highlighted={true}
                popularTag={true}
              />
              <PricingTier
                title="Enterprise"
                price="Custom"
                description="Unlimited employees"
                billingInfo="Contact sales for custom pricing"
                buttonText="Contact Sales"
              />
            </div>
            
            <div className="text-center mt-12 max-w-2xl mx-auto">
              <p className="text-muted-foreground">
                All plans include <span className="font-medium text-foreground">full access to all features</span> including employee management, 
                attendance tracking, performance reviews, and more.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Need a custom solution? <a href="#" className="text-primary hover:underline">Contact our sales team</a> for personalized pricing.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <div className="bg-primary rounded-lg py-12 px-6 md:p-12 text-white text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your HR Operations?</h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                Join thousands of companies that use Alkaa to streamline their employee management and boost productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={()=>navigate("/auth/signup")} className="bg-white text-primary hover:bg-white/90 text-base px-8 py-6">
                  Get Started Today
                </Button>
                <Button 
                  className="bg-transparent border border-white hover:bg-white/10 text-base px-8 py-6"
                  onClick={() => setDemoDialogOpen(true)}
                >
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-secondary/50 border-t border-border py-12">
        <div className="container max-w-screen-xl px-4 md:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">A</div>
                <span className="text-xl font-bold">Alkaa</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Streamline your employee management with our comprehensive HR solution.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integration</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Webinars</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Alkaa. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
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