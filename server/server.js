const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from app directory
app.use(express.static(path.join(__dirname, '../app')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/img', express.static(path.join(__dirname, '../img')));

const BOARDS_DIR = path.join(__dirname, '../boards');
const DATA_FILE = path.join(BOARDS_DIR, 'kanban.json');

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
            backlogItems: [],
            progressItems: [],
            completeItems: [],
            onHoldItems: []
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Get all kanban data
app.get('/api/kanban', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading kanban data:', error);
        res.status(500).json({ error: 'Failed to read kanban data' });
    }
});

// Update kanban data
app.post('/api/kanban', async (req, res) => {
    try {
        const { backlogItems, progressItems, completeItems, onHoldItems } = req.body;
        
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
            return res.status(400).json({ error: 'Invalid data structure' });
        }

        const data = { backlogItems, progressItems, completeItems, onHoldItems };
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving kanban data:', error);
        res.status(500).json({ error: 'Failed to save kanban data' });
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
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Please try a different port.`);
                process.exit(1);
            } else {
                console.error('Server error:', error);
            }
        });
    } catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
}

init();
