/**
 * Solver Module
 * Contains word finding (DFS) and puzzle solving (backtracking) algorithms
 */

export class Solver {
    constructor(grid, wordSet) {
        this.grid = grid;
        this.wordSet = wordSet || new Set();
        this.prefixTree = this.buildPrefixTree(this.wordSet);
        this.rows = grid.length;
        this.cols = grid[0].length;
    }

    setWordSet(wordSet) {
        this.wordSet = wordSet;
        this.prefixTree = this.buildPrefixTree(wordSet);
    }

    setGrid(grid) {
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
    }

    buildPrefixTree(wordSet) {
        const trie = {};
        for (const word of wordSet) {
            let current = trie;
            for (const letter of word) {
                if (!current[letter]) {
                    current[letter] = {};
                }
                current = current[letter];
            }
            current['$'] = true; // Mark end of word
        }
        return trie;
    }

    hasPrefix(prefix) {
        let current = this.prefixTree;
        for (const letter of prefix) {
            if (!current[letter]) {
                return false;
            }
            current = current[letter];
        }
        return true;
    }

    /**
     * Find all possible words starting from a given position
     * @param {number} startRow - Starting row
     * @param {number} startCol - Starting column
     * @param {Set<string>} usedPositions - Set of positions already used in set words
     * @param {Set<string>} blacklistedWords - Words to exclude
     * @param {number} minLength - Minimum word length
     * @param {number} maxLength - Maximum word length
     * @returns {Array<[string, Array<[number, number]>]>} Array of [word, positions] tuples
     */
    findWordsDFS(startRow, startCol, usedPositions = new Set(), blacklistedWords = new Set(), minLength = 4, maxLength = 15) {
        if (startRow < 0 || startRow >= this.rows || startCol < 0 || startCol >= this.cols) {
            return [];
        }

        const posKey = `${startRow},${startCol}`;
        if (usedPositions.has(posKey)) {
            return [];
        }

        const foundWords = [];
        const uniqueWords = new Map(); // word -> positions (keep longest path)

        // 8 directions: up, down, left, right, and 4 diagonals
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        const dfs = (row, col, currentWord, currentPath, visited) => {
            // Check if current word is valid
            if (currentWord.length >= minLength && 
                this.wordSet.has(currentWord) && 
                !blacklistedWords.has(currentWord)) {
                // Keep if it's a new word or a longer path for existing word
                if (!uniqueWords.has(currentWord) || currentPath.length > uniqueWords.get(currentWord).length) {
                    uniqueWords.set(currentWord, [...currentPath]);
                }
            }

            // Stop if we've reached max length
            if (currentWord.length >= maxLength) {
                return;
            }

            // Early termination: check if any words start with current prefix
            if (!this.hasPrefix(currentWord)) {
                return;
            }

            // Try all 8 directions
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;

                // Check bounds
                if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) {
                    continue;
                }

                // Check if already visited in this path
                const newPosKey = `${newRow},${newCol}`;
                if (visited.has(newPosKey)) {
                    continue;
                }

                // Check if position is used in set words
                if (usedPositions.has(newPosKey)) {
                    continue;
                }

                // Get the letter at the new position
                const letter = this.grid[newRow][newCol].toUpperCase();
                const newWord = currentWord + letter;
                const newPath = [...currentPath, [newRow, newCol]];

                // Add to visited set
                visited.add(newPosKey);

                // Continue searching
                dfs(newRow, newCol, newWord, newPath, visited);

                // Remove from visited set (backtrack)
                visited.delete(newPosKey);
            }
        };

        // Start the search
        const startLetter = this.grid[startRow][startCol].toUpperCase();
        const startVisited = new Set([`${startRow},${startCol}`]);
        dfs(startRow, startCol, startLetter, [[startRow, startCol]], startVisited);

        // Convert to array and sort by length (descending)
        const result = Array.from(uniqueWords.entries()).map(([word, positions]) => [word, positions]);
        result.sort((a, b) => b[0].length - a[0].length);

        return result;
    }

    /**
     * Solve the puzzle using backtracking
     * @param {Array<[string, Array<[number, number]>]>} allWords - All possible words
     * @param {Array<[string, Array<[number, number]>]>} existingWords - Already set words
     * @param {Function} onProgress - Progress callback (attempts, currentSolution, coverage)
     * @param {Function} shouldCancel - Function that returns true if should cancel
     * @param {number} maxAttempts - Maximum number of attempts
     * @returns {Array<[string, Array<[number, number]>]>|null} Solution or null
     */
    solvePuzzle(allWords, existingWords = [], onProgress = null, shouldCancel = () => false, maxAttempts = 100000) {
        const usedPositions = new Set();
        const currentSolution = [];

        // Add existing words to solution
        for (const [word, coords] of existingWords) {
            currentSolution.push([word, coords]);
            for (const [row, col] of coords) {
                usedPositions.add(`${row},${col}`);
            }
        }

        let attempts = 0;
        let bestSolution = [];
        let bestCoverage = usedPositions.size;
        const totalPositions = this.rows * this.cols;

        // Prioritize words by length and position uniqueness
        const prioritizedWords = allWords.map(([word, coords, length]) => {
            let positionScore = 0;
            for (const [row, col] of coords) {
                if ((row === 0 || row === this.rows - 1) && (col === 0 || col === this.cols - 1)) {
                    positionScore += 4; // Corners
                } else if (row === 0 || row === this.rows - 1 || col === 0 || col === this.cols - 1) {
                    positionScore += 2; // Edges
                } else {
                    positionScore += 1; // Interior
                }
            }
            return { word, coords, length, positionScore, priority: -length * 1000 - positionScore };
        }).sort((a, b) => a.priority - b.priority);

        const canPlaceWord = (coords) => {
            for (const [row, col] of coords) {
                if (usedPositions.has(`${row},${col}`)) {
                    return false;
                }
            }
            return true;
        };

        const placeWord = (word, coords) => {
            for (const [row, col] of coords) {
                usedPositions.add(`${row},${col}`);
            }
            currentSolution.push([word, coords]);
        };

        const removeWord = () => {
            const [word, coords] = currentSolution.pop();
            for (const [row, col] of coords) {
                usedPositions.delete(`${row},${col}`);
            }
        };

        const solveRecursive = (wordIndex) => {
            attempts++;

            // Update progress every 1000 attempts
            if (attempts % 1000 === 0) {
                const coverage = usedPositions.size;
                if (coverage > bestCoverage) {
                    bestCoverage = coverage;
                    bestSolution = currentSolution.map(([w, c]) => [w, [...c]]);
                }
                
                if (onProgress) {
                    const coveragePercent = (coverage / totalPositions) * 100;
                    onProgress(attempts, currentSolution.length, coveragePercent);
                }

                if (shouldCancel()) {
                    return false;
                }
            }

            // Check if we've used all positions
            if (usedPositions.size === totalPositions) {
                return true;
            }

            // Stop if we've exceeded max attempts
            if (attempts > maxAttempts) {
                return false;
            }

            // Try each remaining word
            for (let i = wordIndex; i < prioritizedWords.length; i++) {
                const { word, coords } = prioritizedWords[i];

                if (canPlaceWord(coords)) {
                    placeWord(word, coords);

                    // Recursively try to solve with this word placed
                    if (solveRecursive(i + 1)) {
                        return true;
                    }

                    // Backtrack
                    removeWord();
                }
            }

            return false;
        };

        // Start solving
        const completeSolution = solveRecursive(0);

        if (completeSolution) {
            return currentSolution;
        } else if (bestSolution.length > 0) {
            return bestSolution;
        } else {
            return existingWords.length > 0 ? existingWords : null;
        }
    }
}

