import { useState } from 'react';
import type { Flashcard, StudySession } from '../../types/flashcard.types';
import { LeitnerAlgorithm } from '../../services/leitnerAlgorithm';
import { db } from '../../services/database';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewSessionProps {
  cards: Flashcard[];
  deckId: string;
  onComplete: (session: StudySession) => void;
  subjectName?: string;
  subjectIcon?: string;
}

export const ReviewSession: React.FC<ReviewSessionProps> = ({ cards, deckId, onComplete, subjectName, subjectIcon }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const sessionCards = cards;
  const [session, setSession] = useState<StudySession>({
    id: crypto.randomUUID(),
    deckId,
    startTime: new Date().toISOString(),
    cardsReviewed: 0,
    correctAnswers: 0,
    boxProgress: {
      1: { promoted: 0, demoted: 0 },
      2: { promoted: 0, demoted: 0 },
      3: { promoted: 0, demoted: 0 },
      4: { promoted: 0, demoted: 0 }
    }
  });

  const currentCard = sessionCards[currentIndex];

  const handleAnswer = async (correct: boolean) => {
    const card = sessionCards[currentIndex];
    const oldBox = card.box;
    const updatedCard = LeitnerAlgorithm.processReview(card, correct);
    const newBox = updatedCard.box;

    // Update card in database
    await db.updateCard(card.id, updatedCard);

    // Update session statistics
    const updatedSession = { ...session };
    updatedSession.cardsReviewed++;
    if (correct) {
      updatedSession.correctAnswers++;
    }

    // Track box progress
    if (oldBox !== newBox) {
      if (newBox > oldBox) {
        updatedSession.boxProgress[oldBox].promoted++;
      } else {
        updatedSession.boxProgress[oldBox].demoted++;
      }
    }

    setSession(updatedSession);
    setShowAnswer(false);
    setShowHint(false);

    // Move to next card or complete session
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      const finalSession = {
        ...updatedSession,
        endTime: new Date().toISOString()
      };
      await db.recordSession(finalSession);
      onComplete(finalSession);
    }
  };

  const nextCard = () => {
    setShowAnswer(false);
    setShowHint(false);
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevCard = () => {
    setShowAnswer(false);
    setShowHint(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No cards to review</h2>
            <p className="text-gray-600 mb-6">Check back later for scheduled reviews.</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-2">
              ← Back to Dashboard
            </Link>
            {subjectName && (
              <motion.div 
                className="flex items-center gap-2 text-gray-700 bg-white px-4 py-2 rounded-lg shadow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className="text-xl">{subjectIcon || '📚'}</span>
                <span className="font-medium">Reviewing: {subjectName}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              Card {currentIndex + 1} of {sessionCards.length} • Box {currentCard.box}
            </span>
            <span className="text-sm text-gray-600">
              {session.correctAnswers} correct / {session.cardsReviewed} reviewed
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Card */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-h-[300px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`card-${currentIndex}`}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-semibold text-gray-800 text-center mb-6"
              >
                {currentCard.front}
              </motion.div>
            </AnimatePresence>
            
            <AnimatePresence>
              {showAnswer && (
                <motion.div 
                  initial={{ rotateX: -90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: 90, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg"
                >
                  <div className="text-lg text-gray-700 text-center">
                    {currentCard.back}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {currentCard.hints && currentCard.hints.length > 0 && !showAnswer && (
              <motion.div className="text-center mt-4">
                {!showHint ? (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowHint(true)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    💡 Show Hint
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-500 italic">
                      Hint: {currentCard.hints[0]}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prevCard}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>

            <AnimatePresence mode="wait">
              {!showAnswer ? (
                <motion.button
                  key="show-answer"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowAnswer(true)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Show Answer
                </motion.button>
              ) : (
                <motion.div 
                  key="answer-buttons"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(false)}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <span>✗</span> Incorrect
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(true)}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <span>✓</span> Correct
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={nextCard}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              disabled={currentIndex === sessionCards.length - 1}
            >
              Next →
            </button>
          </div>
        </motion.div>

        {/* Session Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: session.cardsReviewed, label: 'Reviewed', color: 'text-blue-600', delay: 0 },
            { value: session.correctAnswers, label: 'Correct', color: 'text-green-600', delay: 0.1 },
            { value: session.cardsReviewed > 0 ? `${Math.round((session.correctAnswers / session.cardsReviewed) * 100)}%` : '0%', label: 'Accuracy', color: 'text-orange-600', delay: 0.2 },
            { value: sessionCards.length - currentIndex - 1, label: 'Remaining', color: 'text-purple-600', delay: 0.3 }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: stat.delay, duration: 0.3 }}
              className="bg-white rounded-lg shadow p-4 text-center"
            >
              <motion.div 
                className={`text-2xl font-bold ${stat.color}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: stat.delay + 0.2, type: "spring", stiffness: 200 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};