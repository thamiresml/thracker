// src/components/layout/Sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Star, Users, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="w-64 bg-blue-900 text-white h-screen flex flex-col">
      <div className="p-4 border-b border-blue-800">
        <h1 className="text-xl font-bold">JobTrackr</h1>
      </div>
      
      <nav className="flex-1 pt-4 flex flex-col">
        <Link 
          href="/"
          className={`flex items-center px-4 py-3 ${isActive('/') ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
        >
          <LayoutDashboard className="h-5 w-5 mr-3" />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          href="/applications"
          className={`flex items-center px-4 py-3 ${isActive('/applications') ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
        >
          <Briefcase className="h-5 w-5 mr-3" />
          <span>Applications</span>
        </Link>
        
        <Link 
          href="/target-companies"
          className={`flex items-center px-4 py-3 ${isActive('/target-companies') ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
        >
          <Star className="h-5 w-5 mr-3" />
          <span>Target Companies</span>
        </Link>
        
        <Link 
          href="/networking"
          className={`flex items-center px-4 py-3 ${isActive('/networking') ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
        >
          <Users className="h-5 w-5 mr-3" />
          <span>Networking</span>
        </Link>
        
        <div className="flex-grow"></div>
        
        <Link 
          href="/auth/logout"
          className="flex items-center px-4 py-3 text-red-300 hover:bg-red-900/20 mt-auto border-t border-blue-800"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Logout</span>
        </Link>
      </nav>
    </div>
  );
}