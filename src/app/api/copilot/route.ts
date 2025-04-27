import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { runApplicationCopilot } from '@/app/copilot/utils/langgraph';
import { getLatestResumePdfFileNameServer } from './server-utils';
import { fetchAndParsePdfFromSupabase } from '@/app/copilot/utils/pdf';

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    // Extract applicationId, agentSettings, and baseCoverLetter
    const { 
      applicationId, 
      agentSettings, 
      baseCoverLetter // (can be null/undefined)
    } = body;

    // Validate required fields from body
    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = await createClient();
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch the application details
    console.log(`Fetching application details for ID: ${applicationId}`);
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*, companies(*)')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (appError || !application) {
      console.error('Error fetching application or not found:', appError);
      return NextResponse.json(
        { error: `Application not found or access denied (ID: ${applicationId})` }, 
        { status: 404 }
      );
    }

    // Extract job details
    const jobDetails = {
      position: application.position,
      company: application.companies?.name || 'Company',
      location: application.location || undefined,
      industry: application.companies?.industry || undefined
    };

    // Get job description
    const jobDescription = application.description || 'No description provided';

    // Fetch and parse the latest resume PDF for this user
    const resumeFileName = await getLatestResumePdfFileNameServer(userId);
    if (!resumeFileName) {
      return NextResponse.json({ error: 'No resume PDF found for user' }, { status: 404 });
    }
    const resumeText = await fetchAndParsePdfFromSupabase(userId, resumeFileName);

    console.log('Running Application Copilot workflow...');
    // Run the analysis, passing the parsed resume text
    const result = await runApplicationCopilot(
      resumeText,
      baseCoverLetter, // Pass base cover letter text from body (can be undefined)
      jobDescription,
      jobDetails,
      agentSettings || {
        tone: 'professional',
        focusArea: 'technical',
        detailLevel: 'balanced'
      }
    );

    console.log('Copilot workflow finished. Formatting results...');

    // Format the suggestions to include IDs
    const formattedSuggestions = (result.suggestions || []).map((suggestion, index) => ({
      id: `suggestion-${index}`,
      original: suggestion.original,
      suggestion: suggestion.suggestion,
      accepted: false // Default to not accepted
    }));

    // Return the results
    return NextResponse.json({
      compatibilityScore: result.compatibilityScore,
      analysisText: result.analysisText,
      suggestions: formattedSuggestions,
      coverLetter: result.coverLetter,
      error: result.error
    });

  } catch (error: any) {
    console.error('Error in copilot API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred processing your request.' }, 
      { status: 500 }
    );
  }
} 