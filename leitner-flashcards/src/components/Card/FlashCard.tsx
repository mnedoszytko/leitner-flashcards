import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Flashcard } from '../../types/flashcard.types';

interface FlashCardProps {
  card: Flashcard;
  onAnswer: (correct: boolean) => void;
  showHint?: boolean;
}

export const FlashCard: React.FC<FlashCardProps> = ({ card, onAnswer, showHint = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHintState, setShowHintState] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (correct: boolean) => {
    onAnswer(correct);
    setIsFlipped(false);
    setShowHintState(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative h-64 perspective-1000">
        <motion.div
          className="absolute inset-0 w-full h-full cursor-pointer preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          onClick={handleFlip}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden">
            <div className="h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 flex flex-col justify-between">
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white text-xl text-center font-medium">
                  {card.front}
                </p>
              </div>
              
              {card.hints && card.hints.length > 0 && showHint && (
                <div className="mt-4">
                  {!showHintState ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHintState(true);
                      }}
                      className="text-blue-100 text-sm hover:text-white transition-colors"
                    >
                      Show hint
                    </button>
                  ) : (
                    <p className="text-blue-100 text-sm italic">
                      Hint: {card.hints[0]}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-blue-100 text-sm">Box {card.box}</span>
                <span className="text-blue-100 text-sm">Click to flip</span>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            <div className="h-full bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white text-xl text-center font-medium">
                  {card.back}
                </p>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(false);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Incorrect
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnswer(true);
                  }}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Correct
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};