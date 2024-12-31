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

// Get Arrays from localStorage if available, set default values if not
function getSavedColumns() {
    if (localStorage.getItem('kanbanData')) {
        const data = JSON.parse(localStorage.getItem('kanbanData'));
        projectName = data.projectName || 'My Kanban Board';
        backlogListArray = data.backlogItems || [];
        progressListArray = data.progressItems || [];
        completeListArray = data.completeItems || [];
        onHoldListArray = data.onHoldItems || [];
    } else {
        projectName = 'My Kanban Board';
        backlogListArray = [];
        progressListArray = [];
        completeListArray = [];
        onHoldListArray = [];
    }
}

// Set localStorage Arrays
async function updateSavedColumns() {
    const data = {
        projectName,
        backlogItems: backlogListArray,
        progressItems: progressListArray,
        completeItems: completeListArray,
        onHoldItems: onHoldListArray,
    };
    localStorage.setItem('kanbanData', JSON.stringify(data));
    try {
        const response = await fetch('/api/kanban', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to save data to server');
        }
    } catch (error) {
        console.error('Error saving to server:', error);
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
    
    // Run getSavedColumns only if localStorage is empty
    if (!localStorage.getItem('kanbanData')) {
        updateSavedColumns();
    }
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
    const listEl = document.createElement("li");
    listEl.id = index;
    listEl.classList.add("drag-item");
    listEl.draggable = true;
    listEl.setAttribute("ondragstart", "drag(event)");
    
    // Create header
    const header = document.createElement("div");
    header.classList.add("drag-item-header");
    
    // Add drag icon
    const dragIcon = document.createElement("span");
    dragIcon.classList.add("drag-icon");
    dragIcon.innerHTML = "⋮⋮";
    header.appendChild(dragIcon);
    
    // Add title
    const title = document.createElement("div");
    title.classList.add("drag-item-title");
    title.contentEditable = true;
    title.textContent = item.title || '';
    title.setAttribute("onfocusout", `updateItem(${index}, ${column})`);
    header.appendChild(title);
    
    // Add action buttons container
    const actions = document.createElement("div");
    actions.classList.add("drag-item-actions");
    
    // Create normal buttons (collapse and delete)
    const normalButtons = document.createElement("div");
    normalButtons.classList.add("normal-buttons");
    
    // Add collapse button
    const collapseBtn = document.createElement("button");
    collapseBtn.classList.add("action-btn", "collapse-btn");
    collapseBtn.innerHTML = item.collapsed ? "▶" : "▼";
    if (item.collapsed) collapseBtn.classList.add("collapsed");
    collapseBtn.onclick = () => toggleCollapse(listEl);
    normalButtons.appendChild(collapseBtn);
    
    // Add delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("action-btn", "delete-btn");
    deleteBtn.innerHTML = "×";
    deleteBtn.onclick = () => confirmDelete(index, column);
    normalButtons.appendChild(deleteBtn);
    
    // Create edit buttons (save and cancel)
    const editButtons = document.createElement("div");
    editButtons.classList.add("edit-buttons");
    editButtons.style.display = 'none';
    
    // Add save button
    const saveBtn = document.createElement("button");
    saveBtn.classList.add("action-btn", "save-btn");
    saveBtn.innerHTML = "✓";
    saveBtn.onclick = () => saveContent(listEl, index, column);
    editButtons.appendChild(saveBtn);
    
    // Add cancel button
    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("action-btn", "cancel-btn");
    cancelBtn.innerHTML = "↺";
    cancelBtn.onclick = () => cancelEdit(listEl, item);
    editButtons.appendChild(cancelBtn);
    
    // Add both button sets to actions
    actions.appendChild(normalButtons);
    actions.appendChild(editButtons);
    header.appendChild(actions);
    
    // Create content wrapper for edit/display modes
    const contentWrapper = document.createElement("div");
    contentWrapper.classList.add("drag-item-content-wrapper");
    
    // Add content for editing
    const contentEdit = document.createElement("div");
    contentEdit.classList.add("drag-item-content", "content-edit");
    contentEdit.contentEditable = true;
    contentEdit.textContent = item.content || '';
    contentEdit.style.display = 'none';
    
    // Store original content for cancel functionality
    contentEdit.dataset.originalContent = item.content || '';
    
    // Add content for display (with markdown)
    const contentDisplay = document.createElement("div");
    contentDisplay.classList.add("drag-item-content", "content-display");
    contentDisplay.innerHTML = marked.parse(item.content || '');
    
    // Add click handler to switch between edit and display modes
    contentDisplay.addEventListener('click', () => {
        contentDisplay.style.display = 'none';
        contentEdit.style.display = 'block';
        contentEdit.focus();
        
        // Show edit buttons, hide normal buttons
        normalButtons.style.display = 'none';
        editButtons.style.display = 'flex';
    });
    
    contentWrapper.appendChild(contentEdit);
    contentWrapper.appendChild(contentDisplay);
    
    if (item.collapsed) {
        contentWrapper.style.display = 'none';
    }
    
    // Assemble the card
    listEl.appendChild(header);
    listEl.appendChild(contentWrapper);
    
    // Append to column
    columnEl.appendChild(listEl);
}

// Save content changes
async function saveContent(listEl, index, column) {
    const contentEdit = listEl.querySelector('.content-edit');
    const contentDisplay = listEl.querySelector('.content-display');
    const normalButtons = listEl.querySelector('.normal-buttons');
    const editButtons = listEl.querySelector('.edit-buttons');
    const title = listEl.querySelector('.drag-item-title');
    
    // Update display content
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
            title: title.textContent || '',
            content: contentEdit.textContent || '',
            collapsed: listEl.querySelector('.drag-item-content-wrapper').style.display === 'none'
        };
        
        // Save to server
        try {
            await updateSavedColumns();
            // Update the original content after successful save
            contentEdit.dataset.originalContent = contentEdit.textContent || '';
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
function confirmDelete(id, column) {
    const selectedArray = listArrays[column];
    const item = selectedArray[id];
    
    if (confirm(`Delete "${item.title}"?`)) {
        selectedArray.splice(id, 1);
        updateSavedColumns();
        updateDOM();
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
                title: title.textContent || '',
                content: content.textContent || '',
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
    
    const selectedArray = listArrays[column];
    selectedArray.push({
        title: title.textContent.trim(),
        content: content.textContent.trim(),
        collapsed: false
    });
    
    // Reset input fields
    title.textContent = '';
    content.textContent = '';
    
    await updateSavedColumns();
    updateDOM();
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
    
    // Run getSavedColumns only if localStorage is empty
    if (!localStorage.getItem('kanbanData')) {
        updateSavedColumns();
    }
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

// Allows arrays to reflect Drag and Drop items
async function rebuildArrays() {
    backlogListArray = [];
    for (let i = 0; i < backlogListEl.children.length; i++) {
        const item = backlogListEl.children[i];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.content-edit');
        const isCollapsed = item.querySelector('.drag-item-content-wrapper').style.display === 'none';
        backlogListArray.push({
            title: title.textContent || '',
            content: content.textContent || '',
            collapsed: isCollapsed
        });
    }
    progressListArray = [];
    for (let i = 0; i < progressListEl.children.length; i++) {
        const item = progressListEl.children[i];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.content-edit');
        const isCollapsed = item.querySelector('.drag-item-content-wrapper').style.display === 'none';
        progressListArray.push({
            title: title.textContent || '',
            content: content.textContent || '',
            collapsed: isCollapsed
        });
    }
    completeListArray = [];
    for (let i = 0; i < completeListEl.children.length; i++) {
        const item = completeListEl.children[i];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.content-edit');
        const isCollapsed = item.querySelector('.drag-item-content-wrapper').style.display === 'none';
        completeListArray.push({
            title: title.textContent || '',
            content: content.textContent || '',
            collapsed: isCollapsed
        });
    }
    onHoldListArray = [];
    for (let i = 0; i < onHoldListEl.children.length; i++) {
        const item = onHoldListEl.children[i];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.content-edit');
        const isCollapsed = item.querySelector('.drag-item-content-wrapper').style.display === 'none';
        onHoldListArray.push({
            title: title.textContent || '',
            content: content.textContent || '',
            collapsed: isCollapsed
        });
    }
    await updateSavedColumns();
    updateDOM();
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

// On Load
async function initialize() {
    try {
        const response = await fetch('/api/kanban');
        if (response.ok) {
            const data = await response.json();
            projectName = data.projectName;
            backlogListArray = data.backlogItems;
            progressListArray = data.progressItems;
            completeListArray = data.completeItems;
            onHoldListArray = data.onHoldItems;
            updateDOM();
        } else {
            getSavedColumns();
            updateDOM();
        }
    } catch (error) {
        console.error('Error loading from server:', error);
        getSavedColumns();
        updateDOM();
    }
}

// Initialize on page load
initialize();

// Make functions available globally
window.showInputBox = showInputBox;
window.hideInputBox = hideInputBox;
window.addToColumn = addToColumn;
window.updateItem = updateItem;
window.drag = drag;
window.allowDrop = allowDrop;
window.drop = drop;
window.updateProjectName = updateProjectName;
