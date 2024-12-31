const addBtns = document.querySelectorAll(".add-btn:not(.solid)");
const saveItemBtns = document.querySelectorAll(".solid");
const addItemContainers = document.querySelectorAll(".add-container");
const addItems = document.querySelectorAll(".add-item");

// Kanban Board Elements
const backlogListEl = document.querySelector(".to-do-column .drag-item-list");
const progressListEl = document.querySelector(".doing-column .drag-item-list");
const completeListEl = document.querySelector(".done-column .drag-item-list");
const onHoldListEl = document.querySelector(".on-hold-column .drag-item-list");

const backlogList = document.getElementById("backlog-list");
const progressList = document.getElementById("progress-list");
const completeList = document.getElementById("complete-list");
const onHoldList = document.getElementById("on-hold-list");

// Items
let projectName = 'My Kanban Board';
let updatedOnLoad = false;

// Initialize Arrays
let backlogListArray = [];
let progressListArray = [];
let completeListArray = [];
let onHoldListArray = [];
let listArrays = [backlogListArray, progressListArray, completeListArray, onHoldListArray];
let listColumns = [backlogListEl, progressListEl, completeListEl, onHoldListEl];

// Drag Functionality
let draggedItem;
let dragging = false;
let currentColumn;

// Set server data
async function updateSavedColumns() {
    const data = {
        projectName,
        backlogItems: backlogListArray,
        progressItems: progressListArray,
        completeItems: completeListArray,
        onHoldItems: onHoldListArray,
    };

    console.log('Preparing to save data:', data);
    console.log('Arrays state:', {
        backlog: backlogListArray.length,
        progress: progressListArray.length,
        complete: completeListArray.length,
        onHold: onHoldListArray.length
    });

    try {
        console.log('Sending data to server...');
        const response = await fetch('/api/kanban', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        console.log('Server response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(errorData.error || 'Failed to save data to server');
        }
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (!result.success) {
            throw new Error('Server did not confirm successful save');
        }
        
        console.log('Successfully saved to server');
    } catch (error) {
        console.error('Error saving to server:', error);
        alert(`Failed to save changes: ${error.message}`);
        throw error;
    }
}

// Load data from server
async function loadFromServer() {
    try {
        const response = await fetch('/api/kanban');
        if (!response.ok) {
            throw new Error('Failed to load data from server');
        }
        const data = await response.json();
        projectName = data.projectName || 'My Kanban Board';
        backlogListArray = data.backlogItems || [];
        progressListArray = data.progressItems || [];
        completeListArray = data.completeItems || [];
        onHoldListArray = data.onHoldItems || [];
        console.log('Loaded data from server:', data);
    } catch (error) {
        console.error('Error loading from server:', error);
        // Use empty arrays if server load fails
        projectName = 'My Kanban Board';
        backlogListArray = [];
        progressListArray = [];
        completeListArray = [];
        onHoldListArray = [];
    }
}

// Initialize on page load
async function initialize() {
    try {
        await loadFromServer();
        updateDOM();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Update DOM - Create Project Title and Cards
function updateDOM() {
    // Update project title
    const titleEl = document.querySelector('.main-title');
    if (titleEl) {
        titleEl.textContent = projectName;
        titleEl.contentEditable = true;
        titleEl.addEventListener('focusout', updateProjectName);
    }
    
    // Clear lists
    if (backlogListEl) backlogListEl.textContent = '';
    if (progressListEl) progressListEl.textContent = '';
    if (completeListEl) completeListEl.textContent = '';
    if (onHoldListEl) onHoldListEl.textContent = '';
    
    // Create Cards
    if (backlogListEl) backlogListArray.forEach((item, index) => createItemEl(backlogListEl, 0, item, index));
    if (progressListEl) progressListArray.forEach((item, index) => createItemEl(progressListEl, 1, item, index));
    if (completeListEl) completeListArray.forEach((item, index) => createItemEl(completeListEl, 2, item, index));
    if (onHoldListEl) onHoldListArray.forEach((item, index) => createItemEl(onHoldListEl, 3, item, index));
}

// Update Project Name
async function updateProjectName(e) {
    const newName = e.target.textContent.trim();
    if (newName && newName !== projectName) {
        projectName = newName;
        await updateSavedColumns();
    } else {
        e.target.textContent = projectName;
    }
}

// Configure marked to preserve line breaks
marked.use({
    breaks: true,
    gfm: true
});

// Create DOM Elements for each list item
function createItemEl(columnEl, column, item, index) {
    // List Item
    const listEl = document.createElement('li');
    listEl.id = index;
    listEl.classList.add('drag-item');
    listEl.draggable = true;
    listEl.setAttribute('ondragstart', 'drag(event)');

    // Header
    const header = document.createElement('div');
    header.classList.add('drag-item-header');

    // Drag Icon
    const dragIcon = document.createElement('span');
    dragIcon.classList.add('drag-icon');
    dragIcon.innerHTML = '⋮⋮';
    header.appendChild(dragIcon);

    // Title
    const title = document.createElement('div');
    title.classList.add('drag-item-title');
    title.contentEditable = true;
    title.textContent = item.title || '';
    title.setAttribute('onfocusout', `updateItem(${index}, ${column})`);
    header.appendChild(title);

    // Actions Container
    const actions = document.createElement('div');
    actions.classList.add('drag-item-actions');

    // Normal Buttons
    const normalButtons = document.createElement('div');
    normalButtons.classList.add('normal-buttons');

    // Collapse Button
    const collapseBtn = document.createElement('button');
    collapseBtn.classList.add('action-btn', 'collapse-btn');
    collapseBtn.innerHTML = item.collapsed ? '▶' : '▼';
    collapseBtn.onclick = () => toggleCollapse(listEl);
    normalButtons.appendChild(collapseBtn);

    // Edit Button
    const editBtn = document.createElement('button');
    editBtn.classList.add('action-btn', 'edit-btn');
    editBtn.innerHTML = '✎';
    editBtn.onclick = () => {
        // Expand card if collapsed
        const contentWrapper = listEl.querySelector('.drag-item-content-wrapper');
        const collapseBtn = listEl.querySelector('.collapse-btn');
        if (contentWrapper.style.display === 'none') {
            contentWrapper.style.display = 'block';
            collapseBtn.innerHTML = '▼';
        }
        
        const contentEdit = listEl.querySelector('.content-edit');
        const contentDisplay = listEl.querySelector('.content-display');
        const editButtons = listEl.querySelector('.edit-buttons');
        contentEdit.style.display = 'block';
        contentDisplay.style.display = 'none';
        normalButtons.style.display = 'none';
        editButtons.style.display = 'flex';
        contentEdit.focus();
    };
    normalButtons.appendChild(editBtn);

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('action-btn', 'delete-btn');
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent event bubbling
        await confirmDelete(index, column);
    });
    normalButtons.appendChild(deleteBtn);

    // Edit Buttons
    const editButtons = document.createElement('div');
    editButtons.classList.add('edit-buttons');
    editButtons.style.display = 'none';

    // Save Button
    const saveBtn = document.createElement('button');
    saveBtn.classList.add('action-btn', 'save-btn');
    saveBtn.innerHTML = '✓';
    saveBtn.onclick = () => saveContent(listEl, index, column);
    editButtons.appendChild(saveBtn);

    // Cancel Button
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('action-btn', 'cancel-btn');
    cancelBtn.innerHTML = '↺';
    cancelBtn.onclick = () => cancelEdit(listEl, item);
    editButtons.appendChild(cancelBtn);

    // Add both button sets to actions
    actions.appendChild(normalButtons);
    actions.appendChild(editButtons);
    header.appendChild(actions);

    // Content Wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('drag-item-content-wrapper');
    if (item.collapsed) {
        contentWrapper.style.display = 'none';
    }

    // Content Edit
    const contentEdit = document.createElement('div');
    contentEdit.classList.add('content-edit');
    contentEdit.contentEditable = true;
    contentEdit.textContent = item.content || '';
    contentEdit.style.display = 'none';
    contentEdit.dataset.originalContent = item.content || '';
    contentWrapper.appendChild(contentEdit);

    // Content Display
    const contentDisplay = document.createElement('div');
    contentDisplay.classList.add('content-display');
    contentDisplay.innerHTML = marked.parse(item.content || '');
    contentWrapper.appendChild(contentDisplay);

    // Assemble the card
    listEl.appendChild(header);
    listEl.appendChild(contentWrapper);
    columnEl.appendChild(listEl);

    return listEl;
}

// Save content changes
async function saveContent(listEl, index, column) {
    const contentEdit = listEl.querySelector('.content-edit');
    const contentDisplay = listEl.querySelector('.content-display');
    const normalButtons = listEl.querySelector('.normal-buttons');
    const editButtons = listEl.querySelector('.edit-buttons');
    const title = listEl.querySelector('.drag-item-title');
    
    // Update display content with markdown
    contentDisplay.innerHTML = marked.parse(contentEdit.textContent || '');
    contentDisplay.style.display = 'block';
    contentEdit.style.display = 'none';
    
    // Show normal buttons, hide edit buttons
    normalButtons.style.display = 'flex';
    editButtons.style.display = 'none';
    
    // Update the array data
    const selectedArray = listArrays[column];
    if (selectedArray) {
        selectedArray[index] = {
            ...selectedArray[index],
            title: title.textContent.trim() || '',
            content: contentEdit.textContent.trim() || '',
            collapsed: listEl.querySelector('.drag-item-content-wrapper').style.display === 'none'
        };
        
        console.log('Saving card data:', selectedArray[index]);
        
        // Save to server
        try {
            await rebuildArrays(); // This will trigger updateSavedColumns
            // Update the original content after successful save
            contentEdit.dataset.originalContent = contentEdit.textContent.trim() || '';
        } catch (error) {
            console.error('Failed to save changes:', error);
            // Show error message to user
            alert('Failed to save changes. Please try again.');
            // Revert changes
            cancelEdit(listEl, selectedArray[index]);
        }
    }
}

// Cancel content edit
function cancelEdit(listEl, item) {
    const contentEdit = listEl.querySelector('.content-edit');
    const contentDisplay = listEl.querySelector('.content-display');
    const normalButtons = listEl.querySelector('.normal-buttons');
    const editButtons = listEl.querySelector('.edit-buttons');
    
    // Restore original content
    contentEdit.textContent = contentEdit.dataset.originalContent;
    contentDisplay.style.display = 'block';
    contentEdit.style.display = 'none';
    
    // Show normal buttons, hide edit buttons
    normalButtons.style.display = 'flex';
    editButtons.style.display = 'none';
}

// Toggle card collapse
function toggleCollapse(card) {
    const contentWrapper = card.querySelector('.drag-item-content-wrapper');
    const collapseBtn = card.querySelector('.collapse-btn');
    const column = findColumnForCard(card);
    const id = parseInt(card.id);
    
    const isCollapsed = contentWrapper.style.display === 'none';
    contentWrapper.style.display = isCollapsed ? 'block' : 'none';
    collapseBtn.innerHTML = isCollapsed ? '▼' : '▶';
    
    if (isCollapsed) {
        collapseBtn.classList.remove('collapsed');
    } else {
        collapseBtn.classList.add('collapsed');
    }
    
    // Update the collapsed state in the data structure
    if (column !== -1 && !isNaN(id)) {
        const selectedArray = listArrays[column];
        if (selectedArray[id]) {
            selectedArray[id].collapsed = !isCollapsed;
            updateSavedColumns();
        }
    }
}

// Confirm and delete card
async function confirmDelete(id, column) {
    const selectedArray = listArrays[column];
    if (!selectedArray) {
        console.error('Invalid column:', column);
        return;
    }

    // Find the item by ID
    const item = selectedArray[id];
    if (!item) {
        console.error('Item not found:', id);
        return;
    }

    if (confirm(`Delete "${item.title || 'Untitled'}"?`)) {
        try {
            // Remove the item
            selectedArray.splice(id, 1);
            
            // Remove any empty slots
            for (let i = 0; i < listArrays.length; i++) {
                listArrays[i] = listArrays[i].filter(item => item !== null && item !== undefined);
            }
            
            await updateSavedColumns();
            updateDOM();
            console.log('Successfully deleted item:', id, 'from column:', column);
        } catch (error) {
            console.error('Failed to delete card:', error);
            alert('Failed to delete card. Please try again.');
            // Restore the item
            selectedArray.splice(id, 0, item);
            updateDOM();
        }
    }
}

// Update Item - Delete if necessary, or update Array value
async function updateItem(id, column) {
    const selectedArray = listArrays[column];
    const selectedColumn = listColumns[column].children;
    if (!dragging) {
        const item = selectedColumn[id];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.content-edit');
        const contentWrapper = item.querySelector('.drag-item-content-wrapper');
        const isCollapsed = contentWrapper.style.display === 'none';
        
        if (!title.textContent && !content.textContent) {
            delete selectedArray[id];
        } else {
            selectedArray[id] = {
                ...selectedArray[id],
                title: title.textContent.trim() || '',
                content: content.textContent.trim() || '',
                collapsed: isCollapsed
            };
        }
        await updateSavedColumns();
        updateDOM();
    }
}

// Add to Column List, Reset Textbox
async function addToColumn(column) {
    const container = addItemContainers[column];
    const title = container.querySelector('.add-item-title');
    const content = container.querySelector('.add-item-content');
    
    // Only add if title is not empty
    if (!title.textContent.trim()) return;
    
    console.log('Adding new card to column:', column);
    console.log('Title:', title.textContent.trim());
    console.log('Content:', content.textContent.trim());
    
    // Create the card element
    const columnEl = listColumns[column];
    const newCard = document.createElement('li');
    newCard.classList.add('drag-item');
    newCard.draggable = true;
    
    // Add the card data
    const cardData = {
        title: title.textContent.trim(),
        content: content.textContent.trim(),
        collapsed: false
    };
    
    console.log('New card data:', cardData);
    
    // Create and append the card
    createItemEl(columnEl, column, cardData, columnEl.children.length);
    
    // Reset input fields
    title.textContent = '';
    content.textContent = '';
    
    try {
        console.log('Rebuilding arrays...');
        await rebuildArrays();
        console.log('Arrays rebuilt, saving to server...');
        await updateSavedColumns();
        console.log('Save successful');
    } catch (error) {
        console.error('Failed to save new card:', error);
        // Remove the card if save failed
        columnEl.removeChild(columnEl.lastChild);
        alert('Failed to save card. Please try again.');
    }
}

// Allows arrays to reflect Drag and Drop items
async function rebuildArrays() {
    const getCardData = (item) => {
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.content-edit');
        const contentWrapper = item.querySelector('.drag-item-content-wrapper');
        const data = {
            title: title ? title.textContent.trim() : '',
            content: content ? content.textContent.trim() : '',
            collapsed: contentWrapper ? contentWrapper.style.display === 'none' : false
        };
        console.log('Card data:', data);
        return data;
    };

    console.log('Rebuilding arrays...');
    
    // Rebuild backlog items
    backlogListArray = Array.from(backlogListEl.children).map(getCardData);
    console.log('Backlog items:', backlogListArray);

    // Rebuild progress items
    progressListArray = Array.from(progressListEl.children).map(getCardData);
    console.log('Progress items:', progressListArray);

    // Rebuild complete items
    completeListArray = Array.from(completeListEl.children).map(getCardData);
    console.log('Complete items:', completeListArray);

    // Rebuild on hold items
    onHoldListArray = Array.from(onHoldListEl.children).map(getCardData);
    console.log('On hold items:', onHoldListArray);

    // Update the listArrays reference
    listArrays = [backlogListArray, progressListArray, completeListArray, onHoldListArray];
    
    console.log('Arrays rebuilt');
}

// Update Columns in DOM - Reset HTML, Filter Array, Update localStorage
async function updateDOM() {
    // Update project title
    const titleEl = document.querySelector('.main-title');
    if (titleEl) {
        titleEl.textContent = projectName;
        titleEl.contentEditable = true;
        titleEl.addEventListener('focusout', updateProjectName);
    }
    
    // Check if list elements exist before updating
    if (backlogListEl) backlogListEl.textContent = "";
    if (progressListEl) progressListEl.textContent = "";
    if (completeListEl) completeListEl.textContent = "";
    if (onHoldListEl) onHoldListEl.textContent = "";
    
    // Create Cards
    if (backlogListEl) backlogListArray.forEach((item, index) => createItemEl(backlogListEl, 0, item, index));
    if (progressListEl) progressListArray.forEach((item, index) => createItemEl(progressListEl, 1, item, index));
    if (completeListEl) completeListArray.forEach((item, index) => createItemEl(completeListEl, 2, item, index));
    if (onHoldListEl) onHoldListArray.forEach((item, index) => createItemEl(onHoldListEl, 3, item, index));
}

// When Item Enters Column Area
function dragEnter(column) {
    listColumns[column].classList.add("over");
    currentColumn = column;
}

// When Item Starts Dragging
function drag(e) {
    draggedItem = e.target;
    dragging = true;
}

// Column Allows for Item to Drop
function allowDrop(e) {
    e.preventDefault();
}

// Dropping Item in Column
async function drop(e) {
    e.preventDefault();
    const parent = listColumns[currentColumn];
    // Remove Background Color/Padding
    listColumns.forEach((column) => {
        column.classList.remove("over");
    });
    // Add item to Column
    parent.appendChild(draggedItem);
    // Dragging complete
    dragging = false;
    await rebuildArrays();
}

// Show Add Item Input Box
function showInputBox(column) {
    addBtns[column].style.visibility = "hidden";
    saveItemBtns[column].style.display = "flex";
    addItemContainers[column].style.display = "flex";
    
    // Focus on title field
    const titleField = addItemContainers[column].querySelector('.add-item-title');
    titleField.focus();
}

// Hide Item Input Box
function hideInputBox(column) {
    addBtns[column].style.visibility = "visible";
    saveItemBtns[column].style.display = "none";
    addItemContainers[column].style.display = "none";
    addToColumn(column);
}

// Helper function to find which column a card belongs to
function findColumnForCard(card) {
    for (let i = 0; i < listColumns.length; i++) {
        if (listColumns[i].contains(card)) {
            return i;
        }
    }
    return -1;
}

// Make functions available globally
window.showInputBox = showInputBox;
window.hideInputBox = hideInputBox;
window.addToColumn = addToColumn;
window.drag = drag;
window.allowDrop = allowDrop;
window.drop = drop;
window.toggleCollapse = toggleCollapse;
window.confirmDelete = confirmDelete;
window.saveContent = saveContent;
window.cancelEdit = cancelEdit;

// Initialize on page load
initialize();
