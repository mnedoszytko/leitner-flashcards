import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Subject } from '../../types/flashcard.types';
import { db } from '../../services/database';
import { motion } from 'framer-motion';

export const ReviewBySubject: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectStats, setSubjectStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubjectsWithStats();
  }, []);

  const loadSubjectsWithStats = async () => {
    try {
      const loadedSubjects = await db.subjects.toArray();
      const stats: Record<string, number> = {};

      // Calculate due cards for each subject
      for (const subject of loadedSubjects) {
        const decks = await db.decks.where('subjectId').equals(subject.id).toArray();
        const deckIds = decks.map(d => d.id);
        
        if (deckIds.length > 0) {
          const dueCards = await db.cards
            .where('deckId')
            .anyOf(deckIds)
            .and(card => !card.nextReview || card.nextReview <= new Date().toISOString())
            .toArray();
          
          stats[subject.id] = dueCards.length;
        } else {
          stats[subject.id] = 0;
        }
      }

      setSubjects(loadedSubjects);
      setSubjectStats(stats);
    } catch (error) {
      console.error('Failed to load subjects:', error);
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

  const totalDue = Object.values(subjectStats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Choose Subject to Review</h1>
          <p className="text-gray-600">
            {totalDue > 0 
              ? `You have ${totalDue} cards due for review across all subjects`
              : 'Select a subject to study new cards'
            }
          </p>
        </div>

        {totalDue > 0 && (
          <motion.div 
            className="mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button
              onClick={() => navigate('/learn/review')}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="text-4xl mb-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                🎯
              </motion.div>
              <h3 className="text-xl font-semibold">Review All Due Cards</h3>
              <p className="text-purple-100 mt-1">Review {totalDue} cards from all subjects</p>
            </motion.button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, index) => {
            const dueCount = subjectStats[subject.id] || 0;
            
            return (
              <motion.button
                key={subject.id}
                onClick={() => navigate(`/learn/subject/${subject.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.span 
                    className="text-3xl" 
                    style={{ color: subject.color }}
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                  >
                    {subject.icon || '📚'}
                  </motion.span>
                  {dueCount > 0 && (
                    <motion.span 
                      className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 300 }}
                    >
                      {dueCount} due
                    </motion.span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{subject.name}</h3>
                {subject.description && (
                  <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                )}
              </motion.button>
            );
          })}
        </div>

        {subjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Subjects Yet</h3>
            <p className="text-gray-600 mb-6">Create your first subject to start learning</p>
            <Link
              to="/flashcards/subjects"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <span>➕</span> Create Subject
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};