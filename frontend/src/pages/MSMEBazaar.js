
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MSMEBazaar = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/api/msme-bazaar/packages');
      setPackages(response.data.packages);
    } catch (error) {
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setShowPayment(true);
  };

  const handlePayment = async () => {
    try {
      // Create Razorpay order
      const response = await api.post('/api/msme-bazaar/payment', {
        package_id: selectedPackage.id,
        amount: selectedPackage.price
      });

      const { order } = response.data;

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'VyapaarMitra',
          description: `${selectedPackage.name} - MSME Onboarding`,
          order_id: order.id,
          handler: function (response) {
            // Verify payment
            verifyPayment(response);
          },
          prefill: {
            name: 'MSME Owner',
            email: 'user@example.com',
            contact: '9999999999'
          },
          theme: {
            color: '#3B82F6'
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      toast.error('Failed to initiate payment');
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const response = await api.post('/api/msme-bazaar/verify-payment', {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      });

      if (response.data.success) {
        toast.success('Payment successful! Your onboarding has started.');
        setShowPayment(false);
        setSelectedPackage(null);
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      toast.error('Payment verification failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">MSME Bazaar</h1>
          <p className="text-xl text-gray-600">
            Complete onboarding solution for your MSME business
          </p>
        </div>

        {/* Process Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Your Onboarding Journey
          </h2>
          <div className="flex justify-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Payment</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-100 p-2 rounded-full">
                  <CheckCircle className="w-6 h-6 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-500">Registration</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-100 p-2 rounded-full">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-500">Compliance</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-100 p-2 rounded-full">
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-500">Completion</span>
              </div>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                pkg.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {pkg.popular && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-gray-900">₹{pkg.price}</span>
                  <span className="text-gray-600 ml-2">/{pkg.duration}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePackageSelect(pkg)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    pkg.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Modal */}
        {showPayment && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Confirm Your Purchase
              </h3>
              <div className="mb-6">
                <p className="text-gray-600 mb-2">Package: {selectedPackage.name}</p>
                <p className="text-2xl font-bold text-gray-900">₹{selectedPackage.price}</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MSMEBazaar;
