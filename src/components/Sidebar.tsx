// src/components/Sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Star, Users, Calendar, LogOut, CheckSquare } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed">
      <div className="px-5 py-4 flex items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">Thracker</h1>
      </div>
      
      <nav className="flex-1 pt-4 flex flex-col px-3 space-y-1 overflow-y-auto">
        {/* Weekly Plan link added at the top */}
        <Link 
          href="/weekly-plan"
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
            isActive('/weekly-plan') 
              ? 'bg-purple-50 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <CheckSquare className={`h-5 w-5 mr-3 ${isActive('/weekly-plan') ? 'text-purple-500' : 'text-gray-400'}`} />
          <span>Weekly Plan</span>
        </Link>
        
        <Link 
          href="/"
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
            isActive('/') 
              ? 'bg-purple-50 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <LayoutDashboard className={`h-5 w-5 mr-3 ${isActive('/') ? 'text-purple-500' : 'text-gray-400'}`} />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          href="/applications"
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
            isActive('/applications') 
              ? 'bg-purple-50 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Briefcase className={`h-5 w-5 mr-3 ${isActive('/applications') ? 'text-purple-500' : 'text-gray-400'}`} />
          <span>Applications</span>
        </Link>
        
        <Link 
          href="/target-companies"
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
            isActive('/target-companies') 
              ? 'bg-purple-50 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Star className={`h-5 w-5 mr-3 ${isActive('/target-companies') ? 'text-purple-500' : 'text-gray-400'}`} />
          <span>Target Companies</span>
        </Link>
        
        <Link 
          href="/networking"
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
            isActive('/networking') 
              ? 'bg-purple-50 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Users className={`h-5 w-5 mr-3 ${isActive('/networking') ? 'text-purple-500' : 'text-gray-400'}`} />
          <span>Networking</span>
        </Link>
        
        {/* <Link 
          href="/schedule"
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
            isActive('/schedule') 
              ? 'bg-purple-50 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Calendar className={`h-5 w-5 mr-3 ${isActive('/schedule') ? 'text-purple-500' : 'text-gray-400'}`} />
          <span>Schedule</span>
        </Link> */}
        
        <div className="flex-grow"></div>
        
        <Link 
          href="/auth/logout"
          className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 mt-auto"
        >
          <LogOut className="h-5 w-5 mr-3 text-gray-400" />
          <span>Logout</span>
        </Link>
      </nav>
    </div>
  );
}