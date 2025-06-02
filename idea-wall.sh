#!/bin/bash

# Define log directory
LOG_DIR="logs"
PID_DIR="logs"

# Create log directory
mkdir -p $LOG_DIR

# Start services function
start_services() {
    echo "Starting Idea Wall Project..."

    # Check Python virtual environment
    if [ ! -d "components/idea-wall-api/venv" ]; then
        echo "Creating Python virtual environment..."
        cd components/idea-wall-api
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        cd ../..
    else
        cd components/idea-wall-api
        source venv/bin/activate
        cd ../..
    fi

    # Check Node.js dependencies
    if [ ! -d "components/idea-wall-ui/node_modules" ]; then
        echo "Installing Node.js dependencies..."
        cd components/idea-wall-ui
        npm install
        cd ../..
    fi

    # Start backend service
    echo "Starting backend service..."
    cd components/idea-wall-api
    source venv/bin/activate
    uvicorn main:app --reload > ../../$LOG_DIR/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ../..

    # Wait for backend to start
    echo "Waiting for backend to start..."
    sleep 5

    # Start frontend service
    echo "Starting frontend service..."
    cd components/idea-wall-ui
    npm start > ../../$LOG_DIR/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ../..

    # Save PIDs
    echo $BACKEND_PID > $PID_DIR/backend.pid
    echo $FRONTEND_PID > $PID_DIR/frontend.pid

    echo
    echo "Services are starting..."
    echo "Backend: http://localhost:8000"
    echo "Frontend: http://localhost:4200"
    echo
    echo "To stop the services, run:"
    echo "./idea-wall.sh stop"
    echo
    echo "Logs are available in:"
    echo "$LOG_DIR/backend.log"
    echo "$LOG_DIR/frontend.log"
}

# Stop services function
stop_services() {
    echo "Stopping Idea Wall services..."

    # Stop backend service
    if [ -f "$PID_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat $PID_DIR/backend.pid)
        if ps -p $BACKEND_PID > /dev/null; then
            echo "Stopping backend service (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            rm $PID_DIR/backend.pid
        fi
    fi

    # Stop frontend service
    if [ -f "$PID_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat $PID_DIR/frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null; then
            echo "Stopping frontend service (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            rm $PID_DIR/frontend.pid
        fi
    fi

    echo "All services stopped"
}

# Check service status function
check_status() {
    echo "Checking service status..."
    
    # Check backend service
    if [ -f "$PID_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat $PID_DIR/backend.pid)
        if ps -p $BACKEND_PID > /dev/null; then
            echo "Backend: Running (PID: $BACKEND_PID)"
        else
            echo "Backend: Not running"
        fi
    else
        echo "Backend: Not running"
    fi

    # Check frontend service
    if [ -f "$PID_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat $PID_DIR/frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null; then
            echo "Frontend: Running (PID: $FRONTEND_PID)"
        else
            echo "Frontend: Not running"
        fi
    else
        echo "Frontend: Not running"
    fi
}

# Show help information
show_help() {
    echo "Usage:"
    echo "  ./idea-wall.sh <command>"
    echo
    echo "Commands:"
    echo "  start   - Start all services"
    echo "  stop    - Stop all services"
    echo "  status  - Check service status"
    echo "  help    - Show this help message"
}

# Main program
if [ -z "$1" ]; then
    show_help
    exit 0
fi

case "$1" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "status")
        check_status
        ;;
    "help")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac