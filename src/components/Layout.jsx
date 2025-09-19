// Shared layout for pages
// Reused across Jobs, Candidates, and Assessments
import { Briefcase, Users, FileText } from 'lucide-react';

export default function Layout({ children, currentPage, onNavigate }) {
  const navigation = [
    { id: 'jobs', name: 'Jobs', icon: Briefcase },
    { id: 'candidates', name: 'Candidates', icon: Users },
    { id: 'assessments', name: 'Assessments', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TalentFlow</h1>
            </div>
            
            {/* Navigation */}
            <nav className="flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id || 
                  (item.id === 'jobs' && currentPage === 'job-detail') ||
                  (item.id === 'candidates' && currentPage === 'candidate-detail');
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}