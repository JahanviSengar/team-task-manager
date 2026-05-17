/**
 * Seed Script — creates demo data for testing
 * Usage: node src/utils/seed.js
 * Set MONGODB_URI in .env before running
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Project.deleteMany(), Task.deleteMany()]);
    console.log('Cleared existing data');

    // Create users
    const [alice, bob, carol] = await User.create([
      { name: 'Alice Admin', email: 'alice@demo.com', password: 'demo123' },
      { name: 'Bob Member', email: 'bob@demo.com', password: 'demo123' },
      { name: 'Carol Dev', email: 'carol@demo.com', password: 'demo123' },
    ]);
    console.log('Created 3 users');

    // Create projects
    const [proj1, proj2] = await Project.create([
      {
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with modern design',
        status: 'active',
        priority: 'high',
        color: '#7c3aed',
        owner: alice._id,
        members: [
          { user: alice._id, role: 'admin' },
          { user: bob._id, role: 'member' },
          { user: carol._id, role: 'member' },
        ],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Mobile App v2',
        description: 'Second version of the mobile application with new features',
        status: 'active',
        priority: 'critical',
        color: '#0891b2',
        owner: bob._id,
        members: [
          { user: bob._id, role: 'admin' },
          { user: alice._id, role: 'member' },
        ],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log('Created 2 projects');

    // Create tasks for Website Redesign
    await Task.create([
      { title: 'Design new homepage mockup', description: 'Create wireframes and high-fidelity mockups for homepage', status: 'done', priority: 'high', project: proj1._id, createdBy: alice._id, assignedTo: carol._id, tags: ['design', 'frontend'], completedAt: new Date() },
      { title: 'Set up React project structure', description: 'Initialize CRA, configure ESLint, Prettier, and folder structure', status: 'done', priority: 'medium', project: proj1._id, createdBy: alice._id, assignedTo: bob._id, tags: ['frontend', 'setup'] },
      { title: 'Implement authentication flow', description: 'Login, register, forgot password pages with JWT', status: 'in_progress', priority: 'critical', project: proj1._id, createdBy: alice._id, assignedTo: bob._id, tags: ['auth', 'backend'] },
      { title: 'Build dashboard components', description: 'Stats cards, charts, and activity feed', status: 'in_progress', priority: 'high', project: proj1._id, createdBy: alice._id, assignedTo: carol._id, tags: ['frontend', 'dashboard'] },
      { title: 'Write API integration tests', description: 'Test all REST endpoints with edge cases', status: 'todo', priority: 'medium', project: proj1._id, createdBy: alice._id, tags: ['testing', 'backend'], dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { title: 'SEO optimization', description: 'Meta tags, sitemap, robots.txt, structured data', status: 'todo', priority: 'low', project: proj1._id, createdBy: alice._id, tags: ['seo'] },
      { title: 'Deploy to production', description: 'Set up CI/CD pipeline and deploy to Railway', status: 'todo', priority: 'high', project: proj1._id, createdBy: alice._id, assignedTo: bob._id, dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), tags: ['devops'] },
      // Overdue task
      { title: 'Fix navigation bug on mobile', description: 'Hamburger menu not closing after link click on iOS', status: 'in_review', priority: 'high', project: proj1._id, createdBy: carol._id, assignedTo: carol._id, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), tags: ['bug', 'mobile'] },
    ]);

    // Create tasks for Mobile App v2
    await Task.create([
      { title: 'Design onboarding screens', description: '5-step onboarding flow with animations', status: 'done', priority: 'high', project: proj2._id, createdBy: bob._id, assignedTo: alice._id, tags: ['design', 'ux'] },
      { title: 'Implement push notifications', description: 'FCM integration for iOS and Android', status: 'in_progress', priority: 'critical', project: proj2._id, createdBy: bob._id, assignedTo: bob._id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), tags: ['backend', 'notifications'] },
      { title: 'App Store submission', description: 'Prepare screenshots, descriptions, and submit for review', status: 'todo', priority: 'high', project: proj2._id, createdBy: bob._id, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), tags: ['release'] },
      // Overdue
      { title: 'Fix crash on Android 11', description: 'App crashes on startup on Android 11 devices', status: 'todo', priority: 'critical', project: proj2._id, createdBy: bob._id, assignedTo: alice._id, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), tags: ['bug', 'android'] },
    ]);
    console.log('Created 12 tasks');

    console.log('\n✅ Seed complete!');
    console.log('\nDemo accounts (password: demo123):');
    console.log('  alice@demo.com — Admin of Website Redesign');
    console.log('  bob@demo.com   — Admin of Mobile App v2');
    console.log('  carol@demo.com — Member on Website Redesign');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
