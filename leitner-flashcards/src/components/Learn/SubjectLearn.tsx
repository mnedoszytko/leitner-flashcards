import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Subject } from '../../types/flashcard.types';
import { db } from '../../services/database';

export const SubjectLearn: React.FC = () => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subjectId) {
      loadSubject();
    }
  }, [subjectId]);

  const loadSubject = async () => {
    try {
      const loadedSubject = await db.subjects.get(subjectId!);
      setSubject(loadedSubject || null);
    } catch (error) {
      console.error('Failed to load subject:', error);
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
          <Link to="/learn/subjects" className="text-blue-600 hover:text-blue-700">
            Back to subjects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {subject.icon} {subject.name}
        </h1>
        <p className="text-gray-600">Subject learning view coming soon...</p>
      </div>
    </div>
  );
};