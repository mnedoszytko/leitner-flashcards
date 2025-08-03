import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Subject } from '../../types/flashcard.types';
import { db } from '../../services/database';

export const SubjectManager: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📚',
    color: '#3B82F6'
  });

  const defaultIcons = ['📚', '🔬', '🌍', '🎨', '💻', '🏥', '⚖️', '🎵', '🏛️', '💰'];
  const defaultColors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1', // indigo
    '#84CC16', // lime
  ];

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const loadedSubjects = await db.subjects.toArray();
      // Get card counts for each subject
      const subjectsWithStats = await Promise.all(
        loadedSubjects.map(async (subject) => {
          const decks = await db.decks.where('subjectId').equals(subject.id).toArray();
          const deckIds = decks.map(d => d.id);
          const cardCount = await db.cards.where('deckId').anyOf(deckIds).count();
          return { ...subject, cardCount, deckCount: decks.length };
        })
      );
      setSubjects(subjectsWithStats);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubject) {
        // Update existing subject
        await db.subjects.update(editingSubject.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new subject
        await db.subjects.add({
          id: crypto.randomUUID(),
          ...formData,
          decks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Reset form and reload
      setFormData({ name: '', description: '', icon: '📚', color: '#3B82F6' });
      setShowAddModal(false);
      setEditingSubject(null);
      loadSubjects();
    } catch (error) {
      console.error('Failed to save subject:', error);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      icon: subject.icon || '📚',
      color: subject.color || '#3B82F6'
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject? All associated decks and cards will be deleted.')) {
      return;
    }
    
    try {
      // Delete subject and all related data
      await db.transaction('rw', db.subjects, db.decks, db.cards, async () => {
        const decks = await db.decks.where('subjectId').equals(id).toArray();
        const deckIds = decks.map(d => d.id);
        
        // Delete all cards in these decks
        await db.cards.where('deckId').anyOf(deckIds).delete();
        
        // Delete all decks
        await db.decks.where('subjectId').equals(id).delete();
        
        // Delete the subject
        await db.subjects.delete(id);
      });
      
      loadSubjects();
    } catch (error) {
      console.error('Failed to delete subject:', error);
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manage Subjects</h1>
            <p className="text-gray-600 mt-1">Organize your flashcards by topic</p>
          </div>
          <button
            onClick={() => {
              setEditingSubject(null);
              setFormData({ name: '', description: '', icon: '📚', color: '#3B82F6' });
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Add Subject
          </button>
        </div>

        {/* Subject Grid */}
        {subjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No subjects yet</h2>
            <p className="text-gray-600 mb-6">Create your first subject to start organizing flashcards</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject: any) => (
              <div
                key={subject.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div 
                  className="h-24 rounded-t-lg flex items-center justify-center text-5xl"
                  style={{ backgroundColor: subject.color || '#3B82F6' }}
                >
                  {subject.icon || '📚'}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{subject.name}</h3>
                  {subject.description && (
                    <p className="text-gray-600 text-sm mb-4">{subject.description}</p>
                  )}
                  
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>{subject.cardCount || 0} cards</span>
                    <span>{subject.deckCount || 0} decks</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/flashcards/subject/${subject.id}`}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-center transition-colors"
                    >
                      Manage Cards
                    </Link>
                    <button
                      onClick={() => handleEdit(subject)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {defaultIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-3 text-2xl rounded-lg border-2 transition-colors ${
                          formData.icon === icon 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {defaultColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`h-10 rounded-lg border-2 transition-all ${
                          formData.color === color 
                            ? 'border-gray-800 scale-110' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingSubject(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {editingSubject ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};