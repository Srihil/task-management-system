const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');
const asyncHandler = require('../middleware/asyncHandler');

router.post('/', asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Task name is required');
  }

  const result = await taskService.createTask(name);
  res.status(201).json(result);
}));

router.get('/', asyncHandler(async (req, res) => {
  const { state } = req.query;

  const result = await taskService.getTasks(state || null);
  res.status(200).json(result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await taskService.getTaskById(id);
  res.status(200).json(result);
}));

router.patch('/:id/state', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { targetState } = req.body;

  if (!targetState) {
    res.status(400);
    throw new Error('Target state is required');
  }

  const result = await taskService.transitionTaskState(id, targetState);
  res.status(200).json(result);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await taskService.deleteTask(id);
  res.status(200).json(result);
}));

module.exports = router;