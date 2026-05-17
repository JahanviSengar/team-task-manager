const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Check if user is admin of a project
const requireProjectAdmin = (Project) => async (req, res, next) => {
  const project = await Project.findById(req.params.projectId || req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  const member = project.members.find(
    (m) => m.user.toString() === req.user._id.toString()
  );

  if (!member || member.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required for this action.',
    });
  }

  req.project = project;
  next();
};

module.exports = { protect, requireProjectAdmin };
