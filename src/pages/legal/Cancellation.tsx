import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const Cancellation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center mb-8">
            <Link 
              to="/login" 
              className="flex items-center text-red-600 hover:text-red-800 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Login
            </Link>
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cancellation and Refund</h1>
            </div>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last updated on Aug 9 2025</strong>
            </p>

            <div className="text-gray-700 dark:text-gray-300 space-y-6">
              <p>
                SHIVAM KUMAR believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
              </p>

              <p>
                Cancellations will be considered only if the request is made within 7 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.
              </p>

              <p>
                SHIVAM KUMAR does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.
              </p>

              <p>
                In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 7 days of receipt of the products.
              </p>

              <p>
                In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.
              </p>

              <p>
                In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.
              </p>

              <p>
                In case of any Refunds approved by the SHIVAM KUMAR, it'll take 7 days for the refund to be processed to the end customer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cancellation;