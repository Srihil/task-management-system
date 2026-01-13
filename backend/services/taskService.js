const Task = require('../models/taskModel');
const VALID_TRANSITIONS = {
  'Not Started': ['In Progress'],
  'In Progress': ['Completed'],
  'Completed': [] 
};

const isValidTransition = (currentState, targetState) => {
  if (currentState === targetState) {
    return true;
  }
  
  const allowedStates = VALID_TRANSITIONS[currentState] || [];
  return allowedStates.includes(targetState);
};

const createTask = async (name) => {
  try {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Task name is required and must be a non-empty string');
    }

    const task = await Task.create({ name: name.trim() });
    return {
      success: true,
      data: task,
      message: 'Task created successfully'
    };
  } catch (error) {
    if (error.name === 'ValidationError') {
      throw new Error(Object.values(error.errors).map(e => e.message).join(', '));
    }
    throw error;
  }
};

const getTasks = async (state = null) => {
  try {
    const filter = {};
    
    if (state) {
      const validStates = ['Not Started', 'In Progress', 'Completed'];
      if (!validStates.includes(state)) {
        throw new Error(`Invalid state: ${state}. Must be one of: ${validStates.join(', ')}`);
      }
      filter.state = state;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 }); // Newest first
    return {
      success: true,
      data: tasks,
      count: tasks.length,
      message: state ? `Tasks filtered by state: ${state}` : 'All tasks retrieved'
    };
  } catch (error) {
    throw error;
  }
};

const getTaskById = async (taskId) => {
  try {
    const task = await Task.findById(taskId);
    
    if (!task) {
      throw new Error('Task not found');
    }

    return {
      success: true,
      data: task
    };
  } catch (error) {
    if (error.name === 'CastError') {
      throw new Error('Invalid task ID format');
    }
    throw error;
  }
};

const findTaskByName = async (name) => {
  try {
    if (!name || typeof name !== 'string') {
      throw new Error('Task name must be provided');
    }

    const task = await Task.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });

    if (!task) {
      return {
        success: false,
        data: null,
        message: `No task found with name: "${name}"`
      };
    }

    return {
      success: true,
      data: task
    };
  } catch (error) {
    throw error;
  }
};

const findTasksByPartialName = async (nameFragment) => {
  try {
    if (!nameFragment || typeof nameFragment !== 'string') {
      throw new Error('Name fragment must be provided');
    }

    const tasks = await Task.find({ 
      name: { $regex: new RegExp(nameFragment.trim(), 'i') } 
    }).sort({ createdAt: -1 });

    return {
      success: true,
      data: tasks,
      count: tasks.length,
      message: tasks.length === 0 
        ? `No tasks found matching: "${nameFragment}"` 
        : `Found ${tasks.length} task(s) matching: "${nameFragment}"`
    };
  } catch (error) {
    throw error;
  }
};

const transitionTaskState = async (taskId, targetState) => {
  try {
    const validStates = ['Not Started', 'In Progress', 'Completed'];
    if (!validStates.includes(targetState)) {
      throw new Error(`Invalid target state: ${targetState}. Must be one of: ${validStates.join(', ')}`);
    }

    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const currentState = task.state;

    if (!isValidTransition(currentState, targetState)) {
      throw new Error(
        `Invalid state transition: Cannot move from "${currentState}" to "${targetState}". ` +
        `Valid next state(s) from "${currentState}": ${
          VALID_TRANSITIONS[currentState].length > 0 
            ? VALID_TRANSITIONS[currentState].join(', ') 
            : 'None (task is completed)'
        }`
      );
    }

    if (currentState === targetState) {
      return {
        success: true,
        data: task,
        message: `Task is already in state: ${targetState}`
      };
    }

    task.state = targetState;
    await task.save();

    return {
      success: true,
      data: task,
      message: `Task state updated from "${currentState}" to "${targetState}"`
    };
  } catch (error) {
    if (error.name === 'CastError') {
      throw new Error('Invalid task ID format');
    }
    throw error;
  }
};


const deleteTask = async (taskId) => {
  try {
    const task = await Task.findByIdAndDelete(taskId);
    
    if (!task) {
      throw new Error('Task not found');
    }

    return {
      success: true,
      data: task,
      message: 'Task deleted successfully'
    };
  } catch (error) {
    if (error.name === 'CastError') {
      throw new Error('Invalid task ID format');
    }
    throw error;
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  findTaskByName,
  findTasksByPartialName,
  transitionTaskState,
  deleteTask,
  isValidTransition 
};