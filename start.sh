#!/bin/bash

# AI Recipe Meal Planner - Start Script with Hot Reloading
# This script cleans ports, sets up the database, seeds data, and starts the application
# Both frontend and backend will auto-reload on file changes

set -e

echo "🍽️  AI Recipe Meal Planner - Starting with Hot Reload..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Default ports (NOT using 5000)
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-5001}

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill_port $FRONTEND_PORT
    kill_port $BACKEND_PORT
    echo -e "${GREEN}Servers stopped. Goodbye!${NC}"
    exit 0
}

# Trap Ctrl+C and other exit signals
trap cleanup SIGINT SIGTERM

# Step 1: Clean up ports
echo -e "\n${GREEN}Step 1: Cleaning up ports...${NC}"
kill_port $FRONTEND_PORT
kill_port $BACKEND_PORT
# Also clean common ports that might conflict
kill_port 5000 2>/dev/null || true
echo "Ports $FRONTEND_PORT and $BACKEND_PORT are now available"

# Step 2: Check PostgreSQL
echo -e "\n${GREEN}Step 2: Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL is not running. Attempting to start...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql 2>/dev/null || brew services start postgresql@14 2>/dev/null || brew services start postgresql@15 2>/dev/null || true
    else
        sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null || true
    fi
    sleep 2
fi

if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
    echo "PostgreSQL is running"
else
    echo -e "${RED}Could not start PostgreSQL. Please start it manually.${NC}"
    exit 1
fi

# Step 3: Create database if not exists
echo -e "\n${GREEN}Step 3: Creating database if not exists...${NC}"
DB_NAME=${DB_NAME:-ai_recipe_meal_planner}
DB_USER=${DB_USER:-postgres}

# Try to create database (ignore error if exists)
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -c "CREATE DATABASE $DB_NAME" 2>/dev/null || true

echo "Database '$DB_NAME' is ready"

# Step 4: Install backend dependencies
echo -e "\n${GREEN}Step 4: Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

# Step 5: Install frontend dependencies
echo -e "\n${GREEN}Step 5: Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..

# Step 6: Run database sync and seed
echo -e "\n${GREEN}Step 6: Syncing database and seeding data...${NC}"
cd backend
node -e "
const db = require('./models');
const seed = require('./seeders/seed');

async function setup() {
    try {
        await db.sequelize.sync({ force: true });
        console.log('Database synced successfully');
        await seed();
        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Setup error:', error);
        process.exit(1);
    }
}
setup();
"
cd ..

# Step 7: Start backend server with nodemon (hot reload)
echo -e "\n${GREEN}Step 7: Starting backend server with hot reload (nodemon)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..
sleep 3

# Check if backend started
if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend server is running on port $BACKEND_PORT${NC}"
else
    echo -e "${YELLOW}Backend server is starting...${NC}"
fi

# Step 8: Start frontend server with hot reload (React default)
echo -e "\n${GREEN}Step 8: Starting frontend server with hot reload...${NC}"
cd frontend
BROWSER=none npm start &
FRONTEND_PID=$!
cd ..

echo -e "\n${CYAN}========================================"
echo -e "🎉 ${PURPLE}AI Recipe Meal Planner is running!${NC}"
echo -e "${CYAN}========================================"
echo -e "Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "Backend:  ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "\n${CYAN}Hot Reload Enabled:${NC}"
echo -e "  📁 Backend:  Changes to /backend files auto-restart server (nodemon)"
echo -e "  📁 Frontend: Changes to /frontend/src files auto-refresh browser"
echo -e "\n${CYAN}Demo credentials:${NC}"
echo -e "  Email:    ${GREEN}${DEMO_EMAIL:-demo@example.com}${NC}"
echo -e "  Password: ${GREEN}${DEMO_PASSWORD:-demo123}${NC}"
echo -e "\n${PURPLE}✨ AI Features Available:${NC}"
echo -e "  • AI Dietary Adjuster - Adjust recipes for dietary needs"
echo -e "  • AI Grocery Optimizer - Optimize shopping lists for budget"
echo -e "  • AI Leftover Suggester - Creative recipes from leftovers"
echo -e "  • AI Nutrition Balancer - Analyze and balance nutrition"
echo -e "  • AI Cooking Timer - Smart cooking schedules"
echo -e "\n${CYAN}OpenRouter Model:${NC} ${OPENROUTER_MODEL:-anthropic/claude-haiku-4.5}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Wait for both processes
wait
