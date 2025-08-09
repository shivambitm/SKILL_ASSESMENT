import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center mb-8">
            <Link 
              to="/login" 
              className="flex items-center text-green-600 hover:text-green-800 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Login
            </Link>
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms and Conditions</h1>
            </div>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last updated on Aug 9 2025</strong>
            </p>

            <div className="text-gray-700 dark:text-gray-300 space-y-6">
              <p>
                For the purpose of these Terms and Conditions, The term "we", "us", "our" used anywhere on this page shall mean SHIVAM KUMAR, whose registered/operational office is GAYATRI BHAWAN PROFESSORS COLONY Ranchi JHARKHAND 834001 . "you", "your", "user", "visitor" shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.
              </p>

              <p>
                Your use of the website and/or purchase from us are governed by following Terms and Conditions:
              </p>

              <p>
                The content of the pages of this website is subject to change without notice.
              </p>

              <p>
                Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
              </p>

              <p>
                Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.
              </p>

              <p>
                Our website contains material which is owned by or licensed to us. This material includes, but are not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.
              </p>

              <p>
                All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website.
              </p>

              <p>
                Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.
              </p>

              <p>
                From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information.
              </p>

              <p>
                You may not create a link to our website from another website or document without SHIVAM KUMAR's prior written consent.
              </p>

              <p>
                Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India .
              </p>

              <p>
                We, shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;