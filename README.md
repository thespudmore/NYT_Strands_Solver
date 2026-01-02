# NYT Strands Solver - Web Edition

A modern web application for solving New York Times Strands word puzzles with intelligent word finding and backtracking solver. This is a complete rewrite of the original Python Tkinter application as a responsive GitHub Pages website.

## Features

- **Unified Edit/Solve Interface**: Toggle between edit mode (to input letters) and solve mode (to find words)
- **Interactive Grid Editor**: 
  - Click cells to edit letters directly
  - Automatic cursor advancement for quick input
  - Fixed 8x6 grid (NYT Strands standard)
- **Smart Word Finding**: DFS algorithm with prefix tree optimization for fast word discovery
- **Visual Word Highlighting**: 
  - Found words highlighted in blue (yellow when selected)
  - Proposed words from possible words list highlighted in green with dotted lines
  - Selected starting cell highlighted in green
  - Connecting lines show word paths
- **Complete Puzzle Solver**: Backtracking algorithm to find complete or best partial solutions
- **Configurable Solver**: Adjustable max attempts for longer searches
- **Word Management**: 
  - Add/remove set words
  - Blacklist incorrect words (removed words are automatically blacklisted)
  - Clear all words
  - Toggle word selection by clicking
- **Possible Words Feature**: Click any unused letter to see all possible words starting from that position
- **Performance Optimized**: Handles large word lists efficiently (370K+ words)

## Usage

### Accessing the Application

Simply open `index.html` in a modern web browser, or visit the GitHub Pages deployment.

### Using the Solver

1. **Edit Mode** (to input puzzle letters):
   - Click the "Edit" button in the header
   - Click any cell to edit its letter
   - Type letters - cursor automatically advances to next cell
   - Use Backspace to clear and move back
   - Press Escape to stop editing

2. **Solve Mode** (to find words):
   - Click the "Solve" button in the header
   - **Click an unused letter**: Shows all possible words starting from that position
   - **Click a letter that's part of a found word**: Selects that word (click again to deselect)
   - **Select a word from "Possible Words"**: Highlights it on the grid with green dotted lines
   - **Add a word**: Click "Add Word" to add the selected possible word to found words
   - **Select a found word**: Click it in the "Found Words" list to highlight it on the grid

3. **Solve the Puzzle**:
   - Adjust "Max Attempts" if needed (higher = longer search, better solutions)
   - Click "Solve Puzzle" to find a complete solution
   - Monitor progress in the progress display
   - Use "Cancel" to stop the solver if needed
   - The solver will find the best partial solution if complete solution isn't possible

4. **Manage Words**:
   - Click a found word to select it (highlights in yellow)
   - Click again to deselect
   - Click "Remove Selected" to remove and blacklist a word
   - "Clear All" to remove all found words

## Algorithm Details

### Word Finding Algorithm
- **Depth-First Search (DFS)** with backtracking
- **8-directional movement** (including diagonals)
- **No letter reuse** within a single word
- **Prefix tree optimization** for early termination
- **Performance optimized** for large word lists

### Puzzle Solver
- **Backtracking algorithm** for constraint satisfaction
- **Word prioritization** by length and position uniqueness
- **Progress tracking** with attempt counting
- **Best partial solution** fallback
- **Configurable attempt limits** (default: 100,000, adjustable in UI)

## Technical Specifications

- **Language**: HTML5, CSS3, JavaScript (ES6+)
- **No Dependencies**: Pure vanilla JavaScript, no frameworks required
- **Data Structures**: Sets, Arrays, Maps, Prefix Trees (Trie)
- **Algorithms**: DFS, Backtracking, Constraint Satisfaction
- **Performance**: Optimized for speed and memory efficiency
- **Word List**: Includes `words_alpha.txt` (370K+ words) directly in the application

## File Structure

```
strands_solver/
├── index.html              # Main HTML file
├── styles.css              # All styling (NYT Strands theme)
├── app.js                  # Main application logic
├── grid.js                 # Grid rendering and interaction
├── solver.js               # Word finding and puzzle solving algorithms
├── wordManager.js          # Word management logic
├── wordLoader.js           # Word list loading
├── utils.js                # Utility functions
├── words_alpha.txt         # Word list (370K+ words)
└── README.md               # This file
```

## Browser Compatibility

- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Canvas API**: Required for grid rendering
- **ES6+ features**: Modern JavaScript features used throughout

## GitHub Pages Deployment

The application is designed to work on GitHub Pages. Simply:
1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select the branch and folder (usually `main` and `/root`)
4. The site will be available at `https://yourusername.github.io/NYT_Strands_Solver/`

## Acknowledgments

- Word list from [dwyl/english-words](https://github.com/dwyl/english-words)
- New York Times Strands puzzle game
- Original Python implementation by [thespudmore](https://github.com/thespudmore/NYT_Strands_Solver)

## Known Limitations

- **Word List**: The word list may not match exactly what NYT allows/disallows in the actual game
- **Spangram**: The solver doesn't specifically look for spangrams (words that span the grid)
- **Theme**: No use of puzzle theme to filter words
- **Large Word Lists**: Very large word lists may take a few seconds to load initially

## Performance Tips

- Blacklist incorrect words to improve solver efficiency (words are auto-blacklisted when removed)
- Increase "Max Attempts" for better solutions (but longer search time)
- Use the cancel button for long-running operations
- The solver works best when you've already found some words manually

## License

This project is open source and available for personal and educational use.
