const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true, 
      minlength: [1, 'Task name cannot be empty'],
      maxlength: [200, 'Task name cannot exceed 200 characters']
    },
    state: {
      type: String,
      required: true,
      enum: {
        values: ['Not Started', 'In Progress', 'Completed'],
        message: '{VALUE} is not a valid state'
      },
      default: 'Not Started'
    }
  },
  {
    timestamps: true 
  }
);

taskSchema.index({ state: 1 });

taskSchema.index({ name: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;