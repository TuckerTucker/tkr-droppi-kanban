const addBtns = document.querySelectorAll(".add-btn:not(.solid)");
const saveItemBtns = document.querySelectorAll(".solid");
const addItemContainers = document.querySelectorAll(".add-container");
const addItems = document.querySelectorAll(".add-item");

// Item Lists
const listColumns = document.querySelectorAll(".drag-item-list");
const backlogListEl = document.getElementById("to-do-list");
const progressListEl = document.getElementById("doing-list");
const completeListEl = document.getElementById("done-list");
const onHoldListEl = document.getElementById("on-hold-list");

// Items
let updatedOnLoad = false;

// Initialize Arrays
let backlogListArray = [];
let progressListArray = [];
let completeListArray = [];
let onHoldListArray = [];
let listArrays = [];

// Drag Functionality
let draggedItem;
let dragging = false;
let currentColumn;

// Get Arrays from server
async function getSavedColumns() {
    try {
        const response = await fetch('http://localhost:3001/api/kanban');
        const data = await response.json();
        
        if (response.ok) {
            backlogListArray = data.backlogItems;
            progressListArray = data.progressItems;
            completeListArray = data.completeItems;
            onHoldListArray = data.onHoldItems;
        } else {
            const intro = prompt(
                "Type 'y' (Yes) if you want to display an Editable Sample? \n(Not typing 'y' will display a plane NEW board.)"
            );
            if (intro === "y" || intro === "Y") {
                backlogListArray = [
                    { title: "Write the documentation", content: "" },
                    { title: "Post a technical article", content: "" },
                ];
                progressListArray = [
                    { title: "Work on Droppi project", content: "" },
                    { title: "Listen to Spotify", content: "" },
                ];
                completeListArray = [
                    { title: "Submit a PR", content: "" },
                    { title: "Review my projects code", content: "" },
                ];
                onHoldListArray = [
                    { title: "Get a girlfriend", content: "" },
                ];
            } else {
                backlogListArray = [];
                progressListArray = [];
                completeListArray = [];
                onHoldListArray = [];
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Save Arrays to server
async function updateSavedColumns() {
    listArrays = [
        backlogListArray,
        progressListArray,
        completeListArray,
        onHoldListArray,
    ];
    
    const data = {
        backlogItems: backlogListArray,
        progressItems: progressListArray,
        completeItems: completeListArray,
        onHoldItems: onHoldListArray
    };

    try {
        const response = await fetch('http://localhost:3001/api/kanban', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            console.error('Error saving data');
        }
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Filter Array to remove empty values
function filterArray(array) {
    const filteredArray = array.filter((item) => item !== null);
    return filteredArray;
}

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
    dragIcon.innerHTML = "⋮⋮"; // Simple drag handle icon using text
    header.appendChild(dragIcon);
    
    // Add title
    const title = document.createElement("div");
    title.classList.add("drag-item-title");
    title.contentEditable = true;
    title.textContent = item.title || '';
    title.setAttribute("onfocusout", `updateItem(${index}, ${column})`);
    header.appendChild(title);
    
    // Add content container
    const content = document.createElement("div");
    content.classList.add("drag-item-content");
    content.contentEditable = true;
    content.textContent = item.content || '';
    content.setAttribute("onfocusout", `updateItem(${index}, ${column})`);
    
    // Assemble the card
    listEl.appendChild(header);
    listEl.appendChild(content);
    
    // Append to column
    columnEl.appendChild(listEl);
}

// Update Item - Delete if necessary, or update Array value
async function updateItem(id, column) {
    const selectedArray = listArrays[column];
    const selectedColumn = listColumns[column].children;
    if (!dragging) {
        const item = selectedColumn[id];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.drag-item-content');
        
        if (!title.textContent && !content.textContent) {
            delete selectedArray[id];
        } else {
            selectedArray[id] = {
                title: title.textContent || '',
                content: content.textContent || ''
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
        content: content.textContent.trim()
    });
    
    // Reset input fields
    title.textContent = '';
    content.textContent = '';
    
    await updateSavedColumns();
    updateDOM();
}

// Update Columns in DOM - Reset HTML, Filter Array, Update localStorage
async function updateDOM() {
    // Check localStorage once
    if (!updatedOnLoad) {
        await getSavedColumns();
    }
    // Backlog Column
    backlogListEl.textContent = "";
    backlogListArray.forEach((backlogItem, index) => {
        createItemEl(backlogListEl, 0, backlogItem, index);
    });
    backlogListArray = filterArray(backlogListArray);
    // Progress Column
    progressListEl.textContent = "";
    progressListArray.forEach((progressItem, index) => {
        createItemEl(progressListEl, 1, progressItem, index);
    });
    progressListArray = filterArray(progressListArray);
    // Complete Column
    completeListEl.textContent = "";
    completeListArray.forEach((completeItem, index) => {
        createItemEl(completeListEl, 2, completeItem, index);
    });
    completeListArray = filterArray(completeListArray);
    // On Hold Column
    onHoldListEl.textContent = "";
    onHoldListArray.forEach((onHoldItem, index) => {
        createItemEl(onHoldListEl, 3, onHoldItem, index);
    });
    onHoldListArray = filterArray(onHoldListArray);
    // Run getSavedColumns only once, Update Local Storage
    updatedOnLoad = true;
    if (updatedOnLoad) {
        await updateSavedColumns();
    }
}

// Allows arrays to reflect Drag and Drop items
async function rebuildArrays() {
    backlogListArray = [];
    for (let i = 0; i < backlogListEl.children.length; i++) {
        const item = backlogListEl.children[i];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.drag-item-content');
        backlogListArray.push({
            title: title.textContent || '',
            content: content.textContent || ''
        });
    }
    progressListArray = [];
    for (let i = 0; i < progressListEl.children.length; i++) {
        const item = progressListEl.children[i];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.drag-item-content');
        progressListArray.push({
            title: title.textContent || '',
            content: content.textContent || ''
        });
    }
    completeListArray = [];
    for (let i = 0; i < completeListEl.children.length; i++) {
        const item = completeListEl.children[i];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.drag-item-content');
        completeListArray.push({
            title: title.textContent || '',
            content: content.textContent || ''
        });
    }
    onHoldListArray = [];
    for (let i = 0; i < onHoldListEl.children.length; i++) {
        const item = onHoldListEl.children[i];
        const title = item.querySelector('.drag-item-title');
        const content = item.querySelector('.drag-item-content');
        onHoldListArray.push({
            title: title.textContent || '',
            content: content.textContent || ''
        });
    }
    await updateSavedColumns();
    updateDOM();
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

// On Load
updateDOM();
