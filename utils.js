/**
 * Utility functions for the Strands Solver
 */

/**
 * Parse coordinate text into array of [row, col] tuples
 * @param {string} coordText - Text containing coordinates
 * @returns {Array<[number, number]>} Array of coordinate tuples
 */
export function parseCoordinates(coordText) {
    const coords = [];
    try {
        const text = coordText.trim();
        if (!text) return [];

        // Split by whitespace or newlines
        const parts = text.replace(/\n/g, ' ').split(/\s+/);

        for (const part of parts) {
            // Remove parentheses if present
            const cleaned = part.replace(/[()]/g, '');
            if (cleaned.includes(',')) {
                const [row, col] = cleaned.split(',').map(s => parseInt(s.trim(), 10));
                if (!isNaN(row) && !isNaN(col)) {
                    coords.push([row, col]);
                }
            }
        }
    } catch (error) {
        console.error('Error parsing coordinates:', error);
        return [];
    }
    return coords;
}

/**
 * Validate grid dimensions
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {boolean} True if valid
 */
export function validateGridSize(rows, cols) {
    return rows > 0 && rows <= 20 && cols > 0 && cols <= 20;
}

/**
 * Validate that a grid is properly filled
 * @param {Array<Array<string>>} grid - 2D array of letters
 * @returns {boolean} True if valid
 */
export function validateGrid(grid) {
    if (!grid || grid.length === 0) return false;
    
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    
    if (cols === 0) return false;
    
    // Check all rows have same length
    for (const row of grid) {
        if (row.length !== cols) return false;
    }
    
    // Check all cells contain single uppercase letters
    for (const row of grid) {
        for (const cell of row) {
            if (!/^[A-Z]$/.test(cell)) return false;
        }
    }
    
    return true;
}

/**
 * Parse text input into grid
 * @param {string} text - Text input (one row per line)
 * @returns {Array<Array<string>>|null} 2D array of letters or null if invalid
 */
export function parseTextGrid(text) {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;
    
    const grid = [];
    const cols = lines[0].length;
    
    for (const line of lines) {
        const cleaned = line.trim().toUpperCase().replace(/[^A-Z]/g, '');
        if (cleaned.length !== cols) return null; // All rows must have same length
        grid.push(cleaned.split(''));
    }
    
    return validateGrid(grid) ? grid : null;
}

/**
 * Create empty grid
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Array<Array<string>>} Empty grid filled with 'A'
 */
export function createEmptyGrid(rows, cols) {
    return Array(rows).fill(null).map(() => Array(cols).fill('A'));
}

/**
 * Deep copy a 2D array
 * @param {Array<Array>} arr - 2D array to copy
 * @returns {Array<Array>} Deep copy of the array
 */
export function deepCopy2D(arr) {
    return arr.map(row => [...row]);
}

/**
 * Get all available letters from grid
 * @param {Array<Array<string>>} grid - 2D array of letters
 * @returns {Set<string>} Set of available letters
 */
export function getAvailableLetters(grid) {
    const letters = new Set();
    for (const row of grid) {
        for (const letter of row) {
            letters.add(letter);
        }
    }
    return letters;
}

