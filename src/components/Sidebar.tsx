// src/components/Sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Star, Users, LogOut, CheckSquare, Link as LinkIcon } from 'lucide-react';

// Define props including the modal opener function
interface SidebarProps {
  openAddJobUrlModal: () => void;
}

export default function Sidebar({ openAddJobUrlModal }: SidebarProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed overflow-y-auto">
      <div className="px-5 py-4 flex items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">Thracker</h1>
      </div>
      
      {/* Profile section moved to top */}
      {/*
      <div className="px-3 mb-2">
        <Link 
          href="/profile"
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
            isActive('/profile') 
              ? 'bg-purple-50 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <UserCircle className={`h-5 w-5 mr-3 ${isActive('/profile') ? 'text-purple-500' : 'text-gray-400'}`} />
          <span>Profile</span>
        </Link>
      </div>
      */}
      
      {/* Divider after Profile */}
      {/*
      <div className="px-3 mb-4">
        <hr className="border-t border-gray-200" />
      </div>
      */}
      
      <nav className="flex-1 pt-0 flex flex-col px-3 space-y-1 overflow-y-auto">
        {/* Dashboard link */}
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
        
        {/* Weekly Plan link */}
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
        
        {/* Application Copilot link */}
        {/*
        <Link 
          href="/copilot"
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
            isActive('/copilot') 
              ? 'bg-purple-50 text-purple-700' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Bot className={`h-5 w-5 mr-3 ${isActive('/copilot') ? 'text-purple-500' : 'text-gray-400'}`} />
          <span>Application Copilot</span>
          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">Testing</span>
        </Link>
        */}
      </nav>
      
      {/* Quick Actions - directly after navigation */}
      <div className="px-3 mb-4">
        <hr className="border-t border-gray-200 mb-4" />
        <h3 className="px-1 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Quick Actions
        </h3>
        <button
          onClick={openAddJobUrlModal}
          className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 group"
        >
          <LinkIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" /> 
          Add Job from URL
        </button>
      </div>
      
      {/* Spacer to push logout to the bottom */}
      <div className="flex-grow"></div>
      
      {/* Logout at the very bottom */}
      <div className="px-3 pb-4">
        <hr className="border-t border-gray-200 mb-4" />
        <Link 
          href="/auth/logout"
          className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5 mr-3 text-gray-400" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}