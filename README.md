# Task Management System

A full-stack task management application with natural language AI integration using Google Gemini API. Built with Node.js, Express, MongoDB, and React.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Task State Model](#task-state-model)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [AI Integration](#ai-integration)
- [Design Decisions](#design-decisions)
- [Features](#features)
- [Testing](#testing)

---

## 🎯 Overview

This Task Management System demonstrates a **clean architecture** where business logic is completely separated from user interfaces. The system supports two interaction modes:

1. **UI Mode**: Traditional web interface with forms and buttons
2. **AI Mode**: Natural language commands powered by Google Gemini

**Key Principle**: Both interfaces use the **same backend services**, ensuring consistency and maintainability.

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React)                        │
│  ┌──────────────┐              ┌──────────────┐        │
│  │  UI Mode     │              │  AI Mode     │        │
│  │  (Forms)     │              │  (NL Input)  │        │
│  └──────┬───────┘              └──────┬───────┘        │
└─────────┼──────────────────────────────┼────────────────┘
          │                              │
          │         HTTP/REST API        │
          └──────────────┬───────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               BACKEND (Node.js/Express)                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                  API ROUTES                        │ │
│  │  /api/tasks  |  /api/ai/command                   │ │
│  └─────────────────────┬──────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────▼──────────────────────────────┐ │
│  │             SERVICE LAYER (Core Logic)            │ │
│  │  ┌──────────────────┐    ┌──────────────────┐    │ │
│  │  │  taskService.js  │    │  aiService.js    │    │ │
│  │  │  - CRUD ops      │    │  - Interpret     │    │ │
│  │  │  - State trans.  │    │  - Return JSON   │    │ │
│  │  │  - Validation    │    │  - NO decisions  │    │ │
│  │  └──────────────────┘    └──────────────────┘    │ │
│  └─────────────────────┬──────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────▼──────────────────────────────┐ │
│  │              DATABASE (MongoDB)                    │ │
│  │              taskModel.js (Schema)                 │ │
│  └───────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Three-Layer Architecture

1. **Routes Layer** (`routes/`)
   - Handles HTTP requests and responses
   - Validates request format
   - Delegates business logic to services
   - Returns formatted responses

2. **Service Layer** (`services/`)
   - Contains ALL business logic
   - Enforces state transition rules
   - Performs validation
   - **Both UI and AI routes call these same functions**

3. **Model Layer** (`models/`)
   - Defines MongoDB schema
   - Basic field validation
   - Database interactions

---

## 🔄 Task State Model

### States

Tasks can be in one of three states:

```
┌─────────────┐
│ Not Started │  (Initial state for all new tasks)
└──────┬──────┘
       │
       ▼ (Start Task)
┌─────────────┐
│ In Progress │
└──────┬──────┘
       │
       ▼ (Mark Complete)
┌─────────────┐
│  Completed  │  (Terminal state)
└─────────────┘
```

### Transition Rules

**Valid Transitions:**
- `Not Started` → `In Progress` ✅
- `In Progress` → `Completed` ✅

**Invalid Transitions:**
- `Not Started` → `Completed` ❌ (Cannot skip states)
- `In Progress` → `Not Started` ❌ (Cannot reverse)
- `Completed` → `In Progress` ❌ (Cannot reverse)
- `Completed` → `Not Started` ❌ (Cannot reverse)

### State Enforcement

State transitions are enforced in **`taskService.js`**:

```javascript
const VALID_TRANSITIONS = {
  'Not Started': ['In Progress'],
  'In Progress': ['Completed'],
  'Completed': []  // Terminal state
};
```

**Key Design Decision**: The service layer is the **single source of truth** for what transitions are allowed. Neither the UI nor the AI can bypass these rules.

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Google Gemini API** - Natural language processing

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **CSS** - Styling (no frameworks)

### Why These Choices?

1. **Node.js + Express**: Simple, fast, JavaScript everywhere
2. **MongoDB**: Flexible schema, easy to iterate during development
3. **Mongoose**: Schema validation, cleaner database operations
4. **React**: Component-based, easy state management
5. **Google Gemini**: Free tier, fast responses, good JSON support

---

## 📁 Project Structure

```
task-management-system/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   │
│   ├── models/
│   │   └── taskModel.js             # Task schema (name, state, timestamps)
│   │
│   ├── services/
│   │   ├── taskService.js           # Business logic (CRUD, state transitions)
│   │   └── aiService.js             # Gemini API intent interpreter
│   │
│   ├── routes/
│   │   ├── taskRoutes.js            # REST endpoints for tasks
│   │   └── aiRoutes.js              # AI command endpoint
│   │
│   ├── middleware/
│   │   ├── errorHandler.js          # Centralized error handling
│   │   └── asyncHandler.js          # Async error wrapper
│   │
│   ├── server.js                    # Express app setup
│   ├── .env                         # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main React component
│   │   ├── App.css                  # Styling
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/task-management
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=development
   ```

4. **Start MongoDB** (if using local):
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows - Start from Services panel
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   App will open at `http://localhost:5173`

### Verify Installation

1. **Backend health check:**
   ```bash
   curl http://localhost:5000/api/health
   ```

   Expected response:
   ```json
   {
     "status": "OK",
     "message": "Task Management API is running",
     "timestamp": "2026-01-14T..."
   }
   ```

2. **Create a test task:**
   ```bash
   curl -X POST http://localhost:5000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Task"}'
   ```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Create Task
```http
POST /tasks
```

**Request Body:**
```json
{
  "name": "Buy groceries"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Buy groceries",
    "state": "Not Started",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  },
  "message": "Task created successfully"
}
```

---

#### 2. Get All Tasks
```http
GET /tasks
GET /tasks?state=Completed
```

**Query Parameters:**
- `state` (optional): Filter by state (`Not Started`, `In Progress`, `Completed`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Buy groceries",
      "state": "In Progress",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:30:00.000Z"
    }
  ],
  "count": 1,
  "message": "All tasks retrieved"
}
```

---

#### 3. Get Single Task
```http
GET /tasks/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Buy groceries",
    "state": "Not Started",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "message": "Task not found"
}
```

---

#### 4. Transition Task State
```http
PATCH /tasks/:id/state
```

**Request Body:**
```json
{
  "targetState": "In Progress"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Buy groceries",
    "state": "In Progress",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "message": "Task state updated from \"Not Started\" to \"In Progress\""
}
```

**Error (400 Bad Request - Invalid Transition):**
```json
{
  "success": false,
  "message": "Invalid state transition: Cannot move from \"Completed\" to \"In Progress\". Valid next state(s) from \"Completed\": None (task is completed)"
}
```

---

#### 5. Delete Task
```http
DELETE /tasks/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Buy groceries",
    "state": "Not Started",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  },
  "message": "Task deleted successfully"
}
```

---

#### 6. AI Command
```http
POST /ai/command
```

**Request Body:**
```json
{
  "command": "Mark 'Buy groceries' as done"
}
```

**Response (200 OK - Success):**
```json
{
  "success": true,
  "message": "Task state updated from \"In Progress\" to \"Completed\"",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Buy groceries",
    "state": "Completed",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T11:00:00.000Z"
  },
  "intent": {
    "action": "update_state",
    "taskName": "Buy groceries",
    "targetState": "Completed",
    "confidence": "high",
    "ambiguity": null
  }
}
```

**Response (400 Bad Request - Ambiguous):**
```json
{
  "success": false,
  "message": "Found 2 tasks matching \"grocery\"",
  "matches": [
    { "id": "507f...", "name": "Buy groceries", "state": "Not Started" },
    { "id": "608a...", "name": "Get grocery list", "state": "In Progress" }
  ],
  "intent": {
    "action": "update_state",
    "taskName": "grocery",
    "targetState": "Completed",
    "confidence": "medium",
    "ambiguity": "Task name might be partial"
  },
  "suggestion": "Please be more specific with the task name"
}
```

**Response (200 OK - Unknown Command):**
```json
{
  "success": false,
  "message": "Could not determine what you want to do",
  "intent": {
    "action": "unknown",
    "taskName": null,
    "targetState": null,
    "confidence": "high",
    "ambiguity": "Not a task management command"
  },
  "suggestion": "Try commands like: \"Create a task\", \"Mark [task] as done\", \"Show completed tasks\", \"Delete [task]\""
}
```

---

## 🤖 AI Integration

### How AI Works in This System

The AI layer acts as an **intent interpreter only**. It does NOT make decisions about validity or directly modify the database.

### AI Flow

```
1. User: "Mark 'Buy groceries' as done"
   ↓
2. aiService.interpretCommand()
   - Sends prompt to Gemini API
   - Receives structured JSON intent
   ↓
3. Intent returned:
   {
     "action": "update_state",
     "taskName": "Buy groceries",
     "targetState": "Completed"
   }
   ↓
4. AI Route logic:
   - Calls taskService.findTaskByName("Buy groceries")
   - Calls taskService.transitionTaskState(taskId, "Completed")
   ↓
5. Service Layer:
   - Validates transition (In Progress → Completed is valid ✅)
   - Updates database
   - Returns success
```

### AI Prompt Engineering

The system prompt teaches Gemini:
- The exact state names to use (`"Not Started"`, `"In Progress"`, `"Completed"`)
- The JSON structure to return
- How to interpret user language ("done" → "Completed", "start" → "In Progress")
- To indicate confidence and ambiguity

**Critical**: The AI suggests what to do, but the **service layer decides** if it's allowed.

### Handling Ambiguity

1. **Exact Match First**: "Buy groceries" looks for exact match
2. **Partial Match Fallback**: If not found, tries case-insensitive partial match
3. **Multiple Matches**: Returns list of matches, asks user to be specific
4. **No Match**: Returns clear error message

### AI as Untrusted Input

The AI's output is treated like any user input:
- Intent is parsed and validated
- Task names are looked up in the database
- State transitions go through the same validation as UI requests
- Invalid operations are rejected with clear errors

**Key Principle**: If the AI malfunctions and returns invalid data, the service layer catches it.

---

## 🎨 Design Decisions

### 1. Why Centralized Business Logic?

**Decision**: All state transition logic lives in `taskService.js`

**Rationale**:
- **Single Source of Truth**: Only one place to change rules
- **Consistency**: UI and AI can't behave differently
- **Testability**: Business logic can be tested independently
- **Maintainability**: Adding new features doesn't require changing multiple files

**Alternative Considered**: Putting validation in routes or models
**Why Rejected**: Would duplicate logic between UI and AI routes

---

### 2. Why MongoDB?

**Decision**: Use MongoDB instead of PostgreSQL or SQLite

**Rationale**:
- **Flexible Schema**: Easy to add fields during development
- **JSON Native**: Natural fit for REST APIs
- **Easy Setup**: Simple local development
- **Mongoose**: Clean ODM with built-in validation

**Trade-off**: 
-  Fast iteration during development
-  Less strict schema enforcement (but Mongoose helps)

**Alternative Considered**: PostgreSQL with Sequelize
**Why Rejected**: Overkill for this project's requirements; MongoDB is simpler

---

### 3. Why Three States Only?

**Decision**: Limit states to `Not Started`, `In Progress`, `Completed`

**Rationale**:
- **Simplicity**: Easy to understand and explain
- **Clear Progression**: Linear workflow
- **No Confusion**: Users know exactly what each state means

**Trade-off**:
-  Simple to implement and test
-  Less flexible for complex workflows (could add "Blocked", "Paused", etc.)

**Extensibility**: Adding new states only requires updating `VALID_TRANSITIONS` in `taskService.js`

---

### 4. Why No State Reversal?

**Decision**: Once a task moves forward, it cannot go backward

**Rationale**:
- **Intent Preservation**: Moving "Completed" back to "In Progress" suggests poor initial judgment
- **Data Integrity**: Clear audit trail of progress
- **User Behavior**: Encourages thoughtful state changes

**Alternative Workflow**: 
- If a completed task needs work, create a new task
- If work is paused, leave it "In Progress"

**Trade-off**:
-  Clear semantics, prevents confusion
-  Less forgiving of mistakes (but mistakes should be rare)

---

### 5. Why AI as Intent Interpreter Only?

**Decision**: AI suggests actions, service layer enforces rules

**Rationale**:
- **Security**: AI output is untrusted input
- **Consistency**: Same validation for all inputs
- **Reliability**: System works even if AI misbehaves
- **Testability**: Business logic is deterministic

**Alternative Considered**: Give AI direct database access
**Why Rejected**: 
- AI could bypass validation
- Harder to debug
- Not interview-ready architecture

---

### 6. Why Single-File React Component?

**Decision**: Keep all React code in one `App.jsx` file

**Rationale**:
- **Simplicity**: Easy to understand entire frontend at once
- **Interview Friendly**: Can explain whole system quickly
- **No Over-Engineering**: Avoids premature abstraction

**Trade-off**:
-  Easy to navigate and modify
-  Would need refactoring for larger apps

**When to Split**: If the file exceeds 500 lines or components are reused

---

#### Frontend Tests

1. **UI Mode - Create Task**
   - Enter task name
   - Click "Create"
   - Verify task appears in list

2. **UI Mode - State Transitions**
   - Click "Start Task" on "Not Started" task
   - Verify state changes to "In Progress"
   - Click "Complete" on "In Progress" task
   - Verify state changes to "Completed"
   - Verify no action buttons on "Completed" task

3. **UI Mode - Filtering**
   - Create tasks in different states
   - Click each filter button
   - Verify only matching tasks appear

4. **AI Mode - Natural Language**
   - Switch to AI Mode
   - Try: "Create task Do homework"
   - Try: "Mark 'Do homework' as in progress"
   - Try: "Show me completed tasks"
   - Verify all commands work

5. **Error Handling**
   - Try: "Mark homework as not started" (on "In Progress" task)
   - Verify error message about invalid transition
   - Try: "Delete grocery" with multiple matching tasks
   - Verify list of matches returned
---

**Sahil N**
- GitHub: https://github.com/Srihil/task-management-system.git
- LinkedIn: https://www.linkedin.com/in/sahil-n-72b6a7310
