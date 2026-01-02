/**
 * Main Application
 * Unified Strands Solver with Edit/Solve modes
 */

import { GridDisplay } from './grid.js?v=8';
import { Solver } from './solver.js?v=2';
import { WordManager } from './wordManager.js?v=7';
import { loadWordList } from './wordLoader.js?v=2';
import { createEmptyGrid, validateGridSize } from './utils.js?v=2';

class StrandsApp {
    constructor() {
        this.grid = null;
        this.gridDisplay = null;
        this.solver = null;
        this.wordManager = new WordManager();
        this.wordSet = new Set();
        this.wordListReady = false; // Track when word list is fully loaded
        this.currentMode = 'solve'; // 'edit' or 'solve'
        this.solveCancelled = false;
        this.maxAttempts = 100000; // Default max attempts for solver
        
        this.init();
    }

    async init() {
        // Set up event listeners first
        this.setupEventListeners();

        // Initialize grid display with edit callback
        this.gridDisplay = new GridDisplay(
            'grid-canvas',
            (row, col) => this.onCellClick(row, col),
            (grid) => this.onGridEdit(grid)
        );

        // Set up word manager callbacks
        this.wordManager.setWordSelectCallback((word, positions) => {
            this.onWordSelected(word, positions);
        });
        
        // Set up callback for when a set word is selected from the found words list
        this.wordManager.setSetWordSelectCallback((word, positions, index) => {
            if (index >= 0 && word && positions) {
                this.onSetWordSelected(word, positions, index);
            } else {
                // Word was deselected
                this.onSetWordDeselected();
            }
        });
        
        // Set up max attempts input
        const maxAttemptsInput = document.getElementById('max-attempts');
        if (maxAttemptsInput) {
            maxAttemptsInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value > 0) {
                    this.maxAttempts = value;
                    console.log('Max attempts set to:', this.maxAttempts);
                }
            });
            // Initialize with default value
            this.maxAttempts = parseInt(maxAttemptsInput.value, 10) || 100000;
        }

        // Load word list
        await this.loadWordList();

        // Initialize with fixed 8x6 grid (NYT Strands standard: 8 rows, 6 columns)
        const defaultGrid = createEmptyGrid(8, 6);
        this.setGrid(defaultGrid);
        
        // Set initial mode to solve (this will properly initialize edit mode state)
        // Make sure editMode starts as false (solve mode)
        this.currentMode = 'solve';
        if (this.gridDisplay) {
            this.gridDisplay.editMode = false;
            this.gridDisplay.setEditMode(false);
        }
        this.setMode('solve');
        
        console.log('Initialization complete:', {
            currentMode: this.currentMode,
            editMode: this.gridDisplay?.editMode,
            wordListReady: this.wordListReady,
            hasSolver: !!this.solver
        });
        
        // Force a render to ensure everything is initialized
        if (this.gridDisplay) {
            this.gridDisplay.render();
        }
    }

    setupEventListeners() {
        // Mode toggle
        document.getElementById('mode-edit').addEventListener('click', () => {
            this.setMode('edit');
        });
        document.getElementById('mode-solve').addEventListener('click', () => {
            this.setMode('solve');
        });

        // Grid size controls removed - fixed 6x8 grid

        document.getElementById('clear-grid-btn').addEventListener('click', () => {
            if (confirm('Clear the entire grid?')) {
                const rows = this.grid.length;
                const cols = this.grid[0].length;
                this.setGrid(createEmptyGrid(rows, cols));
            }
        });

        // Word management
        document.getElementById('add-word-btn').addEventListener('click', () => {
            this.addSetWord();
        });

        document.getElementById('blacklist-btn').addEventListener('click', () => {
            this.blacklistCurrentWord();
        });

        document.getElementById('remove-word-btn').addEventListener('click', () => {
            this.removeSelectedWord();
        });

        document.getElementById('clear-words-btn').addEventListener('click', () => {
            if (confirm('Clear all found words?')) {
                this.wordManager.clearSetWords();
                this.updateDisplay();
            }
        });

        // Solver
        document.getElementById('solve-btn').addEventListener('click', () => {
            this.attemptSolve();
        });

        document.getElementById('cancel-solve-btn').addEventListener('click', () => {
            this.cancelSolve();
        });
    }

    async loadWordList() {
        const statusEl = document.getElementById('word-count');
        statusEl.textContent = 'Loading...';
        this.wordListReady = false;
        
        try {
            const loadedWordSet = await loadWordList();
            if (loadedWordSet && loadedWordSet.size > 0) {
                this.wordSet = loadedWordSet;
                this.wordListReady = true; // Mark as ready
                statusEl.textContent = `${this.wordSet.size.toLocaleString()} words`;
                statusEl.style.color = 'var(--strands-darker-mint)';
                
                console.log('Word list loaded successfully:', {
                    size: this.wordSet.size,
                    wordListReady: this.wordListReady
                });
                
                // Initialize solver if grid exists
                if (this.grid) {
                    this.solver = new Solver(this.grid, this.wordSet);
                    console.log('Solver initialized with grid');
                }
            } else {
                throw new Error('Word list loaded but is empty');
            }
        } catch (error) {
            console.error('Failed to load word list:', error);
            statusEl.textContent = 'Failed to load';
            statusEl.style.color = '#ef4444';
            this.wordSet = new Set(); // Ensure it's at least initialized
            this.wordListReady = false;
        }
    }

    setMode(mode) {
        console.log('Setting mode to:', mode);
        this.currentMode = mode;
        
        // Update UI buttons
        const editBtn = document.getElementById('mode-edit');
        const solveBtn = document.getElementById('mode-solve');
        
        if (mode === 'edit') {
            editBtn.classList.add('active');
            solveBtn.classList.remove('active');
        } else {
            editBtn.classList.remove('active');
            solveBtn.classList.add('active');
        }
        
        // Update grid display - ensure edit mode is properly set
        if (this.gridDisplay) {
            const editModeEnabled = (mode === 'edit');
            console.log('Setting grid edit mode to:', editModeEnabled);
            this.gridDisplay.setEditMode(editModeEnabled);
        }
        
        // Hide grid size controls (fixed 6x8 grid)
        const sizeControls = document.getElementById('grid-size-controls');
        if (sizeControls) {
            sizeControls.style.display = 'none';
        }
        
        console.log('Mode set. Current mode:', this.currentMode, 'Edit mode:', this.gridDisplay?.editMode);
    }

    setGrid(grid) {
        this.grid = grid;
        this.gridDisplay.setGrid(grid);
        
        // Update size inputs (if they exist)
        const rowsInput = document.getElementById('grid-rows');
        const colsInput = document.getElementById('grid-cols');
        if (rowsInput) rowsInput.value = grid.length;
        if (colsInput) colsInput.value = grid[0].length;
        
        // Initialize or update solver if word list is ready
        if (this.wordListReady && this.wordSet.size > 0) {
            this.solver = new Solver(grid, this.wordSet);
            console.log('Solver initialized in setGrid');
        }
        
        // Clear word lists when grid changes
        this.wordManager.updatePossibleWords([]);
        this.wordManager.updateProposedWord(null);
    }

    // Grid size is fixed at 6x8, so this method is no longer needed

    onGridEdit(grid) {
        this.grid = grid;
        if (this.solver) {
            this.solver.setGrid(grid);
        }
    }

    onCellClick(row, col) {
        console.log('onCellClick called:', {
            row,
            col,
            currentMode: this.currentMode,
            hasGrid: !!this.grid,
            hasSolver: !!this.solver,
            wordListReady: this.wordListReady,
            wordSetSize: this.wordSet?.size
        });
        
        if (this.currentMode !== 'solve') {
            console.log('Not in solve mode, ignoring click');
            return;
        }
        
        if (!this.grid) {
            console.warn('No grid available');
            return;
        }
        
        // Ensure solver is initialized
        if (!this.solver) {
            if (this.wordListReady && this.wordSet.size > 0) {
                console.log('Initializing solver in onCellClick');
                this.solver = new Solver(this.grid, this.wordSet);
            } else {
                console.warn('Word list not ready, cannot initialize solver');
                alert('Word list not loaded. Please wait...');
                return;
            }
        }
        
        if (!this.solver) {
            console.error('Solver not available');
            alert('Solver not initialized. Please wait for word list to load.');
            return;
        }

        console.log('Finding words from position:', row, col);
        
        // Check if this cell is part of a found word
        const setWords = this.wordManager.getSetWords();
        let foundWordIndex = -1;
        
        for (let i = 0; i < setWords.length; i++) {
            const [word, positions] = setWords[i];
            // Check if the clicked cell is in this word's positions
            const isInWord = positions.some(p => p[0] === row && p[1] === col);
            if (isInWord) {
                foundWordIndex = i;
                break;
            }
        }
        
        if (foundWordIndex >= 0) {
            // Cell is part of a found word - toggle selection
            console.log('Cell is part of found word at index:', foundWordIndex);
            
            // Toggle selection (selectSetWord already handles toggling and callbacks)
            this.wordManager.selectSetWord(foundWordIndex);
            
            // Clear possible words selection when selecting a word
            if (this.wordManager.getSelectedSetWordIndex() >= 0) {
                this.gridDisplay.setSelectedCellForWords(null, null);
                this.gridDisplay.setProposedWord(null, null);
                this.wordManager.updateProposedWord(null);
            }
        } else {
            // Cell is unused - show possible words starting from this position
            console.log('Cell is unused - showing possible words');
            
            // Set the selected cell for possible words (will show in green)
            this.gridDisplay.setSelectedCellForWords(row, col);
            
            // Clear any previous selections when clicking a new cell
            this.gridDisplay.setSelectedFoundWord(null);
            this.gridDisplay.setProposedWord(null, null);
            this.wordManager.updateProposedWord(null);

            // Find words starting from this position
            const usedPositions = this.wordManager.getUsedPositions();
            const blacklistedWords = this.wordManager.getBlacklistedWords();
            
            const words = this.solver.findWordsDFS(
                row, 
                col, 
                usedPositions, 
                blacklistedWords,
                4, 
                15
            );

            console.log('Found words:', words.length);
            this.wordManager.updatePossibleWords(words);
        }
    }

    onWordSelected(word, positions) {
        // Update the proposed word display
        this.wordManager.updateProposedWord(word);
        // Show the word temporarily on the grid (this will highlight it in green with dotted lines)
        this.gridDisplay.setProposedWord(word, positions);
        // Clear any previous selected found word highlight
        this.gridDisplay.setSelectedFoundWord(null);
    }

    addSetWord() {
        // Get the currently proposed word (from possible words list)
        const proposedWordText = document.getElementById('proposed-word').textContent.trim();
        
        if (!proposedWordText) {
            alert('No word selected. Please select a word from the possible words list first.');
            return;
        }

        // Find the word in foundWordsData
        const proposedWord = this.wordManager.foundWordsData.find(
            ([w]) => w === proposedWordText
        );

        if (proposedWord) {
            const [word, positions] = proposedWord;
            this.wordManager.addSetWord(word, positions);
            this.clearSelection();
            this.updateDisplay();
        } else {
            alert('Word not found in possible words. Please select a word from the list first.');
        }
    }

    blacklistCurrentWord() {
        const word = document.getElementById('proposed-word').textContent;
        if (word) {
            this.wordManager.blacklistWord(word);
            this.clearSelection();
            // Refresh word list if we have a selected cell
            if (this.grid) {
                // Try to refresh from last clicked position if available
                this.onCellClick(0, 0);
            }
        } else {
            alert('No word selected.');
        }
    }

    clearSelection() {
        this.wordManager.updateProposedWord(null);
        this.gridDisplay.setProposedWord(null, null);
        this.gridDisplay.setSelectedFoundWord(null);
        this.gridDisplay.setSelectedCellForWords(null, null);
    }

    removeSelectedWord() {
        const index = this.wordManager.getSelectedSetWordIndex();
        if (index >= 0) {
            // Remove and blacklist the word so future solves won't use it
            const removed = this.wordManager.blacklistAndRemoveWord(index);
            if (removed) {
                console.log(`Removed and blacklisted word: ${removed[0]}`);
            }
            this.updateDisplay();
        } else {
            alert('Please select a word to remove.');
        }
    }

    onSetWordSelected(word, positions, index) {
        // Update the grid display to highlight the selected word
        this.gridDisplay.setSelectedSetWordIndex(index);
        // Clear any other selections
        this.gridDisplay.setSelectedFoundWord(null);
        this.gridDisplay.setProposedWord(null, null);
        this.gridDisplay.setSelectedCellForWords(null, null);
    }
    
    onSetWordDeselected() {
        // Clear all selections when a word is deselected
        this.gridDisplay.setSelectedSetWordIndex(-1);
        this.gridDisplay.setSelectedFoundWord(null);
        this.gridDisplay.setProposedWord(null, null);
        this.gridDisplay.setSelectedCellForWords(null, null);
        this.updateDisplay();
    }

    updateDisplay() {
        const setWords = this.wordManager.getSetWords();
        this.gridDisplay.setSetWords(setWords);
        this.gridDisplay.setSelectedSetWordIndex(this.wordManager.getSelectedSetWordIndex());
    }

    async attemptSolve() {
        // Check if word list is ready using the ready flag
        console.log('Attempt solve - checking state:', {
            wordListReady: this.wordListReady,
            wordSetSize: this.wordSet?.size,
            hasSolver: !!this.solver,
            hasGrid: !!this.grid
        });
        
        if (!this.wordListReady || !this.wordSet || this.wordSet.size === 0) {
            console.error('Word list not ready:', {
                wordListReady: this.wordListReady,
                wordSet: this.wordSet,
                size: this.wordSet?.size
            });
            alert('Word list not loaded. Please wait for the word list to finish loading.');
            return;
        }
        
        // Ensure solver is initialized
        if (!this.solver) {
            if (this.grid && this.wordSet.size > 0) {
                this.solver = new Solver(this.grid, this.wordSet);
                console.log('Solver initialized in attemptSolve');
            } else {
                alert('Grid or word list not ready. Please ensure both are loaded.');
                return;
            }
        }
        
        if (!this.solver) {
            alert('Solver not initialized. Please ensure the grid is set up.');
            return;
        }

        this.solveCancelled = false;
        const progressEl = document.getElementById('solve-progress');
        progressEl.textContent = 'Starting solve...\n';

        // Get all possible words from all positions
        const allPossibleWords = [];
        const usedPositions = this.wordManager.getUsedPositions();
        const blacklistedWords = this.wordManager.getBlacklistedWords();

        const updateProgress = (message) => {
            progressEl.textContent += message + '\n';
            progressEl.scrollTop = progressEl.scrollHeight;
        };

        // Find words from all positions
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[0].length; col++) {
                if (this.solveCancelled) {
                    progressEl.textContent += 'Solve cancelled.\n';
                    return;
                }

                updateProgress(`Scanning position (${row},${col})...`);

                const wordsFromPos = this.solver.findWordsDFS(
                    row, 
                    col, 
                    usedPositions, 
                    blacklistedWords,
                    4, 
                    15
                );

                for (const [word, coords] of wordsFromPos) {
                    allPossibleWords.push([word, coords, coords.length]);
                }
            }
        }

        updateProgress(`Found ${allPossibleWords.length} possible words`);
        updateProgress('Attempting to solve...');

        // Solve with progress updates
        const existingWords = this.wordManager.getSetWords();
        
        const onProgress = (attempts, wordCount, coverage) => {
            if (this.solveCancelled) return;
            updateProgress(`Attempts: ${attempts}, Words: ${wordCount}, Coverage: ${coverage.toFixed(1)}%`);
        };

        const shouldCancel = () => this.solveCancelled;

        // Run solver
        setTimeout(() => {
            const solution = this.solver.solvePuzzle(
                allPossibleWords,
                existingWords,
                onProgress,
                shouldCancel,
                this.maxAttempts
            );

            if (this.solveCancelled) {
                return;
            }

            if (solution) {
                const usedPositions = new Set();
                for (const [word, coords] of solution) {
                    for (const [row, col] of coords) {
                        usedPositions.add(`${row},${col}`);
                    }
                }

                const coveragePercent = (usedPositions.size / (this.grid.length * this.grid[0].length)) * 100;

                if (usedPositions.size === this.grid.length * this.grid[0].length) {
                    updateProgress('COMPLETE SOLUTION FOUND!');
                } else {
                    updateProgress(`BEST PARTIAL SOLUTION FOUND!`);
                    updateProgress(`Coverage: ${coveragePercent.toFixed(1)}% (${usedPositions.size}/${this.grid.length * this.grid[0].length} letters)`);
                }

                updateProgress(`Words: ${solution.length}`);
                solution.forEach(([word, coords], i) => {
                    updateProgress(`${i + 1}. ${word}`);
                });

                // Apply solution
                this.wordManager.clearSetWords();
                for (const [word, positions] of solution) {
                    this.wordManager.addSetWord(word, positions);
                }
                this.updateDisplay();
            } else {
                updateProgress('No solution found.');
                updateProgress('Try removing some set words.');
            }
        }, 100);
    }

    cancelSolve() {
        this.solveCancelled = true;
        const progressEl = document.getElementById('solve-progress');
        progressEl.textContent += 'Solve cancelled by user.\n';
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new StrandsApp();
    });
} else {
    new StrandsApp();
}
