import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Star } from 'lucide-react';
import Button from '../components/ui/Button';
import HeroSection from '../components/landingPage/HeroSection';
import FeatureSection from '../components/landingPage/FeatureSection';
import ServicesSection from '../components/landingPage/ServicesSection';
import Testimonials from '../components/landingPage/Testimonials';
const Landing = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Courses',
      description: 'Engage with video lectures, quizzes, and hands-on projects'
    },
    {
      icon: Users,
      title: 'Expert Instructors',
      description: 'Learn from industry professionals and experienced educators'
    },
    {
      icon: Award,
      title: 'Certificates',
      description: 'Earn verified certificates upon course completion'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Web Developer',
      content: 'The courses here helped me transition into tech. The instructors are amazing!',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Data Scientist',
      content: 'Comprehensive content and excellent support. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emily Davis',
      role: 'UX Designer',
      content: 'Great platform with practical projects that helped build my portfolio.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection/>    
      {/* Features Section */}
      <FeatureSection features={features} />

      {/* Services Section */}
      <ServicesSection />

      {/* Testimonials Section */}
      <Testimonials testimonials={testimonials} />

      {/* Contact Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of learners and start your journey today
            </p>
            <Link to="/register">
              <Button size="xl" variant="primary">
                Get Started Now
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-primary-400" />
                <span className="ml-2 text-xl font-bold">LearnHub</span>
              </div>
              <p className="text-gray-300">
                Empowering learners worldwide with quality education and practical skills.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/courses" className="text-gray-300 hover:text-white">Courses</Link></li>
                <li><Link to="/about" className="text-gray-300 hover:text-white">About</Link></li>
                <li><Link to="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
                <li><Link to="/help" className="text-gray-300 hover:text-white">Help</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                <li><span className="text-gray-300">Web Development</span></li>
                <li><span className="text-gray-300">Data Science</span></li>
                <li><span className="text-gray-300">AI & Machine Learning</span></li>
                <li><span className="text-gray-300">Mobile Development</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-2">
                <li className="text-gray-300">info@learnhub.com</li>
                <li className="text-gray-300">+1 (555) 123-4567</li>
                <li className="text-gray-300">123 Learning St, Education City</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © 2024 LearnHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;