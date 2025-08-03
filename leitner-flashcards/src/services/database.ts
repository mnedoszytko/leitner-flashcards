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

  async importData(data: any) {
    try {
      await this.transaction('rw', this.subjects, this.decks, this.cards, async () => {
        // Clear existing data
        await this.subjects.clear();
        await this.decks.clear();
        await this.cards.clear();

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
      });

      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async exportData() {
    const subjects = await this.subjects.toArray();
    const decks = await this.decks.toArray();
    const cards = await this.cards.toArray();

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

    return {
      version: '1.0',
      metadata: {
        created: new Date().toISOString(),
        source: 'Leitner Flashcards App'
      },
      subjects: subjectsWithDecks,
      decks: standaloneDecksWithCards
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