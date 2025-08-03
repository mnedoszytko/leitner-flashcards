import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Subject, Flashcard, Deck } from '../../types/flashcard.types';
import { db } from '../../services/database';
import { LeitnerAlgorithm } from '../../services/leitnerAlgorithm';
import { motion } from 'framer-motion';
import { ReviewSession } from '../ReviewSession/ReviewSession';

export const SubjectLearn: React.FC = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (subjectId) {
      loadSubjectData();
    }
  }, [subjectId]);

  const loadSubjectData = async () => {
    try {
      const loadedSubject = await db.subjects.get(subjectId!);
      setSubject(loadedSubject || null);
      
      if (loadedSubject) {
        // Get all decks for this subject
        const decks = await db.decks.where('subjectId').equals(subjectId!).toArray();
        const deckIds = decks.map(d => d.id);
        
        if (deckIds.length > 0) {
          // Get all cards from these decks
          const allCards = await db.cards.where('deckId').anyOf(deckIds).toArray();
          setCards(allCards);
          
          // Get due cards
          const due = allCards.filter(card => 
            !card.nextReview || card.nextReview <= new Date().toISOString()
          );
          setDueCards(due);
          
          // Calculate statistics
          const subjectStats = LeitnerAlgorithm.getStatistics(allCards);
          setStats(subjectStats);
        }
      }
    } catch (error) {
      console.error('Failed to load subject data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewComplete = async () => {
    setShowReview(false);
    await loadSubjectData(); // Reload data after review
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Subject not found</h2>
          <Link to="/learn/subjects" className="text-blue-600 hover:text-blue-700">
            Back to subjects
          </Link>
        </div>
      </div>
    );
  }

  if (showReview && dueCards.length > 0) {
    return (
      <ReviewSession
        cards={dueCards}
        deckId={`subject-${subjectId}`}
        onComplete={handleReviewComplete}
        subjectName={subject.name}
        subjectIcon={subject.icon}
      />
    );
  }

  const boxes = [
    { id: 1, name: "Box 1 - Daily", color: "border-red-300", icon: "🔴", bgGradient: "bg-gradient-to-br from-red-50 to-red-100" },
    { id: 2, name: "Box 2 - Every 2-3 Days", color: "border-yellow-300", icon: "🟡", bgGradient: "bg-gradient-to-br from-yellow-50 to-yellow-100" },
    { id: 3, name: "Box 3 - Weekly", color: "border-blue-300", icon: "🔵", bgGradient: "bg-gradient-to-br from-blue-50 to-blue-100" },
    { id: 4, name: "Box 4 - Mastered", color: "border-green-300", icon: "🟢", bgGradient: "bg-gradient-to-br from-green-50 to-green-100" }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/learn/subjects" className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-2 mb-4">
            ← Back to subjects
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span style={{ color: subject.color }} className="text-4xl">{subject.icon || '📚'}</span>
            {subject.name}
          </h1>
          {subject.description && (
            <p className="text-gray-600 mt-2">{subject.description}</p>
          )}
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: stats.total || 0, label: 'Total Cards', color: 'text-blue-600', delay: 0 },
            { value: dueCards.length, label: 'Due Now', color: 'text-orange-600', delay: 0.1 },
            { value: stats.mastered || 0, label: 'Mastered', color: 'text-green-600', delay: 0.2 },
            { value: `${stats.averageCorrectRate || 0}%`, label: 'Success Rate', color: 'text-purple-600', delay: 0.3 }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: stat.delay, duration: 0.4 }}
              className="bg-white rounded-lg shadow p-4 text-center"
            >
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Box Distribution */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-4">Card Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {boxes.map(box => {
              const cardsInBox = stats.byBox?.[box.id] || 0;
              const percentage = stats.total > 0 ? Math.round((cardsInBox / stats.total) * 100) : 0;
              
              return (
                <motion.div
                  key={box.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + box.id * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-lg border-2 ${box.color} ${box.bgGradient} shadow-md`}
                >
                  <div className="text-2xl mb-1">{box.icon}</div>
                  <div className="font-semibold text-sm">{box.name}</div>
                  <div className="text-xl font-bold mt-1">{cardsInBox}</div>
                  <div className="text-xs text-gray-600">({percentage}%)</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {dueCards.length > 0 ? (
            <motion.button
              onClick={() => setShowReview(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="text-4xl mb-2"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                📚
              </motion.div>
              <h3 className="text-xl font-semibold">Start Review</h3>
              <p className="text-blue-100 mt-1">{dueCards.length} cards due for review</p>
            </motion.button>
          ) : (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-semibold">All Done!</h3>
              <p className="text-green-100 mt-1">No cards due in this subject</p>
            </div>
          )}
          
          <motion.button
            onClick={() => navigate(`/flashcards/subject/${subjectId}`)}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-4xl mb-2">✏️</div>
            <h3 className="text-xl font-semibold text-gray-800">Manage Cards</h3>
            <p className="text-gray-600 mt-1">Add, edit, or import cards</p>
          </motion.button>
        </motion.div>

        {/* Recent Activity */}
        {stats.total === 0 && (
          <motion.div 
            className="mt-8 text-center py-12 bg-gray-50 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Cards Yet</h3>
            <p className="text-gray-600 mb-6">Start by adding some cards to this subject</p>
            <button
              onClick={() => navigate(`/flashcards/subject/${subjectId}`)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <span>➕</span> Add Cards
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};