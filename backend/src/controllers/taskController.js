const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper: verify project membership
const verifyMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found.', status: 404 };
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  if (!member) return { error: 'Access denied.', status: 403 };
  return { project, member };
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, assignedTo, priority, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const { error, status: statusCode } = await verifyMembership(projectId, req.user._id);
    if (error) return res.status(statusCode).json({ success: false, message: error });

    const query = { project: projectId };
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo === 'me' ? req.user._id : assignedTo;
    if (priority) query.priority = priority;
    if (search) query.title = { $regex: search, $options: 'i' };

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort(sortOptions);

    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/projects/:projectId/tasks/:id
// @access  Private
const getTask = async (req, res, next) => {
  try {
    const { error, status } = await verifyMembership(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const task = await Task.findOne({
      _id: req.params.id,
      project: req.params.projectId,
    })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/projects/:projectId/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { projectId } = req.params;
    const { error, status, project, member } = await verifyMembership(projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    // Validate assignedTo is a project member
    if (req.body.assignedTo) {
      const isValidMember = project.members.some(
        (m) => m.user.toString() === req.body.assignedTo
      );
      if (!isValidMember) {
        return res.status(400).json({ success: false, message: 'Assigned user is not a project member.' });
      }
    }

    const task = await Task.create({
      ...req.body,
      project: projectId,
      createdBy: req.user._id,
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/projects/:projectId/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { error, status, project, member } = await verifyMembership(projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const task = await Task.findOne({ _id: req.params.id, project: projectId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Members can only edit tasks assigned to them or created by them (unless admin)
    const isAdmin = member.role === 'admin';
    const isOwner = task.createdBy.toString() === req.user._id.toString();
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner && !isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this task.' });
    }

    // Validate new assignedTo
    if (req.body.assignedTo) {
      const isValidMember = project.members.some(
        (m) => m.user.toString() === req.body.assignedTo
      );
      if (!isValidMember) {
        return res.status(400).json({ success: false, message: 'Assigned user is not a project member.' });
      }
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo', 'tags'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/projects/:projectId/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { error, status, member } = await verifyMembership(projectId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const task = await Task.findOne({ _id: req.params.id, project: projectId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const isAdmin = member.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task.' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/tasks/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // Get all project IDs where user is a member
    const projects = await Project.find({ 'members.user': req.user._id }).select('_id name color');
    const projectIds = projects.map((p) => p._id);

    // Task stats across all projects
    const [totalTasks, tasksByStatus, myTasks, overdueTasks, recentTasks] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({ project: { $in: projectIds }, assignedTo: req.user._id }),
      Task.countDocuments({
        project: { $in: projectIds },
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() },
      }),
      Task.find({ project: { $in: projectIds } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('project', 'name color')
        .populate('assignedTo', 'name avatar')
        .populate('createdBy', 'name avatar'),
    ]);

    const statusMap = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    tasksByStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });

    // Tasks due soon (next 7 days)
    const dueSoon = await Task.countDocuments({
      project: { $in: projectIds },
      status: { $ne: 'done' },
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      success: true,
      stats: {
        totalProjects: projects.length,
        totalTasks,
        myTasks,
        overdueTasks,
        dueSoon,
        tasksByStatus: statusMap,
        recentTasks,
        projects: projects.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getDashboardStats };
