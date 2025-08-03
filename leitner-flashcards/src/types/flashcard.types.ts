export interface FlashcardMedia {
  frontImage?: string | null;
  backImage?: string | null;
}

export type CardType = 'basic' | 'cloze' | 'image' | 'multi-choice';

export interface Flashcard {
  id: string;
  type: CardType;
  front: string;
  back: string;
  hints?: string[];
  tags?: string[];
  difficulty?: number; // 1-5 scale
  media?: FlashcardMedia;
  box: number; // 1-4 for Leitner system
  lastReviewed?: string; // ISO date string
  nextReview?: string; // ISO date string
  reviewCount: number;
  correctCount: number;
  deckId?: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  cards: Flashcard[];
  subjectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  decks: Deck[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashcardData {
  version: string;
  metadata: {
    source?: string;
    created: string;
    subject?: string;
    language?: string;
  };
  subjects: Subject[];
}

export interface StudySession {
  id: string;
  deckId: string;
  startTime: string;
  endTime?: string;
  cardsReviewed: number;
  correctAnswers: number;
  boxProgress: {
    [key: number]: {
      promoted: number;
      demoted: number;
    };
  };
}