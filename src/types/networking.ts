// src/types/networking.ts

export interface Contact {
  id: number;
  name: string;
  role?: string;
  company_id: number;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
  status: string;
  is_alumni: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  company?: {
    id: number;
    name: string;
    logo?: string;
  };
  last_interaction_date?: string;
  interactions_count?: number;
}

export interface Interaction {
  id: number;
  contact_id: number;
  interaction_date: string;
  interaction_type: string;
  notes?: string;
  follow_up_date?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
}

// Contact statuses
export const CONTACT_STATUSES = [
  'Active',
  'To Reach Out',
  'Connected',
  'Following Up',
  'Dormant',
  'Archived'
];

// Interaction types
export const INTERACTION_TYPES = [
  'Email',
  'Phone Call',
  'Video Meeting',
  'In-Person Meeting',
  'Coffee Chat',
  'Informational Interview',
  'Event/Conference',
  'LinkedIn Message',
  'Other'
];