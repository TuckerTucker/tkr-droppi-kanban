#!/bin/sh

# Default board file
BOARD_FILE="kanban.json"
CREATE_NEW=false

# Function to clean board name
clean_board_name() {
    # Remove .json extension if present
    echo "$1" | sed 's/\.json$//'
}

# Function to create a new board file
create_new_board() {
    # Clean the board name
    local clean_name=$(clean_board_name "$1")
    local file="boards/$clean_name.json"
    
    if [ -f "$file" ]; then
        echo "Error: Board '$clean_name.json' already exists"
        exit 1
    fi
    
    # Create default board structure
    cat > "$file" << EOF
{
  "projectName": "My Kanban Board",
  "backlogItems": [],
  "progressItems": [],
  "completeItems": [],
  "onHoldItems": []
}
EOF
    echo "Created new board: $file"
    BOARD_FILE="$clean_name.json"
}

# Parse arguments
while [ "$#" -gt 0 ]; do
    case "$1" in
        --new)
            if [ -z "$2" ]; then
                echo "Error: --new requires a board name"
                echo "Usage: ./start.sh --new board_name"
                exit 1
            fi
            create_new_board "$2"
            shift 2
            ;;
        *)
            # Clean the board name if it's not --new
            BOARD_FILE="$(clean_board_name "$1").json"
            shift
            ;;
    esac
done

# Validate that the board file exists in the boards directory
if [ ! -f "boards/$BOARD_FILE" ]; then
    echo "Error: Board file 'boards/$BOARD_FILE' not found"
    echo "Usage: ./start.sh [board_file.json]"
    echo "       ./start.sh --new board_name"
    echo "The board file should exist in the 'boards' directory"
    exit 1
fi

# Export the board file as an environment variable
export BOARD_FILE="$BOARD_FILE"

# Start the server
node server/server.js