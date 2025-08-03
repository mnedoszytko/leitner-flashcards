# Project-Specific Instructions for Leitner Flashcards

## Development Server
The development server is running in the background with Hot Module Replacement (HMR) enabled. 
- **DO NOT** run `npm run dev` again - it's already running
- The app is accessible at http://localhost:5173/ (or the next available port)
- Any code changes will automatically refresh in the browser

## Project Structure
- Navigation-based app with two main sections: Learn and Flashcards
- Uses React Router for navigation
- IndexedDB (Dexie.js) for local storage
- 4-box Leitner spaced repetition system

## Key Components
- `/learn` - Learning interface with box statistics
- `/flashcards` - CRUD management for subjects and cards
- Subjects (formerly Sections) organize flashcards by topic