// CandidatesPage component
// Displays candidate list with filters and drag-and-drop stages
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  Clock, 
  User, 
  Mail,
  MessageSquare,
  Plus
} from 'lucide-react';
import { mockAPI } from '../lib/mockAPI';

// Virtual list component for performance with 1000+ candidates
function VirtualizedCandidateList({ candidates, onCandidateSelect, searchTerm }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef(null);
  const itemHeight = 80;

  const filteredCandidates = useMemo(() => {
    if (!searchTerm) return candidates;
    return candidates.filter(candidate => 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [candidates, searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = containerRef.current.scrollTop;
      const containerHeight = containerRef.current.clientHeight;
      
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(
        start + Math.ceil(containerHeight / itemHeight) + 5,
        filteredCandidates.length
      );
      
      setVisibleRange({ start, end });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial calculation
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [filteredCandidates.length]);

  const visibleCandidates = filteredCandidates.slice(visibleRange.start, visibleRange.end);

  return (
    <div 
      ref={containerRef}
      className="h-96 overflow-auto border border-gray-200 rounded-lg"
    >
      <div style={{ height: filteredCandidates.length * itemHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${visibleRange.start * itemHeight}px)`,
            position: 'absolute',
            width: '100%'
          }}
        >
          {visibleCandidates.map((candidate, index) => (
            <div
              key={candidate.id}
              onClick={() => onCandidateSelect(candidate.id)}
              className="h-20 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                  <p className="text-sm text-gray-500">{candidate.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  candidate.stage === 'hired' ? 'bg-green-100 text-green-800' :
                  candidate.stage === 'rejected' ? 'bg-red-100 text-red-800' :
                  candidate.stage === 'offer' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {candidate.stage}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(candidate.appliedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Kanban board for moving candidates between stages
function CandidateKanban({ candidates, onStageChange }) {
  const [draggedCandidate, setDraggedCandidate] = useState(null);
  
  const stages = [
    { id: 'applied', name: 'Applied', color: 'bg-gray-100' },
    { id: 'screen', name: 'Screening', color: 'bg-blue-100' },
    { id: 'tech', name: 'Technical', color: 'bg-yellow-100' },
    { id: 'offer', name: 'Offer', color: 'bg-purple-100' },
    { id: 'hired', name: 'Hired', color: 'bg-green-100' },
    { id: 'rejected', name: 'Rejected', color: 'bg-red-100' },
  ];

  const candidatesByStage = useMemo(() => {
    const grouped = {};
    stages.forEach(stage => {
      grouped[stage.id] = candidates.filter(c => c.stage === stage.id);
    });
    return grouped;
  }, [candidates]);

  const handleDragStart = (e, candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    
    if (!draggedCandidate || draggedCandidate.stage === targetStage) {
      setDraggedCandidate(null);
      return;
    }
    
    onStageChange(draggedCandidate.id, targetStage);
    setDraggedCandidate(null);
  };

  return (
    <div className="grid grid-cols-6 gap-4 h-96">
      {stages.map(stage => (
        <div
          key={stage.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage.id)}
          className={`${stage.color} rounded-lg p-3 flex flex-col`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">{stage.name}</h3>
            <span className="text-xs text-gray-600 bg-white rounded-full px-2 py-1">
              {candidatesByStage[stage.id]?.length || 0}
            </span>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto">
            {candidatesByStage[stage.id]?.map(candidate => (
              <div
                key={candidate.id}
                draggable
                onDragStart={(e) => handleDragStart(e, candidate)}
                className={`bg-white p-2 rounded shadow-sm cursor-move text-sm ${
                  draggedCandidate?.id === candidate.id ? 'opacity-50' : ''
                }`}
              >
                <div className="font-medium text-gray-900 truncate">{candidate.name}</div>
                <div className="text-gray-500 text-xs truncate">{candidate.email}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Candidate timeline component
function CandidateTimeline({ candidateId }) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['candidate-timeline', candidateId],
    queryFn: () => mockAPI.getCandidateTimeline(candidateId),
    enabled: !!candidateId,
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading timeline...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
      <div className="space-y-3">
        {timeline?.map(entry => (
          <div key={entry.id} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Moved to {entry.stage}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
              {entry.note && (
                <p className="text-sm text-gray-700 mt-1">{entry.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Notes component with @mentions
function CandidateNotes({ candidate, onAddNote }) {
  const [newNote, setNewNote] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  
  // Mock team members for @mentions
  const teamMembers = [
    { id: 1, name: 'John Doe', email: 'john@company.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com' },
    { id: 3, name: 'Mike Johnson', email: 'mike@company.com' },
  ];

  const handleNoteChange = (e) => {
    const value = e.target.value;
    setNewNote(value);
    
    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const query = value.slice(lastAtIndex + 1);
      if (query.length > 0) {
        setMentionQuery(query);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member) => {
    const lastAtIndex = newNote.lastIndexOf('@');
    const beforeMention = newNote.slice(0, lastAtIndex);
    const afterMention = newNote.slice(lastAtIndex + mentionQuery.length + 1);
    setNewNote(`${beforeMention}@${member.name}${afterMention}`);
    setShowMentions(false);
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Notes</h3>
      
      <div className="relative">
        <textarea
          value={newNote}
          onChange={handleNoteChange}
          placeholder="Add a note... Use @ to mention team members"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
        
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => insertMention(member)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
              >
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">{member.name}</div>
                  <div className="text-xs text-gray-500">{member.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        <button
          onClick={() => {
            if (newNote.trim()) {
              onAddNote(newNote);
              setNewNote('');
            }
          }}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Add Note
        </button>
      </div>

      <div className="space-y-3">
        {candidate.notes?.map((note, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-900">{note.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(note.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CandidatesPage({ onCandidateSelect, selectedCandidateId, onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const pageSize = 50;

  // Fetch candidates with filters and pagination
  const { data: candidatesData, isLoading, error } = useQuery({
    queryKey: ['candidates', { search: searchTerm, stage: stageFilter, page: currentPage, pageSize }],
    queryFn: () => mockAPI.getCandidates({ 
      search: searchTerm, 
      stage: stageFilter, 
      page: currentPage, 
      pageSize 
    }),
  });

  // Get single candidate for detail view
  const { data: selectedCandidate } = useQuery({
    queryKey: ['candidate', selectedCandidateId],
    queryFn: async () => {
      if (!selectedCandidateId) return null;
      const candidates = await mockAPI.getCandidates({});
      return candidates.data.find(candidate => candidate.id === selectedCandidateId);
    },
    enabled: !!selectedCandidateId,
  });

  // Update candidate mutation
  const updateCandidateMutation = useMutation({
    mutationFn: ({ id, ...updates }) => mockAPI.updateCandidate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-timeline'] });
      toast.success('Candidate updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update candidate');
    },
  });

  const handleStageChange = useCallback((candidateId, newStage) => {
    updateCandidateMutation.mutate({
      id: candidateId,
      stage: newStage,
    });
  }, [updateCandidateMutation]);

  const handleAddNote = useCallback((content) => {
    if (!selectedCandidate) return;
    
    const newNote = {
      content,
      timestamp: new Date().toISOString(),
      author: 'Current User' // In a real app, this would be the logged-in user
    };
    
    updateCandidateMutation.mutate({
      id: selectedCandidate.id,
      notes: [...(selectedCandidate.notes || []), newNote],
    });
  }, [selectedCandidate, updateCandidateMutation]);

  // If showing candidate detail
  if (selectedCandidateId && selectedCandidate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Candidates
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</h1>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-gray-500">
                        <Mail className="w-4 h-4 mr-1" />
                        {selectedCandidate.email}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedCandidate.stage === 'hired' ? 'bg-green-100 text-green-800' :
                        selectedCandidate.stage === 'rejected' ? 'bg-red-100 text-red-800' :
                        selectedCandidate.stage === 'offer' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedCandidate.stage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Applied:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(selectedCandidate.appliedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Job ID:</span>
                  <span className="ml-2 text-gray-900">{selectedCandidate.jobId}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <CandidateNotes 
                candidate={selectedCandidate} 
                onAddNote={handleAddNote}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <CandidateTimeline candidateId={selectedCandidateId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'kanban' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Stages</option>
              <option value="applied">Applied</option>
              <option value="screen">Screening</option>
              <option value="tech">Technical</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading candidates...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">Error loading candidates: {error.message}</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <CandidateKanban 
            candidates={candidatesData?.data || []} 
            onStageChange={handleStageChange}
          />
        ) : (
          <>
            <VirtualizedCandidateList
              candidates={candidatesData?.data || []}
              onCandidateSelect={onCandidateSelect}
              searchTerm={searchTerm}
            />
            
            {/* Pagination */}
            {candidatesData && candidatesData.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, candidatesData.total)} of {candidatesData.total} candidates
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {currentPage} of {candidatesData.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(candidatesData.totalPages, prev + 1))}
                    disabled={currentPage === candidatesData.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}