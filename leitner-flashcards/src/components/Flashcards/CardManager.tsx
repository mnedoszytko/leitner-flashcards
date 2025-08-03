import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Subject, Flashcard } from '../../types/flashcard.types';
import { db } from '../../services/database';

export const CardManager: React.FC = () => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

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

  const handleImport = async () => {
    try {
      setImportError(null);
      const data = JSON.parse(importJson);
      
      // Validate the structure
      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error('Nieprawidłowy format: brak tablicy "cards"');
      }
      
      // Create a deck for imported cards if needed
      let deckId = `${subjectId}-imported-${Date.now()}`;
      const deckName = data.metadata?.deckName || 'Zaimportowane fiszki';
      
      await db.decks.add({
        id: deckId,
        name: deckName,
        description: data.metadata?.description || 'Fiszki zaimportowane z ChatGPT',
        subjectId: subjectId!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Import each card
      const importedCards: Flashcard[] = [];
      for (const card of data.cards) {
        const newCard: Flashcard = {
          id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: card.type || 'basic',
          front: card.front,
          back: card.back,
          hints: card.hints || [],
          tags: card.tags || [],
          deckId: deckId,
          box: 1,
          lastReviewed: null,
          nextReview: new Date().toISOString(),
          correctCount: 0,
          incorrectCount: 0,
          difficulty: card.difficulty || 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await db.cards.add(newCard);
        importedCards.push(newCard);
      }
      
      // Refresh the cards list
      await loadSubjectAndCards();
      
      // Close modal and reset
      setShowImportModal(false);
      setImportJson('');
      
      alert(`Pomyślnie zaimportowano ${importedCards.length} fiszek!`);
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Nie udało się zaimportować fiszek');
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
          <div className="p-6 border-b flex gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              + Add Card
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>📥</span> Importuj z AI
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

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Importuj fiszki z AI</h2>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Krok 1: Skopiuj ten prompt do ChatGPT</h3>
                  <div className="relative">
                    <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{`Wygeneruj fiszki na temat [TWÓJ TEMAT] w następującym formacie JSON:

{
  "metadata": {
    "deckName": "[Nazwa talii]",
    "description": "[Krótki opis]",
    "topic": "[Temat]",
    "language": "pl"
  },
  "cards": [
    {
      "type": "basic",
      "front": "[Pytanie lub pojęcie]",
      "back": "[Odpowiedź lub definicja]",
      "hints": ["Opcjonalna wskazówka 1", "Opcjonalna wskazówka 2"],
      "tags": ["tag1", "tag2"],
      "difficulty": 1
    }
  ]
}

Proszę wygeneruj 10-20 fiszek zgodnie z tą dokładną strukturą. Upewnij się, że JSON jest poprawny.`}</pre>
                    </div>
                    <button
                      onClick={() => {
                        const prompt = `Wygeneruj fiszki na temat [TWÓJ TEMAT] w następującym formacie JSON:

{
  "metadata": {
    "deckName": "[Nazwa talii]",
    "description": "[Krótki opis]",
    "topic": "[Temat]",
    "language": "pl"
  },
  "cards": [
    {
      "type": "basic",
      "front": "[Pytanie lub pojęcie]",
      "back": "[Odpowiedź lub definicja]",
      "hints": ["Opcjonalna wskazówka 1", "Opcjonalna wskazówka 2"],
      "tags": ["tag1", "tag2"],
      "difficulty": 1
    }
  ]
}

Proszę wygeneruj 10-20 fiszek zgodnie z tą dokładną strukturą. Upewnij się, że JSON jest poprawny.`;
                        navigator.clipboard.writeText(prompt);
                        alert('Prompt skopiowany do schowka!');
                      }}
                      className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <span>📋</span> Kopiuj
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Zamień <code>[TWÓJ TEMAT]</code> na wybrany temat (np. "Słownictwo angielskie", "Pojęcia z biologii", "Stolice świata")
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Krok 2: Wklej odpowiedź JSON tutaj</h3>
                  <textarea
                    className="w-full h-64 p-4 border rounded-lg font-mono text-sm"
                    placeholder="Wklej odpowiedź JSON z ChatGPT tutaj..."
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                  />
                  {importError && (
                    <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                      {importError}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportJson('');
                      setImportError(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importJson.trim()}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    Importuj fiszki
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};