const express = require('express');
const { body } = require('express-validator');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Dashboard stats (no projectId)
router.get('/dashboard', getDashboardStats);

// Project-specific tasks
router.route('/project/:projectId').get(getTasks).post(
  [
    body('title').trim().isLength({ min: 2 }).withMessage('Task title must be at least 2 characters'),
    body('status').optional().isIn(['todo', 'in_progress', 'in_review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  createTask
);

router.route('/project/:projectId/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
