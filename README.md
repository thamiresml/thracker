# Thracker - Job Application Tracker

Thracker is a comprehensive job application tracking system built with Next.js, React, TypeScript, and Supabase.

## Features

- **Dashboard**: Get a quick overview of your job search progress
- **Applications**: Track and manage all your job applications
- **Target Companies**: Keep a list of companies you're interested in
- **Networking**: Manage your professional connections
- **Weekly Plan**: Set goals and plan your job search activities
- **Application Copilot**: Get AI-powered resume and cover letter assistance

## Stack

- **Next.js 15**: For server-side rendering and routing
- **React 19**: For building the user interface
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling
- **Supabase**: For authentication, database, and storage
- **OpenAI GPT-4o**: For the AI-powered Application Copilot

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/thracker.git
cd thracker
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI (for Application Copilot)
OPENAI_API_KEY=your-openai-api-key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

## Setting up Application Copilot

The Application Copilot feature requires:
1. An OpenAI API key with access to GPT-4o
2. A Supabase storage bucket for storing resumes and cover letters

The bucket will be created automatically when you first use the Application Copilot feature. You can upload your resume directly in the application.

## License

[MIT](LICENSE)
