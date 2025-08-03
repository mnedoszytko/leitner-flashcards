import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Subject, Flashcard } from '../../types/flashcard.types';
import { db } from '../../services/database';
import { motion } from 'framer-motion';
import { ReviewSession } from '../ReviewSession/ReviewSession';

interface SubjectBoxStats {
  subject: Subject;
  cardCount: number;
  dueCount: number;
}

export const BoxDetails: React.FC = () => {
  const { boxId } = useParams();
  const navigate = useNavigate();
  const [subjectStats, setSubjectStats] = useState<SubjectBoxStats[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [reviewSubject, setReviewSubject] = useState<Subject | null>(null);

  const boxNumber = parseInt(boxId || '1');
  const boxes = [
    { id: 1, name: "Box 1 - Daily", color: "border-red-300", icon: "🔴", bgGradient: "bg-gradient-to-br from-red-50 to-red-100", textColor: "text-red-800" },
    { id: 2, name: "Box 2 - Every 2-3 Days", color: "border-yellow-300", icon: "🟡", bgGradient: "bg-gradient-to-br from-yellow-50 to-yellow-100", textColor: "text-yellow-800" },
    { id: 3, name: "Box 3 - Weekly", color: "border-blue-300", icon: "🔵", bgGradient: "bg-gradient-to-br from-blue-50 to-blue-100", textColor: "text-blue-800" },
    { id: 4, name: "Box 4 - Mastered", color: "border-green-300", icon: "🟢", bgGradient: "bg-gradient-to-br from-green-50 to-green-100", textColor: "text-green-800" }
  ];
  const currentBox = boxes.find(b => b.id === boxNumber) || boxes[0];

  useEffect(() => {
    loadBoxData();
  }, [boxId]);

  const loadBoxData = async () => {
    try {
      const subjects = await db.subjects.toArray();
      const stats: SubjectBoxStats[] = [];
      let totalInBox = 0;
      let totalDueInBox = 0;

      for (const subject of subjects) {
        const decks = await db.decks.where('subjectId').equals(subject.id).toArray();
        const deckIds = decks.map(d => d.id);
        
        if (deckIds.length > 0) {
          // Get cards in this box for this subject
          const cardsInBox = await db.cards
            .where('deckId')
            .anyOf(deckIds)
            .and(card => card.box === boxNumber)
            .toArray();
          
          if (cardsInBox.length > 0) {
            const dueCards = cardsInBox.filter(card => 
              !card.nextReview || card.nextReview <= new Date().toISOString()
            );
            
            stats.push({
              subject,
              cardCount: cardsInBox.length,
              dueCount: dueCards.length
            });
            
            totalInBox += cardsInBox.length;
            totalDueInBox += dueCards.length;
          }
        }
      }

      setSubjectStats(stats);
      setTotalCards(totalInBox);
      setTotalDue(totalDueInBox);
    } catch (error) {
      console.error('Failed to load box data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAll = async () => {
    const allDueCards: Flashcard[] = [];
    
    for (const stat of subjectStats) {
      if (stat.dueCount > 0) {
        const decks = await db.decks.where('subjectId').equals(stat.subject.id).toArray();
        const deckIds = decks.map(d => d.id);
        
        const dueCards = await db.cards
          .where('deckId')
          .anyOf(deckIds)
          .and(card => card.box === boxNumber && (!card.nextReview || card.nextReview <= new Date().toISOString()))
          .toArray();
        
        allDueCards.push(...dueCards);
      }
    }
    
    setReviewCards(allDueCards);
    setReviewSubject(null);
    setShowReview(true);
  };

  const handleReviewSubject = async (subject: Subject) => {
    const decks = await db.decks.where('subjectId').equals(subject.id).toArray();
    const deckIds = decks.map(d => d.id);
    
    const dueCards = await db.cards
      .where('deckId')
      .anyOf(deckIds)
      .and(card => card.box === boxNumber && (!card.nextReview || card.nextReview <= new Date().toISOString()))
      .toArray();
    
    setReviewCards(dueCards);
    setReviewSubject(subject);
    setShowReview(true);
  };

  const handleReviewComplete = async () => {
    setShowReview(false);
    setReviewCards([]);
    setReviewSubject(null);
    await loadBoxData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (showReview && reviewCards.length > 0) {
    return (
      <ReviewSession
        cards={reviewCards}
        deckId={reviewSubject ? `subject-${reviewSubject.id}` : `box-${boxNumber}`}
        onComplete={handleReviewComplete}
        subjectName={reviewSubject?.name}
        subjectIcon={reviewSubject?.icon}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/learn" className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-2 mb-4">
            ← Back to overview
          </Link>
          <div className="flex items-center gap-4">
            <motion.span 
              className="text-5xl"
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring" }}
            >
              {currentBox.icon}
            </motion.span>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{currentBox.name}</h1>
              <p className="text-gray-600 mt-1">
                {totalCards} cards • {totalDue} due for review
              </p>
            </div>
          </div>
        </motion.div>

        {/* Review All Button */}
        {totalDue > 0 && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={handleReviewAll}
              className={`w-full ${currentBox.bgGradient} ${currentBox.color} border-2 rounded-lg p-6 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🎯</div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold">Review All Cards in {currentBox.name}</h3>
                    <p className={`${currentBox.textColor} opacity-80 mt-1`}>
                      Review {totalDue} due cards from all subjects
                    </p>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${currentBox.textColor}`}>
                  {totalDue}
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* Subject Breakdown */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Subjects in this box</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectStats.map((stat, index) => (
              <motion.div
                key={stat.subject.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" style={{ color: stat.subject.color }}>
                      {stat.subject.icon || '📚'}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {stat.subject.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stat.cardCount} cards in this box
                      </p>
                    </div>
                  </div>
                  {stat.dueCount > 0 && (
                    <motion.span 
                      className={`${currentBox.bgGradient} ${currentBox.textColor} px-3 py-1 rounded-full text-sm font-medium`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                    >
                      {stat.dueCount} due
                    </motion.span>
                  )}
                </div>
                
                <div className="flex gap-3">
                  {stat.dueCount > 0 && (
                    <motion.button
                      onClick={() => handleReviewSubject(stat.subject)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Review {stat.dueCount} cards
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => navigate(`/learn/subject/${stat.subject.id}`)}
                    className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Details
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {subjectStats.length === 0 && (
          <motion.div 
            className="text-center py-12 bg-gray-50 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No cards in this box</h3>
            <p className="text-gray-600">Cards will appear here as you review them</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};