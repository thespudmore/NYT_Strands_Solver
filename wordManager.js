/**
 * Word Manager Module
 * Handles set words, blacklist, and word list UI
 */

export class WordManager {
    constructor() {
        this.setWords = []; // Array of [word, positions] tuples
        this.blacklistedWords = new Set();
        this.selectedSetWordIndex = -1;
        this.foundWordsData = []; // Store found words for selection
        this.selectedFoundWordIndex = -1; // Track selected found word
        this.onSetWordSelect = null; // Callback when a set word is selected from found words list
    }

    /**
     * Add a word to set words
     * @param {string} word - The word
     * @param {Array<[number, number]>} positions - Array of [row, col] positions
     */
    addSetWord(word, positions) {
        // Check if word already exists
        const exists = this.setWords.some(([w, p]) => w === word);
        if (!exists) {
            this.setWords.push([word, positions]);
            this.updateSetWordsDisplay();
        }
    }

    /**
     * Remove a set word by index
     * @param {number} index - Index of word to remove
     * @returns {[string, Array]} Removed word tuple or null
     */
    removeSetWord(index) {
        if (index >= 0 && index < this.setWords.length) {
            const removed = this.setWords.splice(index, 1)[0];
            if (this.selectedSetWordIndex === index) {
                this.selectedSetWordIndex = -1;
            } else if (this.selectedSetWordIndex > index) {
                this.selectedSetWordIndex--;
            }
            this.updateSetWordsDisplay();
            return removed;
        }
        return null;
    }

    /**
     * Blacklist a word
     * @param {string} word - Word to blacklist
     */
    blacklistWord(word) {
        this.blacklistedWords.add(word);
    }

    /**
     * Blacklist and remove a set word
     * @param {number} index - Index of word to blacklist and remove
     */
    blacklistAndRemoveWord(index) {
        const removed = this.removeSetWord(index);
        if (removed) {
            this.blacklistWord(removed[0]);
        }
    }

    /**
     * Clear all set words
     */
    clearSetWords() {
        this.setWords = [];
        this.selectedSetWordIndex = -1;
        this.updateSetWordsDisplay();
    }

    /**
     * Clear blacklist
     */
    clearBlacklist() {
        this.blacklistedWords.clear();
    }

    /**
     * Get all used positions from set words
     * @returns {Set<string>} Set of position keys "row,col"
     */
    getUsedPositions() {
        const used = new Set();
        for (const [word, positions] of this.setWords) {
            for (const [row, col] of positions) {
                used.add(`${row},${col}`);
            }
        }
        return used;
    }

    /**
     * Update the set words display
     */
    updateSetWordsDisplay() {
        const container = document.getElementById('set-words-list');
        container.innerHTML = '';

        this.setWords.forEach(([word, positions], index) => {
            const item = document.createElement('div');
            item.className = `word-item set-word ${index === this.selectedSetWordIndex ? 'selected' : ''}`;
            item.textContent = `${index + 1}. ${word}`;
            item.dataset.index = index;
            
            item.addEventListener('click', () => {
                this.selectSetWord(index);
            });

            item.addEventListener('dblclick', () => {
                this.removeSetWord(index);
            });

            container.appendChild(item);
        });
    }

    /**
     * Select a set word
     * @param {number} index - Index of word to select
     */
    selectSetWord(index) {
        const wasSelected = this.selectedSetWordIndex === index;
        this.selectedSetWordIndex = wasSelected ? -1 : index;
        this.updateSetWordsDisplay();
        
        // Notify callback - pass -1 if deselected
        if (this.onSetWordSelect) {
            if (this.selectedSetWordIndex >= 0) {
                const [word, positions] = this.setWords[this.selectedSetWordIndex];
                this.onSetWordSelect(word, positions, this.selectedSetWordIndex);
            } else {
                // Word was deselected - notify with null/undefined to indicate deselection
                this.onSetWordSelect(null, null, -1);
            }
        }
        
        return this.selectedSetWordIndex;
    }
    
    /**
     * Set callback for set word selection (from found words list)
     * @param {Function} callback - Callback(word, positions, index)
     */
    setSetWordSelectCallback(callback) {
        this.onSetWordSelect = callback;
    }

    /**
     * Update proposed word display
     * @param {string|null} word - The proposed word or null
     */
    updateProposedWord(word) {
        const display = document.getElementById('proposed-word');
        if (display) {
            display.textContent = word || '';
        }
    }

    /**
     * Update possible words list
     * @param {Array<[string, Array<[number, number]>]>} words - Array of [word, positions] tuples
     */
    updatePossibleWords(words) {
        this.foundWordsData = words;
        const container = document.getElementById('possible-words');
        container.innerHTML = '';

        if (words.length === 0) {
            const item = document.createElement('div');
            item.className = 'word-item';
            item.textContent = 'No words found. Click a letter to search.';
            item.style.cursor = 'default';
            container.appendChild(item);
            return;
        }

        // Display all words (no limit)
        words.forEach(([word, positions], index) => {
            const item = document.createElement('div');
            item.className = 'word-item';
            item.textContent = word;
            item.dataset.index = index;
            
            item.addEventListener('click', () => {
                // Remove previous selection
                container.querySelectorAll('.word-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
                
                // Track selected found word index
                this.selectedFoundWordIndex = index;
                
                // Return selected word data
                if (this.onWordSelect) {
                    this.onWordSelect(word, positions);
                }
            });

            container.appendChild(item);
        });
    }

    /**
     * Set callback for word selection
     * @param {Function} callback - Callback(word, positions)
     */
    setWordSelectCallback(callback) {
        this.onWordSelect = callback;
    }

    /**
     * Get set words
     * @returns {Array<[string, Array<[number, number]>]>}
     */
    getSetWords() {
        return this.setWords;
    }

    /**
     * Get blacklisted words
     * @returns {Set<string>}
     */
    getBlacklistedWords() {
        return this.blacklistedWords;
    }

    /**
     * Get selected set word index
     * @returns {number}
     */
    getSelectedSetWordIndex() {
        return this.selectedSetWordIndex;
    }

    /**
     * Get selected found word index
     * @returns {number}
     */
    getSelectedFoundWordIndex() {
        return this.selectedFoundWordIndex;
    }

    /**
     * Get selected found word data
     * @returns {[string, Array<[number, number]>]|null}
     */
    getSelectedFoundWord() {
        if (this.selectedFoundWordIndex >= 0 && this.selectedFoundWordIndex < this.foundWordsData.length) {
            return this.foundWordsData[this.selectedFoundWordIndex];
        }
        return null;
    }
}

