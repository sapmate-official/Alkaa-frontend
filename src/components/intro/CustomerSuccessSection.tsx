import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Quote,
  Star,
  TrendingUp,
  Users,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';

interface SuccessStory {
  id: string;
  company: string;
  industry: string;
  size: string;
  logo: string;
  testimonial: {
    quote: string;
    author: string;
    role: string;
    avatar: string;
  };
  metrics: {
    label: string;
    value: string;
    improvement: string;
    icon: React.ReactNode;
  }[];
  challenge: string;
  solution: string;
  videoUrl?: string;
}

const successStories: SuccessStory[] = [
  {
    id: '1',
    company: 'TechNova Inc.',
    industry: 'Software Development',
    size: '150+ employees',
    logo: '/api/placeholder/80/40',
    testimonial: {
      quote: "Alkaa has completely transformed how we manage our team of 150+ employees. The interface is intuitive and the automation features save us countless hours each month.",
      author: "Sarah Johnson",
      role: "HR Director",
      avatar: '/api/placeholder/60/60'
    },
    metrics: [
      { label: 'Time Saved', value: '85%', improvement: '+85%', icon: <Clock className="h-5 w-5" /> },
      { label: 'Accuracy', value: '99.8%', improvement: '+35%', icon: <Target className="h-5 w-5" /> },
      { label: 'Employee Satisfaction', value: '4.9/5', improvement: '+40%', icon: <Users className="h-5 w-5" /> }
    ],
    challenge: 'Managing 150+ employees across multiple departments with manual spreadsheets and time-consuming processes.',
    solution: 'Automated workflows, centralized employee data, and real-time analytics dashboard.',
    videoUrl: '/demo-video-1.mp4'
  },
  {
    id: '2',
    company: 'GrowthSync',
    industry: 'Marketing Agency',
    size: '75+ employees',
    logo: '/api/placeholder/80/40',
    testimonial: {
      quote: "The onboarding workflow in Alkaa has reduced our new hire setup time by 70%. It's been a game-changer for our rapidly growing team.",
      author: "Michael Chen",
      role: "People Operations Manager",
      avatar: '/api/placeholder/60/60'
    },
    metrics: [
      { label: 'Onboarding Time', value: '70%', improvement: '-70%', icon: <TrendingUp className="h-5 w-5" /> },
      { label: 'New Hire Experience', value: '4.8/5', improvement: '+45%', icon: <Star className="h-5 w-5" /> },
      { label: 'Administrative Tasks', value: '80%', improvement: '-80%', icon: <Clock className="h-5 w-5" /> }
    ],
    challenge: 'Rapid growth required efficient onboarding process for frequent new hires.',
    solution: 'Automated onboarding workflows, digital document management, and progress tracking.',
    videoUrl: '/demo-video-2.mp4'
  },
  {
    id: '3',
    company: 'Bright Solutions',
    industry: 'Consulting',
    size: '50+ employees',
    logo: '/api/placeholder/80/40',
    testimonial: {
      quote: "As a small business owner, I needed something comprehensive yet simple. Alkaa strikes that perfect balance and has scaled perfectly as we've grown from 10 to 50 employees.",
      author: "Lisa Rodriguez",
      role: "CEO",
      avatar: '/api/placeholder/60/60'
    },
    metrics: [
      { label: 'Scalability', value: '5x', improvement: '500%', icon: <TrendingUp className="h-5 w-5" /> },
      { label: 'Cost Savings', value: '60%', improvement: '+60%', icon: <Target className="h-5 w-5" /> },
      { label: 'Team Productivity', value: '45%', improvement: '+45%', icon: <Users className="h-5 w-5" /> }
    ],
    challenge: 'Needed scalable HR solution that could grow from 10 to 50+ employees.',
    solution: 'Flexible platform architecture, modular features, and intuitive user interface.',
    videoUrl: '/demo-video-3.mp4'
  }
];

interface CustomerSuccessSectionProps {
  onRequestDemo?: () => void;
}

export const CustomerSuccessSection: React.FC<CustomerSuccessSectionProps> = ({ onRequestDemo }) => {
  const [activeStory, setActiveStory] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const currentStory = successStories[activeStory];

  const nextStory = () => {
    setActiveStory((prev) => (prev + 1) % successStories.length);
    setShowDetails(false);
  };

  const prevStory = () => {
    setActiveStory((prev) => (prev - 1 + successStories.length) % successStories.length);
    setShowDetails(false);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="container max-w-screen-xl px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">Customer Success Stories</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Real Results from <span className="text-primary">Real Companies</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              See how companies like yours have transformed their HR operations and achieved measurable results with Alkaa
            </p>
          </motion.div>
        </div>

        {/* Main Success Story Display */}
        <div className="max-w-6xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-8 md:p-12">
              {/* Company Header */}
              <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className="w-16 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs font-medium">{currentStory.company}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{currentStory.company}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{currentStory.industry}</span>
                      <span>•</span>
                      <span>{currentStory.size}</span>
                    </div>
                  </div>
                </div>
                
                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={prevStory}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {activeStory + 1} of {successStories.length}
                  </span>
                  <Button variant="outline" size="sm" onClick={nextStory}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Testimonial */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  <blockquote className="text-lg italic mb-6 leading-relaxed">
                    "{currentStory.testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {currentStory.testimonial.author[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{currentStory.testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{currentStory.testimonial.role}</div>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                  <h4 className="font-semibold mb-4">Key Results Achieved</h4>
                  {currentStory.metrics.map((metric, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-primary">
                          {metric.icon}
                        </div>
                        <span className="font-medium">{metric.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{metric.value}</div>
                        <div className="text-xs text-green-600">{metric.improvement}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Challenge & Solution Details */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                  opacity: showDetails ? 1 : 0, 
                  height: showDetails ? 'auto' : 0 
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border">
                  <div>
                    <h5 className="font-semibold mb-3 text-red-600">The Challenge</h5>
                    <p className="text-sm text-muted-foreground">{currentStory.challenge}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-3 text-green-600">The Solution</h5>
                    <p className="text-sm text-muted-foreground">{currentStory.solution}</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2"
                >
                  {showDetails ? 'Hide Details' : 'View Full Case Study'}
                </Button>
                {currentStory.videoUrl && (
                  <Button variant="outline" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Watch Video Testimonial
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Story Navigator */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            {successStories.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStory(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  activeStory === index ? 'bg-primary' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <h3 className="text-2xl font-bold mb-4">Ready to Create Your Success Story?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join these successful companies and transform your HR operations with Alkaa
          </p>          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-base px-8 py-6"
              onClick={onRequestDemo}
            >
              Start Your Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base px-8 py-6"
              onClick={onRequestDemo}
            >
              Schedule a Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CustomerSuccessSection;
