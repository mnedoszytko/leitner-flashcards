import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export const NavigationBar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-xl text-gray-800">Leitner Flashcards</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <Link
                to="/learn"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/learn')
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <span>📚</span>
                <span>Learn</span>
              </Link>
              
              {/* Learn Dropdown */}
              <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link
                  to="/learn"
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  <div className="font-medium">Overview</div>
                  <div className="text-sm text-gray-500">All boxes & due cards</div>
                </Link>
                <Link
                  to="/learn/subjects"
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100"
                >
                  <div className="font-medium">By Subject</div>
                  <div className="text-sm text-gray-500">Organized by topics</div>
                </Link>
                <Link
                  to="/learn/review"
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-b-lg"
                >
                  <div className="font-medium">Review Session</div>
                  <div className="text-sm text-gray-500">Start studying</div>
                </Link>
              </div>
            </div>

            <div className="relative group">
              <Link
                to="/flashcards"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/flashcards')
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <span>🗂️</span>
                <span>Flashcards</span>
              </Link>
              
              {/* Flashcards Dropdown */}
              <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link
                  to="/flashcards/subjects"
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  <div className="font-medium">Manage Subjects</div>
                  <div className="text-sm text-gray-500">Create & organize</div>
                </Link>
                <Link
                  to="/import"
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-b-lg"
                >
                  <div className="font-medium">Import/Export</div>
                  <div className="text-sm text-gray-500">Backup & restore</div>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              <Link
                to="/learn"
                className={`block px-3 py-2 rounded-lg ${
                  isActive('/learn') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                📚 Learn
              </Link>
              <Link
                to="/learn/subjects"
                className="block pl-8 pr-3 py-2 text-gray-600 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                By Subject
              </Link>
              <Link
                to="/learn/review"
                className="block pl-8 pr-3 py-2 text-gray-600 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Review Session
              </Link>
              
              <Link
                to="/flashcards"
                className={`block px-3 py-2 rounded-lg ${
                  isActive('/flashcards') ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                🗂️ Flashcards
              </Link>
              <Link
                to="/flashcards/subjects"
                className="block pl-8 pr-3 py-2 text-gray-600 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Manage Subjects
              </Link>
              <Link
                to="/import"
                className="block pl-8 pr-3 py-2 text-gray-600 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Import/Export
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};