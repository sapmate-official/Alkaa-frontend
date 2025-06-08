import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  PlayCircle,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

interface StoryStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const storySteps: StoryStep[] = [
  {
    id: 1,
    title: "Traditional HR Chaos",
    description: "Scattered spreadsheets, manual processes, and endless paperwork consuming valuable time",
    icon: <Users className="h-8 w-8" />,
    color: "text-red-500",
    features: ["Manual attendance tracking", "Paper-based leave requests", "Scattered employee data"]
  },
  {
    id: 2,
    title: "Alkaa Integration",
    description: "Seamless transition to automated, intelligent HR management in just 24 hours",
    icon: <Zap className="h-8 w-8" />,
    color: "text-blue-500", 
    features: ["One-click data migration", "Automated workflows", "Instant team onboarding"]
  },
  {
    id: 3,
    title: "Transformed Operations",
    description: "80% time savings, 100% accuracy, and happier employees with streamlined processes",
    icon: <BarChart3 className="h-8 w-8" />,
    color: "text-green-500",
    features: ["Real-time analytics", "Automated reporting", "Enhanced productivity"]
  }
];

interface ProductIntroSectionProps {
  onRequestDemo?: () => void;
}

export const ProductIntroSection: React.FC<ProductIntroSectionProps> = ({ onRequestDemo }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % storySteps.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="container max-w-screen-xl px-4 md:px-8">
        {/* Main Headline */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Trusted by 10,000+ Companies</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              From HR <span className="text-primary">Chaos</span> to 
              <br />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Perfect Harmony
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Watch how Alkaa transforms traditional HR departments into efficient, 
              data-driven powerhouses that employees actually love.
            </p>
          </motion.div>
        </div>

        {/* Interactive Story Timeline */}
        <div className="mb-16">
          <div className="flex justify-center mb-8">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              {isPlaying ? 'Pause Story' : 'Play Transformation Story'}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {storySteps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`cursor-pointer transition-all duration-300 ${
                  activeStep === index ? 'scale-105' : 'scale-100 opacity-70'
                }`}
                onClick={() => setActiveStep(index)}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={`p-6 h-full border-2 ${
                  activeStep === index 
                    ? 'border-primary shadow-lg bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}>
                  <div className={`${step.color} mb-4`}>
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Metrics Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {[
            { metric: "80%", label: "Time Saved", icon: <Clock className="h-6 w-6" /> },
            { metric: "100%", label: "Data Accuracy", icon: <CheckCircle className="h-6 w-6" /> },
            { metric: "24hrs", label: "Setup Time", icon: <Zap className="h-6 w-6" /> },
            { metric: "10K+", label: "Happy Teams", icon: <Globe className="h-6 w-6" /> }
          ].map((item, index) => (
            <Card key={index} className="p-6 text-center border-border bg-card/50 backdrop-blur">
              <div className="text-primary mb-2 flex justify-center">
                {item.icon}
              </div>
              <div className="text-3xl font-bold text-primary mb-1">{item.metric}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </Card>
          ))}
        </motion.div>        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-base px-8 py-6"
              onClick={onRequestDemo}
            >
              Start Your Transformation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base px-8 py-6"
              onClick={onRequestDemo}
            >
              Watch 2-Min Demo
              <PlayCircle className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Join 10,000+ companies • No credit card required • Free 14-day trial
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductIntroSection;
