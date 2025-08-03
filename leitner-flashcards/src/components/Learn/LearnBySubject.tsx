import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/database';
import { LeitnerAlgorithm } from '../../services/leitnerAlgorithm';

export const LearnBySubject: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const loadedSubjects = await db.subjects.toArray();
      
      // Get statistics for each subject
      const subjectsWithStats = await Promise.all(
        loadedSubjects.map(async (subject) => {
          const decks = await db.decks.where('subjectId').equals(subject.id).toArray();
          const deckIds = decks.map(d => d.id);
          const cards = await db.cards.where('deckId').anyOf(deckIds).toArray();
          
          const stats = LeitnerAlgorithm.getStatistics(cards);
          
          return {
            ...subject,
            stats,
            cardCount: cards.length,
            deckCount: decks.length
          };
        })
      );
      
      setSubjects(subjectsWithStats);
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Learn by Subject</h1>
          <p className="text-gray-600 mt-1">Choose a subject to focus your study session</p>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No subjects yet</h2>
            <p className="text-gray-600 mb-6">Create subjects to organize your flashcards</p>
            <Link
              to="/flashcards/subjects"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Create First Subject
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                to={`/learn/subject/${subject.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div 
                  className="h-32 rounded-t-lg flex items-center justify-center text-6xl"
                  style={{ backgroundColor: subject.color || '#3B82F6' }}
                >
                  {subject.icon || '📚'}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Cards:</span>
                      <span className="font-medium">{subject.cardCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due Today:</span>
                      <span className="font-medium text-orange-600">{subject.stats.dueToday}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mastered:</span>
                      <span className="font-medium text-green-600">{subject.stats.mastered}</span>
                    </div>
                  </div>

                  {/* Box Distribution */}
                  <div className="mt-4 flex gap-1">
                    {[1, 2, 3, 4].map(box => {
                      const count = subject.stats.byBox?.[box] || 0;
                      const percentage = subject.cardCount > 0 
                        ? Math.round((count / subject.cardCount) * 100) 
                        : 0;
                      
                      return (
                        <div
                          key={box}
                          className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
                          title={`Box ${box}: ${count} cards`}
                        >
                          <div
                            className={`h-full transition-all duration-300 ${
                              box === 1 ? 'bg-red-500' :
                              box === 2 ? 'bg-yellow-500' :
                              box === 3 ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};