import { NextResponse } from 'next/server';
// Use createServerClient from @supabase/ssr for Route Handlers
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as cheerio from 'cheerio';

interface JobData {
  company: string;
  position: string;
  location: string;
  description: string;
  salary: string;
  industry: string;
  companySize: string;
  [key: string]: string;
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

// Helper function to find best match from a list
function findBestMatch(input: string, list: string[]): string | null {
  if (!input) return null;
  
  // First try exact match
  const exactMatch = list.find(item => 
    item.toLowerCase() === input.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Then try contains match
  const containsMatch = list.find(item =>
    input.toLowerCase().includes(item.toLowerCase()) ||
    item.toLowerCase().includes(input.toLowerCase())
  );
  if (containsMatch) return containsMatch;
  
  return null;
}

// Helper function to normalize location
function normalizeLocation(location: string): string {
  if (!location) return 'Remote';
  
  // Clean up the location string
  location = location.trim()
    .replace(/\s+/g, ' ')
    .replace(/[,\s]*USA?$/i, '')
    .replace(/United States/i, '')
    .trim();
  
  // Check for remote indicators
  if (/remote|work from home|wfh|virtual/i.test(location)) {
    return 'Remote';
  }
  
  // Check for hybrid indicators
  if (/hybrid|flexible|partial remote/i.test(location)) {
    return 'Hybrid';
  }
  
  // Try to find a match in our predefined cities
  const bestMatch = findBestMatch(location, americanCities);
  return bestMatch || location;
}

// Helper function to normalize job title
function normalizeJobTitle(title: string): string {
  if (!title) return 'Unknown Position';
  
  // Clean up the title string
  title = title.trim().replace(/\s+/g, ' ');
  
  // Try to find a match in our predefined roles
  const bestMatch = findBestMatch(title, mbaJobRoles);
  return bestMatch || title;
}

// Helper function to extract salary from text content
function extractSalaryFromText(text: string): string {
  if (!text) return '';
  
  // Patterns for salary information with higher specificity
  const salaryPatterns = [
    /\$[\d,]+ *- *\$[\d,]+( per year| annually)?/gi,
    /\$[\d,]+ *to *\$[\d,]+( per year| annually)?/gi,
    /\$[\d,]+ *\+ *( per year| annually)?/gi,
    /salary:? *\$[\d,]+ *- *\$[\d,]+/gi,
    /compensation:? *\$[\d,]+ *- *\$[\d,]+/gi,
    /salary range:? *\$[\d,]+ *- *\$[\d,]+/gi,
    /annual salary range:? *\$[\d,]+ *- *\$[\d,]+/gi,
    /range:? *\$[\d,]+ *- *\$[\d,]+/gi,
    /total compensation:? *\$[\d,]+ *- *\$[\d,]+/gi
  ];

  for (const pattern of salaryPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].replace(/( per year| annually)/gi, '').trim();
    }
  }
  
  return '';
}

// Helper function to extract location from text content
function extractLocationFromText(text: string): string {
  if (!text) return '';
  
  // Check for common location indicators
  const locationPatterns = [
    /location:? *([\w\s,]+?)(?:\.|,|\n|$)/i,
    /based in:? *([\w\s,]+?)(?:\.|,|\n|$)/i,
    /position is (?:located|based) in:? *([\w\s,]+?)(?:\.|,|\n|$)/i,
    /this role is based in:? *([\w\s,]+?)(?:\.|,|\n|$)/i,
    /office location:? *([\w\s,]+?)(?:\.|,|\n|$)/i,
    /work location:? *([\w\s,]+?)(?:\.|,|\n|$)/i,
    /working location:? *([\w\s,]+?)(?:\.|,|\n|$)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

// Helper function to validate a location against our list of known locations
function validateLocation(location: string): string {
  if (!location) return 'Remote';
  
  // Clean and normalize the location text
  const cleanedLocation = location.trim()
    .replace(/^\s*in\s+/, '') // Remove leading "in" if present
    .replace(/^\s*at\s+/, '') // Remove leading "at" if present
    .replace(/[,.;:]$/, '')   // Remove trailing punctuation
    .trim();
  
  // Common words that shouldn't be treated as locations
  const invalidLocationTerms = [
    'assistance', 'new', 'emp', 'help', 'support', 'the', 'and', 'position', 'role',
    'job', 'benefits', 'salary', 'compensation', 'apply', 'opportunity', 'experience'
  ];
  
  // Check if the location contains any invalid terms
  for (const term of invalidLocationTerms) {
    if (cleanedLocation.toLowerCase().includes(term.toLowerCase())) {
      return 'Remote'; // Default to Remote if the location contains invalid terms
    }
  }
  
  // Check if the location matches known city patterns
  for (const city of americanCities) {
    if (
      cleanedLocation.toLowerCase() === city.toLowerCase() ||
      cleanedLocation.toLowerCase().includes(city.toLowerCase())
    ) {
      return city; // Return the standardized city name
    }
  }
  
  // If it includes remote or hybrid indicators, return those
  if (/remote|work from home|wfh|virtual/i.test(cleanedLocation)) {
    return 'Remote';
  }
  
  if (/hybrid|flexible|partial remote/i.test(cleanedLocation)) {
    return 'Hybrid';
  }
  
  // If it's a short string (2-20 chars) without numbers, it might be a valid location
  if (cleanedLocation.length >= 2 && 
      cleanedLocation.length <= 20 && 
      !/\d/.test(cleanedLocation)) {
    return cleanedLocation;
  }
  
  // Default to Remote if we can't validate the location
  return 'Remote';
}

// Enhanced helper function to detect the real company from various job boards
function detectCompanyFromJobBoard(url: string, $: cheerio.CheerioAPI): string | null {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  
  // For Greenhouse job board
  if (hostname.includes('greenhouse.io')) {
    // Try several selectors to find the company name in Greenhouse
    const companySelectors = [
      '.company-name',
      'a[data-source="company-name"]',
      'meta[property="og:title"]', // Often has "Company - Position" format
      'title', // Often has "Position at Company" format
      '.app-title', // Sometimes contains company name
      '.company' // Another common class for company
    ];
    
    for (const selector of companySelectors) {
      let companyText = '';
      if (selector === 'meta[property="og:title"]') {
        companyText = $(selector).attr('content') || '';
        // Extract company name from "Company - Position" format
        const parts = companyText.split(' - ');
        if (parts.length > 1) {
          return parts[0].trim();
        }
      } else if (selector === 'title') {
        companyText = $(selector).text();
        // Extract company name from "Position at Company" format
        const match = companyText.match(/ at (.*?)( \||\(|\)|$)/i);
        if (match && match[1]) {
          return match[1].trim();
        }
      } else {
        companyText = $(selector).text().trim();
        if (companyText && companyText !== 'Greenhouse') {
          return companyText;
        }
      }
    }
    
    // Try to extract from URL path
    try {
      const urlPath = urlObj.pathname;
      const pathParts = urlPath.split('/').filter(Boolean);
      
      // In Greenhouse URLs, the first part after "job-boards.greenhouse.io" is often the company name
      // Format: /companyname/job/position-slug or /companyname/jobs/1234
      if (pathParts.length > 0) {
        // Skip "jobs" if it's the first part
        const companySlug = pathParts[0] === 'jobs' && pathParts.length > 1 ? pathParts[1] : pathParts[0];
        
        // Check if this is a company subdomain in the hostname
        if (urlObj.hostname.includes('.greenhouse.io') && !urlObj.hostname.startsWith('job-boards')) {
          const subdomain = urlObj.hostname.split('.')[0];
          if (subdomain && subdomain !== 'www' && subdomain !== 'boards') {
            return subdomain.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
          }
        }
        
        // Convert slug to proper company name if not found in subdomain
        const companyName = companySlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        // Don't return common words that aren't company names
        if (companyName && !['Jobs', 'Job', 'Board', 'Boards', 'Greenhouse'].includes(companyName)) {
          return companyName;
        }
      }
    } catch (error) {
      console.error('Error parsing URL for company name:', error);
    }
  }
  
  // For Lever job board
  if (hostname.includes('lever.co')) {
    // Try several selectors for company name in Lever
    const companySelectors = [
      '.main-header-logo img[alt]', // Logo alt text often has company name
      '.company-name',
      'meta[property="og:title"]'
    ];
    
    for (const selector of companySelectors) {
      if (selector.includes('img[alt]')) {
        const alt = $(selector).attr('alt');
        if (alt && alt !== 'Lever') {
          return alt.trim();
        }
      } else if (selector.startsWith('meta')) {
        const content = $(selector).attr('content') || '';
        // Lever meta titles are often "Position - Company"
        const parts = content.split(' - ');
        if (parts.length > 1) {
          return parts[1].trim(); // Company is usually the second part
        }
      } else {
        const text = $(selector).text().trim();
        if (text && text !== 'Lever') {
          return text;
        }
      }
    }
    
    // Check page title
    const title = $('title').text();
    const titleMatch = title.match(/.*? at (.*?)( \||\(|\)|$)/i);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    
    // Try to extract from URL (lever URLs typically have company as subdomain)
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'jobs') {
      return subdomain.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  // For Workday
  if (hostname.includes('workday') || hostname.includes('myworkdayjobs.com')) {
    // Workday format is usually company.myworkdayjobs.com
    const parts = hostname.split('.');
    if (parts.length > 0) {
      const companySlug = parts[0];
      if (companySlug !== 'www' && companySlug !== 'workday') {
        return companySlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    // Try to find in the page content
    const companySelectors = [
      '.WFMA .gwt-Label', // Often contains company name
      'img.logo[alt]',
      'meta[property="og:title"]'
    ];
    
    for (const selector of companySelectors) {
      if (selector.includes('[alt]')) {
        const alt = $(selector).attr('alt');
        if (alt) return alt.trim();
      } else if (selector.startsWith('meta')) {
        const content = $(selector).attr('content') || '';
        // Format could be "Job | Company"
        const parts = content.split(' | ');
        if (parts.length > 1) return parts[1].trim();
      } else {
        const text = $(selector).text().trim();
        if (text) return text;
      }
    }
  }
  
  // For general job boards, try to extract from the URL or page title
  // Common job boards: LinkedIn, Indeed, ZipRecruiter, etc.
  if (hostname.includes('linkedin.com') || 
      hostname.includes('indeed.com') || 
      hostname.includes('ziprecruiter.com') || 
      hostname.includes('monster.com')) {
    
    // Look for company in meta tags
    const companyMeta = $('meta[property="og:site_name"]').attr('content') ||
                       $('meta[name="company"]').attr('content') ||
                       $('meta[name="organization"]').attr('content');
                       
    if (companyMeta) return companyMeta;
    
    // Try page heading/title that might contain the company name
    const companySelectors = [
      '.company-name',
      '.job-company-name',
      '.hiring-org',
      '[data-testid="company-name"]',
      'a[data-test="company-name"]'
    ];
    
    for (const selector of companySelectors) {
      const text = $(selector).text().trim();
      if (text) return text;
    }
    
    // For LinkedIn, company is often in the URL
    if (hostname.includes('linkedin.com')) {
      const path = urlObj.pathname;
      if (path.includes('/company/')) {
        const companySlug = path.split('/company/')[1]?.split('/')[0];
        if (companySlug) {
          return companySlug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }
    }
  }
  
  return null;
}

async function fetchAndParse(url: string) {
  try {
    // Enhanced headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };

    // Fetch the page content
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} - ${await response.text()}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Initialize job data
    const jobData: JobData = {
      company: 'Unknown Company',
      position: 'Unknown Position',
      location: '',
      description: '',
      salary: '',
      industry: '',
      companySize: ''
    };

    // Check if this is a job board and try to detect the real company
    const realCompany = detectCompanyFromJobBoard(url, $);
    if (realCompany) {
      jobData.company = realCompany;
    }

    // Get the full text content for deeper analysis
    const fullPageText = $('body').text();
    
    // Special handling for known job boards
    if (url.includes('careers.mastercard.com')) {
      jobData.company = 'Mastercard';
      jobData.position = $('h1.job-title, h1').first().text().trim();
      const locationText = $('[data-ui="location"]').first().text().trim();
      jobData.location = locationText || 'Multiple Locations';
      jobData.description = $('.job-description').text().trim() || 
                           $('[data-ui="job-description"]').text().trim() ||
                           $('.ats-description').text().trim();

    } else if (url.includes('careers.chime.com') || url.includes('chime.com')) {
      jobData.company = 'Chime';
      // For Chime, try multiple selectors for each field
      jobData.position = $('.posting-headline h2').text().trim() ||
                        $('h1.job-title').text().trim() ||
                        $('h1').first().text().trim();
      
      jobData.location = $('.posting-categories .sort-by-location').text().trim() ||
                        $('.location').first().text().trim() ||
                        $('.job-location').first().text().trim();
      
      jobData.description = $('.posting-description').text().trim() ||
                           $('.job-description').text().trim();

    } else if (url.includes('openai.com') || url.includes('careers.openai.com')) {
      jobData.company = 'OpenAI';
      
      // Extract position from URL first
      const urlPath = new URL(url).pathname;
      const urlPosition = urlPath.split('/').pop()?.replace(/-/g, ' ');
      
      // Try multiple ways to get the position
      const titleSelectors = [
        'h1.job-title',
        'h1:contains("Product")',
        'h1:contains("Engineer")',
        'h1:contains("Manager")',
        'h1',
        'title'  // Try page title as last resort
      ];

      let foundPosition = '';
      for (const selector of titleSelectors) {
        let title = '';
        if (selector === 'title') {
          title = $('title').text().split('|')[0].trim();  // Usually "Position | OpenAI" format
        } else {
          title = $(selector).first().text().trim();
        }
        
        if (title) {
          // Clean up the title
          title = title
            .replace('OpenAI', '')
            .replace('Careers', '')
            .replace('Jobs', '')
            .replace('at', '')
            .replace(/\|/g, '')
            .trim();
          
          if (title) {
            foundPosition = title;
            break;
          }
        }
      }
      
      // If we still don't have a position, try to construct it from the URL
      if (!foundPosition && urlPosition) {
        foundPosition = urlPosition
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      jobData.position = foundPosition || 'Unknown Position';

      // Improved location extraction for OpenAI
      // First try specific selectors
      const locationSelectors = [
        '.location',
        '.job-location',
        '[data-field="location"]',
        'div:contains("Location:")',
        'span:contains("Location:")',
        'div:contains("This role is based in")',
        'p:contains("Location:")',
        'li:contains("Location:")'
      ];

      let location = '';
      for (const selector of locationSelectors) {
        if (selector.includes(':contains')) {
          const elements = $(selector);
          elements.each((_, el) => {
            const text = $(el).text();
            // More specific pattern matching to avoid capturing wrong text
            const match = text.match(/Location:?\s*([\w\s,]+?)(?:\.|,|\n|$)/i) || 
                         text.match(/This role is based in\s*([\w\s,]+?)(?:\.|,|\n|$)/i) ||
                         text.match(/Position located in\s*([\w\s,]+?)(?:\.|,|\n|$)/i);
            if (match && match[1]) {
              location = match[1].trim();
              return false; // Break the loop
            }
          });
        } else {
          const elementText = $(selector).first().text().trim();
          // Verify this looks like a location before using it
          if (elementText && elementText.length < 30 && !elementText.includes('assistance')) {
            location = elementText;
          }
        }
        if (location) break;
      }
      
      // Get full job description for deeper analysis
      const descriptionSelectors = [
        'div:contains("About the Team")',
        'div:contains("About the Role")',
        'div:contains("In this role, you will")',
        '.job-description',
        '#job-description',
        '[data-field="description"]',
        '.description',
        'main',
        'article'
      ];

      let description = '';
      for (const selector of descriptionSelectors) {
        const section = $(selector);
        if (section.length) {
          if (selector.includes('About the')) {
            // Get the section and next sections to capture the full description
            description = section.text() + '\n\n' + section.next().text() + 
                         '\n\n' + section.next().next().text() + 
                         '\n\n' + section.next().next().next().text();
          } else {
            description = section.text();
          }
          if (description) {
            break;
          }
        }
      }
      
      // Store the description for other extraction
      jobData.description = description.trim();
      
      // If no location found from selectors, try to extract from the description
      if (!location) {
        // Look more specifically for OpenAI location patterns
        const locationPatterns = [
          /\*Open to hiring remote across ([\w\s,]+?) —/i,
          /\*Open to ([\w\s,]+?) —/i,
          /location:?\s*([\w\s,]+?)(?:\.|,|\n|$)/i,
          /based in\s*([\w\s,]+?)(?:\.|,|\n|$)/i,
          /position is (?:located|based) in\s*([\w\s,]+?)(?:\.|,|\n|$)/i,
          /this role is based in\s*([\w\s,]+?)(?:\.|,|\n|$)/i,
          /this is a\s*([\w\s,]+?)-based role/i,
          /our office in\s*([\w\s,]+?)(?:\.|,|\n|$)/i,
          /offices? in ([\w\s,]+?)(?:\.|,|\n|$)/i
        ];
        
        for (const pattern of locationPatterns) {
          const match = description.match(pattern);
          if (match && match[1]) {
            const potentialLocation = match[1].trim();
            // Only use if it looks like a valid location
            if (potentialLocation.length < 30 && !potentialLocation.toLowerCase().includes('assistance')) {
              location = potentialLocation;
              break;
            }
          }
        }
        
        // OpenAI jobs are often based in San Francisco if nothing else specified
        if (!location && description.includes('San Francisco')) {
          location = 'San Francisco, CA';
        }
      }
      
      // Validate the extracted location against our list
      const validatedLocation = validateLocation(location);
      jobData.location = validatedLocation;

      // Enhanced salary extraction for OpenAI jobs
      // OpenAI usually puts salary info at the end of job descriptions
      const salaryPatterns = [
        /compensation.*?\$([\d,]+).*?\$([\d,]+)/i,
        /salary.*?\$([\d,]+).*?\$([\d,]+)/i,
        /range.*?\$([\d,]+).*?\$([\d,]+)/i,
        /\$([\d,]+).*?to.*?\$([\d,]+)/i,
        /\$([\d,]+).*?-.*?\$([\d,]+)/i
      ];
      
      let salary = '';
      
      // If we have a description, search through it for salary information
      if (description) {
        // First try the last 500 characters - OpenAI often puts salary at the end
        const endOfDescription = description.slice(-500);
        
        for (const pattern of salaryPatterns) {
          // First look at the end of the description
          const endMatch = endOfDescription.match(pattern);
          if (endMatch) {
            if (endMatch[1] && endMatch[2]) {
              salary = `$${endMatch[1]} - $${endMatch[2]}`;
              break;
            }
          }
          
          // If not found at the end, check the full description
          const fullMatch = description.match(pattern);
          if (fullMatch) {
            if (fullMatch[1] && fullMatch[2]) {
              salary = `$${fullMatch[1]} - $${fullMatch[2]}`;
              break;
            }
          }
        }
      }
      
      // Use the extracted salary if found
      if (salary) {
        jobData.salary = salary;
      }

    } else if (url.includes('adobe.com') || url.includes('careers.adobe.com')) {
      jobData.company = 'Adobe';
      
      // Get the full position title
      const titleSelectors = [
        'h1.job-title',
        'h1:first',
        'h1',
        'title'
      ];
      
      let foundPosition = '';
      for (const selector of titleSelectors) {
        let title = '';
        if (selector === 'title') {
          title = $('title').text().split('|')[0].trim();
        } else {
          title = $(selector).first().text().trim();
        }
        
        if (title) {
          // Clean up the title
          title = title
            .replace('Adobe', '')
            .replace('Careers', '')
            .replace('Jobs', '')
            .replace('at', '')
            .replace(/\|/g, '')
            .trim();
          
          if (title) {
            foundPosition = title;
            break;
          }
        }
      }
      
      jobData.position = foundPosition || 'Unknown Position';

      // Get location - Adobe usually has a specific format for this
      const locationText = $('.job-location, [aria-label="Job location"]').text().trim() ||
                         $('div:contains("Job available in")').first().text().trim();
      
      if (locationText) {
        // Extract locations if multiple are listed
        const locations = locationText.replace('Job available in', '')
                                    .split(/[,|]/)
                                    .map(loc => loc.trim())
                                    .filter(loc => loc);
        jobData.location = locations.join(' | ') || 'Remote';
      }

      // Get job description - Adobe usually structures this well
      const descriptionSections = [
        'Our Company',
        'The Opportunity',
        "What you'll do",
        "What you'll need to succeed",
        'The Challenge',
        'The Team'
      ];
      
      let fullDescription = '';
      
      // Try to get structured content first
      descriptionSections.forEach(section => {
        const sectionContent = $(`h2:contains("${section}"), h3:contains("${section}"), .section-title:contains("${section}")`).parent().text().trim();
        if (sectionContent) {
          fullDescription += `${section}:\n${sectionContent}\n\n`;
        }
      });
      
      // If structured content isn't found, try general content
      if (!fullDescription) {
        fullDescription = $('.job-description, .description, [data-t="job-details"]').text().trim() ||
                         $('main').text().trim();
      }
      
      // Clean up the description
      jobData.description = fullDescription
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

    } else if (url.includes('greenhouse.io') || url.includes('job-boards.greenhouse.io')) {
      // First extract real company name
      const realCompany = detectCompanyFromJobBoard(url, $);
      if (realCompany) {
        jobData.company = realCompany;
      }
      
      // Get the full job title from multiple possible sources
      const titleSelectors = [
        'h1.app-title',
        'h1',
        '.app-title',
        'meta[property="og:title"]',
        'title' // Fallback to page title
      ];
      
      let fullTitle = '';
      
      // First try to get directly from the h1 tag (most reliable)
      for (const selector of titleSelectors) {
        if (selector.startsWith('meta')) {
          const content = $(selector).attr('content') || '';
          // Meta title usually has "Position - Company" format
          const parts = content.split(' - ');
          if (parts.length > 0) {
            fullTitle = parts[0].trim();
            break;
          }
        } else if (selector === 'title') {
          const pageTitle = $(selector).text().trim();
          // Title can be "Position at Company | Greenhouse" or similar
          const parts = pageTitle.split(' at ');
          if (parts.length > 0) {
            fullTitle = parts[0].trim();
            break;
          }
        } else {
          fullTitle = $(selector).first().text().trim();
          if (fullTitle) break;
        }
      }
      
      // If we have a title, clean it up
      if (fullTitle) {
        // Remove "Greenhouse Job Board" text if present
        fullTitle = fullTitle.replace(/Greenhouse Job Board/gi, '').trim();
        
        // Remove "at Company" suffix if present
        const atCompanyMatch = fullTitle.match(/^(.*?)\s+at\s+.*$/i);
        if (atCompanyMatch && atCompanyMatch[1]) {
          fullTitle = atCompanyMatch[1].trim();
        }
        
        jobData.position = fullTitle;
      }
      
      // If still no title, try to extract from URL
      if (!jobData.position || jobData.position === 'Unknown Position') {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          
          // In URLs like /company/job/job-title-slug or /company/jobs/1234
          // Look for position in the job-title-slug
          let positionSlug = '';
          
          for (let i = 0; i < pathParts.length; i++) {
            if ((pathParts[i] === 'job' || pathParts[i] === 'jobs') && i + 1 < pathParts.length) {
              positionSlug = pathParts[i + 1];
              break;
            }
          }
          
          if (positionSlug && !(/^\d+$/.test(positionSlug))) { // Ensure it's not just a numeric ID
            const position = positionSlug.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            jobData.position = position;
          }
        } catch (error) {
          console.error('Error extracting position from URL:', error);
        }
      }
      
      // Get location - Greenhouse usually shows this clearly
      const locationSelectors = [
        '.location',
        '.js-location',
        'div.metadata div:contains("Location")',
        'meta[property="og:location"]'
      ];
      
      let location = '';
      for (const selector of locationSelectors) {
        if (selector.includes(':contains')) {
          $(selector).each((_, el) => {
            const text = $(el).text();
            if (text.includes('Location')) {
              location = text.replace('Location', '').trim();
              return false; // Break the loop
            }
          });
        } else if (selector.startsWith('meta')) {
          location = $(selector).attr('content') || '';
        } else {
          location = $(selector).first().text().trim();
        }
        if (location) break;
      }
      
      jobData.location = location || 'Remote';
      
      // Enhanced job description extraction for Greenhouse
      const descriptionSelectors = [
        '.content', 
        '#content',
        '#app .app-body',  // Main container for Greenhouse job boards
        '.description',
        '#description',
        '.job-description',
        // Content sections commonly used in Greenhouse job listings
        'section:contains("About the")',
        'section:contains("What you")',
        'section:contains("Responsibilities")',
        'section:contains("Requirements")',
        'section:contains("Qualifications")',
        // For Runway specifically
        'div[role="main"]',
        'article'
      ];
      
      let description = '';
      
      // First try to get the main containers with descriptions
      for (const selector of descriptionSelectors) {
        let content: string | undefined;
        if (selector.includes(':contains')) {
          // Handle sections that contain specific text
          $(selector).each((_, el) => {
            const sectionText = $(el).text().trim();
            if (sectionText) {
              content = (content || '') + sectionText + '\n\n';
            }
          });
        } else {
          content = $(selector).text().trim();
        }
        
        if (content) {
          description = content;
          break;
        }
      }
      
      // If still no description, try to get all main content
      if (!description) {
        // For Greenhouse boards, the job description is often in the main content area
        // Try to capture everything in the main content area
        const mainContent = $('div[role="main"]').text() || 
                          $('main').text() || 
                          $('#main').text();
        
        if (mainContent) {
          // Clean up the main content to extract just the job description
          description = mainContent
            .replace(/apply|submit application|back to jobs/gi, '')
            .trim();
        }
      }
      
      // For Runway specifically, try an alternate approach if still no description
      if (!description || description.length < 100) {
        // Get all paragraphs and headings from the main content area
        const contentSections: string[] = [];
        $('div[role="main"] p, div[role="main"] h1, div[role="main"] h2, div[role="main"] h3, div[role="main"] h4, div[role="main"] ul').each((_, el) => {
          const text = $(el).text().trim();
          if (text && !text.includes('Apply') && !text.includes('Submit') && !text.includes('Back to jobs')) {
            contentSections.push(text);
          }
        });
        
        if (contentSections.length > 0) {
          description = contentSections.join('\n\n');
        }
      }
      
      jobData.description = description;
      
      // Try to extract salary information from the description
      const salarySection = description.match(/salary.*?\$([\d,]+).*?\$([\d,]+)/i) ||
                           description.match(/compensation.*?\$([\d,]+).*?\$([\d,]+)/i) ||
                           description.match(/range.*?\$([\d,]+).*?\$([\d,]+)/i);
                           
      if (salarySection && salarySection[1] && salarySection[2]) {
        jobData.salary = `$${salarySection[1]} - $${salarySection[2]}`;
      } else {
        // Fallback to general salary extraction
        const salary = extractSalaryFromText(fullPageText);
        if (salary) {
          jobData.salary = salary;
        }
      }
    } else if (url.includes('lever.co')) {
      // Set company from detection function
      const realCompany = detectCompanyFromJobBoard(url, $);
      if (realCompany) {
        jobData.company = realCompany;
      }
      
      // Get position title
      const positionSelectors = [
        'h2[data-qa="posting-name"]',
        '.posting-headline h2',
        'h2.posting-headline',
        'meta[property="og:title"]'
      ];
      
      let position = '';
      for (const selector of positionSelectors) {
        if (selector.startsWith('meta')) {
          const content = $(selector).attr('content') || '';
          const parts = content.split(' - ');
          if (parts.length > 0) {
            position = parts[0].trim();
            break;
          }
        } else {
          position = $(selector).text().trim();
          if (position) break;
        }
      }
      
      jobData.position = position || 'Unknown Position';
      
      // Get location
      const locationSelectors = [
        '.location',
        '.posting-categories .sort-by-time',
        'div.posting-categories .sort-by-location',
        '.job-posting__metadata-item:contains("Location")'
      ];
      
      let location = '';
      for (const selector of locationSelectors) {
        if (selector.includes(':contains')) {
          $(selector).each((_, el) => {
            const text = $(el).text();
            if (text.includes('Location')) {
              location = text.replace('Location', '').trim();
              return false; // Break the loop
            }
          });
        } else {
          location = $(selector).text().trim();
        }
        if (location) break;
      }
      
      jobData.location = location || 'Remote';
      
      // Get job description
      const descriptionSelectors = [
        '.section-wrapper.content',
        '.posting-page-content',
        '.posting-description',
        'div[data-qa="posting-description"]'
      ];
      
      let description = '';
      for (const selector of descriptionSelectors) {
        description = $(selector).text().trim();
        if (description) break;
      }
      
      jobData.description = description;
      
      // Try to extract salary
      const salary = extractSalaryFromText(description || fullPageText);
      if (salary) {
        jobData.salary = salary;
      }
    } else if (url.includes('workday') || url.includes('myworkdayjobs.com')) {
      // Set company from detection function
      const realCompany = detectCompanyFromJobBoard(url, $);
      if (realCompany) {
        jobData.company = realCompany;
      }
      
      // Get position title - Workday usually has this prominently displayed
      const positionSelectors = [
        'h1.job-title',
        'h1#job-title',
        'h2.job-title',
        'title'
      ];
      
      let position = '';
      for (const selector of positionSelectors) {
        if (selector === 'title') {
          const pageTitle = $(selector).text();
          // Workday titles are often "Job Title | Company"
          const parts = pageTitle.split(' | ');
          if (parts.length > 0) {
            position = parts[0].trim();
          }
        } else {
          position = $(selector).text().trim();
        }
        if (position) break;
      }
      
      jobData.position = position || 'Unknown Position';
      
      // Get location - Workday usually shows this near the title
      const locationSelectors = [
        '.location-data',
        '.location',
        '.gwt-Label:contains("Location")'
      ];
      
      let location = '';
      for (const selector of locationSelectors) {
        if (selector.includes(':contains')) {
          $(selector).each((_, el) => {
            const text = $(el).text();
            if (text.includes('Location:')) {
              location = text.replace('Location:', '').trim();
              return false;
            }
          });
        } else {
          location = $(selector).text().trim();
        }
        if (location) break;
      }
      
      jobData.location = location || 'Remote';
      
      // Get description
      const descriptionSelectors = [
        '.job-description',
        '#job-description',
        '.job_description'
      ];
      
      let description = '';
      for (const selector of descriptionSelectors) {
        description = $(selector).text().trim();
        if (description) break;
      }
      
      jobData.description = description;
      
      // Try to extract salary
      const salary = extractSalaryFromText(description || fullPageText);
      if (salary) {
        jobData.salary = salary;
      }
    } else {
      // Generic parsing for other sites
      // Try to get company name from meta tags or OpenGraph data
      const metaCompany = $('meta[property="og:site_name"]').attr('content') ||
                         $('meta[name="application-name"]').attr('content') ||
                         $('meta[property="og:title"]').attr('content')?.split('|')[1]?.trim() ||
                         $('meta[name="company"]').attr('content');
      
      // Try multiple selectors for job title, including schema.org metadata
      const schemaScript = $('script[type="application/ld+json"]').text();
      let schemaData;
      try {
        schemaData = JSON.parse(schemaScript);
        // Handle both single object and array of objects
        if (Array.isArray(schemaData)) {
          schemaData = schemaData.find(item => item['@type'] === 'JobPosting');
        }
      } catch {
        schemaData = null;
      }

      const titleSelectors = [
        'h1.job-title',
        'h1.posting-headline',
        'h1:first',
        'h1',
        '.job-title',
        '.posting-headline h2',
        '[data-field="title"]',
        'meta[property="og:title"]',
        'title'
      ];
      
      let title = schemaData?.title || '';
      if (!title) {
        for (const selector of titleSelectors) {
          if (selector === 'title') {
            title = $('title').text().split(/[|\-]/).filter(Boolean)[0]?.trim();
          } else if (selector.startsWith('meta')) {
            title = $(selector).attr('content')?.split(/[|\-]/).filter(Boolean)[0]?.trim();
          } else {
            title = $(selector).first().text().trim();
          }
          if (title) break;
        }
      }

      // Try to find location information
      const genericLocationSelectors = [
        '.job-location',
        '.location',
        '[itemprop="jobLocation"]',
        '[data-testid="job-location"]',
        'span:contains("Location")',
        'div:contains("Location")'
      ];
      
      let genericLocation = '';
      // Process location selectors
      for (const selector of genericLocationSelectors) {
        if (selector.includes('Location:')) {
          genericLocation = $(selector).next().text().trim() || 
                            $(selector).parent().text().replace('Location:', '').trim();
        } else if (selector.startsWith('meta')) {
          const content = $(selector).attr('content');
          if (content) {
            genericLocation = content;
          }
        } else {
          genericLocation = $(selector).first().text().trim();
        }
        if (genericLocation) break;
      }
      
      // Extract location from text if not found via selectors
      const extractedLocation = extractLocationFromText(fullPageText);
      genericLocation = genericLocation || extractedLocation || 'Remote';
      
      // Try multiple selectors for description, including schema.org data
      const descriptionSelectors = [
        '.job-description',
        '.posting-description',
        '#job-description',
        '[data-field="description"]',
        '.description',
        'div[role="main"]',
        'main',
        'article'
      ];
      
      let genericDescription = schemaData?.description || '';
      if (!genericDescription) {
        for (const selector of descriptionSelectors) {
          const element = $(selector).first();
          if (element.length) {
            // Remove any script tags or hidden elements
            element.find('script, style, .hidden, [style*="display: none"]').remove();
            genericDescription = element.text().trim();
            if (genericDescription) break;
          }
        }
      }
      
      // Try to find salary information from schema.org data or page content
      let genericSalary = schemaData?.baseSalary?.value || 
                        schemaData?.estimatedSalary?.value || '';
      
      if (!genericSalary) {
        genericSalary = extractSalaryFromText(fullPageText);
      }

      // Parse URL for company name fallback
      const urlObj = new URL(url);
      const domainParts = urlObj.hostname.split('.');
      const possibleCompany = domainParts[domainParts.length - 2];
      const companyFromUrl = possibleCompany.charAt(0).toUpperCase() + possibleCompany.slice(1);

      // Set the parsed values with improved fallbacks
      jobData.company = metaCompany || companyFromUrl || 'Unknown Company';
      jobData.position = title || 'Unknown Position';
      jobData.location = genericLocation;
      jobData.description = genericDescription || '';
      jobData.salary = genericSalary || '';

      // Try to extract industry and company size from page content
      const pageText = $('body').text();
      const industryMatch = pageText.match(/industry:?\s*([^.!?\n]+)/i);
      const sizeMatch = pageText.match(/(?:company size|employees):?\s*([^.!?\n]+)/i);
      
      if (industryMatch) jobData.industry = industryMatch[1].trim();
      if (sizeMatch) jobData.companySize = sizeMatch[1].trim();
    }

    // Clean up any empty strings or whitespace
    Object.keys(jobData).forEach(key => {
      if (typeof jobData[key] === 'string') {
        jobData[key] = jobData[key].trim();
        if (!jobData[key]) {
          if (key === 'company') jobData[key] = 'Unknown Company';
          else if (key === 'position') jobData[key] = 'Unknown Position';
          else if (key === 'location') jobData[key] = 'Remote'; // Only default to Remote if we couldn't find a location
          else jobData[key] = '';
        }
      }
    });

    // After parsing the data for each site, normalize the values
    jobData.position = normalizeJobTitle(jobData.position);
    jobData.location = normalizeLocation(jobData.location);

    return jobData;
  } catch (error: unknown) {
    console.error('Error parsing job page:', error);
    throw new Error(`Oh no! Seems like this company page doesn't allow scraping 😔 You can try adding the job details manually.`);
  }
}

export async function POST(req: Request) {
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
          console.warn('[API Route] Attempted to set cookie in POST handler - skipped');
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        remove(_name: string, _options: Record<string, unknown>) {
          console.warn('[API Route] Attempted to remove cookie in POST handler - skipped');
        },
      },
    }
  );

  try {
    const { url } = await req.json();

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

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error(`[API /parse-job] Auth Error: ${authError?.message || 'No user session'}`);
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch and parse the job posting
    const jobData = await fetchAndParse(url);

    // Return the job data
    return NextResponse.json(jobData);
    
  } catch (error) {
    console.error('Error parsing job:', error);
    // Return appropriate error response based on fetchAndParse error message
    const errorMessage = (error instanceof Error) ? error.message : 'Failed to parse job information';
    const status = errorMessage.includes('Oh no!') ? 400 : 500; // Bad request if scraping blocked
    return NextResponse.json(
      { message: errorMessage },
      { status: status }
    );
  }
} 