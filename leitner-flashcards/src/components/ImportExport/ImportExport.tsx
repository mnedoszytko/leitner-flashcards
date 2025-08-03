import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/database';
import { LeitnerAlgorithm } from '../../services/leitnerAlgorithm';

export const ImportExport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const processImportData = async (data: any) => {
    // Validate data structure
    if (!data.version && !data.decks && !data.sections) {
      throw new Error('Invalid file format. Expected JSON with version, decks, or sections.');
    }

    // Initialize cards with Leitner algorithm
    if (data.decks) {
      data.decks = data.decks.map((deck: any) => ({
        ...deck,
        cards: deck.cards?.map((card: any) => LeitnerAlgorithm.initializeCard(card)) || []
      }));
    }

    if (data.sections) {
      data.sections = data.sections.map((section: any) => ({
        ...section,
        decks: section.decks?.map((deck: any) => ({
          ...deck,
          cards: deck.cards?.map((card: any) => LeitnerAlgorithm.initializeCard(card)) || []
        })) || []
      }));
    }

    const result = await db.importData(data);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Data imported successfully!' });
      setTimeout(() => navigate('/'), 2000);
    } else {
      throw new Error(result.error || 'Import failed');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await processImportData(data);
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to import file' 
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasteImport = async () => {
    if (!jsonInput.trim()) {
      setMessage({ type: 'error', text: 'Please paste JSON data first' });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const data = JSON.parse(jsonInput);
      await processImportData(data);
    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof SyntaxError) {
        setMessage({ 
          type: 'error', 
          text: 'Invalid JSON format. Please check your data and try again.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: error instanceof Error ? error.message : 'Failed to import data' 
        });
      }
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);

    try {
      const data = await db.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `leitner-flashcards-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to export data' 
      });
    } finally {
      setExporting(false);
    }
  };

  const handleBackupExport = async () => {
    setExporting(true);
    setMessage(null);

    try {
      const data = await db.exportData(true); // Include all stats
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `leitner-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Full backup created successfully!' });
    } catch (error) {
      console.error('Backup error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create backup' 
      });
    } finally {
      setExporting(false);
    }
  };

  const handleBackupRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);
    setShowBackupConfirm(false);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Verify it's a backup file
      if (data.metadata?.exportType !== 'full-backup') {
        throw new Error('This is not a backup file. Use the Import section for regular imports.');
      }

      const result = await db.importData(data, { clearExisting: true });
      
      if (result.success) {
        const statsText = result.stats ? 
          `\n\nRestored: ${result.stats.totalSubjects} subjects, ${result.stats.totalCards} cards` : '';
        setMessage({ type: 'success', text: result.message + statsText });
        setTimeout(() => navigate('/'), 2000);
      } else {
        throw new Error(result.error || 'Restore failed');
      }
    } catch (error) {
      console.error('Restore error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to restore backup' 
      });
    } finally {
      setImporting(false);
      if (backupFileInputRef.current) {
        backupFileInputRef.current.value = '';
      }
    }
  };

  const sampleData = {
    version: "1.0",
    metadata: {
      source: "OCR_PDF",
      created: new Date().toISOString(),
      subject: "Sample Subject",
      language: "en"
    },
    decks: [
      {
        id: "sample-deck-1",
        name: "Sample Deck",
        description: "This is a sample deck to demonstrate the format",
        tags: ["sample", "demo"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cards: [
          {
            id: "card-1",
            type: "basic",
            front: "What is the capital of France?",
            back: "Paris",
            hints: ["It's known as the City of Light"],
            tags: ["geography", "capitals"],
            difficulty: 1
          },
          {
            id: "card-2",
            type: "basic",
            front: "What is 2 + 2?",
            back: "4",
            hints: ["Basic addition"],
            tags: ["math", "arithmetic"],
            difficulty: 1
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Import/Export</h1>

        {/* Import Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Import Flashcards</h2>
          
          {/* Tab Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'file' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'paste' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Paste JSON
            </button>
          </div>

          {activeTab === 'file' ? (
            <div>
              <p className="text-gray-600 mb-4">
                Select a JSON file from your computer to import flashcards.
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="file-input"
              />
              
              <label
                htmlFor="file-input"
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                  importing 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {importing ? 'Importing...' : 'Choose File to Import'}
              </label>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Paste your JSON data below and click import. The data should follow the format shown in the example.
              </p>
              
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON data here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                onClick={handlePasteImport}
                disabled={importing || !jsonInput.trim()}
                className={`mt-4 px-6 py-3 rounded-lg font-medium transition-colors ${
                  importing || !jsonInput.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {importing ? 'Importing...' : 'Import JSON'}
              </button>
            </div>
          )}
        </div>

        {/* Backup/Restore Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💾</span> Full Database Backup & Restore
          </h2>
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Recommended:</strong> Create regular backups to protect your learning progress. 
              Backups include all cards, subjects, and learning statistics.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Backup */}
            <div>
              <h3 className="font-medium mb-2">Create Backup</h3>
              <p className="text-gray-600 text-sm mb-3">
                Download a complete backup of your database including all progress.
              </p>
              <button
                onClick={handleBackupExport}
                disabled={exporting}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  exporting 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {exporting ? 'Creating Backup...' : '💾 Create Full Backup'}
              </button>
            </div>

            {/* Restore */}
            <div>
              <h3 className="font-medium mb-2">Restore from Backup</h3>
              <p className="text-gray-600 text-sm mb-3">
                <span className="text-red-600">⚠️ Warning:</span> This will replace ALL current data.
              </p>
              
              {!showBackupConfirm ? (
                <button
                  onClick={() => setShowBackupConfirm(true)}
                  className="px-6 py-3 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  🔄 Restore Backup
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 font-medium">Are you sure? This will delete all current data!</p>
                  <div className="flex gap-2">
                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleBackupRestore}
                      className="hidden"
                      id="backup-file-input"
                    />
                    <label
                      htmlFor="backup-file-input"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    >
                      Yes, Select Backup File
                    </label>
                    <button
                      onClick={() => setShowBackupConfirm(false)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Export Flashcards</h2>
          <p className="text-gray-600 mb-4">
            Export all your flashcards to a JSON file for sharing or importing into another device.
          </p>
          
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              exporting 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {exporting ? 'Exporting...' : 'Export All Data'}
          </button>
        </div>

        {/* LLM Prompt Template */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Prompt LLM do generowania fiszek (Polish)</h2>
          <p className="text-gray-600 mb-4">
            Użyj tego promptu przy przetwarzaniu tekstów przez AI, aby wygenerować fiszki po polsku:
          </p>
          
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`Jesteś ekspertem w tworzeniu fiszek edukacyjnych. Przekształć poniższy tekst w fiszki do nauki metodą Leitnera.

ZASADY:
1. Twórz jasne, zwięzłe pary pytanie-odpowiedź PO POLSKU
2. Jedna koncepcja na fiszkę
3. Stosuj zasady aktywnego przypominania
4. Dodawaj wskazówki tam, gdzie są pomocne
5. Odpowiednio taguj do organizacji
6. WSZYSTKIE TEKSTY (pytania, odpowiedzi, wskazówki) MUSZĄ BYĆ PO POLSKU

TEKST WEJŚCIOWY:
[Tu zostanie wstawiony tekst do przetworzenia]

FORMAT WYJŚCIOWY:
Zwróć tablicę JSON z fiszkami (struktura po angielsku, treść po polsku):
{
  "cards": [
    {
      "type": "basic",
      "front": "[Pytanie po polsku]",
      "back": "[Odpowiedź po polsku]",
      "hints": ["[Opcjonalna wskazówka po polsku]"],
      "tags": ["[tagi po polsku]"],
      "difficulty": [1-5]
    }
  ]
}

Przykład:
{
  "cards": [
    {
      "type": "basic",
      "front": "Jaka jest stolica Polski?",
      "back": "Warszawa",
      "hints": ["Największe miasto w Polsce"],
      "tags": ["geografia", "polska", "stolice"],
      "difficulty": 1
    }
  ]
}

Wygeneruj fiszki z powyższego tekstu.`}
          </pre>
        </div>

        {/* Sample Format */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Import Format</h2>
          <p className="text-gray-600 mb-4">
            Here's an example of the JSON format expected for import:
          </p>
          
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
          
          <button
            onClick={() => {
              setActiveTab('paste');
              setJsonInput(JSON.stringify(sampleData, null, 2));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Copy Sample to Import
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};