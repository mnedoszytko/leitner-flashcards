import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Subject, Flashcard } from '../../types/flashcard.types';
import { db } from '../../services/database';

export const CardManager: React.FC = () => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subjectId) {
      loadSubjectAndCards();
    }
  }, [subjectId]);

  const loadSubjectAndCards = async () => {
    try {
      const loadedSubject = await db.subjects.get(subjectId!);
      setSubject(loadedSubject || null);
      
      if (loadedSubject) {
        // Get all decks for this subject
        const decks = await db.decks.where('subjectId').equals(subjectId!).toArray();
        const deckIds = decks.map(d => d.id);
        
        // Get all cards from these decks
        const loadedCards = await db.cards.where('deckId').anyOf(deckIds).toArray();
        setCards(loadedCards);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
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

  if (!subject) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Subject not found</h2>
          <Link to="/flashcards/subjects" className="text-blue-600 hover:text-blue-700">
            Back to subjects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link to="/flashcards/subjects" className="hover:text-blue-600">Subjects</Link>
            <span>/</span>
            <span>{subject.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <span style={{ color: subject.color }}>{subject.icon}</span>
            {subject.name} Cards
          </h1>
          <p className="text-gray-600 mt-1">{cards.length} cards in this subject</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              + Add Card
            </button>
          </div>
          
          {cards.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No cards yet. Add your first card to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Front
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Back
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Box
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cards.map((card) => (
                    <tr key={card.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {card.front}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {card.back}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          card.box === 1 ? 'bg-red-100 text-red-800' :
                          card.box === 2 ? 'bg-yellow-100 text-yellow-800' :
                          card.box === 3 ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Box {card.box}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-700 mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};