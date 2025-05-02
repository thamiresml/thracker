import { NextRequest, NextResponse } from 'next/server';
// Use createServerClient from @supabase/ssr for Route Handlers
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { runApplicationCopilot } from '@/app/copilot/utils/langgraph';
import { getLatestResumePdfFileNameServer } from './server-utils';
import { fetchAndParsePdfFromSupabase } from '@/app/copilot/utils/pdf';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies(); // Await the cookie store
  // Create client using ssr helper INSIDE the route handler
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set(_name: string, _value: string, _options: Record<string, unknown>) {
          // Cannot set cookies directly in POST
          console.warn('[API Route] Attempted to set cookie in POST handler - skipped');
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        remove(_name: string, _options: Record<string, unknown>) {
          // Cannot set cookies directly in POST
          console.warn('[API Route] Attempted to remove cookie in POST handler - skipped');
        },
      },
    }
  );

  try {
    // Get the request body
    const body = await req.json();
    // Extract applicationId, agentSettings, and baseCoverLetter
    const { 
      applicationId, 
      baseCoverLetter // (can be null/undefined)
    } = body;

    // Validate required fields from body
    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`[API /copilot] Auth Error: ${authError?.message || 'No user session'}`);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = user.id;

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
      jobDetails
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

  } catch (error: unknown) {
    console.error('Error in copilot API route:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred processing your request.' }, 
      { status: 500 }
    );
  }
} 