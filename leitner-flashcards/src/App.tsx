import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationBar } from './components/Navigation/NavigationBar';
import { LearnOverview } from './components/Learn/LearnOverview';
import { SubjectLearn } from './components/Learn/SubjectLearn';
import { ReviewSession } from './components/ReviewSession/ReviewSession';
import { ReviewBySubject } from './components/Learn/ReviewBySubject';
import { BoxDetails } from './components/Learn/BoxDetails';
import { SubjectManager } from './components/Flashcards/SubjectManager';
import { CardManager } from './components/Flashcards/CardManager';
import { ImportExport } from './components/ImportExport/ImportExport';
import { useEffect, useState } from 'react';
import { db } from './services/database';
import type { Flashcard } from './types/flashcard.types';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename="/leitner-flashcards">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <NavigationBar />
          <main>
            <Routes>
              {/* Learn Routes */}
              <Route path="/" element={<Navigate to="/learn" replace />} />
              <Route path="/learn" element={<LearnOverview />} />
              <Route path="/learn/subjects" element={<ReviewBySubject />} />
              <Route path="/learn/subject/:subjectId" element={<SubjectLearn />} />
              <Route path="/learn/box/:boxId" element={<BoxDetails />} />
              <Route path="/learn/review/:subjectId?" element={<ReviewPage />} />
              
              {/* Flashcards Management Routes */}
              <Route path="/flashcards" element={<Navigate to="/flashcards/subjects" replace />} />
              <Route path="/flashcards/subjects" element={<SubjectManager />} />
              <Route path="/flashcards/subject/:subjectId" element={<CardManager />} />
              
              {/* Utility Routes */}
              <Route path="/import" element={<ImportExport />} />
              <Route path="/export" element={<ImportExport />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

// Review Page Component (temporary - will be replaced)
function ReviewPage() {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDueCards();
  }, []);

  const loadDueCards = async () => {
    try {
      const cards = await db.getCardsDueForReview();
      setDueCards(cards);
    } catch (error) {
      console.error('Failed to load due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Cards Due</h2>
          <p className="text-gray-600 mb-6">Great job! You've reviewed all your cards for today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <ReviewSession
        cards={dueCards}
        deckId="all"
        onComplete={() => {
          window.location.href = '/learn';
        }}
      />
    </div>
  );
}

export default App;