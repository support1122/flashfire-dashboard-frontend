// Job scraping and processing utilities
export interface ScrapedJobData {
  title: string;
  company: string;
  description: string;
  url: string;
  location?: string;
  salary?: string;
  requirements?: string[];
}

// Mock job scraper - in production, this would use actual scraping APIs
export async function scrapeJobFromUrl(url: string): Promise<ScrapedJobData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Mock different job sites
  const mockJobs = [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc',
      description: `We are seeking a Senior Software Engineer to join our dynamic team. 

Key Responsibilities:
• Develop and maintain web applications using React, Node.js, and TypeScript
• Collaborate with cross-functional teams to deliver high-quality software solutions
• Participate in code reviews and maintain coding standards
• Work with cloud technologies including AWS and Docker
• Implement CI/CD pipelines and DevOps practices

Requirements:
• 5+ years of experience in software development
• Proficiency in JavaScript, TypeScript, React, and Node.js
• Experience with cloud platforms (AWS, Azure, or GCP)
• Strong understanding of database design and SQL
• Excellent problem-solving and communication skills
• Bachelor's degree in Computer Science or related field

Preferred Qualifications:
• Experience with microservices architecture
• Knowledge of containerization technologies (Docker, Kubernetes)
• Familiarity with agile development methodologies
• Experience with automated testing frameworks`,
      location: 'San Francisco, CA',
      salary: '$120,000 - $160,000',
    },
    {
      title: 'Frontend Developer',
      company: 'StartupXYZ',
      description: `Join our innovative startup as a Frontend Developer and help build the next generation of web applications.

What You'll Do:
• Build responsive and interactive user interfaces using React and Vue.js
• Collaborate with designers to implement pixel-perfect designs
• Optimize applications for maximum speed and scalability
• Work with RESTful APIs and GraphQL
• Participate in agile development processes

Requirements:
• 3+ years of frontend development experience
• Expert knowledge of HTML5, CSS3, and JavaScript
• Proficiency in React.js and/or Vue.js
• Experience with state management libraries (Redux, Vuex)
• Understanding of responsive design principles
• Familiarity with version control systems (Git)

Nice to Have:
• Experience with TypeScript
• Knowledge of CSS preprocessors (Sass, Less)
• Understanding of web accessibility standards
• Experience with testing frameworks (Jest, Cypress)`,
      location: 'Remote',
      salary: '$80,000 - $110,000',
    },
    {
      title: 'Full Stack Developer',
      company: 'Enterprise Solutions Ltd',
      description: `We're looking for a talented Full Stack Developer to join our enterprise development team.

Responsibilities:
• Design and develop full-stack web applications
• Work with both frontend and backend technologies
• Integrate with third-party APIs and services
• Ensure application security and performance
• Collaborate with product managers and designers

Technical Requirements:
• Strong experience with JavaScript/TypeScript
• Proficiency in React.js and Node.js
• Database experience (PostgreSQL, MongoDB)
• RESTful API development
• Cloud deployment experience (AWS, Azure)
• Understanding of DevOps practices

Qualifications:
• Bachelor's degree in Computer Science or equivalent
• 4+ years of full-stack development experience
• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Experience with agile methodologies`,
      location: 'New York, NY',
      salary: '$100,000 - $140,000',
    }
  ];
  
  // Randomly select a mock job or simulate scraping failure
  if (Math.random() < 0.1) {
    throw new Error('Failed to scrape job data - site may be blocking requests');
  }
  
  const mockJob = mockJobs[Math.floor(Math.random() * mockJobs.length)];
  
  return {
    ...mockJob,
    url,
    requirements: extractRequirements(mockJob.description),
  };
}

export async function scrapeMultipleJobs(urls: string[]): Promise<{
  successful: ScrapedJobData[];
  failed: { url: string; error: string }[];
}> {
  const successful: ScrapedJobData[] = [];
  const failed: { url: string; error: string }[] = [];
  
  // Process jobs in batches to avoid overwhelming the system
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map(async (url) => {
      try {
        const jobData = await scrapeJobFromUrl(url);
        successful.push(jobData);
      } catch (error) {
        failed.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    await Promise.all(promises);
    
    // Add delay between batches
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return { successful, failed };
}

function extractRequirements(description: string): string[] {
  const requirements: string[] = [];
  const lines = description.split('\n');
  
  let inRequirementsSection = false;
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toLowerCase().includes('requirement') || 
        trimmedLine.toLowerCase().includes('qualifications') ||
        trimmedLine.toLowerCase().includes('must have')) {
      inRequirementsSection = true;
      continue;
    }
    
    if (inRequirementsSection && trimmedLine.startsWith('•')) {
      requirements.push(trimmedLine.substring(1).trim());
    }
    
    if (inRequirementsSection && trimmedLine === '') {
      break;
    }
  }
  
  return requirements;
}

// Validate job URLs
export function validateJobUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const supportedDomains = [
      'linkedin.com',
      'indeed.com',
      'glassdoor.com',
      'monster.com',
      'ziprecruiter.com',
      'dice.com',
      'stackoverflow.com',
      'angel.co',
      'wellfound.com'
    ];
    
    return supportedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}