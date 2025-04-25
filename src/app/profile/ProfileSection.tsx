'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Save, Edit, MapPin, Check, X, AlertCircle, Briefcase, Search } from 'lucide-react';

interface ProfileSectionProps {
  userId: string;
  profile: Profile | null;
}

interface Profile {
  id: string;
  preferred_locations: string[];
  target_roles: string[];
  created_at?: string;
  updated_at?: string;
}

// List of popular American cities for job search
const americanCities = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC",
  "Boston, MA", "Nashville, TN", "Baltimore, MD", "Oklahoma City, OK", "Portland, OR",
  "Las Vegas, NV", "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA",
  "Sacramento, CA", "Atlanta, GA", "Kansas City, MO", "Miami, FL", "Raleigh, NC",
  "Omaha, NE", "Oakland, CA", "Minneapolis, MN", "Tulsa, OK", "Cleveland, OH",
  "Wichita, KS", "Arlington, TX", "New Orleans, LA", "Bakersfield, CA", "Tampa, FL",
  "Aurora, CO", "Honolulu, HI", "Pittsburgh, PA", "Cincinnati, OH", "St. Louis, MO",
  "Remote", "Hybrid"
];

// Common MBA job roles, especially in tech
const mbaJobRoles = [
  "Product Manager",
  "Product Marketing Manager",
  "Business Development Manager",
  "Strategy Consultant",
  "Management Consultant",
  "Senior Product Manager",
  "Marketing Manager",
  "Brand Manager",
  "Program Manager",
  "Business Operations Manager",
  "Operations Manager",
  "Finance Manager",
  "Corporate Development",
  "Venture Capital Associate",
  "Private Equity Associate",
  "Investment Banking Associate",
  "Data Analytics Manager",
  "Growth Manager",
  "Customer Success Manager",
  "UX Researcher",
  "Technical Product Manager",
  "Strategic Partnerships Manager",
  "Director of Operations",
  "Director of Strategy",
  "Chief of Staff",
  "Business Intelligence Analyst",
  "Product Operations Manager",
  "Sales Operations Manager",
  "Strategic Finance Manager",
  "Business Analyst",
  "Digital Marketing Manager"
];

export default function ProfileSection({ userId, profile }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [locations, setLocations] = useState<string[]>(profile?.preferred_locations || []);
  const [roles, setRoles] = useState<string[]>(profile?.target_roles || []);
  const [newLocation, setNewLocation] = useState('');
  const [newRole, setNewRole] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  
  const locationInputRef = useRef<HTMLInputElement>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Filter cities based on input
  const filteredCities = americanCities
    .filter(city => city.toLowerCase().includes(newLocation.toLowerCase()))
    .filter(city => !locations.includes(city))
    .sort();

  // Filter roles based on input
  const filteredRoles = mbaJobRoles
    .filter(role => role.toLowerCase().includes(newRole.toLowerCase()))
    .filter(role => !roles.includes(role))
    .sort();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node) && 
          locationInputRef.current !== event.target) {
        setLocationDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node) && 
          roleInputRef.current !== event.target) {
        setRoleDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType(null);
      }, 5000); // Dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          preferred_locations: locations,
          target_roles: roles,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error saving profile:', error);
        setMessage('Failed to save profile');
        setMessageType('error');
        return;
      }
      
      setIsEditing(false);
      setMessage('Profile saved successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Error in save process:', error);
      setMessage('An unexpected error occurred');
      setMessageType('error');
    }
  };
  
  const addLocation = (location: string = newLocation.trim()) => {
    if (location && !locations.includes(location)) {
      setLocations([...locations, location]);
      setNewLocation('');
      setLocationDropdownOpen(false);
    }
  };
  
  const removeLocation = (location: string) => {
    setLocations(locations.filter(loc => loc !== location));
  };
  
  const addRole = (role: string = newRole.trim()) => {
    if (role && !roles.includes(role)) {
      setRoles([...roles, role]);
      setNewRole('');
      setRoleDropdownOpen(false);
    }
  };
  
  const removeRole = (role: string) => {
    setRoles(roles.filter(r => r !== role));
  };
  
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'location' | 'role'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'location') {
        addLocation();
      } else {
        addRole();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (type === 'location' && filteredCities.length > 0) {
        setLocationDropdownOpen(true);
      } else if (type === 'role' && filteredRoles.length > 0) {
        setRoleDropdownOpen(true);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (type === 'location') {
        setLocationDropdownOpen(false);
      } else {
        setRoleDropdownOpen(false);
      }
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
            isEditing 
              ? "bg-purple-600 text-white hover:bg-purple-700" 
              : "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
          }`}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </button>
      </div>
      
      {/* Preferred Locations Section */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <MapPin className="h-5 w-5 text-purple-500 mr-2" />
          <label className="text-base font-medium text-gray-700">Preferred Locations</label>
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 relative">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => {
                    setNewLocation(e.target.value);
                    setLocationDropdownOpen(e.target.value.length > 0);
                  }}
                  onFocus={() => setLocationDropdownOpen(newLocation.length > 0)}
                  onKeyDown={(e) => handleKeyDown(e, 'location')}
                  placeholder="Search for a city or 'Remote'"
                  className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  ref={locationInputRef}
                />
                {locationDropdownOpen && filteredCities.length > 0 && (
                  <div 
                    ref={locationDropdownRef}
                    className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                  >
                    {filteredCities.map((city) => (
                      <div
                        key={city}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-gray-900"
                        onClick={() => addLocation(city)}
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={() => addLocation()}
                className="bg-purple-100 text-purple-900 hover:bg-purple-200 px-3 py-1.5 rounded-md text-sm font-medium"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {locations.map((location, index) => (
                <div key={index} className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-transparent text-gray-600 ring-1 ring-inset ring-gray-300">
                  {location}
                  <button 
                    onClick={() => removeLocation(location)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {locations.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No preferred locations added</p>
            ) : (
              locations.map((location, index) => (
                <div key={index} className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-500/10">
                  {location}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Target Roles Section */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <Briefcase className="h-5 w-5 text-purple-500 mr-2" />
          <label className="text-base font-medium text-gray-700">Target Roles</label>
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 relative">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => {
                    setNewRole(e.target.value);
                    setRoleDropdownOpen(e.target.value.length > 0);
                  }}
                  onFocus={() => setRoleDropdownOpen(newRole.length > 0)}
                  onKeyDown={(e) => handleKeyDown(e, 'role')}
                  placeholder="Search for a job role"
                  className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  ref={roleInputRef}
                />
                {roleDropdownOpen && filteredRoles.length > 0 && (
                  <div 
                    ref={roleDropdownRef}
                    className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                  >
                    {filteredRoles.map((role) => (
                      <div
                        key={role}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-gray-900"
                        onClick={() => addRole(role)}
                      >
                        {role}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={() => addRole()}
                className="bg-purple-100 text-purple-900 hover:bg-purple-200 px-3 py-1.5 rounded-md text-sm font-medium"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {roles.map((role, index) => (
                <div key={index} className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-transparent text-gray-600 ring-1 ring-inset ring-gray-300">
                  {role}
                  <button 
                    onClick={() => removeRole(role)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {roles.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No target roles added</p>
            ) : (
              roles.map((role, index) => (
                <div key={index} className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-500/10">
                  {role}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Status message area */}
      {message && (
        <div 
          className={`mt-4 p-3 rounded-lg flex items-center text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          {messageType === 'success' ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
} 