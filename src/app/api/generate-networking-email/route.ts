import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Create the supabase client
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const { 
      contactName, 
      contactRole, 
      companyName, 
      lastInteraction, 
      isAlumni, 
      resumeContent 
    } = await request.json();
    
    // Get user info for personalization
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, current_title')
      .eq('user_id', session.user.id)
      .single();
    
    const userName = userData?.first_name 
      ? `${userData.first_name} ${userData.last_name || ''}`
      : '[Your Name]';
    
    const userRole = userData?.current_title || '[Your Current Role/Status]';
    
    // Create a prompt for email generation
    let prompt = `Generate a professional networking email from ${userName} (${userRole}) to ${contactName}`;
    
    if (contactRole) {
      prompt += `, who is a ${contactRole}`;
    }
    
    if (companyName) {
      prompt += ` at ${companyName}`;
    }
    
    prompt += '.';
    
    if (isAlumni) {
      prompt += ` Note that ${contactName} went to the same school as ${userName}.`;
    }
    
    if (lastInteraction) {
      const lastDate = new Date(lastInteraction);
      const formattedDate = lastDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      prompt += ` Their last interaction was on ${formattedDate}.`;
    }
    
    prompt += ` The email should be friendly yet professional, with a clear purpose (networking, informational interview, etc.).`;
    prompt += ` Include a subject line at the beginning of the email.`;
    
    if (resumeContent) {
      prompt += ` Use the following resume information to personalize the email, but don't make it sound like a job application: ${resumeContent.substring(0, 500)}...`;
    }
    
    // Generate the email draft using the AI model
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert in professional communication and networking. Your task is to draft effective networking emails that are personalized, concise, and have a clear call to action."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });
    
    const emailDraft = completion.choices[0]?.message?.content || '';
    
    return NextResponse.json({ emailDraft });
  } catch (error: unknown) {
    console.error('Error generating email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate email' },
      { status: 500 }
    );
  }
} 