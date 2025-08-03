#!/bin/bash

# Quick run script for Leitner Flashcards

echo "🎯 Starting Leitner Flashcards..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
fi

echo "🚀 Opening at http://localhost:5173"
echo "Press Ctrl+C to stop"
echo ""

npm run dev