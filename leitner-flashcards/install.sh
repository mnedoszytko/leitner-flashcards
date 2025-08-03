#!/bin/bash

# Leitner Flashcards - One-Click Installer for Mac/Linux
# This script will install and run the Leitner Flashcards app

echo "🎯 Leitner Flashcards Installer"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org first."
    echo "Then run this script again."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    echo "Please install npm or reinstall Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Ask user for installation directory
echo "Where would you like to install Leitner Flashcards?"
echo "Press Enter for default location (./leitner-flashcards)"
read -p "Installation directory: " install_dir

# Use default if empty
if [ -z "$install_dir" ]; then
    install_dir="leitner-flashcards"
fi

# Check if directory already exists
if [ -d "$install_dir" ]; then
    echo "⚠️  Directory '$install_dir' already exists!"
    read -p "Delete it and continue? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Installation cancelled."
        exit 1
    fi
    rm -rf "$install_dir"
fi

echo ""
echo "📥 Downloading Leitner Flashcards..."
npx degit mnedoszytko/leitner-flashcards "$install_dir"

if [ $? -ne 0 ]; then
    echo "❌ Failed to download the app!"
    exit 1
fi

cd "$install_dir"

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies!"
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 Starting Leitner Flashcards..."
echo "The app will open in your browser at http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the app"
echo ""

npm run dev