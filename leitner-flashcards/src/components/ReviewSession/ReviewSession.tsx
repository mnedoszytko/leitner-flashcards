import { useState } from 'react';
import type { Flashcard, StudySession } from '../../types/flashcard.types';
import { LeitnerAlgorithm } from '../../services/leitnerAlgorithm';
import { db } from '../../services/database';
import { Link } from 'react-router-dom';

interface ReviewSessionProps {
  cards: Flashcard[];
  deckId: string;
  onComplete: (session: StudySession) => void;
}

export const ReviewSession: React.FC<ReviewSessionProps> = ({ cards, deckId, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
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
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevCard = () => {
    setShowAnswer(false);
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
          <Link to="/" className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-2">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
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
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="min-h-[300px] flex flex-col justify-center">
            <div className="text-xl font-semibold text-gray-800 text-center mb-6">
              {currentCard.front}
            </div>
            
            {showAnswer && (
              <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <div className="text-lg text-gray-700 text-center">
                  {currentCard.back}
                </div>
              </div>
            )}

            {currentCard.hints && currentCard.hints.length > 0 && !showAnswer && (
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500 italic">
                  Hint: {currentCard.hints[0]}
                </p>
              </div>
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

            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Show Answer
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => handleAnswer(false)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <span>✗</span> Incorrect
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <span>✓</span> Correct
                </button>
              </div>
            )}

            <button
              onClick={nextCard}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              disabled={currentIndex === sessionCards.length - 1}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{session.cardsReviewed}</div>
            <div className="text-sm text-gray-600">Reviewed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{session.correctAnswers}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {session.cardsReviewed > 0 
                ? Math.round((session.correctAnswers / session.cardsReviewed) * 100) 
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{sessionCards.length - currentIndex - 1}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};