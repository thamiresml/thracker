// src/app/applications/ApplicationCard.tsx

'use client';

import { CalendarClock, MapPin, DollarSign, Edit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ApplicationCardProps {
  id: number;
  companyName: string;
  companyLogo?: string;
  position: string;
  status: string;
  appliedDate?: string;
  createdAt?: string;
  location?: string;
  salary?: string;
}

export default function ApplicationCard({
  id,
  companyName,
  companyLogo,
  position,
  status,
  appliedDate,
  createdAt,
  location,
  salary
}: ApplicationCardProps) {
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Offer': return 'bg-green-100 text-green-800';
      case 'Not Selected': return 'bg-red-100 text-red-800';
      case 'Interview': return 'bg-blue-100 text-blue-800';
      case 'Assessment': return 'bg-yellow-100 text-yellow-800';
      case 'Applied': return 'bg-purple-100 text-purple-800';
      case 'Saved': return 'bg-gray-100 text-gray-800';
      case 'No Response 👻': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Determine which date to show based on status
  const getDateText = () => {
    if (status === 'Saved' && createdAt) {
      return `Saved on ${formatDate(createdAt)}`;
    } else if (appliedDate) {
      return `Applied ${formatDate(appliedDate)}`;
    } else if (createdAt) {
      return `Created ${formatDate(createdAt)}`;
    }
    return '';
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {companyLogo ? (
                <Image 
                  src={companyLogo} 
                  alt={`${companyName} logo`}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-500 font-medium">
                  {companyName.charAt(0)}
                </span>
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{position}</h3>
              <p className="text-sm text-gray-500">{companyName}</p>
            </div>
          </div>
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
          >
            {status}
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {location && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span>{location}</span>
            </div>
          )}
          
          {getDateText() && (
            <div className="flex items-center text-xs text-gray-500">
              <CalendarClock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span>{getDateText()}</span>
            </div>
          )}
          
          {salary && (
            <div className="flex items-center text-xs text-gray-500">
              <DollarSign className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span>{salary}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200 bg-gray-50 flex divide-x divide-gray-200">
        <Link
          href={`/applications/${id}`}
          className="w-full py-2.5 text-xs font-medium text-gray-700 hover:text-purple-700 flex justify-center"
        >
          View Details
        </Link>
        <Link
          href={`/applications/${id}/edit`}
          className="w-full py-2.5 text-xs font-medium text-gray-700 hover:text-purple-700 flex justify-center items-center"
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          Edit
        </Link>
      </div>
    </div>
  );
}