import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
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
      location: '',  // Don't default to Remote until we've tried all options
      description: '',
      salary: '',
      industry: '',
      companySize: ''
    };

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

      // Look for location in multiple places
      const locationSelectors = [
        '.location',
        '.job-location',
        '[data-field="location"]',
        'div:contains("Location:")',
        'span:contains("Location:")',
        'div:contains("This role is based in")'
      ];

      for (const selector of locationSelectors) {
        let location = '';
        if (selector.includes('This role is based in')) {
          const text = $(selector).text();
          const match = text.match(/This role is based in ([^,.]+)/);
          if (match) {
            location = match[1].trim();
          }
        } else if (selector.includes('Location:')) {
          location = $(selector).next().text().trim() || 
                    $(selector).parent().text().replace('Location:', '').trim();
        } else {
          location = $(selector).first().text().trim();
        }
        if (location) {
          jobData.location = location;
          break;
        }
      }

      // Try multiple description selectors
      const descriptionSelectors = [
        'div:contains("About the Team")',
        'div:contains("About the Role")',
        'div:contains("In this role, you will")',
        '.job-description',
        '#job-description',
        '[data-field="description"]',
        '.description'
      ];

      let description = '';
      for (const selector of descriptionSelectors) {
        const section = $(selector);
        if (section.length) {
          if (selector.includes('About the')) {
            // Get the section and next sections
            description = section.text() + '\n\n' + section.next().text();
          } else {
            description = section.text();
          }
          if (description) {
            jobData.description = description.trim();
            break;
          }
        }
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

      // Try multiple selectors for location, including schema.org data
      const locationSelectors = [
        '.location',
        '.job-location',
        '[data-field="location"]',
        '.posting-categories .sort-by-location',
        'div:contains("Location:")',
        'span:contains("Location:")',
        '[aria-label="Job location"]',
        'div:contains("Job location")',
        'meta[name="job-location"]'
      ];
      
      let location = schemaData?.jobLocation?.address?.addressLocality || 
                    schemaData?.jobLocation?.address?.addressRegion ||
                    schemaData?.jobLocation;
      
      if (!location) {
        for (const selector of locationSelectors) {
          if (selector.includes('Location:')) {
            location = $(selector).next().text().trim() || 
                      $(selector).parent().text().replace('Location:', '').trim();
          } else if (selector.startsWith('meta')) {
            location = $(selector).attr('content');
          } else {
            location = $(selector).first().text().trim();
          }
          if (location) break;
        }
      }

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
      
      let description = schemaData?.description || '';
      if (!description) {
        for (const selector of descriptionSelectors) {
          const element = $(selector).first();
          if (element.length) {
            // Remove any script tags or hidden elements
            element.find('script, style, .hidden, [style*="display: none"]').remove();
            description = element.text().trim();
            if (description) break;
          }
        }
      }

      // Try to find salary information from schema.org data or page content
      let salary = schemaData?.baseSalary?.value || 
                  schemaData?.estimatedSalary?.value || '';
      
      if (!salary) {
        const pageText = $('body').text();
        const salaryPatterns = [
          /\$[\d,]+ *- *\$[\d,]+/i,
          /\$[\d,]+ *per *year/i,
          /\$[\d,]+ *\+ */i,
          /salary range:? *\$[\d,]+ *- *\$[\d,]+/i,
          /compensation:? *\$[\d,]+ *- *\$[\d,]+/i
        ];

        for (const pattern of salaryPatterns) {
          const match = pageText.match(pattern);
          if (match) {
            salary = match[0];
            break;
          }
        }
      }

      // Parse URL for company name fallback
      const urlObj = new URL(url);
      const domainParts = urlObj.hostname.split('.');
      const possibleCompany = domainParts[domainParts.length - 2];
      const companyFromUrl = possibleCompany.charAt(0).toUpperCase() + possibleCompany.slice(1);

      // Set the parsed values with improved fallbacks
      jobData.company = metaCompany || companyFromUrl || 'Unknown Company';
      jobData.position = title || 'Unknown Position';
      jobData.location = location || 'Remote';
      jobData.description = description || '';
      jobData.salary = salary || '';

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

    // Fetch and parse the job posting
    const jobData = await fetchAndParse(url);

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