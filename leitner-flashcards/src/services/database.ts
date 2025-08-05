import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Subject, Deck, Flashcard, StudySession } from '../types/flashcard.types';

export class FlashcardDatabase extends Dexie {
  subjects!: Table<Subject>;
  decks!: Table<Deck>;
  cards!: Table<Flashcard>;
  sessions!: Table<StudySession>;

  constructor() {
    super('LeitnerFlashcards');
    
    this.version(1).stores({
      subjects: 'id, name',
      decks: 'id, name, subjectId',
      cards: 'id, deckId, box, nextReview',
      sessions: 'id, deckId, startTime'
    });
  }

  async importData(data: any, options: { clearExisting?: boolean } = { clearExisting: true }) {
    try {
      console.log('=== IMPORT DEBUG START ===');
      console.log('Import data:', data);
      console.log('Options:', options);
      console.log('Metadata:', data.metadata);
      console.log('Export type:', data.metadata?.exportType);
      
      // Check if this is a single subject import
      const isSingleSubject = data.metadata?.exportType === 'single-subject';
      console.log('Is single subject?', isSingleSubject);
      
      await this.transaction('rw', this.subjects, this.decks, this.cards, this.sessions, async () => {
        // Only clear existing data for full backup restore, not for single subject imports
        const shouldClear = options.clearExisting && !isSingleSubject;
        console.log('Should clear existing data?', shouldClear);
        console.log('clearExisting option:', options.clearExisting);
        
        if (shouldClear) {
          console.log('CLEARING ALL DATA!');
          // Clear existing data for full restore
          await this.subjects.clear();
          await this.decks.clear();
          await this.cards.clear();
          await this.sessions.clear();
        } else {
          console.log('NOT clearing data - preserving existing content');
        }

        // Handle single subject import
        if (isSingleSubject && data.subject) {
          const { decks, ...subjectData } = data.subject;
          
          // Generate new IDs to avoid conflicts
          const newSubjectId = `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          subjectData.id = newSubjectId;
          
          // Check if a subject with the same name already exists
          const existingSubject = await this.subjects.where('name').equals(subjectData.name).first();
          if (existingSubject) {
            subjectData.name = `${subjectData.name} (Imported ${new Date().toLocaleDateString()})`;
          }
          
          await this.subjects.add(subjectData);

          // Import decks for this subject with new IDs
          if (decks) {
            for (const deck of decks) {
              const { cards, ...deckData } = deck;
              const newDeckId = `deck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              deckData.id = newDeckId;
              deckData.subjectId = newSubjectId;
              
              await this.decks.add(deckData);

              // Import cards for this deck with new IDs
              if (cards) {
                for (const card of cards) {
                  const newCard = { ...card };
                  newCard.id = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  newCard.deckId = newDeckId;
                  await this.cards.add(newCard);
                }
              }
            }
          }
          return;
        }

        // Original import logic for full imports
        // Import subjects (handle both old 'sections' and new 'subjects' keys)
        const subjectsData = data.subjects || data.sections;
        if (subjectsData) {
          for (const subject of subjectsData) {
            const { decks, ...subjectData } = subject;
            await this.subjects.add(subjectData);

            // Import decks for this subject
            if (decks) {
              for (const deck of decks) {
                const { cards, ...deckData } = deck;
                await this.decks.add({ ...deckData, subjectId: subject.id });

                // Import cards for this deck
                if (cards) {
                  for (const card of cards) {
                    await this.cards.add({ ...card, deckId: deck.id });
                  }
                }
              }
            }
          }
        }

        // Import standalone decks
        if (data.decks) {
          for (const deck of data.decks) {
            const { cards, ...deckData } = deck;
            await this.decks.add(deckData);

            // Import cards for this deck
            if (cards) {
              for (const card of cards) {
                await this.cards.add({ ...card, deckId: deck.id });
              }
            }
          }
        }

        // Import sessions if available (for full backup restore)
        if (data.sessions && Array.isArray(data.sessions)) {
          for (const session of data.sessions) {
            await this.sessions.add(session);
          }
        }
      });

      const isFullBackup = data.metadata?.exportType === 'full-backup';
      const message = isSingleSubject 
        ? `Subject "${data.metadata?.subjectName}" imported successfully` 
        : isFullBackup 
          ? 'Full backup restored successfully' 
          : 'Data imported successfully';
          
      return { 
        success: true, 
        message,
        stats: data.metadata?.stats
      };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async exportData(includeStats = true) {
    const subjects = await this.subjects.toArray();
    const decks = await this.decks.toArray();
    const cards = await this.cards.toArray();
    const sessions = includeStats ? await this.sessions.toArray() : [];

    // Build hierarchical structure
    const subjectsWithDecks = await Promise.all(
      subjects.map(async (subject) => {
        const subjectDecks = decks.filter(deck => deck.subjectId === subject.id);
        const decksWithCards = await Promise.all(
          subjectDecks.map(async (deck) => {
            const deckCards = cards.filter(card => card.deckId === deck.id);
            return { ...deck, cards: deckCards };
          })
        );
        return { ...subject, decks: decksWithCards };
      })
    );

    // Get standalone decks (no subject)
    const standaloneDecks = decks.filter(deck => !deck.subjectId);
    const standaloneDecksWithCards = await Promise.all(
      standaloneDecks.map(async (deck) => {
        const deckCards = cards.filter(card => card.deckId === deck.id);
        return { ...deck, cards: deckCards };
      })
    );

    // Calculate statistics
    const stats = {
      totalSubjects: subjects.length,
      totalDecks: decks.length,
      totalCards: cards.length,
      totalSessions: sessions.length,
      cardsByBox: cards.reduce((acc, card) => {
        acc[card.box] = (acc[card.box] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    };

    return {
      version: '1.1',
      metadata: {
        created: new Date().toISOString(),
        source: 'Leitner Flashcards App',
        exportType: 'full-backup',
        stats
      },
      subjects: subjectsWithDecks,
      decks: standaloneDecksWithCards,
      sessions: includeStats ? sessions : undefined
    };
  }

  async exportSubject(subjectId: string) {
    const subject = await this.subjects.get(subjectId);
    if (!subject) {
      throw new Error('Subject not found');
    }

    // Get all decks for this subject
    const subjectDecks = await this.decks.where('subjectId').equals(subjectId).toArray();
    const deckIds = subjectDecks.map(d => d.id);
    
    // Get all cards from these decks
    const cards = await this.cards.where('deckId').anyOf(deckIds).toArray();
    
    // Build hierarchical structure
    const decksWithCards = await Promise.all(
      subjectDecks.map(async (deck) => {
        const deckCards = cards.filter(card => card.deckId === deck.id);
        return { ...deck, cards: deckCards };
      })
    );

    // Calculate statistics for this subject
    const stats = {
      totalDecks: subjectDecks.length,
      totalCards: cards.length,
      cardsByBox: cards.reduce((acc, card) => {
        acc[card.box] = (acc[card.box] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    };

    return {
      version: '1.1',
      metadata: {
        created: new Date().toISOString(),
        source: 'Leitner Flashcards App',
        exportType: 'single-subject',
        subjectName: subject.name,
        stats
      },
      subject: {
        ...subject,
        decks: decksWithCards
      }
    };
  }

  async getCardsDueForReview(deckId?: string): Promise<Flashcard[]> {
    const now = new Date().toISOString();
    
    if (deckId) {
      return await this.cards
        .where('deckId').equals(deckId)
        .and(card => !card.nextReview || card.nextReview <= now)
        .toArray();
    }
    
    return await this.cards
      .filter(card => !card.nextReview || card.nextReview <= now)
      .toArray();
  }

  async updateCard(cardId: string, updates: Partial<Flashcard>) {
    return await this.cards.update(cardId, updates);
  }

  async recordSession(session: StudySession) {
    return await this.sessions.add(session);
  }
}

export const db = new FlashcardDatabase();