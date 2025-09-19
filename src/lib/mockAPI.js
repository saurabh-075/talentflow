// Mock API using localStorage for persistence
let isInitialized = false;

// Utility functions for localStorage persistence
const getFromStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// Generate seed data
const generateJobs = () => {
  const statuses = ['active', 'archived'];
  const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales'];
  const levels = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];
  
  return Array.from({ length: 25 }, (_, i) => ({
    id: `job-${i + 1}`,
    title: `${levels[i % levels.length]} ${departments[i % departments.length]} Role ${i + 1}`,
    slug: `${levels[i % levels.length]}-${departments[i % departments.length]}-role-${i + 1}`.toLowerCase().replace(/\s+/g, '-'),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    tags: [departments[i % departments.length], levels[i % levels.length]],
    order: i + 1,
    description: `We are looking for a talented ${levels[i % levels.length]} ${departments[i % departments.length]} professional to join our team.`,
    requirements: [
      `${3 + (i % 5)}+ years of experience`,
      'Strong communication skills',
      'Team player',
      'Problem-solving mindset'
    ],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const generateCandidates = () => {
  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
  const firstNames = ['John', 'Jane', 'Alex', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa', 'Chris', 'Anna'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  return Array.from({ length: 1000 }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const jobId = `job-${Math.floor(Math.random() * 25) + 1}`;
    
    return {
      id: `candidate-${i + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      stage: stages[Math.floor(Math.random() * stages.length)],
      jobId,
      appliedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      notes: [],
      timeline: [
        {
          id: `timeline-${i}-1`,
          stage: 'applied',
          timestamp: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          note: 'Application submitted'
        }
      ]
    };
  });
};

const generateAssessments = () => {
  const questionTypes = ['single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric', 'file-upload'];
  
  return Array.from({ length: 3 }, (_, i) => ({
    id: `assessment-${i + 1}`,
    jobId: `job-${i + 1}`,
    title: `Assessment for Job ${i + 1}`,
    sections: [
      {
        id: `section-${i}-1`,
        title: 'Technical Skills',
        questions: Array.from({ length: 5 }, (_, j) => ({
          id: `question-${i}-${j}`,
          type: questionTypes[j % questionTypes.length],
          title: `Technical Question ${j + 1}`,
          required: j < 3,
          options: questionTypes[j % questionTypes.length].includes('choice') 
            ? ['Option A', 'Option B', 'Option C', 'Option D'] 
            : undefined,
          validation: questionTypes[j % questionTypes.length] === 'numeric' 
            ? { min: 0, max: 100 } 
            : undefined
        }))
      },
      {
        id: `section-${i}-2`,
        title: 'Experience',
        questions: Array.from({ length: 5 }, (_, j) => ({
          id: `question-${i}-exp-${j}`,
          type: questionTypes[(j + 2) % questionTypes.length],
          title: `Experience Question ${j + 1}`,
          required: j < 2,
          options: questionTypes[(j + 2) % questionTypes.length].includes('choice') 
            ? ['Yes', 'No', 'Somewhat'] 
            : undefined
        }))
      }
    ]
  }));
};

// Mock API functions with artificial latency and error simulation
const delay = (ms = Math.random() * 1000 + 200) => new Promise(resolve => setTimeout(resolve, ms));

const shouldError = () => Math.random() < 0.08; // 8% error rate

export const mockAPI = {
  // Jobs API
  async getJobs(params = {}) {
    await delay();
    if (shouldError()) throw new Error('Failed to fetch jobs');
    
    let jobs = getFromStorage('talentflow-jobs', []);
    const { search, status, page = 1, pageSize = 10, sort = 'order' } = params;
    
    // Filter
    if (search) {
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }
    
    // Sort
    jobs.sort((a, b) => {
      if (sort === 'order') return a.order - b.order;
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });
    
    // Paginate
    const start = (page - 1) * pageSize;
    const paginatedJobs = jobs.slice(start, start + pageSize);
    
    return {
      data: paginatedJobs,
      total: jobs.length,
      page,
      pageSize,
      totalPages: Math.ceil(jobs.length / pageSize)
    };
  },

  async createJob(jobData) {
    await delay();
    if (shouldError()) throw new Error('Failed to create job');
    
    const jobs = getFromStorage('talentflow-jobs', []);
    const newJob = {
      id: `job-${Date.now()}`,
      ...jobData,
      order: Math.max(...jobs.map(j => j.order), 0) + 1,
      createdAt: new Date().toISOString()
    };
    
    jobs.push(newJob);
    saveToStorage('talentflow-jobs', jobs);
    return newJob;
  },

  async updateJob(id, updates) {
    await delay();
    if (shouldError()) throw new Error('Failed to update job');
    
    const jobs = getFromStorage('talentflow-jobs', []);
    const index = jobs.findIndex(job => job.id === id);
    
    if (index === -1) throw new Error('Job not found');
    
    jobs[index] = { ...jobs[index], ...updates };
    saveToStorage('talentflow-jobs', jobs);
    return jobs[index];
  },

  async reorderJobs(fromOrder, toOrder) {
    await delay();
    if (shouldError()) throw new Error('Failed to reorder jobs');
    
    const jobs = getFromStorage('talentflow-jobs', []);
    
    // Reorder logic
    jobs.forEach(job => {
      if (job.order === fromOrder) {
        job.order = toOrder;
      } else if (fromOrder < toOrder && job.order > fromOrder && job.order <= toOrder) {
        job.order -= 1;
      } else if (fromOrder > toOrder && job.order >= toOrder && job.order < fromOrder) {
        job.order += 1;
      }
    });
    
    saveToStorage('talentflow-jobs', jobs);
    return jobs;
  },

  // Candidates API
  async getCandidates(params = {}) {
    await delay();
    if (shouldError()) throw new Error('Failed to fetch candidates');
    
    let candidates = getFromStorage('talentflow-candidates', []);
    const { search, stage, page = 1, pageSize = 50 } = params;
    
    // Filter
    if (search) {
      candidates = candidates.filter(candidate => 
        candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (stage) {
      candidates = candidates.filter(candidate => candidate.stage === stage);
    }
    
    // Sort by application date
    candidates.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    
    // Paginate
    const start = (page - 1) * pageSize;
    const paginatedCandidates = candidates.slice(start, start + pageSize);
    
    return {
      data: paginatedCandidates,
      total: candidates.length,
      page,
      pageSize,
      totalPages: Math.ceil(candidates.length / pageSize)
    };
  },

  async updateCandidate(id, updates) {
    await delay();
    if (shouldError()) throw new Error('Failed to update candidate');
    
    const candidates = getFromStorage('talentflow-candidates', []);
    const index = candidates.findIndex(candidate => candidate.id === id);
    
    if (index === -1) throw new Error('Candidate not found');
    
    const oldStage = candidates[index].stage;
    candidates[index] = { ...candidates[index], ...updates };
    
    // Add timeline entry if stage changed
    if (updates.stage && updates.stage !== oldStage) {
      candidates[index].timeline.push({
        id: `timeline-${Date.now()}`,
        stage: updates.stage,
        timestamp: new Date().toISOString(),
        note: `Moved to ${updates.stage}`
      });
    }
    
    saveToStorage('talentflow-candidates', candidates);
    return candidates[index];
  },

  async getCandidateTimeline(id) {
    await delay();
    if (shouldError()) throw new Error('Failed to fetch candidate timeline');
    
    const candidates = getFromStorage('talentflow-candidates', []);
    const candidate = candidates.find(c => c.id === id);
    
    if (!candidate) throw new Error('Candidate not found');
    
    return candidate.timeline || [];
  },

  // Assessments API
  async getAssessment(jobId) {
    await delay();
    if (shouldError()) throw new Error('Failed to fetch assessment');
    
    const assessments = getFromStorage('talentflow-assessments', []);
    return assessments.find(assessment => assessment.jobId === jobId) || null;
  },

  async saveAssessment(jobId, assessmentData) {
    await delay();
    if (shouldError()) throw new Error('Failed to save assessment');
    
    const assessments = getFromStorage('talentflow-assessments', []);
    const index = assessments.findIndex(assessment => assessment.jobId === jobId);
    
    const assessment = {
      id: `assessment-${jobId}`,
      jobId,
      ...assessmentData,
      updatedAt: new Date().toISOString()
    };
    
    if (index === -1) {
      assessments.push(assessment);
    } else {
      assessments[index] = assessment;
    }
    
    saveToStorage('talentflow-assessments', assessments);
    return assessment;
  },

  async submitAssessmentResponse(jobId, responses) {
    await delay();
    if (shouldError()) throw new Error('Failed to submit assessment response');
    
    const responseData = {
      jobId,
      responses,
      submittedAt: new Date().toISOString()
    };
    
    const responses_key = `talentflow-assessment-responses-${jobId}`;
    const existingResponses = getFromStorage(responses_key, []);
    existingResponses.push(responseData);
    saveToStorage(responses_key, existingResponses);
    
    return responseData;
  }
};

export const initializeMockAPI = () => {
  if (isInitialized) return;
  
  // Initialize data if not exists
  if (!localStorage.getItem('talentflow-jobs')) {
    saveToStorage('talentflow-jobs', generateJobs());
  }
  
  if (!localStorage.getItem('talentflow-candidates')) {
    saveToStorage('talentflow-candidates', generateCandidates());
  }
  
  if (!localStorage.getItem('talentflow-assessments')) {
    saveToStorage('talentflow-assessments', generateAssessments());
  }
  
  isInitialized = true;
};