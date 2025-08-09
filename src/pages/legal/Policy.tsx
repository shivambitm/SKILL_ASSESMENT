import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

const Policy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center mb-8">
            <Link 
              to="/login" 
              className="flex items-center text-orange-600 hover:text-orange-800 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Login
            </Link>
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-orange-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Policy</h1>
            </div>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Platform Usage Policy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                This policy outlines the acceptable use guidelines and community standards for the Skill Assessment & Reporting Portal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Acceptable Use</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Use the platform for legitimate skill assessment and learning purposes</li>
                <li>• Maintain honesty and integrity during all assessments</li>
                <li>• Respect other users and maintain professional conduct</li>
                <li>• Provide accurate information during registration and profile setup</li>
                <li>• Report any technical issues or suspicious activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Prohibited Activities</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Attempting to cheat or manipulate assessment results</li>
                <li>• Creating multiple accounts to circumvent limitations</li>
                <li>• Sharing account credentials with other users</li>
                <li>• Attempting to reverse engineer or hack the platform</li>
                <li>• Using automated tools or bots to interact with the system</li>
                <li>• Uploading malicious content or attempting to compromise security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Content Guidelines</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Profile information must be accurate and appropriate</li>
                <li>• No offensive, discriminatory, or inappropriate content</li>
                <li>• Respect intellectual property rights</li>
                <li>• No spam or promotional content in user-generated areas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Enforcement</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Violations may result in account suspension or termination</li>
                <li>• We reserve the right to investigate suspicious activities</li>
                <li>• Repeated violations will result in permanent account closure</li>
                <li>• Appeals process available for disputed actions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Updates to Policy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this policy periodically. Users will be notified of significant changes via email or platform notifications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300">
                For policy-related questions or to report violations, contact us at:{' '}
                <a href="mailto:policy@skills.shivastra.in" className="text-orange-600 hover:underline">
                  policy@skills.shivastra.in
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policy;