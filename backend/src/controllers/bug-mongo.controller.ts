import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth-mongo.middleware';
import { Bug } from '../models/mongoose/Bug';
import { OrganizationMember } from '../models/mongoose/OrganizationMember';

export const getAllBugs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // For super admin, support organization filtering
    if (user.role === 'admin' && user.email === 'admin@bugtracker.com') {
      const { organizationId } = req.query;

      if (organizationId) {
        console.log('🔍 Super admin requesting bugs for organization:', organizationId);
        const bugs = await Bug.find({
          organizationId: organizationId
        }).populate('reporterId assigneeId projectId', 'firstName lastName email name');

        const bugData = bugs.map(bug => ({
          id: bug._id,
          title: bug.title,
          description: bug.description,
          status: bug.status,
          priority: bug.priority,
          severity: bug.severity,
          type: bug.type,
          reporter: bug.reporterId,
          assignee: bug.assigneeId,
          project: bug.projectId,
          organizationId: bug.organizationId,
          createdAt: bug.createdAt,
          updatedAt: bug.updatedAt
        }));

        console.log('✅ Found', bugData.length, 'bugs for organization', organizationId);
        res.json({
          success: true,
          data: { bugs: bugData }
        });
        return;
      }
    }

    // Get user's organization memberships
    const memberships = await OrganizationMember.find({
      userId: user._id,
      status: 'active'
    });

    if (memberships.length === 0) {
      res.json({
        success: true,
        data: { bugs: [] }
      });
      return;
    }

    const organizationIds = memberships.map(m => m.organizationId);

    // Get bugs from user's organizations
    const bugs = await Bug.find({
      organizationId: { $in: organizationIds }
    }).populate('reporterId assigneeId projectId', 'firstName lastName email name');

    const bugData = bugs.map(bug => ({
      id: bug._id,
      title: bug.title,
      description: bug.description,
      status: bug.status,
      priority: bug.priority,
      severity: bug.severity,
      type: bug.type,
      reporter: bug.reporterId,
      assignee: bug.assigneeId,
      project: bug.projectId,
      organizationId: bug.organizationId,
      createdAt: bug.createdAt,
      updatedAt: bug.updatedAt
    }));

    res.json({
      success: true,
      data: { bugs: bugData }
    });
  } catch (error) {
    console.error('Get all bugs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getBugById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const bug = await Bug.findById(id).populate('reporterId assigneeId projectId organizationId', 'firstName lastName email name');
    
    if (!bug) {
      res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
      return;
    }

    // Check if user has access to this bug
    const membership = await OrganizationMember.findOne({
      userId: user._id,
      organizationId: bug.organizationId,
      status: 'active'
    });

    if (!membership && !(user.role === 'admin' && user.email === 'admin@bugtracker.com')) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        bug: {
          id: bug._id,
          title: bug.title,
          description: bug.description,
          status: bug.status,
          priority: bug.priority,
          severity: bug.severity,
          type: bug.type,
          reporter: bug.reporterId,
          assignee: bug.assigneeId,
          project: bug.projectId,
          organization: bug.organizationId,
          createdAt: bug.createdAt,
          updatedAt: bug.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get bug by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createBug = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { title, description, priority = 'medium', severity = 'minor', type = 'bug', projectId, assigneeId } = req.body;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!title) {
      res.status(400).json({
        success: false,
        message: 'Bug title is required'
      });
      return;
    }

    // Get user's primary organization
    const membership = await OrganizationMember.findOne({
      userId: user._id,
      status: 'active'
    });

    if (!membership) {
      res.status(400).json({
        success: false,
        message: 'User must be a member of an organization to create bugs'
      });
      return;
    }

    const bug = await Bug.create({
      title,
      description: description || '',
      priority,
      severity,
      type,
      status: 'open',
      reporterId: user._id,
      assigneeId: assigneeId || null,
      projectId: projectId || null,
      organizationId: membership.organizationId
    });

    const populatedBug = await Bug.findById(bug._id).populate('reporterId assigneeId projectId', 'firstName lastName email name');

    res.status(201).json({
      success: true,
      data: {
        bug: {
          id: populatedBug!._id,
          title: populatedBug!.title,
          description: populatedBug!.description,
          status: populatedBug!.status,
          priority: populatedBug!.priority,
          severity: populatedBug!.severity,
          type: populatedBug!.type,
          reporter: populatedBug!.reporterId,
          assignee: populatedBug!.assigneeId,
          project: populatedBug!.projectId,
          organizationId: populatedBug!.organizationId,
          createdAt: populatedBug!.createdAt,
          updatedAt: populatedBug!.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateBug = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { title, description, priority, severity, type, status, assigneeId, projectId } = req.body;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const bug = await Bug.findByIdAndUpdate(
      id,
      { title, description, priority, severity, type, status, assigneeId, projectId },
      { new: true }
    ).populate('reporterId assigneeId projectId', 'firstName lastName email name');

    if (!bug) {
      res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        bug: {
          id: bug._id,
          title: bug.title,
          description: bug.description,
          status: bug.status,
          priority: bug.priority,
          severity: bug.severity,
          type: bug.type,
          reporter: bug.reporterId,
          assignee: bug.assigneeId,
          project: bug.projectId,
          organizationId: bug.organizationId,
          updatedAt: bug.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateBugStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { status } = req.body;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required'
      });
      return;
    }

    const bug = await Bug.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('reporterId assigneeId projectId', 'firstName lastName email name');

    if (!bug) {
      res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        bug: {
          id: bug._id,
          title: bug.title,
          status: bug.status,
          updatedAt: bug.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update bug status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteBug = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const bug = await Bug.findByIdAndDelete(id);

    if (!bug) {
      res.status(404).json({
        success: false,
        message: 'Bug not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
