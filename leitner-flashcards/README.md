# Leitner Flashcards System

A modern, offline-first flashcard learning application using the 4-box Leitner spaced repetition system.

## Features

- 📚 **4-Box Leitner System**: Optimized spaced repetition for effective learning
- 💾 **Offline Storage**: All data stored locally using IndexedDB
- 🎯 **Smart Scheduling**: Automatic review scheduling based on performance
- 📊 **Progress Tracking**: Visual statistics and box distribution
- 📥 **Import/Export**: JSON format for easy data management
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- 🔄 **LLM Integration Ready**: Structured format for OCR/AI-generated cards

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Leitner Box System

- **Box 1**: New/incorrect cards (review daily)
- **Box 2**: Cards answered correctly once (review every 3 days)
- **Box 3**: Cards answered correctly twice (review weekly)
- **Box 4**: Mastered cards (review monthly)

## Import Format

The application accepts JSON files in the following format:

```json
{
  "version": "1.0",
  "metadata": {
    "source": "OCR_PDF",
    "created": "2025-08-02",
    "subject": "Mathematics",
    "language": "en"
  },
  "decks": [
    {
      "id": "deck-uuid",
      "name": "Algebra Basics",
      "cards": [
        {
          "type": "basic",
          "front": "Question text",
          "back": "Answer text",
          "hints": ["Optional hint"],
          "tags": ["math", "algebra"],
          "difficulty": 1
        }
      ]
    }
  ]
}
```

## LLM Prompt for OCR Processing

When processing OCR'd PDFs through an LLM, use this prompt:

```
You are a flashcard generation expert. Convert the following OCR'd text into structured flashcards.

RULES:
1. Create clear, concise question-answer pairs
2. One concept per card
3. Use active recall principles
4. Include hints when helpful
5. Tag appropriately for organization

OUTPUT FORMAT:
{
  "cards": [
    {
      "type": "basic",
      "front": "[Question]",
      "back": "[Answer]",
      "hints": ["[Optional hint]"],
      "tags": ["[tags]"],
      "difficulty": [1-5]
    }
  ]
}
```

## Usage

1. **Import Cards**: Use the Import page to load flashcards from JSON files
2. **Review**: Cards due for review appear automatically on the dashboard
3. **Track Progress**: Monitor your learning progress through the statistics
4. **Export**: Backup your data anytime as JSON

## Technologies

- React 18 with TypeScript
- Vite for fast builds
- TailwindCSS for styling
- Framer Motion for animations
- Dexie.js for IndexedDB management
- React Router for navigation