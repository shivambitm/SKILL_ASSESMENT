import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';

const Delivery: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center mb-8">
            <Link 
              to="/login" 
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Login
            </Link>
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shipping and Delivery</h1>
            </div>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last updated on Aug 9 2025</strong>
            </p>

            <div className="text-gray-700 dark:text-gray-300">
              <p>
                Shipping is not applicable for business.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Delivery;