import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  FileText,
  Zap,
  Shield,
  Target,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface ProblemSolution {
  category: string;
  problem: {
    title: string;
    description: string;
    icon: React.ReactNode;
    pain_points: string[];
    color: string;
  };
  solution: {
    title: string;
    description: string;
    icon: React.ReactNode;
    benefits: string[];
    color: string;
  };
}

const problemSolutions: ProblemSolution[] = [
  {
    category: "Time Management",
    problem: {
      title: "Manual Time Tracking Chaos",
      description: "Hours wasted on spreadsheets, attendance disputes, and manual calculations",
      icon: <Clock className="h-8 w-8" />,
      pain_points: [
        "5+ hours weekly on attendance tracking",
        "Frequent payroll errors & disputes", 
        "No real-time visibility",
        "Lost productivity data"
      ],
      color: "text-red-500"
    },
    solution: {
      title: "Automated Time Intelligence",
      description: "Smart tracking with real-time insights and zero manual intervention",
      icon: <Zap className="h-8 w-8" />,
      benefits: [
        "95% time savings on tracking",
        "100% accuracy guaranteed",
        "Real-time attendance insights",
        "Automated payroll integration"
      ],
      color: "text-green-500"
    }
  },
  {
    category: "Employee Data",
    problem: {
      title: "Scattered Information Nightmare",
      description: "Critical employee data lost in emails, folders, and multiple systems",
      icon: <FileText className="h-8 w-8" />,
      pain_points: [
        "Data scattered across 5+ platforms",
        "Security vulnerabilities",
        "Difficult access to information",
        "Version control issues"
      ],
      color: "text-red-500"
    },
    solution: {
      title: "Centralized Data Fortress",
      description: "Single source of truth with enterprise-grade security and instant access",
      icon: <Shield className="h-8 w-8" />,
      benefits: [
        "One unified platform",
        "Bank-level security",
        "Instant information access",
        "Automated backups & sync"
      ],
      color: "text-green-500"
    }
  },
  {
    category: "Team Performance",
    problem: {
      title: "Performance Blind Spots",
      description: "No visibility into team performance, goals, or growth opportunities",
      icon: <Users className="h-8 w-8" />,
      pain_points: [
        "Annual reviews only",
        "No performance tracking",
        "Missed growth opportunities",
        "Low employee engagement"
      ],
      color: "text-red-500"
    },
    solution: {
      title: "Performance Optimization Engine",
      description: "Continuous performance insights with AI-powered recommendations",
      icon: <Target className="h-8 w-8" />,
      benefits: [
        "Real-time performance tracking",
        "AI-powered insights",
        "Continuous feedback loops",
        "Career development planning"
      ],
      color: "text-green-500"
    }
  }
];

export const ProblemSolutionSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSolution(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentProblemSolution = problemSolutions[activeCategory];

  return (
    <section className="py-20 bg-gradient-to-b from-background via-secondary/20 to-background">
      <div className="container max-w-screen-xl px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-primary" />
              <Badge variant="outline">The Alkaa Solution</Badge>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From <span className="text-red-500">HR Headaches</span> to 
              <br />
              <span className="text-primary">Seamless Success</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              See how Alkaa transforms the most common HR challenges into competitive advantages
            </p>
          </motion.div>
        </div>

        {/* Category Selector */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-wrap gap-2 bg-secondary rounded-lg p-1">
            {problemSolutions.map((item, index) => (
              <Button
                key={index}
                variant={activeCategory === index ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveCategory(index)}
                className="transition-all duration-200"
              >
                {item.category}
              </Button>
            ))}
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Problem Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className={`p-8 border-2 transition-all duration-500 ${
              !showSolution ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 'border-border bg-card opacity-60'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`${currentProblemSolution.problem.color} opacity-80`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant="destructive" className="mb-2">Before Alkaa</Badge>
                  <h3 className="text-xl font-bold">{currentProblemSolution.problem.title}</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <div className={`${currentProblemSolution.problem.color} mb-4`}>
                  {currentProblemSolution.problem.icon}
                </div>
                <p className="text-muted-foreground mb-4">
                  {currentProblemSolution.problem.description}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wide opacity-70">Pain Points</h4>
                {currentProblemSolution.problem.pain_points.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    {point}
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Solution Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className={`p-8 border-2 transition-all duration-500 ${
              showSolution ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-border bg-card opacity-60'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`${currentProblemSolution.solution.color} opacity-80`}>
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <Badge className="mb-2 bg-green-500 hover:bg-green-600">With Alkaa</Badge>
                  <h3 className="text-xl font-bold">{currentProblemSolution.solution.title}</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <div className={`${currentProblemSolution.solution.color} mb-4`}>
                  {currentProblemSolution.solution.icon}
                </div>
                <p className="text-muted-foreground mb-4">
                  {currentProblemSolution.solution.description}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wide opacity-70">Benefits</h4>
                {currentProblemSolution.solution.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {benefit}
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Transformation Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-primary rounded-lg p-8 text-white text-center mb-12"
        >
          <h3 className="text-2xl font-bold mb-6">The Alkaa Transformation</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold mb-1">80%</div>
              <div className="text-sm opacity-80">Time Savings</div>
            </div>
            <div>
              <Target className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold mb-1">95%</div>
              <div className="text-sm opacity-80">Accuracy Increase</div>
            </div>
            <div>
              <Users className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-sm opacity-80">Companies Transformed</div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your HR Operations?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of companies that have already eliminated HR headaches with Alkaa
          </p>
          <Button size="lg" className="text-base px-8 py-6">
            Start Your Transformation Today
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Free 14-day trial • No credit card required • Setup in 24 hours
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
