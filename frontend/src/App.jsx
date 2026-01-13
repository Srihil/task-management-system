import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

const api = {
  getTasks: async (state = null) => {
    const endpoint = state ? `/tasks?state=${encodeURIComponent(state)}` : '/tasks';
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return response.json();
  },

  createTask: async (name) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  transitionState: async (taskId, targetState) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetState }),
    });
    return response.json();
  },

  deleteTask: async (taskId) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  sendAICommand: async (command) => {
    const response = await fetch(`${API_BASE_URL}/ai/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    return response.json();
  },
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [currentMode, setCurrentMode] = useState('ui');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [feedback, setFeedback] = useState({ message: '', type: 'success' });
  const [taskName, setTaskName] = useState('');
  const [aiCommand, setAiCommand] = useState('');

  useEffect(() => {
    loadTasks();
  }, [currentFilter]);

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ message: '', type: 'success' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
  };

  const loadTasks = async () => {
    try {
      const data = await api.getTasks(currentFilter === 'all' ? null : currentFilter);
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      showFeedback('Failed to load tasks', 'error');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const data = await api.createTask(taskName.trim());
      if (data.success) {
        showFeedback(data.message, 'success');
        setTaskName('');
        loadTasks();
      } else {
        showFeedback(data.message || 'Failed to create task', 'error');
      }
    } catch (error) {
      showFeedback('Network error. Please try again.', 'error');
    }
  };

  const handleAICommand = async (e) => {
    e.preventDefault();
    if (!aiCommand.trim()) return;

    try {
      const data = await api.sendAICommand(aiCommand.trim());
      if (data.success) {
        showFeedback(data.message, 'success');
        setAiCommand('');
        loadTasks();
      } else {
        if (data.matches) {
          const matchList = data.matches.map((m) => `"${m.name}" (${m.state})`).join(', ');
          showFeedback(`${data.message}: ${matchList}. ${data.suggestion}`, 'error');
        } else if (data.suggestion) {
          showFeedback(`${data.message}. ${data.suggestion}`, 'error');
        } else {
          showFeedback(data.message || 'Command failed', 'error');
        }
      }
    } catch (error) {
      showFeedback('Network error. Please try again.', 'error');
    }
  };

  const handleStateTransition = async (taskId, targetState) => {
    try {
      const data = await api.transitionState(taskId, targetState);
      if (data.success) {
        showFeedback(data.message, 'success');
        loadTasks();
      } else {
        showFeedback(data.message || 'State transition failed', 'error');
      }
    } catch (error) {
      showFeedback('Network error. Please try again.', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const data = await api.deleteTask(taskId);
      if (data.success) {
        showFeedback(data.message, 'success');
        loadTasks();
      } else {
        showFeedback(data.message || 'Delete failed', 'error');
      }
    } catch (error) {
      showFeedback('Network error. Please try again.', 'error');
    }
  };

  const getActionButtons = (task) => {
    if (task.state === 'Not Started') {
      return (
        <button
          onClick={() => handleStateTransition(task._id, 'In Progress')}
          className="btn btn-start"
        >
          <span className="btn-icon">▶</span> Start Task
        </button>
      );
    } else if (task.state === 'In Progress') {
      return (
        <button
          onClick={() => handleStateTransition(task._id, 'Completed')}
          className="btn btn-complete"
        >
          <span className="btn-icon">✓</span> Complete
        </button>
      );
    }
    return null;
  };

  const filters = [
    { label: 'All Tasks', value: 'all', icon: '📋' },
    { label: 'Not Started', value: 'Not Started', icon: '⭕' },
    { label: 'In Progress', value: 'In Progress', icon: '⏳' },
    { label: 'Completed', value: 'Completed', icon: '✅' },
  ];

  return (
    <div className="app-container">
      <div className="content-wrapper">
        
        <header className="app-header">
          <div className="header-content">
            <div className="header-title">
              <div className="logo-icon">📝</div>
              <h1>Task Manager</h1>
            </div>
            <div className="mode-toggle">
              <button
                onClick={() => setCurrentMode('ui')}
                className={`mode-btn ${currentMode === 'ui' ? 'active' : ''}`}
              >
                🖱️ UI Mode
              </button>
              <button
                onClick={() => setCurrentMode('ai')}
                className={`mode-btn ${currentMode === 'ai' ? 'active' : ''}`}
              >
                🤖 AI Mode
              </button>
            </div>
          </div>
        </header>

        {feedback.message && (
          <div className={`feedback feedback-${feedback.type}`}>
            <span className="feedback-message">{feedback.message}</span>
            <button
              onClick={() => setFeedback({ message: '', type: 'success' })}
              className="feedback-close"
            >
              ×
            </button>
          </div>
        )}

        {currentMode === 'ui' && (
          <section className="card create-section">
            <h2 className="section-title">
              <span className="title-icon">✨</span>
              Create New Task
            </h2>
            <form onSubmit={handleCreateTask} className="create-form">
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="What needs to be done?"
                maxLength="200"
                className="task-input"
                required
              />
              <button type="submit" className="btn btn-primary">
                <span className="btn-icon">+</span> Create
              </button>
            </form>
          </section>
        )}

        {currentMode === 'ai' && (
          <section className="card ai-section">
            <h2 className="section-title">
              <span className="title-icon">🤖</span>
              AI Command Center
            </h2>
            <form onSubmit={handleAICommand} className="ai-form">
              <input
                type="text"
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                placeholder="Tell me what to do..."
                className="task-input"
                required
              />
              <button type="submit" className="btn btn-primary">
                <span className="btn-icon">🚀</span> Send
              </button>
            </form>

            <div className="ai-examples">
              <p className="examples-title">💡 Try these commands:</p>
              <ul className="examples-list">
                <li>"Create a task called Buy groceries"</li>
                <li>"Mark 'Buy groceries' as in progress"</li>
                <li>"Mark homework as done"</li>
                <li>"Show me all completed tasks"</li>
                <li>"Delete the grocery task"</li>
              </ul>
            </div>
          </section>
        )}

        <section className="card filter-section">
          <h2 className="section-title">
            <span className="title-icon">🔍</span>
            Filter Tasks
          </h2>
          <div className="filter-buttons">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setCurrentFilter(filter.value)}
                className={`filter-btn ${currentFilter === filter.value ? 'active' : ''}`}
              >
                <span className="filter-icon">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="card task-list-section">
          <h2 className="section-title">
            <span className="title-icon">📑</span>
            Tasks
            <span className="task-count">{tasks.length}</span>
          </h2>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p className="empty-text">No tasks found</p>
              <p className="empty-subtext">Create a new task to get started!</p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div key={task._id} className={`task-card state-${task.state.toLowerCase().replace(' ', '-')}`}>
                  <div className="task-header">
                    <h3 className="task-name">{task.name}</h3>
                    <span className={`task-badge badge-${task.state.toLowerCase().replace(' ', '-')}`}>
                      {task.state}
                    </span>
                  </div>

                  <div className="task-meta">
                    <span className="task-date">
                      📅 {new Date(task.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="task-actions">
                    {getActionButtons(task)}
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="btn btn-delete"
                    >
                      <span className="btn-icon">🗑️</span> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;