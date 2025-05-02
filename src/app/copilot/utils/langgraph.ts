'use server';

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { StateGraph, END, StateGraphArgs } from '@langchain/langgraph';

// Default resume content helper (move here or import if defined elsewhere)
function getDefaultResume() {
  return `[Your Name]\n[Your Address]\n[Your Email] | [Your Phone] | [Your LinkedIn]\n\nSUMMARY\n[Brief professional summary highlighting your key skills and experience]\n\nSKILLS\n[List your key technical and soft skills relevant to your target roles]\n\nWORK EXPERIENCE\n[Job Title] | [Company Name] | [Employment Dates]\n- [Accomplishment or responsibility]\n\nEDUCATION\n[Degree] | [Institution] | [Graduation Year]`;
}

// === State Definition ===
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stateSchema = z.object({
  // Input state
  resume: z.string().describe("The user's resume content"),
  jobDescription: z.string().describe("The job description content"),
  jobDetails: z.object({
    position: z.string(),
    company: z.string(),
    location: z.string().optional(),
    industry: z.string().optional(),
  }).describe("Details about the job"),
  baseCoverLetter: z.string().optional().describe("Base cover letter content (if provided)"),
  
  // Processing state
  currentStep: z.string().default("analyze"),
  
  // Output state
  compatibilityScore: z.number().optional(),
  analysisText: z.string().optional(),
  scoringBreakdown: z.object({
    requiredExperience: z.number().optional(),
    technicalSkills: z.number().optional(),
    educationRequirements: z.number().optional(),
    industryKnowledge: z.number().optional(),
    additionalRequirements: z.number().optional()
  }).optional(),
  suggestions: z.array(z.object({
    original: z.string(),
    suggestion: z.string()
  })).optional(),
  coverLetter: z.string().optional(),
  coverLetterChanges: z.array(z.object({
    original: z.string().optional(),
    modified: z.string(),
    reason: z.string()
  })).optional(),
  error: z.string().optional()
});

type State = z.infer<typeof stateSchema>;

// Explicitly define channel types based on State
const graphChannels: StateGraphArgs<State>['channels'] = {
  resume: { value: (x, y) => y, default: () => "" },
  jobDescription: { value: (x, y) => y, default: () => "" },
  jobDetails: { value: (x, y) => y, default: () => ({ position: "", company: "" }) },
  baseCoverLetter: { value: (x, y) => y, default: () => undefined },
  currentStep: { value: (x, y) => y, default: () => "analyze" },
  compatibilityScore: { value: (x, y) => y, default: () => undefined },
  analysisText: { value: (x, y) => y, default: () => undefined },
  scoringBreakdown: { value: (x, y) => y, default: () => undefined },
  suggestions: { value: (x, y) => y, default: () => undefined },
  coverLetter: { value: (x, y) => y, default: () => undefined },
  coverLetterChanges: { value: (x, y) => y, default: () => undefined },
  error: { value: (x, y) => y, default: () => undefined },
};

// Create the model
const getModel = () => {
  return new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.7,
  });
};

// Analyze function
const analyze = async (state: State): Promise<Partial<State>> => {
  const model = getModel();
  
  const systemPrompt = `You are an expert Application Copilot assisting a job seeker.
Your task is to analyze the provided Resume against the Job Description and calculate a detailed compatibility score.
You MUST respond with a valid JSON object following the scoring criteria below.

Scoring Criteria:
1. Required Experience (30 points):
   - Evaluate if the candidate meets the minimum years of experience
   - Consider relevance of past roles to the position
   - Assess leadership/management experience if required

2. Technical Skills Match (30 points):
   - Compare required technical skills with candidate's skills
   - Give higher weight to must-have skills
   - Consider skill proficiency levels if mentioned

3. Education Requirements (15 points):
   - Verify if minimum education requirements are met
   - Consider relevant certifications
   - Evaluate field of study relevance

4. Industry Knowledge (15 points):
   - Assess industry-specific experience
   - Evaluate domain knowledge
   - Consider relevant projects or achievements

5. Additional Requirements (10 points):
   - Location/relocation requirements
   - Required certifications
   - Language requirements
   - Other specific requirements

STRICT RESPONSE FORMAT:
Return a JSON object with these exact fields (replace example values with your analysis):

{{  // Escaped opening brace
  "compatibilityScore": 85,
  "analysis": "Detailed analysis of the match goes here, explaining each category's score",
  "scoringBreakdown": {{ // Escaped opening brace
    "requiredExperience": 25,
    "technicalSkills": 28,
    "educationRequirements": 12,
    "industryKnowledge": 12,
    "additionalRequirements": 8
  }} // Escaped closing brace
}} // Escaped closing brace

IMPORTANT:
- All numbers must be integers
- Do not include any explanatory text outside the JSON structure
- The JSON must be properly formatted with double quotes
- The total score should be the sum of all breakdown scores`;

  const humanPrompt = `# Resume
${state.resume}

# Job Description
${state.jobDescription}

# Job Details
Position: ${state.jobDetails.position}
Company: ${state.jobDetails.company}
Location: ${state.jobDetails.location || 'N/A'}
Industry: ${state.jobDetails.industry || 'N/A'}

Analyze the resume against this job description and provide the compatibility score in the specified JSON format.`;

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["human", humanPrompt]
  ]);
  
  try {
    const response = await prompt.pipe(model).pipe(new JsonOutputParser()).invoke({});
    const responseObj = response as unknown;
    
    // Validate the response format
    if (!responseObj || typeof responseObj !== 'object' ||
        'compatibilityScore' in responseObj === false ||
        'analysis' in responseObj === false ||
        'scoringBreakdown' in responseObj === false ||
        typeof (responseObj as {compatibilityScore?: unknown}).compatibilityScore !== 'number' || 
        typeof (responseObj as {analysis?: unknown}).analysis !== 'string' ||
        !(responseObj as {scoringBreakdown?: unknown}).scoringBreakdown ||
        typeof (responseObj as {scoringBreakdown?: unknown}).scoringBreakdown !== 'object') {
      throw new Error('Invalid response format from model');
    }

    // Type assertion after validation
    const typedResponse = responseObj as {
      compatibilityScore: number;
      analysis: string;
      scoringBreakdown: Record<string, number>;
    };

    // Ensure all scoring breakdown fields are numbers and within valid ranges
    const validatedScoring = {
      requiredExperience: Math.min(30, Math.max(0, Math.round(Number(typedResponse.scoringBreakdown.requiredExperience)) || 0)),
      technicalSkills: Math.min(30, Math.max(0, Math.round(Number(typedResponse.scoringBreakdown.technicalSkills)) || 0)),
      educationRequirements: Math.min(15, Math.max(0, Math.round(Number(typedResponse.scoringBreakdown.educationRequirements)) || 0)),
      industryKnowledge: Math.min(15, Math.max(0, Math.round(Number(typedResponse.scoringBreakdown.industryKnowledge)) || 0)),
      additionalRequirements: Math.min(10, Math.max(0, Math.round(Number(typedResponse.scoringBreakdown.additionalRequirements)) || 0))
    };

    // Calculate total score from the breakdown to ensure consistency
    const totalScore = Object.values(validatedScoring).reduce((a, b) => a + b, 0);
    
    return {
      compatibilityScore: totalScore,
      analysisText: typedResponse.analysis,
      scoringBreakdown: validatedScoring,
      currentStep: "suggest"
    };
  } catch (error: unknown) {
    console.error("Error in analyze step:", error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error
      ? error.message.includes('JSON')
        ? 'Failed to parse AI response. Please try again.'
        : `Failed to analyze resume: ${error.message}`
      : 'An unknown error occurred during analysis';
    
    return {
      error: errorMessage,
      currentStep: END
    };
  }
};

// Generate suggestions function
const suggest = async (state: State): Promise<Partial<State>> => {
  const model = getModel();
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert Application Copilot assisting a job seeker.
Generate specific suggestions to improve the resume for this job application.

Your response should be a JSON object with:
- suggestions: an array of objects each containing:
  - original: a quote of specific text from the resume
  - suggestion: an improved version of that text`],
    ["human", `# Resume
${state.resume}

# Job Description
${state.jobDescription}

# Job Details
Position: ${state.jobDetails.position}
Company: ${state.jobDetails.company}

# Compatibility Score
${state.compatibilityScore}

# Analysis
${state.analysisText}

Generate 3-5 specific suggestions to improve this resume for the job.`]
  ]);
  
  try {
    const response = await prompt.pipe(model).pipe(new JsonOutputParser()).invoke({});
    const responseObj = response as unknown;
    
    // Validate the response has suggestions array
    if (!responseObj || typeof responseObj !== 'object' || !('suggestions' in responseObj)) {
      throw new Error('Invalid response format: missing suggestions array');
    }
    
    // Type assertion after validation
    const typedResponse = responseObj as {
      suggestions: Array<{ original: string; suggestion: string }>;
    };
    
    return {
      suggestions: typedResponse.suggestions,
      currentStep: "generateCoverLetter"
    };
  } catch (error: unknown) {
    console.error("Error in suggest step:", error);
    const errorMessage = error instanceof Error 
      ? `Failed to generate suggestions: ${error.message}`
      : 'An unknown error occurred while generating suggestions';
    return {
      error: errorMessage,
      currentStep: END
    };
  }
};

// Generate cover letter function
const generateCoverLetter = async (state: State): Promise<Partial<State>> => {
  const model = getModel();
  
  const systemPrompt = `You are an expert Application Copilot assisting a job seeker.
Generate a tailored cover letter for this job application.

${state.baseCoverLetter ? `IMPORTANT: A base cover letter is provided. You MUST:
1. Maintain the overall structure and format of the base letter
2. Keep personal anecdotes and unique experiences from the original
3. Only modify sentences that need specific tailoring to this job
4. Preserve the writer's voice and style
5. Keep the same paragraph structure where possible
6. Only add new paragraphs if absolutely necessary for missing critical information
7. Ensure any modified sentences maintain the same tone and writing style as the original

The goal is to make minimal but impactful changes that tailor the letter to this specific job.` : ''}

Your response MUST be a valid JSON object.
All string values within the JSON MUST be properly escaped (e.g., newline characters should be represented as \\n).
JSON Structure:
- coverLetter: the complete cover letter text (as a single JSON string)
${state.baseCoverLetter ? '- changes: array of specific changes made and why they were necessary' : ''}`;

  const userPrompt = `# Resume
${state.resume}

# Job Description
${state.jobDescription}

# Job Details
Position: ${state.jobDetails.position}
Company: ${state.jobDetails.company}
Location: ${state.jobDetails.location || 'N/A'}
Industry: ${state.jobDetails.industry || 'N/A'}

# Analysis from Previous Steps
Compatibility Score: ${state.compatibilityScore}
Key Strengths: ${state.analysisText}

${state.baseCoverLetter ? `# Base Cover Letter
${state.baseCoverLetter}

Instructions:
1. Review the base cover letter above
2. Make minimal necessary changes to tailor it to this job
3. Focus on highlighting relevant experience and skills from the analysis
4. Maintain the personal voice and unique experiences
5. Ensure all company and position details are correctly updated` : 'Generate a compelling cover letter that highlights the key strengths identified in the analysis.'}`;

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["human", userPrompt]
  ]);
  
  try {
    const response = await prompt.pipe(model).pipe(new JsonOutputParser()).invoke({});
    const responseObj = response as unknown;
    
    // Validate the response has coverLetter
    if (!responseObj || typeof responseObj !== 'object' || !('coverLetter' in responseObj)) {
      throw new Error('Invalid response format: missing coverLetter');
    }
    
    // Type assertion after validation
    const typedResponse = responseObj as {
      coverLetter: string;
      changes?: Array<{ modified: string; reason: string; original?: string }>;
    };
    
    return {
      coverLetter: typedResponse.coverLetter,
      coverLetterChanges: state.baseCoverLetter ? typedResponse.changes : undefined,
      currentStep: END
    };
  } catch (error: unknown) {
    console.error("Error in cover letter step:", error);
    const errorMessage = error instanceof Error
      ? `Failed to generate cover letter: ${error.message}`
      : 'An unknown error occurred while generating the cover letter';
    return {
      error: errorMessage,
      currentStep: END
    };
  }
};

// Create the workflow (no longer exported, synchronous)
function createWorkflow() {
  const workflow = new StateGraph<State>({
    channels: graphChannels // Use the explicitly defined channels
  })
    .addNode("analyze", analyze)
    .addNode("suggest", suggest)
    .addNode("generateCoverLetter", generateCoverLetter)
    .addEdge("analyze", "suggest")
    .addEdge("suggest", "generateCoverLetter")
    .setEntryPoint("analyze");
  
  return workflow.compile();
}

// Run the workflow
export async function runApplicationCopilot(
  resumeText: string,
  baseCoverLetter: string | undefined,
  jobDescription: string,
  jobDetails: {
    position: string;
    company: string;
    location?: string;
    industry?: string;
  }
) {
  try {
    console.log('[runApplicationCopilot] Received baseCoverLetter:', baseCoverLetter);
    console.log("Preparing workflow with provided text...");
    
    const workflow = createWorkflow();
    
    const initialState = {
      resume: resumeText || getDefaultResume(),
      jobDescription,
      jobDetails,
      baseCoverLetter,
      currentStep: "analyze"
    };
    
    console.log("Executing workflow...");
    const result = await workflow.invoke(initialState);
    console.log("Workflow completed");
    
    return {
      compatibilityScore: result.compatibilityScore || 0,
      analysisText: result.analysisText || "",
      scoringBreakdown: result.scoringBreakdown || {},
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      coverLetter: result.coverLetter || "",
      coverLetterChanges: Array.isArray(result.coverLetterChanges) ? result.coverLetterChanges : [],
      error: result.error
    };
  } catch (error: unknown) {
    console.error("Error running application copilot:", error);
    return {
      compatibilityScore: 0,
      analysisText: "",
      scoringBreakdown: {},
      suggestions: [],
      coverLetter: "",
      coverLetterChanges: [],
      error: `Workflow error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}