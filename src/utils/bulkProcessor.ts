import { Job, Resume, BaseResume, ApplicationProgress } from '../types';
import { scrapeMultipleJobs, ScrapedJobData } from './jobScraper';
import { optimizeResumeForJob } from './enhancedAI';

export class BulkJobProcessor {
  private onProgressUpdate: (progress: ApplicationProgress) => void;
  private isPaused: boolean = false;
  private shouldStop: boolean = false;

  constructor(onProgressUpdate: (progress: ApplicationProgress) => void) {
    this.onProgressUpdate = onProgressUpdate;
  }

  async processBulkJobs(
    jobUrls: string[],
    baseResume: BaseResume,
    optimizeResumes: boolean = true,
    autoApply: boolean = false
  ): Promise<{
    jobs: Job[];
    resumes: Resume[];
    errors: string[];
  }> {
    const jobs: Job[] = [];
    const resumes: Resume[] = [];
    const errors: string[] = [];

    const progress: ApplicationProgress = {
      total: jobUrls.length,
      processed: 0,
      applied: 0,
      pending: 0,
      errors: 0,
      status: 'processing'
    };

    this.onProgressUpdate(progress);

    try {
      // Step 1: Scrape job data
      const { successful: scrapedJobs, failed: failedScrapes } = await scrapeMultipleJobs(jobUrls);
      
      // Add scraping errors
      failedScrapes.forEach(failure => {
        errors.push(`Failed to scrape ${failure.url}: ${failure.error}`);
        progress.errors++;
      });

      // Step 2: Process each successfully scraped job
      for (const scrapedJob of scrapedJobs) {
        if (this.shouldStop) break;
        
        while (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
          // Create job entry
          const job: Job = {
            id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: scrapedJob.title,
            company: scrapedJob.company,
            description: scrapedJob.description,
            jobUrl: scrapedJob.url,
            dateApplied: new Date().toISOString().split('T')[0],
            status: autoApply ? 'pending' : 'saved',
            applicationMethod: autoApply ? 'auto' : 'manual',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          jobs.push(job);

          // Step 3: Optimize resume if requested
          if (optimizeResumes) {
            const optimizedResume = optimizeResumeForJob(baseResume, job, false);
            resumes.push(optimizedResume);
            job.resumeId = optimizedResume.id;
            job.matchScore = optimizedResume.matchScore;
          }

          // Step 4: Auto-apply if requested (mock implementation)
          if (autoApply) {
            const applicationResult = await this.attemptAutoApplication(job, optimizedResume);
            job.status = applicationResult.success ? 'applied' : 'error';
            job.errorMessage = applicationResult.error;
            
            if (applicationResult.success) {
              progress.applied++;
            } else {
              progress.errors++;
              errors.push(`Failed to apply to ${job.title} at ${job.company}: ${applicationResult.error}`);
            }
          }

          progress.processed++;
          this.onProgressUpdate({ ...progress });

          // Add delay to avoid overwhelming servers
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          progress.errors++;
          errors.push(`Error processing job ${scrapedJob.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          this.onProgressUpdate({ ...progress });
        }
      }

      progress.status = 'completed';
      this.onProgressUpdate(progress);

    } catch (error) {
      progress.status = 'completed';
      errors.push(`Bulk processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.onProgressUpdate(progress);
    }

    return { jobs, resumes, errors };
  }

  private async attemptAutoApplication(job: Job, resume?: Resume): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Mock auto-application logic
    // In production, this would integrate with job site APIs or use browser automation
    
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simulate different outcomes
    const outcomes = [
      { success: true },
      { success: false, error: 'Application form too complex for automation' },
      { success: false, error: 'Site requires manual verification' },
      { success: false, error: 'Job posting has expired' },
      { success: false, error: 'Rate limited by job site' },
    ];
    
    const weights = [0.7, 0.1, 0.1, 0.05, 0.05]; // 70% success rate
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < outcomes.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return outcomes[i];
      }
    }
    
    return outcomes[0]; // Fallback
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.shouldStop = true;
    this.isPaused = false;
  }
}