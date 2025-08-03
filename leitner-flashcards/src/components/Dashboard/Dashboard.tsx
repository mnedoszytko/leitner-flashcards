import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Subject } from '../../types/flashcard.types';
import { LeitnerAlgorithm } from '../../services/leitnerAlgorithm';
import { db } from '../../services/database';

export const Dashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loadedSubjects = await db.subjects.toArray();
      const allCards = await db.cards.toArray();

      setSubjects(loadedSubjects);

      // Calculate overall statistics
      const overallStats = LeitnerAlgorithm.getStatistics(allCards);
      setStats(overallStats);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const boxes = [
    { id: 1, name: "Box 1 - Daily", color: "bg-red-100 border-red-300", icon: "🔴", bgGradient: "from-red-50 to-red-100" },
    { id: 2, name: "Box 2 - Every 2-3 Days", color: "bg-yellow-100 border-yellow-300", icon: "🟡", bgGradient: "from-yellow-50 to-yellow-100" },
    { id: 3, name: "Box 3 - Weekly", color: "bg-blue-100 border-blue-300", icon: "🔵", bgGradient: "from-blue-50 to-blue-100" },
    { id: 4, name: "Box 4 - Mastered", color: "bg-green-100 border-green-300", icon: "🟢", bgGradient: "from-green-50 to-green-100" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <span className="text-4xl">🧠</span>
            Leitner System Flashcards
          </h1>
          <p className="text-gray-600">Master your knowledge with spaced repetition</p>
        </div>

        {/* Box Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {boxes.map(box => {
            const cardsInBox = stats.byBox?.[box.id] || 0;
            const dueCards = box.id === 1 ? stats.dueToday || 0 : 0; // Simplified for now
            
            return (
              <button
                key={box.id}
                onClick={() => stats.dueToday > 0 && navigate('/review')}
                className={`p-6 rounded-lg border-2 transition-all hover:shadow-lg ${box.color} bg-gradient-to-br ${box.bgGradient} cursor-pointer`}
              >
                <div className="text-3xl mb-2">{box.icon}</div>
                <div className="font-semibold text-sm">{box.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {dueCards > 0 ? `${dueCards} due / ` : ''}{cardsInBox} total
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Action Area */}
        {stats.dueToday > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {stats.dueToday} cards due for review today!
            </h2>
            <p className="text-gray-600 mb-6">
              Keep your learning streak going
            </p>
            <Link
              to="/review"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Start Review Session
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              All caught up!
            </h2>
            <p className="text-gray-600 mb-6">
              No cards due for review today. Great job!
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/import"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📥</div>
              <div>
                <h3 className="font-semibold text-lg">Import Cards</h3>
                <p className="text-sm text-gray-600">Add new flashcards from JSON</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/export"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">📤</div>
              <div>
                <h3 className="font-semibold text-lg">Export Data</h3>
                <p className="text-sm text-gray-600">Backup your progress</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            How the Leitner System Works
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Box 1 (Daily):</strong> New or difficult cards. Review every day.</p>
            <p><strong>Box 2 (2-3 Days):</strong> Cards you got right move here. Review every 2-3 days.</p>
            <p><strong>Box 3 (Weekly):</strong> Well-known cards. Review once a week.</p>
            <p><strong>Box 4 (Mastered):</strong> Mastered cards. Review monthly.</p>
            <p className="mt-3"><strong>Rules:</strong> Correct answers move cards up a box. Wrong answers send cards back to Box 1.</p>
          </div>
        </div>

        {/* Subjects - if any */}
        {subjects.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Your Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(subject => (
                <Link
                  key={subject.id}
                  to={`/learn/subject/${subject.id}`}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    {subject.icon && <span className="text-2xl">{subject.icon}</span>}
                    <div>
                      <h3 className="font-medium">{subject.name}</h3>
                      <p className="text-sm text-gray-600">
                        {subject.decks.length} deck{subject.decks.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};