/**
 * Grid Display Module
 * Handles rendering and interaction with the puzzle grid
 */

export class GridDisplay {
    constructor(canvasId, onCellClick, onCellEdit = null) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onCellClick = onCellClick;
        this.onCellEdit = onCellEdit;
        this.grid = null;
        this.rows = 0;
        this.cols = 0;
        this.cellSize = 50;
        this.padding = 5;
        this.setWords = [];
        this.proposedWord = null;
        this.selectedSetWordIndex = -1;
        this.selectedFoundWordPositions = null;
        this.selectedCellForWords = null; // Track which cell was clicked to show possible words (for green highlight)
        this.usedPositions = new Set();
        this.editMode = false; // Start in solve mode (editMode = false)
        this.editingCell = null;
        this.animationFrame = null; // For animated dotted lines
        this.dashOffset = 0; // Animation offset for dotted lines
        
        this.setupCanvas();
        this.startAnimation();
    }
    
    startAnimation() {
        // Animation removed - using simple static dotted lines instead
        // This method kept for compatibility but does nothing
    }
    
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    setEditMode(enabled) {
        console.log('Setting edit mode:', enabled);
        this.editMode = enabled;
        
        // If switching to solve mode, stop any active editing
        if (!enabled && this.editingCell) {
            this.stopEditing();
        }
        
        // If switching to edit mode, clear solve mode selections
        if (enabled) {
            this.selectedCellForWords = null;
            this.proposedWord = null;
            this.selectedFoundWordPositions = null;
        }
        
        if (this.canvas) {
            this.canvas.style.cursor = enabled ? 'crosshair' : 'pointer';
        }
        if (this.grid) {
            this.render();
        }
        console.log('Edit mode set to:', this.editMode);
    }

    setupCanvas() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.getCellFromPosition(x, y);
            
            console.log('Canvas click:', {
                cell,
                editMode: this.editMode,
                hasOnCellEdit: !!this.onCellEdit,
                hasOnCellClick: !!this.onCellClick
            });
            
            if (cell) {
                if (this.editMode && this.onCellEdit) {
                    // Edit mode: start editing the cell
                    console.log('Starting edit mode for cell:', cell);
                    this.startEditing(cell.row, cell.col);
                } else if (this.onCellClick) {
                    // Solve mode: find words from this cell
                    console.log('Calling onCellClick for cell:', cell);
                    this.onCellClick(cell.row, cell.col);
                } else {
                    console.warn('No click handler available');
                }
            }
            // Blank space clicks are ignored - words can be deselected by clicking them again
        });
        
        // Handle keyboard input for editing - only in edit mode
        document.addEventListener('keydown', (e) => {
            // Only allow editing if we're in edit mode
            if (!this.editMode) {
                return;
            }
            
            if (this.editingCell && /^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                this.editCell(this.editingCell.row, this.editingCell.col, e.key.toUpperCase());
            } else if (this.editingCell && e.key === 'Backspace') {
                e.preventDefault();
                this.editCell(this.editingCell.row, this.editingCell.col, '');
            } else if (this.editingCell && e.key === 'Escape') {
                e.preventDefault();
                this.stopEditing();
            }
        });
    }
    
    startEditing(row, col) {
        // Only allow editing if in edit mode
        if (!this.editMode) {
            console.warn('Cannot start editing - not in edit mode');
            return;
        }
        this.editingCell = { row, col };
        this.render();
    }
    
    stopEditing() {
        this.editingCell = null;
        this.render();
    }
    
    editCell(row, col, letter) {
        // Only allow editing if in edit mode
        if (!this.editMode) {
            console.warn('Cannot edit cell - not in edit mode');
            return;
        }
        
        if (this.grid && row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            if (letter && /^[A-Z]$/.test(letter)) {
                this.grid[row][col] = letter;
                
                // Auto-advance to next cell
                this.advanceToNextCell(row, col);
            } else if (letter === '') {
                this.grid[row][col] = 'A'; // Default to A if cleared
            }
            if (this.onCellEdit) {
                this.onCellEdit(this.grid);
            }
            this.render();
        }
    }

    advanceToNextCell(currentRow, currentCol) {
        let newCol = currentCol + 1;
        let newRow = currentRow;
        
        // Move to next column, or next row if at end
        if (newCol >= this.cols) {
            newCol = 0;
            newRow++;
            if (newRow >= this.rows) {
                newRow = 0; // Wrap around to start
            }
        }
        
        // Start editing the next cell
        this.startEditing(newRow, newCol);
    }

    setGrid(grid) {
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
        this.resizeCanvas();
        this.render();
    }

    resizeCanvas() {
        const width = this.cols * (this.cellSize + this.padding) + this.padding;
        const height = this.rows * (this.cellSize + this.padding) + this.padding;
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    getCellFromPosition(x, y) {
        const col = Math.floor((x - this.padding) / (this.cellSize + this.padding));
        const row = Math.floor((y - this.padding) / (this.cellSize + this.padding));
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return { row, col };
        }
        return null;
    }

    getCellPosition(row, col) {
        const x = this.padding + col * (this.cellSize + this.padding) + this.cellSize / 2;
        const y = this.padding + row * (this.cellSize + this.padding) + this.cellSize / 2;
        return { x, y };
    }

    setSetWords(setWords) {
        this.setWords = setWords;
        this.updateUsedPositions();
        this.render();
    }

    setProposedWord(word, positions) {
        this.proposedWord = positions ? { word, positions } : null;
        this.render();
    }

    setSelectedSetWordIndex(index) {
        this.selectedSetWordIndex = index;
        this.render();
    }

    setSelectedFoundWord(positions) {
        this.selectedFoundWordPositions = positions;
        this.render();
    }
    
    setSelectedCellForWords(row, col) {
        this.selectedCellForWords = row !== null && col !== null ? { row, col } : null;
        this.render();
    }

    updateUsedPositions() {
        this.usedPositions.clear();
        for (const [word, positions] of this.setWords) {
            for (const pos of positions) {
                this.usedPositions.add(`${pos[0]},${pos[1]}`);
            }
        }
    }

    render() {
        if (!this.grid) return;

        // Clear canvas with background color
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Only draw word connections in solve mode (hide them in edit mode)
        if (!this.editMode) {
            // Draw connecting lines FIRST (so they appear behind the circles)
            for (let i = 0; i < this.setWords.length; i++) {
                const [word, positions] = this.setWords[i];
                const color = i === this.selectedSetWordIndex ? '#db9e00' : '#3f9ebc'; // strands-dark-yellow or strands-dark-mint
                this.drawWordLines(positions, color, 8, false); // solid lines
            }

            // Draw proposed word lines (behind cells) - these show when selecting from possible words
            // First segment (from starting cell) is solid, rest are dotted with animation
            if (this.proposedWord && this.proposedWord.positions && this.proposedWord.positions.length > 1) {
                this.drawProposedWordLines(this.proposedWord.positions, this.selectedCellForWords);
            }
            
            // Draw selected found word lines (for found words selected from the found words list)
            if (this.selectedFoundWordPositions) {
                this.drawWordLines(this.selectedFoundWordPositions, '#db9e00', 8, false); // strands-dark-yellow, solid
            }
        }

        // Draw grid cells (on top of lines)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.drawCell(row, col);
            }
        }
    }

    drawCell(row, col) {
        const { x, y } = this.getCellPosition(row, col);
        const posKey = `${row},${col}`;
        const radius = this.cellSize / 2;
        
        // Determine cell color - using NYT Strands colors
        let bgColor = '#ffffff'; // White background for unselected cells
        let borderColor = '#e2e8f0'; // Light gray border
        let textColor = '#121212';
        let borderWidth = 1.5;

        // Check if editing this cell (only in edit mode)
        if (this.editMode && this.editingCell && this.editingCell.row === row && this.editingCell.col === col) {
            bgColor = '#aedfee'; // strands-blue
            borderColor = '#0f7ea0'; // strands-darker-mint
            borderWidth = 2.5;
        }
        // Check if this is the selected cell for showing possible words (green highlight)
        else if (!this.editMode && this.selectedCellForWords && this.selectedCellForWords.row === row && this.selectedCellForWords.col === col) {
            bgColor = '#22c55e'; // Green for selected cell
            borderColor = '#16a34a'; // Darker green border
            borderWidth = 2.5;
        }
        // Check if in proposed word (temporary display when selecting from possible words list) - green
        else if (!this.editMode && this.proposedWord && this.proposedWord.positions) {
            const inProposed = this.proposedWord.positions.some(p => p[0] === row && p[1] === col);
            if (inProposed) {
                // Check if this is the starting cell (should have solid border)
                const isStartCell = this.selectedCellForWords && 
                    this.selectedCellForWords.row === row && 
                    this.selectedCellForWords.col === col;
                
                bgColor = '#22c55e'; // Green for proposed words from possible words list
                borderColor = '#16a34a'; // Darker green border
                borderWidth = isStartCell ? 2.5 : 2; // Thicker border for starting cell
                
                // For non-starting cells, we'll draw a dotted border
                // This will be handled in the drawing code below
            }
        }
        // Check if in selected found word (highlight when a found word is selected from the found words list)
        else if (!this.editMode && this.selectedFoundWordPositions) {
            const inSelectedFound = this.selectedFoundWordPositions.some(p => p[0] === row && p[1] === col);
            if (inSelectedFound) {
                bgColor = '#f8cd05'; // Yellow to highlight selected found word
                borderColor = '#db9e00';
                borderWidth = 2.5;
            }
        }
        // Check if in set word
        else {
            for (let i = 0; i < this.setWords.length; i++) {
                const [word, positions] = this.setWords[i];
                const inWord = positions.some(p => p[0] === row && p[1] === col);
                if (inWord) {
                    if (i === this.selectedSetWordIndex) {
                        bgColor = '#f8cd05'; // strands-yellow for selected
                        borderColor = '#db9e00';
                        borderWidth = 2.5;
                    } else {
                        bgColor = '#aedfee'; // strands-blue (light blue)
                        borderColor = '#3f9ebc'; // strands-dark-mint
                        borderWidth = 2;
                    }
                    break;
                }
            }
        }

        // Check if used (but not in a word) - keep white background
        if (bgColor === '#ffffff' && this.usedPositions.has(posKey)) {
            bgColor = '#f5f5f5';
            textColor = '#727272';
        }

        // Draw circular cell background
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
        this.ctx.fillStyle = bgColor;
        this.ctx.fill();
        
        // Draw circular border
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - borderWidth / 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = borderWidth;
        
        // Check if this is a proposed word cell that's not the starting cell (dotted border)
        let useDottedBorder = false;
        if (!this.editMode && this.proposedWord && this.proposedWord.positions) {
            const inProposed = this.proposedWord.positions.some(p => p[0] === row && p[1] === col);
            if (inProposed && this.selectedCellForWords) {
                const isStartCell = this.selectedCellForWords.row === row && this.selectedCellForWords.col === col;
                if (!isStartCell) {
                    useDottedBorder = true;
                }
            }
        }
        
        if (useDottedBorder) {
            // Draw dotted border (no animation)
            this.ctx.setLineDash([4, 4]);
        } else {
            this.ctx.setLineDash([]); // solid border
        }
        
        this.ctx.stroke();
        
        // Reset line dash
        this.ctx.setLineDash([]);

        // Draw letter
        this.ctx.fillStyle = textColor;
        this.ctx.font = `bold ${this.cellSize * 0.45}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.grid[row][col], x, y);
    }

    drawWordLines(positions, color, width, dotted = false) {
        if (positions.length < 2) return;

        // Draw thick connecting lines between circular cells
        const radius = this.cellSize / 2;
        const lineWidth = 10; // Thick uniform lines like NYT Strands

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Set up dotted line pattern if needed
        if (dotted) {
            this.ctx.setLineDash([8, 6]); // 8px dash, 6px gap
        } else {
            this.ctx.setLineDash([]); // solid line
        }

        // Draw lines connecting each pair of adjacent positions
        for (let i = 0; i < positions.length - 1; i++) {
            const current = this.getCellPosition(positions[i][0], positions[i][1]);
            const next = this.getCellPosition(positions[i + 1][0], positions[i + 1][1]);
            
            // Calculate angle between centers
            const angle = Math.atan2(next.y - current.y, next.x - current.x);
            
            // Calculate start point (edge of first circle)
            const startX = current.x + Math.cos(angle) * (radius - lineWidth / 2 - 1);
            const startY = current.y + Math.sin(angle) * (radius - lineWidth / 2 - 1);
            
            // Calculate end point (edge of second circle)
            const endX = next.x - Math.cos(angle) * (radius - lineWidth / 2 - 1);
            const endY = next.y - Math.sin(angle) * (radius - lineWidth / 2 - 1);
            
            // Draw the line
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    drawProposedWordLines(positions, startCell) {
        if (positions.length < 2) return;
        
        const radius = this.cellSize / 2;
        const lineWidth = 10;
        const color = '#22c55e'; // Green
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Find the index of the starting cell in the positions array
        let startIndex = 0;
        if (startCell) {
            for (let i = 0; i < positions.length; i++) {
                if (positions[i][0] === startCell.row && positions[i][1] === startCell.col) {
                    startIndex = i;
                    break;
                }
            }
        }
        
        // Draw lines connecting each pair of adjacent positions
        for (let i = 0; i < positions.length - 1; i++) {
            const current = this.getCellPosition(positions[i][0], positions[i][1]);
            const next = this.getCellPosition(positions[i + 1][0], positions[i + 1][1]);
            
            // Calculate angle between centers
            const angle = Math.atan2(next.y - current.y, next.x - current.x);
            
            // Calculate start point (edge of first circle)
            const startX = current.x + Math.cos(angle) * (radius - lineWidth / 2 - 1);
            const startY = current.y + Math.sin(angle) * (radius - lineWidth / 2 - 1);
            
            // Calculate end point (edge of second circle)
            const endX = next.x - Math.cos(angle) * (radius - lineWidth / 2 - 1);
            const endY = next.y - Math.sin(angle) * (radius - lineWidth / 2 - 1);
            
            // First segment (from starting cell) is solid, rest are dotted
            if (i === startIndex) {
                // Solid line for first segment
                this.ctx.setLineDash([]);
            } else {
                // Dotted line for rest (simple, no animation)
                this.ctx.setLineDash([8, 6]);
            }
            
            // Draw the line
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
}

