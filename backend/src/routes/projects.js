const express = require('express');
const { body } = require('express-validator');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(getProjects).post(
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Project name must be at least 2 characters'),
    body('description').optional().isLength({ max: 500 }),
  ],
  createProject
);

router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId', updateMemberRole);

module.exports = router;
