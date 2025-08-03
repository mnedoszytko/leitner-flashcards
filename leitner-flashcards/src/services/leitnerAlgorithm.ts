import type { Flashcard } from '../types/flashcard.types';

// Leitner box intervals in days
const BOX_INTERVALS = {
  1: 1,    // Review daily
  2: 3,    // Review every 3 days
  3: 7,    // Review weekly
  4: 30    // Review monthly
};

export class LeitnerAlgorithm {
  /**
   * Get cards that are due for review
   */
  static getDueCards(cards: Flashcard[]): Flashcard[] {
    const today = new Date().toISOString().split('T')[0];
    
    return cards.filter(card => {
      if (!card.nextReview) return true; // New cards
      return card.nextReview <= today;
    });
  }

  /**
   * Process a card review and update its box position
   */
  static processReview(card: Flashcard, correct: boolean): Flashcard {
    const updatedCard = { ...card };
    const today = new Date();
    
    updatedCard.lastReviewed = today.toISOString();
    updatedCard.reviewCount = (updatedCard.reviewCount || 0) + 1;
    
    if (correct) {
      updatedCard.correctCount = (updatedCard.correctCount || 0) + 1;
      
      // Move to next box if not already in box 4
      if (updatedCard.box < 4) {
        updatedCard.box += 1;
      }
    } else {
      // Move back to box 1 on incorrect answer
      updatedCard.box = 1;
    }
    
    // Calculate next review date
    const daysUntilNextReview = BOX_INTERVALS[updatedCard.box as keyof typeof BOX_INTERVALS];
    const nextReviewDate = new Date(today);
    nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNextReview);
    updatedCard.nextReview = nextReviewDate.toISOString().split('T')[0];
    
    return updatedCard;
  }

  /**
   * Get statistics for a set of cards
   */
  static getStatistics(cards: Flashcard[]) {
    const stats = {
      total: cards.length,
      byBox: { 1: 0, 2: 0, 3: 0, 4: 0 },
      dueToday: 0,
      mastered: 0,
      averageCorrectRate: 0
    };
    
    const today = new Date().toISOString().split('T')[0];
    let totalCorrectRate = 0;
    let cardsWithReviews = 0;
    
    cards.forEach(card => {
      // Count by box
      if (card.box >= 1 && card.box <= 4) {
        stats.byBox[card.box as keyof typeof stats.byBox]++;
      }
      
      // Count due today
      if (!card.nextReview || card.nextReview <= today) {
        stats.dueToday++;
      }
      
      // Count mastered (in box 4)
      if (card.box === 4) {
        stats.mastered++;
      }
      
      // Calculate correct rate
      if (card.reviewCount && card.reviewCount > 0) {
        totalCorrectRate += (card.correctCount || 0) / card.reviewCount;
        cardsWithReviews++;
      }
    });
    
    // Calculate average correct rate
    if (cardsWithReviews > 0) {
      stats.averageCorrectRate = Math.round((totalCorrectRate / cardsWithReviews) * 100);
    }
    
    return stats;
  }

  /**
   * Get cards for a specific box
   */
  static getCardsByBox(cards: Flashcard[], box: number): Flashcard[] {
    return cards.filter(card => card.box === box);
  }

  /**
   * Initialize a new card
   */
  static initializeCard(card: Partial<Flashcard>): Flashcard {
    return {
      ...card,
      id: card.id || crypto.randomUUID(),
      type: card.type || 'basic',
      front: card.front || '',
      back: card.back || '',
      box: 1,
      reviewCount: 0,
      correctCount: 0,
      nextReview: new Date().toISOString().split('T')[0]
    } as Flashcard;
  }
}