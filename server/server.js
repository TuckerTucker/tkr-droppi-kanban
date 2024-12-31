const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Get board file from environment variable or use default
const boardFile = process.env.BOARD_FILE || 'kanban.json';
const BOARDS_DIR = path.join(__dirname, '../boards');
const DATA_FILE = path.join(BOARDS_DIR, boardFile);

// Log the board file being used
console.log('Using board file:', DATA_FILE);

app.use(cors());
app.use(express.json());

// Serve static files from app directory
app.use(express.static(path.join(__dirname, '../app')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/img', express.static(path.join(__dirname, '../img')));

// Ensure boards directory exists
async function ensureBoardsDir() {
    try {
        await fs.mkdir(BOARDS_DIR, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

// Initialize data file with empty arrays if it doesn't exist
async function initDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        const initialData = {
            projectName: "My Kanban Board",
            backlogItems: [],
            progressItems: [],
            completeItems: [],
            onHoldItems: []
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('Created new board file:', DATA_FILE);
    }
}

// Send current board file info to client
app.get('/api/boardinfo', (req, res) => {
    res.json({ 
        boardFile: boardFile,
        fullPath: DATA_FILE 
    });
});

// Get all kanban data
app.get('/api/kanban', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, return default structure
            const defaultData = {
                projectName: 'My Kanban Board',
                backlogItems: [],
                progressItems: [],
                completeItems: [],
                onHoldItems: []
            };
            await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
            console.log('Created default board structure:', DATA_FILE);
            res.json(defaultData);
        } else {
            console.error('Error reading kanban data:', error);
            res.status(500).json({ error: 'Failed to read kanban data' });
        }
    }
});

// Update kanban data
app.post('/api/kanban', async (req, res) => {
    try {
        console.log('Received save request');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { projectName, backlogItems, progressItems, completeItems, onHoldItems } = req.body;
        
        // Validate project name
        if (typeof projectName !== 'string' || !projectName.trim()) {
            console.error('Invalid project name:', projectName);
            return res.status(400).json({ error: 'Invalid project name' });
        }
        
        // Validate the structure of incoming items
        const validateItems = (items) => {
            return Array.isArray(items) && items.every(item => 
                item && typeof item === 'object' && 
                typeof item.title === 'string' && 
                typeof item.content === 'string'
            );
        };

        if (!validateItems(backlogItems) || !validateItems(progressItems) ||
            !validateItems(completeItems) || !validateItems(onHoldItems)) {
            console.error('Invalid data structure detected');
            console.error('backlogItems valid:', validateItems(backlogItems));
            console.error('progressItems valid:', validateItems(progressItems));
            console.error('completeItems valid:', validateItems(completeItems));
            console.error('onHoldItems valid:', validateItems(onHoldItems));
            return res.status(400).json({ error: 'Invalid data structure' });
        }

        // Log the current state
        console.log('Current board file:', DATA_FILE);
        console.log('Directory exists:', await fs.access(path.dirname(DATA_FILE)).then(() => true).catch(() => false));
        console.log('File exists:', await fs.access(DATA_FILE).then(() => true).catch(() => false));

        // Ensure the boards directory exists
        await ensureBoardsDir();
        console.log('Boards directory ensured');

        // Write the file with explicit options
        const dataToSave = JSON.stringify(req.body, null, 2);
        console.log('Writing data to file:', dataToSave);
        
        await fs.writeFile(
            DATA_FILE,
            dataToSave,
            { encoding: 'utf8', flag: 'w', mode: 0o644 }
        );
        console.log('File write completed');

        // Verify the write by reading it back
        try {
            console.log('Verifying saved data...');
            const savedData = await fs.readFile(DATA_FILE, 'utf8');
            console.log('Read back data:', savedData);
            
            const parsed = JSON.parse(savedData);
            const originalString = JSON.stringify(req.body);
            const savedString = JSON.stringify(parsed);
            
            console.log('Original data length:', originalString.length);
            console.log('Saved data length:', savedString.length);
            
            if (originalString === savedString) {
                console.log('Successfully verified save to:', DATA_FILE);
                res.json({ success: true });
            } else {
                console.error('Data mismatch:');
                console.error('Original:', originalString);
                console.error('Saved:', savedString);
                throw new Error('Data verification failed - content mismatch');
            }
        } catch (verifyError) {
            console.error('Failed to verify saved data:', verifyError);
            throw new Error('Failed to verify saved data');
        }
    } catch (error) {
        console.error('Error saving kanban data:', error);
        res.status(500).json({ error: 'Failed to save kanban data: ' + error.message });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../app/index.html'));
});

// Initialize server
async function init() {
    try {
        await ensureBoardsDir();
        await initDataFile();
        
        const server = app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Using board file: ${DATA_FILE}`);
        });

        server.on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
}

init();
