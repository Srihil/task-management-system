const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const taskService = require('../services/taskService');
const asyncHandler = require('../middleware/asyncHandler');

router.post('/command', asyncHandler(async (req, res) => {
  const { command } = req.body;

  if (!command || typeof command !== 'string' || command.trim() === '') {
    res.status(400);
    throw new Error('Command is required and must be a non-empty string');
  }

  const aiResult = await aiService.interpretCommand(command);

  if (!aiResult.success) {
    return res.status(200).json({
      success: false,
      message: 'Could not understand the command',
      intent: aiResult.intent,
      error: aiResult.error
    });
  }

  const { intent } = aiResult;

  try {
    switch (intent.action) {
      case 'create':
        return await handleCreateTask(intent, res);
      
      case 'update_state':
        return await handleUpdateState(intent, res);
      
      case 'delete':
        return await handleDeleteTask(intent, res);
      
      case 'list':
        return await handleListTasks(intent, res);
      
      case 'unknown':
        return res.status(200).json({
          success: false,
          message: 'Could not determine what you want to do',
          intent: intent,
          suggestion: 'Try commands like: "Create a task", "Mark [task] as done", "Show completed tasks", "Delete [task]"'
        });
      
      default:
        return res.status(200).json({
          success: false,
          message: `Unknown action: ${intent.action}`,
          intent: intent
        });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      intent: intent
    });
  }
}));

const handleCreateTask = async (intent, res) => {
  if (!intent.taskName) {
    return res.status(400).json({
      success: false,
      message: 'Could not determine task name',
      intent: intent
    });
  }

  const result = await taskService.createTask(intent.taskName);
  return res.status(201).json({
    success: true,
    message: `Task "${intent.taskName}" created successfully`,
    data: result.data,
    intent: intent
  });
};

const handleUpdateState = async (intent, res) => {
  if (!intent.taskName) {
    return res.status(400).json({
      success: false,
      message: 'Could not determine which task to update',
      intent: intent
    });
  }

  if (!intent.targetState) {
    return res.status(400).json({
      success: false,
      message: 'Could not determine target state',
      intent: intent
    });
  }

  const findResult = await taskService.findTaskByName(intent.taskName);
  
  if (!findResult.success || !findResult.data) {
    const partialResult = await taskService.findTasksByPartialName(intent.taskName);
    
    if (partialResult.count === 0) {
      return res.status(404).json({
        success: false,
        message: `No task found matching "${intent.taskName}"`,
        intent: intent,
        suggestion: 'Check the task name and try again'
      });
    }

    if (partialResult.count > 1) {
      return res.status(400).json({
        success: false,
        message: `Found ${partialResult.count} tasks matching "${intent.taskName}"`,
        matches: partialResult.data.map(t => ({ id: t._id, name: t.name, state: t.state })),
        intent: intent,
        suggestion: 'Please be more specific with the task name'
      });
    }

    const task = partialResult.data[0];
    const updateResult = await taskService.transitionTaskState(task._id, intent.targetState);
    
    return res.status(200).json({
      success: true,
      message: updateResult.message,
      data: updateResult.data,
      intent: intent
    });
  }

  const task = findResult.data;
  const updateResult = await taskService.transitionTaskState(task._id, intent.targetState);
  
  return res.status(200).json({
    success: true,
    message: updateResult.message,
    data: updateResult.data,
    intent: intent
  });
};

const handleDeleteTask = async (intent, res) => {
  if (!intent.taskName) {
    return res.status(400).json({
      success: false,
      message: 'Could not determine which task to delete',
      intent: intent
    });
  }

  const findResult = await taskService.findTaskByName(intent.taskName);
  
  if (!findResult.success || !findResult.data) {
    const partialResult = await taskService.findTasksByPartialName(intent.taskName);
    
    if (partialResult.count === 0) {
      return res.status(404).json({
        success: false,
        message: `No task found matching "${intent.taskName}"`,
        intent: intent
      });
    }

    if (partialResult.count > 1) {
      return res.status(400).json({
        success: false,
        message: `Found ${partialResult.count} tasks matching "${intent.taskName}"`,
        matches: partialResult.data.map(t => ({ id: t._id, name: t.name, state: t.state })),
        intent: intent,
        suggestion: 'Please be more specific with the task name'
      });
    }

    const task = partialResult.data[0];
    const deleteResult = await taskService.deleteTask(task._id);
    
    return res.status(200).json({
      success: true,
      message: `Task "${task.name}" deleted successfully`,
      data: deleteResult.data,
      intent: intent
    });
  }

  const task = findResult.data;
  const deleteResult = await taskService.deleteTask(task._id);
  
  return res.status(200).json({
    success: true,
    message: `Task "${task.name}" deleted successfully`,
    data: deleteResult.data,
    intent: intent
  });
};

const handleListTasks = async (intent, res) => {
  const result = await taskService.getTasks(intent.filterState || null);
  
  return res.status(200).json({
    success: true,
    message: result.message,
    data: result.data,
    count: result.count,
    intent: intent
  });
};

module.exports = router;