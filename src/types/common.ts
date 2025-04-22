// src/types/common.ts

export interface Company {
    id: number;
    name: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
    description?: string;
    priority?: string;
    notes?: string;
    is_target?: boolean;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface Application {
    id: number;
    position: string;
    status: string;
    applied_date: string;
    company_id: number;
    location?: string;
    salary?: string;
    job_posting_url?: string;
    notes?: string;
    user_id: string;
    created_at?: string;
    updated_at?: string;
    companies?: Company;
  }
  
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
    created_at?: string;
    updated_at?: string;
    company?: Company;
    last_interaction_date?: string;
    interactions_count?: number;
  }
  
  export interface Interaction {
    id: number;
    contact_id: number;
    interaction_date: string;
    interaction_type: string;
    notes?: string;
    follow_up_date?: string | null;
    user_id: string;
    created_at?: string;
    updated_at?: string;
    contact?: Contact;
  }
  
  // Error types
  export interface ApiError {
    message: string;
    code?: string;
    details?: unknown;
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

// Add Task Status constants
export const TASK_STATUS = {
  TODO: 'to_do',
  IN_PROGRESS: 'in_progress',
  DONE: 'done'
};