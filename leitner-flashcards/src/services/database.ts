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
      await this.transaction('rw', this.subjects, this.decks, this.cards, this.sessions, async () => {
        if (options.clearExisting) {
          // Clear existing data for full restore
          await this.subjects.clear();
          await this.decks.clear();
          await this.cards.clear();
          await this.sessions.clear();
        }

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
      return { 
        success: true, 
        message: isFullBackup ? 'Full backup restored successfully' : 'Data imported successfully',
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