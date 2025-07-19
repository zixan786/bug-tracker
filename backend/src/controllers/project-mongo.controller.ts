import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth-mongo.middleware';
import { Project } from '../models/mongoose/Project';
import { OrganizationMember } from '../models/mongoose/OrganizationMember';

export const getMyProjects = async (req: AuthRequest, res: Response): Promise<void> => {
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
        console.log('🔍 Super admin requesting projects for organization:', organizationId);
        const projects = await Project.find({
          organizationId: organizationId
        }).populate('ownerId', 'firstName lastName email');

        const projectData = projects.map(project => ({
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          visibility: project.visibility,
          owner: project.ownerId,
          organizationId: project.organizationId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }));

        console.log('✅ Found', projectData.length, 'projects for organization', organizationId);
        res.json({
          success: true,
          data: { projects: projectData }
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
        data: { projects: [] }
      });
      return;
    }

    const organizationIds = memberships.map(m => m.organizationId);

    // Get projects from user's organizations
    const projects = await Project.find({
      organizationId: { $in: organizationIds }
    }).populate('ownerId', 'firstName lastName email');

    const projectData = projects.map(project => ({
      id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      visibility: project.visibility,
      owner: project.ownerId,
      organizationId: project.organizationId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));

    res.json({
      success: true,
      data: { projects: projectData }
    });
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAllProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // For super admin, return all projects
    if (user.role === 'admin' && user.email === 'admin@bugtracker.com') {
      const projects = await Project.find({}).populate('ownerId organizationId', 'firstName lastName email name');
      
      const projectData = projects.map(project => ({
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        visibility: project.visibility,
        owner: project.ownerId,
        organization: project.organizationId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }));

      res.json({
        success: true,
        data: { projects: projectData }
      });
      return;
    }

    // For regular users, use getMyProjects logic
    await getMyProjects(req, res);
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const project = await Project.findById(id).populate('ownerId organizationId', 'firstName lastName email name');
    
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }

    // Check if user has access to this project
    const membership = await OrganizationMember.findOne({
      userId: user._id,
      organizationId: project.organizationId,
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
        project: {
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          visibility: project.visibility,
          owner: project.ownerId,
          organization: project.organizationId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { name, description, visibility = 'private' } = req.body;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Project name is required'
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
        message: 'User must be a member of an organization to create projects'
      });
      return;
    }

    const project = await Project.create({
      name,
      description: description || '',
      visibility,
      status: 'active',
      ownerId: user._id,
      organizationId: membership.organizationId
    });

    const populatedProject = await Project.findById(project._id).populate('ownerId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: {
        project: {
          id: populatedProject!._id,
          name: populatedProject!.name,
          description: populatedProject!.description,
          status: populatedProject!.status,
          visibility: populatedProject!.visibility,
          owner: populatedProject!.ownerId,
          organizationId: populatedProject!.organizationId,
          createdAt: populatedProject!.createdAt,
          updatedAt: populatedProject!.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { name, description, visibility, status } = req.body;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { name, description, visibility, status },
      { new: true }
    ).populate('ownerId', 'firstName lastName email');

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        project: {
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          visibility: project.visibility,
          owner: project.ownerId,
          organizationId: project.organizationId,
          updatedAt: project.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const addMemberToProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(501).json({
      success: false,
      message: 'Add member to project not implemented yet'
    });
  } catch (error) {
    console.error('Add member to project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
