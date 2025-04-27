'use server';

import { ChatOpenAI } from '@langchain/openai';
import { RunnableLambda } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { StateGraph, END, StateGraphArgs } from '@langchain/langgraph';

// Default resume content helper (move here or import if defined elsewhere)
function getDefaultResume() {
  return `[Your Name]\n[Your Address]\n[Your Email] | [Your Phone] | [Your LinkedIn]\n\nSUMMARY\n[Brief professional summary highlighting your key skills and experience]\n\nSKILLS\n[List your key technical and soft skills relevant to your target roles]\n\nWORK EXPERIENCE\n[Job Title] | [Company Name] | [Employment Dates]\n- [Accomplishment or responsibility]\n\nEDUCATION\n[Degree] | [Institution] | [Graduation Year]`;
}

// === State Definition ===
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
  agentSettings: z.object({
    tone: z.string(),
    focusArea: z.string(), 
    detailLevel: z.string()
  }).describe("Settings for the AI agent"),
  
  // Processing state
  currentStep: z.string().default("analyze"),
  
  // Output state
  compatibilityScore: z.number().optional(),
  analysisText: z.string().optional(),
  suggestions: z.array(z.object({
    original: z.string(),
    suggestion: z.string()
  })).optional(),
  coverLetter: z.string().optional(),
  error: z.string().optional()
});

type State = z.infer<typeof stateSchema>;

// Explicitly define channel types based on State
const graphChannels: StateGraphArgs<State>['channels'] = {
  resume: { value: (x, y) => y, default: () => "" },
  jobDescription: { value: (x, y) => y, default: () => "" },
  jobDetails: { value: (x, y) => y, default: () => ({ position: "", company: "" }) },
  baseCoverLetter: { value: (x, y) => y, default: () => undefined },
  agentSettings: { value: (x, y) => y, default: () => ({ tone: "", focusArea: "", detailLevel: "" }) },
  currentStep: { value: (x, y) => y, default: () => "analyze" },
  compatibilityScore: { value: (x, y) => y, default: () => undefined },
  analysisText: { value: (x, y) => y, default: () => undefined },
  suggestions: { value: (x, y) => y, default: () => undefined },
  coverLetter: { value: (x, y) => y, default: () => undefined },
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
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert Application Copilot assisting a job seeker.
Analyze the provided Resume against the Job Description and calculate a compatibility score (0-100).
Provide a detailed analysis of how well the resume matches the job requirements.

Tone: ${state.agentSettings.tone}
Focus Area: ${state.agentSettings.focusArea}
Detail Level: ${state.agentSettings.detailLevel}

Your response should be a JSON object with:
- compatibilityScore (number between 0-100)
- analysis (detailed text explaining the match)`],
    ["human", `# Resume
${state.resume}

# Job Description
${state.jobDescription}

# Job Details
Position: ${state.jobDetails.position}
Company: ${state.jobDetails.company}
Location: ${state.jobDetails.location || 'N/A'}
Industry: ${state.jobDetails.industry || 'N/A'}`]
  ]);
  
  try {
    const response = await prompt.pipe(model).pipe(new JsonOutputParser()).invoke({});
    const responseObj = response as any;
    
    return {
      compatibilityScore: responseObj.compatibilityScore,
      analysisText: responseObj.analysis,
      currentStep: "suggest"
    };
  } catch (error: any) {
    console.error("Error in analyze step:", error);
    return {
      error: `Failed to analyze resume: ${error.message}`,
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

Tone: ${state.agentSettings.tone}
Focus Area: ${state.agentSettings.focusArea}
Detail Level: ${state.agentSettings.detailLevel}

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
    const responseObj = response as any;
    
    return {
      suggestions: responseObj.suggestions,
      currentStep: "generateCoverLetter"
    };
  } catch (error: any) {
    console.error("Error in suggest step:", error);
    return {
      error: `Failed to generate suggestions: ${error.message}`,
      currentStep: END
    };
  }
};

// Generate cover letter function
const generateCoverLetter = async (state: State): Promise<Partial<State>> => {
  const model = getModel();
  
  let systemPrompt = `You are an expert Application Copilot assisting a job seeker.\nGenerate a tailored cover letter for this job application.\n\nTone: ${state.agentSettings.tone}\nFocus Area: ${state.agentSettings.focusArea}\nDetail Level: ${state.agentSettings.detailLevel}`;

  if (state.baseCoverLetter) {
    systemPrompt += `\n\nA base cover letter is provided. You MUST use it as the foundation. Only modify, add, or remove sentences as needed to tailor it to this job. Do NOT rewrite from scratch unless absolutely necessary.`;
  }
  
  systemPrompt += `\n\nYour response should be a JSON object with:\n- coverLetter: the complete cover letter text`;
  
  let userPrompt = `# Resume\n${state.resume}\n\n# Job Description\n${state.jobDescription}\n\n# Job Details\nPosition: ${state.jobDetails.position}\nCompany: ${state.jobDetails.company}\nLocation: ${state.jobDetails.location || 'N/A'}\nIndustry: ${state.jobDetails.industry || 'N/A'}`;

  if (state.baseCoverLetter) {
    userPrompt += `\n\n# Base Cover Letter\n${state.baseCoverLetter}\n\nEdit the base cover letter below to best fit the job, but keep as much of the original structure and content as possible. Only change what is needed.`;
  }
  
  userPrompt += `\n\nGenerate a tailored cover letter for this job application.`;
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    ["human", userPrompt]
  ]);
  
  try {
    const response = await prompt.pipe(model).pipe(new JsonOutputParser()).invoke({});
    const responseObj = response as any;
    
    return {
      coverLetter: responseObj.coverLetter,
      currentStep: END
    };
  } catch (error: any) {
    console.error("Error in cover letter step:", error);
    return {
      error: `Failed to generate cover letter: ${error.message}`,
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
  },
  agentSettings: {
    tone: string;
    focusArea: string;
    detailLevel: string;
  }
) {
  try {
    console.log("Preparing workflow with provided text...");
    
    const workflow = createWorkflow();
    
    const initialState = {
      resume: resumeText || getDefaultResume(),
      jobDescription,
      jobDetails,
      agentSettings,
      baseCoverLetter,
      currentStep: "analyze"
    };
    
    console.log("Executing workflow...");
    const result = await workflow.invoke(initialState);
    console.log("Workflow completed");
    
    return {
      compatibilityScore: result.compatibilityScore || 0,
      analysisText: result.analysisText || "",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      coverLetter: result.coverLetter || "",
      error: result.error
    };
  } catch (error: any) {
    console.error("Error running application copilot:", error);
    return {
      compatibilityScore: 0,
      analysisText: "",
      suggestions: [],
      coverLetter: "",
      error: `Workflow error: ${error.message}`
    };
  }
}