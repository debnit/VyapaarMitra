
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, TrendingUp, Shield, Target } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Empowering MSMEs Throughout Their Journey
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            From startup to scale-up, from growth to graceful exit - VyapaarMitra is your trusted partner in the MSME ecosystem.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* MSME Bazaar */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">MSME Bazaar</h3>
            <p className="text-gray-600 mb-6">
              Complete onboarding solution for MSMEs. Government registration, compliance, loan facilitation, and market access - all for just ₹199.
            </p>
            <Link 
              to="/msme-bazaar" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Learn More →
            </Link>
          </div>

          {/* Navarambh */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Navarambh</h3>
            <p className="text-gray-600 mb-6">
              Exit as a Service for distressed MSMEs. Financial restructuring, asset optimization, and graceful business closure support.
            </p>
            <Link 
              to="/navarambh" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Learn More →
            </Link>
          </div>

          {/* Agent Hub */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Agent Hub</h3>
            <p className="text-gray-600 mb-6">
              Broker negotiation platform connecting MSMEs with verified agents. Transparent commission tracking and deal management.
            </p>
            <Link 
              to="/agent-hub" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose VyapaarMitra?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Government Compliance</h3>
              <p className="text-gray-600">Full compliance with Indian government regulations and MSME policies.</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Growth Support</h3>
              <p className="text-gray-600">Loan facilitation, procurement assistance, and market expansion support.</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Expert Network</h3>
              <p className="text-gray-600">Connect with verified agents, suppliers, and financial institutions.</p>
            </div>
            <div className="text-center">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">End-to-End Solutions</h3>
              <p className="text-gray-600">From startup to exit, we support MSMEs throughout their lifecycle.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your MSME Journey?</h2>
          <p className="text-xl mb-8">Join thousands of MSMEs who trust VyapaarMitra for their business needs.</p>
          <Link 
            to="/register" 
            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Start Your Journey Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
