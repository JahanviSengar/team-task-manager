const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Add task stats to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const stats = { todo: 0, in_progress: 0, in_review: 0, done: 0, total: 0 };
        taskStats.forEach(({ _id, count }) => {
          stats[_id] = count;
          stats.total += count;
        });

        const overdueCount = await Task.countDocuments({
          project: project._id,
          status: { $ne: 'done' },
          dueDate: { $lt: new Date() },
        });

        return { ...project.toObject(), stats: { ...stats, overdue: overdueCount } };
      })
    );

    res.json({ success: true, projects: projectsWithStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isMember = project.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const project = await Project.create({
      ...req.body,
      owner: req.user._id,
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const member = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const allowedFields = ['name', 'description', 'status', 'priority', 'dueDate', 'color'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only project owner can delete.' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin only)
const addMember = async (req, res, next) => {
  try {
    const { userId, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const requestingMember = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requestingMember || requestingMember.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const alreadyMember = project.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member.' });
    }

    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin only)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const requestingMember = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requestingMember || requestingMember.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project owner.' });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await project.save();

    // Unassign tasks
    await Task.updateMany(
      { project: project._id, assignedTo: req.params.userId },
      { assignedTo: null }
    );

    await project.populate('members.user', 'name email avatar');
    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member role
// @route   PUT /api/projects/:id/members/:userId
// @access  Private (Admin only)
const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only owner can update roles.' });
    }

    const member = project.members.find((m) => m.user.toString() === req.params.userId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.role = role;
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
};
