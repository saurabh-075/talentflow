// Default landing page
// TODO: add dashboard widgets here later
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import JobsPage from '../components/JobsPage';
import CandidatesPage from '../components/CandidatesPage';
import AssessmentsPage from '../components/AssessmentsPage';
import { initializeMockAPI } from '../lib/mockAPI';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export default function TalentFlowApp() {
  const [currentPage, setCurrentPage] = useState('jobs');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  useEffect(() => {
    // Initialize mock API and seed data
    initializeMockAPI();
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'jobs':
        return (
          <JobsPage 
            onJobSelect={(jobId) => {
              setSelectedJobId(jobId);
              setCurrentPage('job-detail');
            }}
          />
        );
      case 'job-detail':
        return (
          <JobsPage 
            selectedJobId={selectedJobId}
            onBack={() => setCurrentPage('jobs')}
            onJobSelect={(jobId) => setSelectedJobId(jobId)}
          />
        );
      case 'candidates':
        return (
          <CandidatesPage 
            onCandidateSelect={(candidateId) => {
              setSelectedCandidateId(candidateId);
              setCurrentPage('candidate-detail');
            }}
          />
        );
      case 'candidate-detail':
        return (
          <CandidatesPage 
            selectedCandidateId={selectedCandidateId}
            onBack={() => setCurrentPage('candidates')}
          />
        );
      case 'assessments':
        return (
          <AssessmentsPage 
            selectedJobId={selectedJobId}
            onJobSelect={(jobId) => setSelectedJobId(jobId)}
          />
        );
      default:
        return <JobsPage onJobSelect={(jobId) => setSelectedJobId(jobId)} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Layout 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
        >
          {renderCurrentPage()}
        </Layout>
        <Toaster position="top-right" />
      </div>
    </QueryClientProvider>
  );
}