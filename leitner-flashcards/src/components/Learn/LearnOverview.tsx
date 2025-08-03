import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Subject } from '../../types/flashcard.types';
import { LeitnerAlgorithm } from '../../services/leitnerAlgorithm';
import { db } from '../../services/database';
import { motion } from 'framer-motion';

export const LearnOverview: React.FC = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

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
    { id: 1, name: "Box 1 - Daily", color: "border-red-300", icon: "🔴", bgGradient: "bg-gradient-to-br from-red-50 to-red-100" },
    { id: 2, name: "Box 2 - Every 2-3 Days", color: "border-yellow-300", icon: "🟡", bgGradient: "bg-gradient-to-br from-yellow-50 to-yellow-100" },
    { id: 3, name: "Box 3 - Weekly", color: "border-blue-300", icon: "🔵", bgGradient: "bg-gradient-to-br from-blue-50 to-blue-100" },
    { id: 4, name: "Box 4 - Mastered", color: "border-green-300", icon: "🟢", bgGradient: "bg-gradient-to-br from-green-50 to-green-100" }
  ];

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Learn Overview</h1>
          <p className="text-gray-600">Track your progress across all subjects</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: stats.total || 0, label: 'Total Cards', color: 'text-blue-600', delay: 0 },
            { value: stats.dueToday || 0, label: 'Due Today', color: 'text-orange-600', delay: 0.1 },
            { value: stats.mastered || 0, label: 'Mastered', color: 'text-green-600', delay: 0.2 },
            { value: `${stats.averageCorrectRate || 0}%`, label: 'Success Rate', color: 'text-purple-600', delay: 0.3 }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: stat.delay, duration: 0.3 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="bg-white rounded-lg shadow p-4 text-center transition-all duration-200 hover:shadow-md"
            >
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Box Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Progress by Box</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {boxes.map(box => {
              const cardsInBox = stats.byBox?.[box.id] || 0;
              const percentage = stats.total > 0 ? Math.round((cardsInBox / stats.total) * 100) : 0;
              
              return (
                <motion.div
                  key={box.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: box.id * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/learn/box/${box.id}`)}
                  className={`p-6 rounded-lg border-2 ${box.color} ${box.bgGradient} shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer`}
                >
                  <div className="text-3xl mb-2">{box.icon}</div>
                  <div className="font-semibold text-sm">{box.name}</div>
                  <div className="text-2xl font-bold mt-2">{cardsInBox}</div>
                  <div className="text-xs text-gray-600">cards ({percentage}%)</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            {stats.dueToday > 0 ? (
              <Link
                to="/learn/review"
                className="block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-2">📚</div>
                <h3 className="text-xl font-semibold">Start Review</h3>
                <p className="text-blue-100 mt-1">{stats.dueToday} cards due today</p>
              </Link>
            ) : (
              <Link
                to="/learn/subjects"
                className="block bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-2">📖</div>
                <h3 className="text-xl font-semibold">Study New Cards</h3>
                <p className="text-green-100 mt-1">Choose a subject to study</p>
              </Link>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <Link
              to="/learn/subjects"
              className="block bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-2">📂</div>
              <h3 className="text-xl font-semibold text-gray-800">Browse by Subject</h3>
              <p className="text-gray-600 mt-1">{subjects.length} subjects available</p>
            </Link>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/flashcards/subjects"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">➕</span>
              <div>
                <div className="font-medium">Add Subject</div>
                <div className="text-sm text-gray-600">Create new topic</div>
              </div>
            </Link>
            <Link
              to="/import"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">📥</span>
              <div>
                <div className="font-medium">Import Cards</div>
                <div className="text-sm text-gray-600">Add flashcards</div>
              </div>
            </Link>
            <Link
              to="/export"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">📤</span>
              <div>
                <div className="font-medium">Export Data</div>
                <div className="text-sm text-gray-600">Backup progress</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};