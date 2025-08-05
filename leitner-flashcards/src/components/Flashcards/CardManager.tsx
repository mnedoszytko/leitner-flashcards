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
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'selected' | 'all' | null>(null);

  useEffect(() => {
    if (subjectId) {
      loadSubjectAndCards();
    }
  }, [subjectId]);

  const handleSelectAll = () => {
    if (selectedCards.size === cards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(cards.map(card => card.id)));
    }
  };

  const handleSelectCard = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedCards.size === 0) return;
    setDeleteMode('selected');
    setShowDeleteConfirm(true);
  };

  const handleDeleteAll = () => {
    if (cards.length === 0) return;
    setDeleteMode('all');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const cardsToDelete = deleteMode === 'all' 
        ? cards.map(c => c.id)
        : Array.from(selectedCards);

      // Delete cards from database
      for (const cardId of cardsToDelete) {
        await db.cards.delete(cardId);
      }

      // Refresh the cards list
      await loadSubjectAndCards();
      
      // Reset state
      setSelectedCards(new Set());
      setShowDeleteConfirm(false);
      setDeleteMode(null);
    } catch (error) {
      console.error('Failed to delete cards:', error);
    }
  };

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
        cards: [],
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
          lastReviewed: undefined,
          nextReview: new Date().toISOString(),
          reviewCount: 0,
          correctCount: 0,
          difficulty: card.difficulty || 1
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

  const handleExportSubject = async () => {
    try {
      const data = await db.exportSubject(subjectId!);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `subject-${subject?.name?.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Subject "${subject?.name}" exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export subject');
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
          <div className="p-6 border-b flex justify-between items-center">
            <div className="flex gap-3">
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
            
            <div className="flex gap-3">
              <button
                onClick={handleExportSubject}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>📤</span> Export Subject
              </button>
              
              {cards.length > 0 && (
                <>
                  {selectedCards.size > 0 && (
                    <span className="text-sm text-gray-600 mr-2">
                      {selectedCards.size} selected
                    </span>
                  )}
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedCards.size === 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCards.size > 0
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Delete Selected ({selectedCards.size})
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Delete All
                  </button>
                </>
              )}
            </div>
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
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={cards.length > 0 && selectedCards.size === cards.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </th>
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
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCards.has(card.id)}
                          onChange={() => handleSelectCard(card.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
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
                      <pre className="whitespace-pre-wrap">{`ZADANIE: Przygotowanie fiszek do nauki farmaceutycznej

KROK 1 - ANALIZA:
Dokładnie przeanalizuj dostarczony materiał dotyczący [TWÓJ TEMAT]. Zidentyfikuj:
- Kluczowe pojęcia i definicje
- Mechanizmy działania
- Wskazania i przeciwwskazania
- Działania niepożądane
- Interakcje
- Dawkowanie
- Wszystkie istotne informacje egzaminacyjne

KROK 2 - GENEROWANIE FISZEK:
Na podstawie analizy wygeneruj DOKŁADNIE 50 fiszek w formacie JSON:

{
  "metadata": {
    "deckName": "[Nazwa talii - np. Farmakologia: Leki kardiologiczne]",
    "description": "[Opis zawartości - np. Fiszki obejmujące leki stosowane w kardiologii]",
    "topic": "[Dokładny temat]",
    "language": "pl"
  },
  "cards": [
    {
      "type": "basic",
      "front": "[Pytanie lub pojęcie medyczne]",
      "back": "[Dokładna, naukowa odpowiedź]",
      "hints": ["Wskazówka pomocna w zapamiętaniu"],
      "tags": ["farmakologia", "egzamin", "konkretny_dział"],
      "difficulty": 1-5
    }
  ]
}

WYMAGANIA:
1. Wygeneruj DOKŁADNIE 50 fiszek
2. Pokryj WSZYSTKIE ważne zagadnienia z materiału
3. Używaj precyzyjnej terminologii medycznej
4. Difficulty: 1-łatwe, 3-średnie, 5-trudne
5. Upewnij się, że JSON jest poprawny
6. Fiszki muszą być przydatne na egzaminie farmaceutycznym`}</pre>
                    </div>
                    <button
                      onClick={() => {
                        const prompt = `ZADANIE: Przygotowanie fiszek do nauki farmaceutycznej

KROK 1 - ANALIZA:
Dokładnie przeanalizuj dostarczony materiał dotyczący [TWÓJ TEMAT]. Zidentyfikuj:
- Kluczowe pojęcia i definicje
- Mechanizmy działania
- Wskazania i przeciwwskazania
- Działania niepożądane
- Interakcje
- Dawkowanie
- Wszystkie istotne informacje egzaminacyjne

KROK 2 - GENEROWANIE FISZEK:
Na podstawie analizy wygeneruj DOKŁADNIE 50 fiszek w formacie JSON:

{
  "metadata": {
    "deckName": "[Nazwa talii - np. Farmakologia: Leki kardiologiczne]",
    "description": "[Opis zawartości - np. Fiszki obejmujące leki stosowane w kardiologii]",
    "topic": "[Dokładny temat]",
    "language": "pl"
  },
  "cards": [
    {
      "type": "basic",
      "front": "[Pytanie lub pojęcie medyczne]",
      "back": "[Dokładna, naukowa odpowiedź]",
      "hints": ["Wskazówka pomocna w zapamiętaniu"],
      "tags": ["farmakologia", "egzamin", "konkretny_dział"],
      "difficulty": 1-5
    }
  ]
}

WYMAGANIA:
1. Wygeneruj DOKŁADNIE 50 fiszek
2. Pokryj WSZYSTKIE ważne zagadnienia z materiału
3. Używaj precyzyjnej terminologii medycznej
4. Difficulty: 1-łatwe, 3-średnie, 5-trudne
5. Upewnij się, że JSON jest poprawny
6. Fiszki muszą być przydatne na egzaminie farmaceutycznym`;
                        navigator.clipboard.writeText(prompt);
                        alert('Prompt skopiowany do schowka!');
                      }}
                      className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <span>📋</span> Kopiuj
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Zamień <code>[TWÓJ TEMAT]</code> na konkretny temat farmaceutyczny (np. "Leki beta-adrenolityczne", "Antybiotyki beta-laktamowe", "Leki przeciwnadciśnieniowe", "Farmakologia układu nerwowego")
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                {deleteMode === 'all' 
                  ? `Are you sure you want to delete ALL ${cards.length} cards? This action cannot be undone.`
                  : `Are you sure you want to delete ${selectedCards.size} selected card${selectedCards.size > 1 ? 's' : ''}? This action cannot be undone.`
                }
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteMode(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete {deleteMode === 'all' ? 'All' : 'Selected'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};