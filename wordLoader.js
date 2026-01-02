/**
 * Word List Loader
 * Loads and processes the word list file
 */

export async function loadWordList() {
    try {
        const response = await fetch('words_alpha.txt');
        if (!response.ok) {
            throw new Error('Failed to load word list');
        }
        
        const text = await response.text();
        const lines = text.split('\n');
        const wordSet = new Set();
        
        for (const line of lines) {
            const word = line.trim().toUpperCase();
            if (word.length >= 4) {
                wordSet.add(word);
            }
        }
        
        return wordSet;
    } catch (error) {
        console.error('Error loading word list:', error);
        // Fallback: return empty set or try to load from original location
        try {
            const response = await fetch('original python strands/words_alpha.txt');
            if (response.ok) {
                const text = await response.text();
                const lines = text.split('\n');
                const wordSet = new Set();
                for (const line of lines) {
                    const word = line.trim().toUpperCase();
                    if (word.length >= 4) {
                        wordSet.add(word);
                    }
                }
                return wordSet;
            }
        } catch (e) {
            console.error('Fallback load also failed:', e);
        }
        return new Set();
    }
}

