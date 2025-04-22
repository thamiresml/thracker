// src/app/landing/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Briefcase, Star, Users, Calendar, Mail } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
                Thracker
                <span className="ml-2 text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">BETA</span>
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/auth/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Log in
              </Link>
              <Link 
                href="/auth/register" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-4">
                <span className="font-semibold">Tuck MBA Exclusive Beta</span>
                <span className="ml-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              </div>
              <h1>
                <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                  <span className="block text-gray-900">Organize your</span>
                  <span className="block bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">job search journey</span>
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Thracker helps you track job applications, networking connections, and interview progress all in one place. Built by Tuck students, for Tuck students.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Link 
                  href="/auth/register" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Join our beta program
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Currently available exclusively to Tuck MBA students
              </p>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <Image
                    className="w-full" 
                    src="/landing-dashboard.png" 
                    alt="Thracker dashboard preview"
                    width={500}
                    height={300}
                    priority
                  />
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <svg className="h-20 w-20 text-indigo-500" fill="currentColor" viewBox="0 0 84 84">
                      <circle opacity="0.9" cx="42" cy="42" r="42" fill="white" />
                      <path d="M55 42L35 55V29L55 42Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Features</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-4xl">
              Everything you need for your job search
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Streamline your job hunting process with powerful tools designed to keep you organized and focused.
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <Briefcase className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Application Tracking</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Never lose track of your job applications. Monitor status, dates, and follow-ups in one central location.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Networking Manager</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Build and maintain your professional connections with detailed contact management and interaction history.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <Star className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Target Companies</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Keep track of your dream employers. Research companies and organize your approach strategy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Weekly Planning</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Organize tasks and plan your job search activities with our powerful weekly planning tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-indigo-700 rounded-lg shadow-xl overflow-hidden">
            <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
              <div className="lg:self-center">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-4">
                  Beta Access • Tuck Students Only
                </span>
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  <span className="block">Ready to join the Thracker beta?</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-indigo-100">
                  Be among the first Tuck MBA students to test Thracker. Help shape the future of this job search management tool built by your peers, for your peers.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/auth/register" 
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white"
                  >
                    Join the beta program
                  </Link>
                  <Link 
                    href="/auth/login" 
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 bg-opacity-60 hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white"
                  >
                    Log in
                  </Link>
                </div>
                <p className="mt-4 text-sm text-indigo-200">
                  Currently in private beta. By joining, you&apos;ll have direct input in shaping features for the official launch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-base text-gray-400">
              &copy; 2025 Thracker
            </p>
            <a href="mailto:thamires.mouta.tu25@tuck.dartmouth.edu" className="text-sm text-gray-400 hover:text-white flex items-center mt-2 md:mt-0">
              <Mail className="h-4 w-4 mr-1" />
              thamires.mouta.tu25@tuck.dartmouth.edu
            </a>
            <p className="text-sm text-gray-400 mt-2 md:mt-0">
              Made with ❤️ by a Tuck student for Tuck students
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}