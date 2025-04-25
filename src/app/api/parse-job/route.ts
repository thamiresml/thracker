import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { message: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { message: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize job data
    const jobData = {
      company: 'Unknown Company',
      position: 'Unknown Position',
      location: 'Remote',
      description: '',
      salary: '',
      industry: '',
      companySize: ''
    };

    // Define URL object
    const urlObj = new URL(url);
    
    try {
      // Simple job data extraction for testing
      jobData.company = urlObj.hostname.split('.')[0];
      jobData.position = "Job Position";
      jobData.description = `This is a job posting at ${url}`;
      
      // Special handling for Anthropic job postings - with properly escaped quote
      if (url.includes('anthropic')) {
        jobData.company = 'Anthropic';
        
        // Note the properly quoted string in headers
        const headers = ['About Anthropic', 'About the Role', 'About You', 'We hope you have', 'Job Details', "What you'll do", 'Requirements'];
        
        jobData.description = `Anthropic job posting with headers: ${headers.join(', ')}`;
      }
      
    } catch (error) {
      console.error('Error parsing job:', error);
    }

    // Return the job data
    return NextResponse.json(jobData);
    
  } catch (error) {
    console.error('Error parsing job:', error);
    return NextResponse.json(
      { message: 'Failed to parse job information' },
      { status: 500 }
    );
  }
} 