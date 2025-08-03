# Leitner Flashcards System

A modern, offline-first flashcard learning application using the 4-box Leitner spaced repetition system.

## 🚀 Live Demo

**No installation required!** Visit the app directly at:
### 👉 [https://mnedoszytko.github.io/leitner-flashcards/](https://mnedoszytko.github.io/leitner-flashcards/)

## ✨ Features

- 📚 **4-Box Leitner System**: Optimized spaced repetition for effective learning
- 💾 **Offline Storage**: All data stored locally using IndexedDB
- 🎯 **Smart Scheduling**: Automatic review scheduling based on performance
- 📊 **Progress Tracking**: Visual statistics and box distribution
- 📥 **Import/Export**: JSON format for easy data management
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- 🔄 **LLM Integration Ready**: Structured format for OCR/AI-generated cards

## 🎯 Installation Options

### Option 1: Use Online (No Installation Required)
Simply visit [https://mnedoszytko.github.io/leitner-flashcards/](https://mnedoszytko.github.io/leitner-flashcards/) in your web browser.

### Option 2: One-Command Local Installation
For those who prefer to run locally, use this single command:

```bash
npx degit mnedoszytko/leitner-flashcards my-flashcards && cd my-flashcards && npm install && npm run dev
```

This will:
1. Download the app to a folder called `my-flashcards`
2. Install all dependencies
3. Start the app at http://localhost:5173

### Option 3: Manual Installation
```bash
# Clone the repository
git clone https://github.com/mnedoszytko/leitner-flashcards.git
cd leitner-flashcards

# Install dependencies
npm install

# Run development server
npm run dev
```

### Option 4: Quick Static Server
If you have Node.js installed, you can serve a pre-built version:

```bash
# Clone and build
git clone https://github.com/mnedoszytko/leitner-flashcards.git
cd leitner-flashcards
npm install && npm run build

# Serve the built files
npx serve dist
```

## 📚 How It Works

### The 4-Box Leitner System

- **Box 1**: New/incorrect cards (review daily)
- **Box 2**: Cards answered correctly once (review every 3 days)  
- **Box 3**: Cards answered correctly twice (review weekly)
- **Box 4**: Mastered cards (review monthly)

When you answer correctly, cards move up a box. Wrong answers send cards back to Box 1.

## 🎮 Usage Guide

1. **Create Subjects**: Organize your flashcards by topic (e.g., "Spanish Vocabulary", "Biology Terms")
2. **Add Cards**: Create flashcards with questions and answers
3. **Study**: Review cards when they're due - the app automatically schedules them
4. **Track Progress**: Monitor your learning with visual statistics

### 💾 Important: Data Storage
- Your flashcards are stored locally in your browser
- Data persists even when we update the app
- **Backup regularly**: Use Export feature to save your cards as JSON
- Each browser/device has separate storage

## 📥 Importing Flashcards

The app accepts JSON files in this format:

```json
{
  "version": "1.0",
  "metadata": {
    "source": "manual",
    "created": "2025-08-03",
    "subject": "Spanish",
    "language": "es"
  },
  "cards": [
    {
      "type": "basic",
      "front": "What is 'hello' in Spanish?",
      "back": "Hola",
      "hints": ["Common greeting"],
      "tags": ["greetings", "basic"],
      "difficulty": 1
    }
  ]
}
```

## 🤖 Creating Flashcards with AI

Use this prompt with ChatGPT or Claude to convert your notes into flashcards:

```
Convert the following text into flashcards for the Leitner system.

Create clear question-answer pairs following these rules:
- One concept per card
- Use active recall (questions that make you think)
- Keep answers concise
- Add hints for difficult concepts

Output as JSON:
{
  "cards": [
    {
      "type": "basic",
      "front": "[Question]",
      "back": "[Answer]",
      "hints": ["[Optional hint]"],
      "tags": ["[relevant tags]"],
      "difficulty": 1
    }
  ]
}

Text to convert:
[PASTE YOUR NOTES HERE]
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## 🧪 Technologies Used

- **React 18** with TypeScript for robust UI
- **Vite** for lightning-fast builds
- **Tailwind CSS v4** for modern styling
- **Framer Motion** for smooth animations
- **Dexie.js** for IndexedDB management
- **React Router** for navigation

## 📱 Features Coming Soon

- [ ] Mobile app version
- [ ] Cloud sync option
- [ ] More card types (image cards, cloze deletion)
- [ ] Study streaks and achievements
- [ ] Dark mode
- [ ] Export to Anki format

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

MIT License - feel free to use this for your own learning!

---

Made with ❤️ for better learning