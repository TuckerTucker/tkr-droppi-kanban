>This is a fork of [Droppi](https://github.com/gateremark/droppi-kanban-board)

# Kanban Board

This is a simple Kanban board project built using HTML, CSS, JavaScript, and the Drag and Drop API. It allows you to create tasks and organize them into different stages, such as "To Do," "Done," and "On Hold"



## Features

- Drag and drop tasks between different stages of the board
- Create new tasks and assign them to a stage
- Edit task details with markdown support
- Collapsible cards for better organization
- Save/Cancel buttons while editing for better control
- Delete tasks with confirmation
- Responsive design for mobile and desktop devices
- Project name customization
- Persistent data storage

## Technologies Used

- HTML
- CSS
- JavaScript
- Drag and Drop API
- Marked.js for Markdown rendering

## Getting Started

To get started with the Kanban board, follow these steps:

1. Clone the repository: `git clone https://github.com/TuckerTucker/tkr-droppi-kanban`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   # Start with default board (kanban.json)
   ./start.sh
   
   # Or specify a custom board file
   ./start.sh myboard.json
   ```
   This will start the Node.js server and serve the application.
4. Open your browser and navigate to `http://localhost:3000`

The server will automatically:
- Create the board file if it doesn't exist
- Save your board state to the specified JSON file
- Use `kanban.json` as the default if no file is specified

### Multiple Boards
You can maintain multiple board files in the `boards` directory:
```bash
boards/
  ├── kanban.json      # Default board
  ├── personal.json    # Personal tasks
  └── work.json        # Work projects
```

Create a new board:
```bash
./start.sh --new myboard     # Creates and starts with myboard.json
```

Switch between existing boards:
```bash
./start.sh personal.json     # Load personal tasks
./start.sh work.json        # Load work projects
```

The server will automatically:
- Create the board file if using --new
- Save your board state to the specified JSON file
- Use `kanban.json` as the default if no file is specified

## Usage

Once you have the project running, you can perform the following actions:

- Click the project title to edit it
- To create a new task, click on the "Add Item" button
- To move a task, drag and drop it to the desired column
- To edit a task:
  - Click the title to edit it
  - Click the description to edit with markdown support
  - Use ✓ to save changes or ↺ to cancel
- To collapse/expand a card, click the ▼ button
- To delete a task, click the × button and confirm

### Markdown Support
The card description supports markdown formatting:
- Headers (#, ##, etc.)
- Lists (-, *, numbers)
- **Bold** and *Italic* text
- `Code blocks`
- Links and images
- Tables
- Blockquotes

## Demo

A live demo of the orginal Kanban board is available at: [Droppi](https://droppi.vercel.app/)

## Screenshots
<div align="left">
<a href="https://droppi.vercel.app/">
   
![Droppi](https://gateremark.vercel.app/img/projects/projects_post_4.png)

</a>
</div>

## Contributing

>tkr-droppi-kanban won't be accepting pull requests. 
Feel free to fork away though.

## Acknowledgements

The Kanban board project was inspired by the principles of the Kanban methodology and built with the help of HTML, CSS, JavaScript, and the Drag and Drop API.

Feel free to explore and use this Kanban board project for your personal or professional needs. Enjoy organizing your tasks and improving your productivity!
