import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  Calendar, 
  BarChart3, 
  Play,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

interface DemoFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
  benefits: string[];
}

const demoFeatures: DemoFeature[] = [
  {
    id: 'employee-management',
    title: 'Employee Management',
    description: 'Complete employee lifecycle management from onboarding to offboarding',
    icon: <Users className="h-5 w-5" />,
    preview: '/api/placeholder/600/400',
    benefits: ['Centralized employee database', 'Automated onboarding workflows', 'Real-time org charts']
  },
  {
    id: 'attendance-tracking',
    title: 'Smart Attendance',
    description: 'Intelligent attendance tracking with multiple check-in methods',
    icon: <Clock className="h-5 w-5" />,
    preview: '/api/placeholder/600/400',
    benefits: ['Biometric integration', 'Geo-location tracking', 'Automated overtime calculation']
  },
  {
    id: 'leave-management',
    title: 'Leave Management',
    description: 'Streamlined leave requests, approvals, and balance tracking',
    icon: <Calendar className="h-5 w-5" />,
    preview: '/api/placeholder/600/400',
    benefits: ['One-click leave requests', 'Automated approval workflows', 'Leave balance tracking']
  },
  {
    id: 'analytics',
    title: 'HR Analytics',
    description: 'Data-driven insights for better HR decision making',
    icon: <BarChart3 className="h-5 w-5" />,
    preview: '/api/placeholder/600/400',
    benefits: ['Real-time dashboards', 'Predictive analytics', 'Custom reports']
  }
];

interface InteractiveDemoSectionProps {
  onRequestDemo?: () => void;
}

export const InteractiveDemoSection: React.FC<InteractiveDemoSectionProps> = ({ onRequestDemo }) => {
  const [activeFeature, setActiveFeature] = useState(demoFeatures[0].id);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  const currentFeature = demoFeatures.find(f => f.id === activeFeature) || demoFeatures[0];

  const deviceStyles = {
    desktop: { width: '100%', height: '400px' },
    tablet: { width: '768px', height: '400px', maxWidth: '100%' },
    mobile: { width: '375px', height: '600px', maxWidth: '100%' }
  };

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container max-w-screen-xl px-4 md:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">Interactive Demo</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              See Alkaa in <span className="text-primary">Action</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our features with this interactive demo. Click on any feature to see how it works in real-time.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feature Navigation */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold mb-6">Core Features</h3>
            <div className="space-y-3">
              {demoFeatures.map((feature) => (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    activeFeature === feature.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${activeFeature === feature.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Demo Preview */}
          <div className="lg:col-span-2">
            {/* Device Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                {[
                  { key: 'desktop', icon: <Monitor className="h-4 w-4" />, label: 'Desktop' },
                  { key: 'tablet', icon: <Tablet className="h-4 w-4" />, label: 'Tablet' },
                  { key: 'mobile', icon: <Smartphone className="h-4 w-4" />, label: 'Mobile' }
                ].map((device) => (
                  <Button
                    key={device.key}
                    variant={deviceView === device.key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDeviceView(device.key as any)}
                    className="flex items-center gap-2"
                  >
                    {device.icon}
                    <span className="hidden sm:inline">{device.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Demo Screen */}
            <div className="flex justify-center mb-6">
              <div 
                className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-border overflow-hidden transition-all duration-300 ${
                  deviceView === 'mobile' ? 'rounded-3xl' : 'rounded-lg'
                }`}
                style={deviceStyles[deviceView]}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    {/* Simulated Interface */}
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="text-primary mb-4 flex justify-center">
                          {currentFeature.icon}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{currentFeature.title}</h3>
                        <p className="text-muted-foreground mb-4">{currentFeature.description}</p>
                        <Button size="sm" className="flex items-center gap-2 mx-auto">
                          <Play className="h-4 w-4" />
                          Play Demo
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Device Frame */}
                {deviceView === 'mobile' && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full"></div>
                )}
              </div>
            </div>

            {/* Feature Benefits */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Key Benefits of {currentFeature.title}</h4>
              <div className="grid sm:grid-cols-3 gap-4">
                {currentFeature.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    {benefit}
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Button 
            size="lg" 
            className="text-base px-8 py-6"
            onClick={onRequestDemo}
          >
            Try All Features Free for 14 Days
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            No credit card required • Full access to all features
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveDemoSection;
