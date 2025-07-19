import { useState, useEffect } from 'react';
import EnhancedUIDemo from './components/demo/EnhancedUIDemo';

interface User {
  id: string | number; // Support both for compatibility
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Bug {
  id: string | number; // Support both for compatibility
  title: string;
  description: string;
  priority: string;
  severity: string;
  status: string;
  type: string;
  projectId?: string | number; // Optional and support both types
  assigneeId?: string | number; // Optional and support both types
  reporterId?: string | number; // Add missing property
  reporter?: User; // Add populated reporter object
  assignee?: User; // Add populated assignee object
  project?: Project; // Add populated project object
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string | number; // Support both for compatibility
  name: string;
  description: string;
  status: string;
  visibility?: string; // Add missing property
  owner?: User; // Add populated owner object
  ownerId?: string | number; // Add owner ID
  createdAt: string;
  updatedAt: string;
}

interface AppUser {
  id: string | number; // Support both for compatibility
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Data transformation utilities for MongoDB compatibility
const transformBugData = (bug: any): Bug => {
  return {
    ...bug,
    id: bug.id || bug._id,
    // Handle populated objects from MongoDB
    assigneeId: bug.assignee?.id || bug.assignee?._id || bug.assigneeId,
    reporterId: bug.reporter?.id || bug.reporter?._id || bug.reporterId,
    projectId: bug.project?.id || bug.project?._id || bug.projectId,
    // Keep populated objects for direct access
    assignee: bug.assignee,
    reporter: bug.reporter,
    project: bug.project
  };
};

const transformProjectData = (project: any): Project => {
  return {
    ...project,
    id: project.id || project._id,
    ownerId: project.owner?.id || project.owner?._id || project.ownerId,
    owner: project.owner
  };
};

// Helper function to safely format dates
const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'N/A';

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting date:', dateValue, error);
    return 'Invalid Date';
  }
};

const transformUserData = (user: any): AppUser => {
  return {
    ...user,
    id: user.id || user._id,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString()
  };
};

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<User | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);

  // Multi-tenant state
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({ name: '', slug: '' });

  // Admin vs Tenant view
  const [viewMode, setViewMode] = useState<'admin' | 'tenant'>('admin'); // Default to admin view
  const [allOrganizations, setAllOrganizations] = useState<any[]>([]); // For super admin
  const [systemStats, setSystemStats] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);



  // Check if accessing via tenant subdomain
  const checkSubdomainTenant = () => {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);

    // Check for subdomain pattern (e.g., acme.localhost, s4.localhost)
    if (hostname !== 'localhost' && hostname.includes('localhost')) {
      const subdomain = hostname.split('.')[0];
      console.log('Detected subdomain:', subdomain);

      // Find organization by slug
      const orgs = JSON.parse(localStorage.getItem('demo_organizations') || '[]');
      const org = orgs.find((o: any) => o.slug === subdomain);

      if (org) {
        console.log('Found organization for subdomain:', org);
        setCurrentOrganization(org);

        // Show tenant-specific login message
        alert(`Welcome to ${org.name}!\n\nPlease login with your organization credentials:\n• admin@${subdomain}.com / password123\n• dev@${subdomain}.com / password123`);
      } else {
        console.log('No organization found for subdomain:', subdomain);
        alert(`Organization "${subdomain}" not found.\n\nAvailable organizations:\n• acme (admin@acme.com)\n• beta (admin@beta.com)\n\nOr go to http://localhost:5173 for main access.`);
      }
    }
  };
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [viewingBug, setViewingBug] = useState<Bug | null>(null);

  // API Base URL
  const API_BASE = 'http://localhost:3001/api';

  // Load user session on app startup
  useEffect(() => {
    const loadSession = async () => {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('Restoring session for user:', parsedUser);
          setUser(parsedUser);
          setAuthToken(savedToken);
          setIsBackendConnected(true);
          setCurrentPage('dashboard');
          // Load dashboard data with the saved token
          console.log('Loading dashboard data from backend...');
          await loadDashboardData(savedToken);
          console.log('Dashboard data loaded successfully');

        // Load organizations for multi-tenant features
        await loadOrganizations();

        // Load admin data if user is admin
        if (parsedUser?.role === 'admin') {
          await loadAdminData();
        }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          // Clear invalid data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
    };

    loadSession();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);

    // First check if this is a demo account - if so, skip backend entirely
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password:', password);

    // Try backend first, then fall back to demo mode
    console.log('🔧 Trying backend first, then demo mode as fallback');

    // If not a demo account, try backend
    try {
      console.log('❌ Not a demo account, attempting backend login');
      console.log('API URL:', `${API_BASE}/auth/login`);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ Backend login successful');
        setUser(data.data.user);
        setAuthToken(data.data.token);
        setIsBackendConnected(true);

        // Save session to localStorage for persistence
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));

        // Handle organization context from backend
        if (data.data.organizations && data.data.organizations.length > 0) {
          setOrganizations(data.data.organizations);
          setAllOrganizations(data.data.organizations);
        }

        // Set primary organization for tenant users
        if (data.data.organizations && data.data.organizations.length > 0) {
          // Tenant user with organizations
          setOrganizations(data.data.organizations);
          setCurrentOrganization(data.data.organizations[0]);
          setViewMode('tenant');
        } else if (data.data.user.role === 'admin' && data.data.user.email === 'admin@bugtracker.com') {
          // Super admin user
          console.log('✅ Super admin detected, setting admin view mode');
          setViewMode('admin');
          // Load admin data immediately for super admin
          console.log('🔄 Calling loadAdminData for super admin...');
          await loadAdminData(data.data.user);
        } else {
          // Regular user without organization - load dashboard data
          await loadDashboardData(data.data.token);
        }

        // Load dashboard data only for tenant users
        if (data.data.organizations && data.data.organizations.length > 0) {
          await loadDashboardData(data.data.token);
        }

        setCurrentPage('dashboard');
        console.log('✅ Backend dashboard data loaded successfully');
      } else {
        console.error('❌ Backend login failed:', data);
        console.log('🔄 Trying demo mode as fallback...');

        // Try demo mode as fallback
        initializeDemoData();
        const demoUser = checkDemoLogin(email, password);

        if (demoUser) {
          console.log('✅ Demo account fallback successful');
          setUser(demoUser.user);
          setIsBackendConnected(false);
          loadDemoData();

          if (demoUser.organization) {
            setCurrentOrganization(demoUser.organization);
            setViewMode('tenant');
          } else {
            setViewMode('admin');
            if (demoUser.user.email === 'admin@bugtracker.com') {
              initializeDemoData();
              const demoOrgs = JSON.parse(localStorage.getItem('demo_organizations') || '[]');
              setAllOrganizations(demoOrgs);
              setOrganizations(demoOrgs);
            }
          }

          setCurrentPage('dashboard');
          return;
        }

        alert(`Backend login failed: ${data.message || 'Invalid credentials'}\n\nNo demo account found either.`);
      }
    } catch (error) {
      console.error('❌ Backend connection error:', error);
      console.log('🔄 Trying demo mode as fallback...');

      // Try demo mode as fallback
      initializeDemoData();
      const demoUser = checkDemoLogin(email, password);

      if (demoUser) {
        console.log('✅ Demo account fallback successful');
        setUser(demoUser.user);
        setIsBackendConnected(false);
        loadDemoData();

        if (demoUser.organization) {
          setCurrentOrganization(demoUser.organization);
          setViewMode('tenant');
        } else {
          setViewMode('admin');
          if (demoUser.user.email === 'admin@bugtracker.com') {
            initializeDemoData();
            const demoOrgs = JSON.parse(localStorage.getItem('demo_organizations') || '[]');
            setAllOrganizations(demoOrgs);
            setOrganizations(demoOrgs);
          }
        }

        setCurrentPage('dashboard');
        setLoading(false);
        return;
      }

      alert('Backend connection failed and no demo account found.\n\nPlease check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    if (!currentOrganization) {
      // If no organization context, load generic demo data for system admin
      console.log('Loading generic demo data for system admin');
      loadGenericDemoData();
      return;
    }

    // Load organization-specific demo data
    console.log('Loading demo data for organization:', currentOrganization.id);
    loadOrganizationSpecificData(currentOrganization.id);
  };

  // Load generic demo data (for system admin without organization context)
  const loadGenericDemoData = () => {
    console.log('Loading generic demo data for system admin');
    const demoUsers: AppUser[] = [
      {
        id: 1,
        email: "admin@bugtracker.com",
        firstName: "Super",
        lastName: "Admin",
        role: "admin",
        createdAt: new Date(Date.now() - 5184000000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    console.log('Setting generic data: 1 admin user, 0 projects, 0 bugs');
    setUsers(demoUsers);
    setProjects([]);
    setBugs([]);
  };

  // Load organization-specific demo data
  const loadOrganizationSpecificData = (organizationId: number) => {
    console.log('Loading data for organization ID:', organizationId);
    const orgData = getOrganizationDemoData(organizationId);
    console.log('Organization data loaded:', {
      bugs: orgData.bugs.length,
      projects: orgData.projects.length,
      users: orgData.users.length
    });
    setBugs(orgData.bugs);
    setProjects(orgData.projects);
    setUsers(orgData.users);
  };

  // Get organization-specific demo data
  const getOrganizationDemoData = (organizationId: number) => {
    const orgDataMap: { [key: number]: any } = {
      1: { // Acme Corporation
        bugs: [
          {
            id: 101,
            title: "Checkout process fails on mobile",
            description: "Users cannot complete purchases on mobile devices",
            priority: "high",
            severity: "major",
            status: "open",
            type: "bug",
            projectId: 101,
            assigneeId: 102,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 102,
            title: "Product images not loading",
            description: "Product images fail to load on slow connections",
            priority: "medium",
            severity: "minor",
            status: "in_progress",
            type: "bug",
            projectId: 101,
            assigneeId: 102,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 103,
            title: "Add wishlist feature",
            description: "Users want to save products for later",
            priority: "low",
            severity: "minor",
            status: "open",
            type: "feature",
            projectId: 101,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updatedAt: new Date(Date.now() - 259200000).toISOString()
          }
        ],

        projects: [
          {
            id: 101,
            name: "E-commerce Platform",
            description: "Main online shopping website",
            status: "active",
            createdAt: new Date(Date.now() - 2592000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 102,
            name: "Mobile Shopping App",
            description: "iOS and Android shopping application",
            status: "active",
            createdAt: new Date(Date.now() - 1296000000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 103,
            name: "Payment Gateway",
            description: "Secure payment processing system",
            status: "active",
            createdAt: new Date(Date.now() - 1728000000).toISOString(),
            updatedAt: new Date(Date.now() - 432000000).toISOString()
          }
        ],
        users: [
          {
            id: 101,
            email: "admin@acme.com",
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            createdAt: new Date(Date.now() - 5184000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 102,
            email: "dev@acme.com",
            firstName: "Dev",
            lastName: "User",
            role: "developer",
            createdAt: new Date(Date.now() - 2592000000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 103,
            email: "sarah@acme.com",
            firstName: "Sarah",
            lastName: "Designer",
            role: "developer",
            createdAt: new Date(Date.now() - 1296000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 104,
            email: "mike@acme.com",
            firstName: "Mike",
            lastName: "Tester",
            role: "tester",
            createdAt: new Date(Date.now() - 604800000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      },
      2: { // Beta Industries
        bugs: [
          {
            id: 201,
            title: "CRM data export timeout",
            description: "Large data exports are timing out after 30 seconds",
            priority: "high",
            severity: "major",
            status: "open",
            type: "bug",
            projectId: 201,
            assigneeId: 203,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 202,
            title: "Dashboard charts not responsive",
            description: "Charts break on smaller screen sizes",
            priority: "medium",
            severity: "minor",
            status: "resolved",
            type: "bug",
            projectId: 202,
            assigneeId: 203,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 203,
            title: "Add dark mode to dashboard",
            description: "Users request dark theme option",
            priority: "low",
            severity: "minor",
            status: "open",
            type: "feature",
            projectId: 202,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updatedAt: new Date(Date.now() - 259200000).toISOString()
          }
        ],
        projects: [
          {
            id: 201,
            name: "CRM System",
            description: "Customer relationship management platform",
            status: "active",
            createdAt: new Date(Date.now() - 2592000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 202,
            name: "Analytics Dashboard",
            description: "Business intelligence and reporting",
            status: "active",
            createdAt: new Date(Date.now() - 1296000000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 203,
            name: "API Gateway",
            description: "Microservices API management",
            status: "inactive",
            createdAt: new Date(Date.now() - 1728000000).toISOString(),
            updatedAt: new Date(Date.now() - 432000000).toISOString()
          }
        ],
        users: [
          {
            id: 201,
            email: "admin@beta.com",
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            createdAt: new Date(Date.now() - 5184000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 202,
            email: "qa@beta.com",
            firstName: "QA",
            lastName: "User",
            role: "tester",
            createdAt: new Date(Date.now() - 2592000000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 203,
            email: "tom@beta.com",
            firstName: "Tom",
            lastName: "Developer",
            role: "developer",
            createdAt: new Date(Date.now() - 1296000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 204,
            email: "lisa@beta.com",
            firstName: "Lisa",
            lastName: "Manager",
            role: "admin",
            createdAt: new Date(Date.now() - 604800000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      },
      4: { // S4 Company
        bugs: [
          {
            id: 401,
            title: "Login session expires too quickly",
            description: "Users get logged out every 15 minutes",
            priority: "medium",
            severity: "major",
            status: "resolved",
            type: "bug",
            projectId: 401,
            assigneeId: 401,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 402,
            title: "Employee directory search broken",
            description: "Search function returns no results",
            priority: "high",
            severity: "major",
            status: "open",
            type: "bug",
            projectId: 402,
            assigneeId: 402,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        projects: [
          {
            id: 401,
            name: "Internal Tools Suite",
            description: "Collection of productivity tools",
            status: "active",
            createdAt: new Date(Date.now() - 2592000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 402,
            name: "Employee Portal",
            description: "HR and employee self-service portal",
            status: "active",
            createdAt: new Date(Date.now() - 1296000000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString()
          }
        ],
        users: [
          {
            id: 401,
            email: "admin@s4.com",
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            createdAt: new Date(Date.now() - 5184000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 402,
            email: "user@s4.com",
            firstName: "User",
            lastName: "User",
            role: "developer",
            createdAt: new Date(Date.now() - 2592000000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 403,
            email: "alex@s4.com",
            firstName: "Alex",
            lastName: "DevOps",
            role: "developer",
            createdAt: new Date(Date.now() - 1296000000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      }
    };

    return orgDataMap[organizationId] || { bugs: [], projects: [], users: [] };
  };

  // Function to reload users from backend
  const reloadUsers = async () => {
    if (!isBackendConnected || !authToken) return;

    try {
      // For super admin with selected organization, load organization-specific users
      let endpoint = `${API_BASE}/users`;
      if (user?.role === 'admin' && user?.email === 'admin@bugtracker.com' && currentOrganization) {
        endpoint = `${API_BASE}/users?organizationId=${currentOrganization.id}`;
        console.log('🔄 Reloading users for organization:', currentOrganization.name);
      } else {
        console.log('🔄 Reloading all users (system-wide or regular user)');
      }

      const usersResponse = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const transformedUsers = (usersData.data.users || []).map(transformUserData);
        setUsers(transformedUsers);
        console.log('✅ Users reloaded:', transformedUsers.length);
      } else {
        console.error('❌ Failed to reload users:', usersResponse.status);
      }
    } catch (error) {
      console.error('Error reloading users:', error);
    }
  };

  // API Functions for Projects
  const createProject = async (projectData: { name: string; description: string; status: string }) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - just add to local state
      const newProject: Project = {
        id: Math.max(...projects.map(p => typeof p.id === 'string' ? parseInt(p.id) || 0 : p.id), 0) + 1,
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProjects(prev => [...prev, newProject]);
      return newProject;
    }

    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const data = await response.json();
        const newProject = transformProjectData(data.data.project);
        setProjects(prev => [...prev, newProject]);
        return newProject;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string | number) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - just remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  // API Functions for Users
  const createUser = async (userData: { email: string; firstName: string; lastName: string; role: string; password?: string; organizationId?: string | number }) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - just add to local state
      const newUser: AppUser = {
        id: Math.max(...users.map(u => typeof u.id === 'string' ? parseInt(u.id) || 0 : u.id), 0) + 1,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
      return newUser;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...userData,
          password: userData.password || 'defaultPassword123' // Default password for admin-created users
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newUser = data.data.user;
        // Reload all users to ensure consistency
        await reloadUsers();
        return newUser;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateProject = async (projectId: string | number, projectData: { name: string; description: string; status: string }) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - update local state
      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? { ...p, ...projectData, updatedAt: new Date().toISOString() }
          : p
      ));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedProject = transformProjectData(data.data.project);
        setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
        return updatedProject;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string | number, userData: { email: string; firstName: string; lastName: string; role: string }) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - update local state
      setUsers(prev => prev.map(u =>
        u.id === userId
          ? { ...u, ...userData, updatedAt: new Date().toISOString() }
          : u
      ));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.data.user;
        // Reload all users to ensure consistency
        await reloadUsers();
        return updatedUser;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string | number) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - just remove from local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        // Reload all users to ensure consistency
        await reloadUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // API Functions for Bugs
  const updateBug = async (bugId: string | number, bugData: {
    title: string;
    description: string;
    priority: string;
    severity: string;
    type: string;
    status: string;
    assigneeId?: string | number;
    projectId?: string | number;
  }) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - update local state
      setBugs(prev => prev.map(b =>
        b.id === bugId
          ? { ...b, ...bugData, updatedAt: new Date().toISOString() }
          : b
      ));
      console.log('Bug updated in demo mode:', { bugId, bugData });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/bugs/${bugId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(bugData),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedBug = transformBugData(data.data.bug);

        // Preserve original createdAt if missing from response
        setBugs(prev => prev.map(b =>
          b.id === bugId
            ? { ...updatedBug, createdAt: updatedBug.createdAt || b.createdAt }
            : b
        ));
        return updatedBug;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update bug');
      }
    } catch (error) {
      console.error('Error updating bug:', error);
      throw error;
    }
  };

  const deleteBug = async (bugId: string | number) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - just remove from local state
      setBugs(prev => prev.filter(b => b.id !== bugId));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/bugs/${bugId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        setBugs(prev => prev.filter(b => b.id !== bugId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete bug');
      }
    } catch (error) {
      console.error('Error deleting bug:', error);
      throw error;
    }
  };

  const loadDashboardData = async (token: string) => {
    try {
      console.log('Loading bugs from backend...');
      // Load bugs
      const bugsResponse = await fetch(`${API_BASE}/bugs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (bugsResponse.ok) {
        const bugsData = await bugsResponse.json();
        console.log('Bugs loaded:', bugsData.data.bugs?.length || 0, 'bugs');
        const transformedBugs = (bugsData.data.bugs || []).map(transformBugData);
        setBugs(transformedBugs);
      } else {
        console.error('Failed to load bugs:', bugsResponse.status, bugsResponse.statusText);
      }

      console.log('Loading projects from backend...');
      // Load projects
      const projectsResponse = await fetch(`${API_BASE}/projects/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        console.log('Projects loaded:', projectsData.data.projects?.length || 0, 'projects');
        const transformedProjects = (projectsData.data.projects || []).map(transformProjectData);
        setProjects(transformedProjects);
      } else {
        console.error('Failed to load projects:', projectsResponse.status, projectsResponse.statusText);
      }

      console.log('Loading users from backend...');
      // Load users (always load for user assignment in bugs)
      const usersResponse = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users loaded:', usersData.data.users?.length || 0, 'users');
        const transformedUsers = (usersData.data.users || []).map(transformUserData);
        setUsers(transformedUsers);
      } else {
        console.error('Failed to load users from backend:', usersResponse.status, usersResponse.statusText);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setIsBackendConnected(false);
    setCurrentPage('login');

    // Clear session from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  // Organization management functions
  const loadOrganizations = async () => {
    if (!authToken) return;

    try {
      // Use different endpoints based on user role
      const endpoint = user?.role === 'admin' && user?.email === 'admin@bugtracker.com'
        ? `${API_BASE_URL}/admin/organizations`  // Super admin endpoint
        : `${API_BASE_URL}/organizations/my`;    // Regular user endpoint

      console.log('🔄 loadOrganizations: Using endpoint:', endpoint);

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const orgs = data.data.organizations || [];
        console.log('✅ loadOrganizations: Loaded', orgs.length, 'organizations');
        setOrganizations(orgs);

        // For super admin, don't auto-select organization
        // For regular users, set current organization if not set
        if (user?.role !== 'admin' || user?.email !== 'admin@bugtracker.com') {
          if (!currentOrganization && orgs.length > 0) {
            setCurrentOrganization(orgs[0]);
          }
        }
      } else {
        console.error('❌ loadOrganizations failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  // Super admin organization switching
  const switchToOrganization = async (organization: any) => {
    console.log('🔄 Super admin switching to organization:', organization.name, 'ID:', organization.id);
    setCurrentOrganization(organization);

    // Clear existing data first to avoid showing stale data
    setUsers([]);
    setProjects([]);
    setBugs([]);
    console.log('🧹 Cleared existing data for organization switch');

    // Load organization-specific data for super admin
    if (authToken) {
      try {
        console.log('📡 Loading data for organization:', organization.id);

        // For now, load all data and filter client-side
        // In a real app, you'd pass organizationId to API endpoints

        // Load users for this organization
        console.log('🔍 Fetching users for organization ID:', organization.id);
        const usersResponse = await fetch(`${API_BASE_URL}/users?organizationId=${organization.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          console.log('📦 Raw users response:', usersData);
          const transformedUsers = (usersData.data.users || []).map(transformUserData);
          setUsers(transformedUsers);
          console.log('✅ Users loaded for organization "' + organization.name + '":', transformedUsers.length, 'users');

          if (transformedUsers.length === 0) {
            console.log('ℹ️ No users found for organization "' + organization.name + '"');
          }
        } else {
          console.error('❌ Failed to load users for organization:', usersResponse.status, usersResponse.statusText);
          const errorText = await usersResponse.text();
          console.error('❌ Error details:', errorText);
        }

        // Load projects for this organization
        const projectsResponse = await fetch(`${API_BASE_URL}/projects/my?organizationId=${organization.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          const transformedProjects = (projectsData.data.projects || []).map(transformProjectData);
          setProjects(transformedProjects);
          console.log('✅ Projects loaded for organization:', transformedProjects.length);
        } else {
          console.error('❌ Failed to load projects for organization:', projectsResponse.status);
        }

        // Load bugs for this organization
        const bugsResponse = await fetch(`${API_BASE_URL}/bugs?organizationId=${organization.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (bugsResponse.ok) {
          const bugsData = await bugsResponse.json();
          const transformedBugs = (bugsData.data.bugs || []).map(transformBugData);
          setBugs(transformedBugs);
          console.log('✅ Bugs loaded for organization:', transformedBugs.length);
        } else {
          console.error('❌ Failed to load bugs for organization:', bugsResponse.status);
        }

        console.log('✅ Organization-specific data loaded for super admin');
      } catch (error) {
        console.error('❌ Failed to load organization-specific data:', error);
      }
    }
  };

  const deleteOrganization = async (organizationId: string | number) => {
    try {
      // Try backend API first
      if (authToken && isBackendConnected) {
        const response = await fetch(`${API_BASE_URL}/admin/organizations/${organizationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          await loadAdminData();
          alert('Organization deleted successfully!');
          return;
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Backend API failed');
        }
      }
    } catch (error) {
      console.error('Backend organization deletion failed:', error);
    }

    // Fallback: Delete organization locally for demo
    try {
      const existingOrgs = JSON.parse(localStorage.getItem('demo_organizations') || '[]');
      const updatedOrgs = existingOrgs.filter((org: any) => org.id !== organizationId);

      // Update localStorage
      localStorage.setItem('demo_organizations', JSON.stringify(updatedOrgs));

      // Update state
      setOrganizations(updatedOrgs);
      setAllOrganizations(updatedOrgs);

      console.log('Organization deleted successfully in demo mode');
      alert('Organization deleted successfully! (Demo mode)');
    } catch (error) {
      console.error('Local organization deletion failed:', error);
      alert(`Failed to delete organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createOrganization = async () => {
    if (!newOrgForm.name || !newOrgForm.slug) {
      alert('Please fill in both organization name and slug');
      return;
    }

    console.log('Creating organization:', newOrgForm);

    try {
      // Try backend API first
      if (authToken && isBackendConnected) {
        console.log('Trying backend API...');
        // Use different endpoints based on user role
        const endpoint = user?.role === 'admin' && user?.email === 'admin@bugtracker.com'
          ? `${API_BASE_URL}/admin/organizations`  // Super admin endpoint
          : `${API_BASE_URL}/organizations`;       // Regular user endpoint

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(newOrgForm)
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Organization created:', data.data.organization);

          // For super admin, reload admin data to update both table and dropdown
          if (user?.role === 'admin' && user?.email === 'admin@bugtracker.com') {
            await loadAdminData();
          } else {
            // For regular users, just reload organizations
            await loadOrganizations();
          }

          setCurrentOrganization(data.data.organization);
          setShowCreateOrg(false);
          setNewOrgForm({ name: '', slug: '' });
          alert('Organization created successfully!');
          return;
        } else {
          const error = await response.json();
          console.error('Backend API error:', error);
          throw new Error(error.message || 'Backend API failed');
        }
      }
    } catch (error) {
      console.error('Backend organization creation failed:', error);
    }

    // Fallback: Create organization locally for demo
    console.log('Using demo mode for organization creation...');
    try {
      const newOrg = {
        id: Date.now(),
        name: newOrgForm.name,
        slug: newOrgForm.slug,
        role: 'owner',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        userCount: 1,
        projectCount: 0,
        bugCount: 0
      };

      console.log('New organization object:', newOrg);

      // Get existing organizations from localStorage and state
      const existingOrgs = JSON.parse(localStorage.getItem('demo_organizations') || '[]');
      const updatedOrgs = [...existingOrgs, newOrg];

      // Update localStorage
      localStorage.setItem('demo_organizations', JSON.stringify(updatedOrgs));

      // Update state
      setOrganizations(updatedOrgs);
      setAllOrganizations(updatedOrgs);
      setCurrentOrganization(newOrg);

      setShowCreateOrg(false);
      setNewOrgForm({ name: '', slug: '' });

      console.log('Organization created successfully in demo mode');
      alert(`Organization "${newOrg.name}" created successfully! (Demo mode)\n\nYou can now create users for this organization.`);
    } catch (error) {
      console.error('Local organization creation failed:', error);
      alert(`Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const switchOrganization = (org: any) => {
    console.log('Switching to organization:', org);
    setCurrentOrganization(org);
    setShowOrgSwitcher(false);

    // Different behavior for super admin vs regular users
    if (user?.role === 'admin' && user?.email === 'admin@bugtracker.com') {
      // Super admin: Switch to tenant view for this organization
      console.log('🔄 Super admin switching to manage organization:', org.name);
      setViewMode('tenant'); // Switch to tenant view to manage this organization
      switchToOrganization(org); // Load organization-specific data
    } else {
      // Regular user: Reload data for new organization
      if (authToken && isBackendConnected) {
        loadDashboardData(authToken);
      } else {
        // Reload demo data for the new organization
        console.log('Reloading demo data for organization:', org.id);
        loadOrganizationSpecificData(org.id);
      }
    }
  };

  const switchToAdminView = () => {
    console.log('🔄 Super admin switching back to system admin view');
    setCurrentOrganization(null);
    setViewMode('admin');
    setCurrentPage('dashboard');
    setShowOrgSwitcher(false);

    // Load admin data for super admin
    if (authToken && isBackendConnected) {
      loadAdminData(); // Reload admin organizations and stats
    } else {
      loadGenericDemoData();
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  // Initialize demo data for tenant login
  const initializeDemoData = () => {
    console.log('Initializing demo data...');

    // Create demo organizations with calculated statistics
    const demoOrgs = [
      {
        id: 1,
        name: 'Acme Corporation',
        slug: 'acme',
        userCount: 4, // admin@acme.com, dev@acme.com, sarah@acme.com, mike@acme.com
        projectCount: 3, // E-commerce Platform, Mobile Shopping App, Payment Gateway
        bugCount: 3, // Checkout process fails, Product images not loading, Add wishlist feature
        subscriptionStatus: 'active'
      },
      {
        id: 2,
        name: 'Beta Industries',
        slug: 'beta',
        userCount: 4, // admin@beta.com, qa@beta.com, tom@beta.com, lisa@beta.com
        projectCount: 3, // CRM System, Analytics Dashboard, API Gateway
        bugCount: 3, // CRM data export timeout, Dashboard charts not responsive, Add dark mode
        subscriptionStatus: 'trial'
      },
      {
        id: 3,
        name: 'Gamma Solutions',
        slug: 'gamma',
        userCount: 0, // No demo data created for this org
        projectCount: 0,
        bugCount: 0,
        subscriptionStatus: 'active'
      },
      {
        id: 4,
        name: 'S4 Company',
        slug: 's4',
        userCount: 3, // admin@s4.com, user@s4.com, alex@s4.com
        projectCount: 2, // Internal Tools Suite, Employee Portal
        bugCount: 2, // Login session expires, Employee directory search broken
        subscriptionStatus: 'active'
      }
    ];

    // Create demo tenant users
    const demoTenantUsers = [
      { email: 'admin@acme.com', password: 'password123', organizationId: 1, role: 'admin' },
      { email: 'dev@acme.com', password: 'password123', organizationId: 1, role: 'developer' },
      { email: 'admin@beta.com', password: 'password123', organizationId: 2, role: 'admin' },
      { email: 'qa@beta.com', password: 'password123', organizationId: 2, role: 'qa_tester' },
      { email: 'admin@s4.com', password: 'password123', organizationId: 4, role: 'admin' },
      { email: 'user@s4.com', password: 'password123', organizationId: 4, role: 'developer' }
    ];

    // Always store in localStorage (overwrite if exists)
    localStorage.setItem('demo_organizations', JSON.stringify(demoOrgs));
    localStorage.setItem('demo_tenant_users', JSON.stringify(demoTenantUsers));

    // Also update state if we're admin
    if (user?.role === 'admin') {
      setAllOrganizations(demoOrgs);
      setOrganizations(demoOrgs);
    }

    console.log('Demo data initialized successfully:', {
      organizations: demoOrgs.length,
      users: demoTenantUsers.length,
      stored: {
        orgs: localStorage.getItem('demo_organizations') ? 'YES' : 'NO',
        users: localStorage.getItem('demo_tenant_users') ? 'YES' : 'NO'
      }
    });
  };

  // Check demo login credentials
  const checkDemoLogin = (email: string, password: string) => {
    console.log('=== CHECKING DEMO LOGIN ===');
    console.log('Email:', email);
    console.log('Password:', password);

    // Ensure demo data exists
    if (!localStorage.getItem('demo_tenant_users') || !localStorage.getItem('demo_organizations')) {
      console.log('Demo data missing, initializing...');
      initializeDemoData();
    }

    // Super admin login
    if (email === 'admin@bugtracker.com' && password === 'admin123') {
      console.log('✅ Super admin login detected');
      return {
        user: {
          id: 1,
          email,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'admin'
        },
        organization: null
      };
    }

    // Check tenant users
    const demoTenantUsersStr = localStorage.getItem('demo_tenant_users');
    const demoOrganizationsStr = localStorage.getItem('demo_organizations');

    console.log('Demo tenant users string:', demoTenantUsersStr);
    console.log('Demo organizations string:', demoOrganizationsStr);

    if (!demoTenantUsersStr || !demoOrganizationsStr) {
      console.error('❌ Demo data not found in localStorage');
      return null;
    }

    let demoTenantUsers, organizations;
    try {
      demoTenantUsers = JSON.parse(demoTenantUsersStr);
      organizations = JSON.parse(demoOrganizationsStr);
    } catch (error) {
      console.error('❌ Error parsing demo data:', error);
      return null;
    }

    console.log('Available demo tenant users:', demoTenantUsers);
    console.log('Available organizations:', organizations);

    const tenantUser = demoTenantUsers.find((u: any) => {
      console.log(`Comparing: ${u.email} === ${email} && ${u.password} === ${password}`);
      return u.email === email && u.password === password;
    });

    console.log('Found tenant user:', tenantUser);

    if (tenantUser) {
      const userOrg = organizations.find((org: any) => org.id === tenantUser.organizationId);
      console.log('User organization:', userOrg);

      const result = {
        user: {
          id: tenantUser.organizationId * 100 + Math.floor(Math.random() * 100),
          email: tenantUser.email,
          firstName: tenantUser.email.split('@')[0].charAt(0).toUpperCase() + tenantUser.email.split('@')[0].slice(1),
          lastName: 'User',
          role: tenantUser.role
        },
        organization: userOrg || null
      };

      console.log('✅ Returning successful login result:', result);
      return result;
    }

    console.log('❌ No matching demo user found');
    return null;
  };

  // Load system-wide admin data
  const loadAdminData = async (userData?: any) => {
    const currentUser = userData || user;
    const currentToken = authToken;

    console.log('🔄 loadAdminData called with:', {
      hasToken: !!currentToken,
      hasUser: !!currentUser,
      role: currentUser?.role,
      email: currentUser?.email,
      userDataPassed: !!userData,
      viewMode
    });

    if (!currentToken) {
      console.log('❌ loadAdminData: No auth token available');
      return;
    }

    if (!currentUser) {
      console.log('❌ loadAdminData: No user data available');
      return;
    }

    if (currentUser.role !== 'admin' || currentUser.email !== 'admin@bugtracker.com') {
      console.log('❌ loadAdminData: Not super admin user', {
        role: currentUser.role,
        email: currentUser.email,
        expectedEmail: 'admin@bugtracker.com'
      });
      return;
    }

    console.log('✅ loadAdminData: Loading admin data for super admin');

    try {
      // Load all organizations for super admin
      const orgsResponse = await fetch(`${API_BASE_URL}/admin/organizations`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        console.log('✅ Admin organizations loaded:', orgsData.data.organizations?.length || 0, 'organizations');
        console.log('Organizations data:', orgsData.data.organizations);

        // For super admin: Set both admin table data AND organization switcher data
        setAllOrganizations(orgsData.data.organizations || []);
        setOrganizations(orgsData.data.organizations || []); // For organization dropdown/switcher

        // If no current organization is selected, don't auto-select one for super admin
        // Super admin should explicitly choose an organization to manage
        console.log('✅ Super admin organizations loaded for both table and switcher');
      } else {
        console.error('❌ Failed to load admin organizations:', orgsResponse.status, orgsResponse.statusText);
      }

      // Load system statistics
      const statsResponse = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Admin stats loaded:', statsData.data);
        setSystemStats(statsData.data);
      } else {
        console.error('❌ Failed to load admin stats:', statsResponse.status, statsResponse.statusText);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      // Fallback to demo data for admin view
      const demoOrgs = [
        { id: 1, name: 'Acme Corporation', slug: 'acme', userCount: 5, projectCount: 3, bugCount: 12, subscriptionStatus: 'active' },
        { id: 2, name: 'Beta Industries', slug: 'beta', userCount: 8, projectCount: 5, bugCount: 23, subscriptionStatus: 'trial' },
        { id: 3, name: 'Gamma Solutions', slug: 'gamma', userCount: 12, projectCount: 8, bugCount: 45, subscriptionStatus: 'active' }
      ];
      setAllOrganizations(demoOrgs);
      setOrganizations(demoOrgs); // Also set for organization switcher

      // Create demo tenant users that can actually login
      const demoTenantUsers = [
        { email: 'admin@acme.com', password: 'password123', organizationId: 1, role: 'admin' },
        { email: 'dev@acme.com', password: 'password123', organizationId: 1, role: 'developer' },
        { email: 'admin@beta.com', password: 'password123', organizationId: 2, role: 'admin' },
        { email: 'qa@beta.com', password: 'password123', organizationId: 2, role: 'qa_tester' }
      ];

      // Store demo data in localStorage for login simulation
      localStorage.setItem('demo_tenant_users', JSON.stringify(demoTenantUsers));
      localStorage.setItem('demo_organizations', JSON.stringify(demoOrgs));
      setSystemStats({
        totalOrganizations: 3,
        totalUsers: 25,
        totalProjects: 16,
        totalBugs: 80,
        activeSubscriptions: 2,
        trialSubscriptions: 1,
        monthlyRevenue: 228
      });
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showOrgSwitcher) {
        setShowOrgSwitcher(false);
      }
    };

    if (showOrgSwitcher) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showOrgSwitcher]);

  // Initialize demo data on app load
  useEffect(() => {
    console.log('App loaded, initializing demo data...');
    initializeDemoData();

    // Check for subdomain-based tenant access
    checkSubdomainTenant();
  }, []);

  // Auto-load admin data when super admin user is set
  useEffect(() => {
    if (user?.role === 'admin' && user?.email === 'admin@bugtracker.com' && authToken && viewMode === 'admin') {
      console.log('🔄 Auto-loading admin data for super admin user');
      // Small delay to ensure all state is properly set
      setTimeout(() => {
        loadAdminData();
      }, 100);
    }
  }, [user, authToken, viewMode]);

  // Test function for debugging (available in browser console as window.testAdminAPI)
  const testAdminAPI = async () => {
    console.log('🧪 Testing admin API access...');
    console.log('Current state:', {
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      hasToken: !!authToken,
      viewMode
    });

    if (!authToken) {
      console.error('❌ No auth token available');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/organizations`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response data:', data);
        console.log('📊 Organizations count:', data.data?.organizations?.length || 0);
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
    }
  };

  // Make test function available globally for debugging
  (window as any).testAdminAPI = testAdminAPI;
  (window as any).loadAdminData = loadAdminData;

  // Enhanced UI Demo Page - Accessible via URL parameter
  if (window.location.search.includes('demo=ui')) {
    return <EnhancedUIDemo />;
  }

  // Login Page
  if (!user && currentPage === 'login') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{ textAlign: 'center', color: '#1976d2', marginBottom: '2rem' }}>
            🐛 Bug Tracker
          </h1>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleLogin(
              formData.get('email') as string,
              formData.get('password') as string
            );
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Email:
              </label>
              <input
                type="email"
                name="email"
                defaultValue="admin@bugtracker.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Password:
              </label>
              <input
                type="password"
                name="password"
                defaultValue="admin123"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
          </form>
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>Demo Credentials:</strong><br />

            {/* Show subdomain-specific credentials if accessing via subdomain */}
            {currentOrganization ? (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>{currentOrganization.name} Login:</strong><br />
                Email: admin@{currentOrganization.slug}.com<br />
                Password: password123<br />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  You're accessing via subdomain: {window.location.hostname}
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Super Admin:</strong><br />
                  Email: admin@bugtracker.com<br />
                  Password: admin123
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                  <strong>Demo Tenant Users:</strong><br />
                  • admin@acme.com / password123 (Acme Corp Admin)<br />
                  • dev@acme.com / password123 (Acme Corp Developer)<br />
                  • admin@beta.com / password123 (Beta Industries Admin)<br />
                  • qa@beta.com / password123 (Beta Industries QA)<br />
                  <br />
                  <strong>Subdomain Access:</strong><br />
                  • http://acme.localhost:5173 (Acme Corp)<br />
                  • http://beta.localhost:5173 (Beta Industries)
                </div>
              </>
            )}

            {/* Debug Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  const orgs = localStorage.getItem('demo_organizations');
                  const users = localStorage.getItem('demo_tenant_users');
                  console.log('=== DEBUG INFO ===');
                  console.log('Demo Organizations:', orgs ? JSON.parse(orgs) : 'NOT FOUND');
                  console.log('Demo Tenant Users:', users ? JSON.parse(users) : 'NOT FOUND');
                  alert(`Debug Info (check console):\nOrganizations: ${orgs ? 'Found' : 'Missing'}\nUsers: ${users ? 'Found' : 'Missing'}`);
                }}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                🔍 Debug Data
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Force refreshing demo data...');
                  localStorage.removeItem('demo_organizations');
                  localStorage.removeItem('demo_tenant_users');
                  initializeDemoData();
                  alert('Demo data refreshed! Try logging in again.');
                }}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                🔄 Refresh Data
              </button>
            </div>

            {/* Test Login Button */}
            <button
              type="button"
              onClick={() => {
                console.log('=== TESTING DEMO LOGIN ===');
                initializeDemoData();
                const testResult = checkDemoLogin('admin@acme.com', 'password123');
                console.log('Test login result:', testResult);
                if (testResult) {
                  alert('✅ Demo login test PASSED!\nTenant login should work now.');
                } else {
                  alert('❌ Demo login test FAILED!\nCheck console for details.');
                }
              }}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                width: '100%'
              }}
            >
              🧪 Test Demo Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Page
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🐛 Bug Tracker</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* View Mode Switcher - Only for System Super Admin */}
          {user?.role === 'admin' && user?.email === 'admin@bugtracker.com' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setViewMode('admin');
                  setCurrentPage('dashboard');
                }}
                style={{
                  backgroundColor: viewMode === 'admin' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                🔧 Admin View
              </button>
              <button
                onClick={() => {
                  setViewMode('tenant');
                  setCurrentPage('dashboard');
                }}
                style={{
                  backgroundColor: viewMode === 'tenant' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                🏢 Tenant View
              </button>
            </div>
          )}

          {/* Organization Display - Different for system admin vs tenant users */}
          {user?.role === 'admin' && user?.email === 'admin@bugtracker.com' ? (
            // Admin users get organization switcher
            <div style={{ position: 'relative', zIndex: 1000 }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOrgSwitcher(!showOrgSwitcher);
                  if (!showOrgSwitcher) loadOrganizations();
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                🏢 {currentOrganization ?
                  (viewMode === 'tenant' ? `Tenant View: ${currentOrganization.name}` : `Managing: ${currentOrganization.name}`) :
                  'Select Organization to Manage'}
                <span style={{ fontSize: '0.8rem' }}>▼</span>
              </button>

              {showOrgSwitcher && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    backgroundColor: 'white',
                    color: 'black',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    minWidth: '250px',
                    zIndex: 1001,
                    marginTop: '0.5rem'
                  }}
                >
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                    Select Organization to Manage
                  </div>

                  {/* Debug info */}
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontSize: '0.8rem', color: '#666' }}>
                    Debug: {organizations.length} organizations available
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadOrganizations();
                      }}
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Load
                    </button>
                  </div>

                  {/* Back to Admin View option - Only for super admin */}
                  {user?.email === 'admin@bugtracker.com' && (
                    <div
                      onClick={switchToAdminView}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        backgroundColor: !currentOrganization ? '#f0f0f0' : 'white',
                        fontWeight: !currentOrganization ? 'bold' : 'normal',
                        color: '#1976d2'
                      }}
                    >
                      🏠 System Admin View
                    </div>
                  )}

                  {organizations.length === 0 ? (
                    <div style={{ padding: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                      No organizations available. Click "🔄 Reload Admin Data" to load.
                    </div>
                  ) : (
                    organizations.map((org) => (
                    <div
                      key={org.id}
                      onClick={() => switchOrganization(org)}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        backgroundColor: currentOrganization?.id === org.id ? '#f0f0f0' : 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentOrganization?.id === org.id ? '#f0f0f0' : 'white'}
                    >
                      <div style={{ fontWeight: '500' }}>{org.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {org.role} • {org.subscriptionStatus}
                      </div>
                    </div>
                    ))
                  )}

                </div>
              )}
            </div>
          ) : (
            // Tenant users get simple organization display (no switching)
            currentOrganization && (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🏢 {currentOrganization.name}
              </div>
            )
          )}

          <span style={{ marginRight: '1rem' }}>
            Welcome, {user?.firstName} {user?.lastName}!
          </span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        borderBottom: '1px solid #ddd'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Dashboard - Always visible */}
          <button
            onClick={() => setCurrentPage('dashboard')}
            style={{
              background: currentPage === 'dashboard' ? '#e3f2fd' : 'none',
              border: 'none',
              color: '#1976d2',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: '4px'
            }}
          >
            🏠 Dashboard
          </button>

          {/* System Admin tabs - Only when in admin view */}
          {user?.role === 'admin' && viewMode === 'admin' && (
            <>
              <button
                onClick={() => setCurrentPage('admin-organizations')}
                style={{
                  background: currentPage === 'admin-organizations' ? '#e3f2fd' : 'none',
                  border: 'none',
                  color: '#1976d2',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}
              >
                🏢 All Organizations
              </button>
              <button
                onClick={() => setCurrentPage('admin-users')}
                style={{
                  background: currentPage === 'admin-users' ? '#e3f2fd' : 'none',
                  border: 'none',
                  color: '#1976d2',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}
              >
                👥 All Users
              </button>
              <button
                onClick={() => setCurrentPage('admin-billing')}
                style={{
                  background: currentPage === 'admin-billing' ? '#e3f2fd' : 'none',
                  border: 'none',
                  color: '#1976d2',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}
              >
                💰 System Revenue
              </button>
            </>
          )}

          {/* Organization Management tabs - For admin managing specific org OR tenant users */}
          {((user?.role === 'admin' && viewMode === 'tenant' && currentOrganization) || user?.role !== 'admin') && (
            <>
              {/* Bugs tab - Hidden for super admin only */}
              {user?.email !== 'admin@bugtracker.com' && (
                <button
                  onClick={() => setCurrentPage('bugs')}
                  style={{
                    background: currentPage === 'bugs' ? '#e3f2fd' : 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px'
                  }}
                >
                  🐛 Bugs
                </button>
              )}

              {/* Projects tab - Hidden for super admin only */}
              {user?.email !== 'admin@bugtracker.com' && (
                <button
                  onClick={() => setCurrentPage('projects')}
                  style={{
                    background: currentPage === 'projects' || currentPage === 'create-project' ? '#e3f2fd' : 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px'
                  }}
                >
                  📁 Projects
                </button>
              )}
              <button
                onClick={() => setCurrentPage('users')}
                style={{
                  background: currentPage === 'users' || currentPage === 'create-user' ? '#e3f2fd' : 'none',
                  border: 'none',
                  color: '#1976d2',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}
              >
                👥 Team
              </button>
              <button
                onClick={() => setCurrentPage('billing')}
                style={{
                  background: currentPage === 'billing' ? '#e3f2fd' : 'none',
                  border: 'none',
                  color: '#1976d2',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}
              >
                💳 Billing
              </button>

              {/* Back to Admin View button - Only show for super admin in tenant view */}
              {user?.email === 'admin@bugtracker.com' && viewMode === 'tenant' && (
                <button
                  onClick={switchToAdminView}
                  style={{
                    background: 'none',
                    border: '1px solid #1976d2',
                    color: '#1976d2',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    marginLeft: '1rem'
                  }}
                >
                  🏠 Back to Admin View
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {currentPage === 'dashboard' && (
          <div>
            {/* System Admin Dashboard - System-wide overview */}
            {user?.role === 'admin' && viewMode === 'admin' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2>🔧 System Administration Dashboard</h2>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => loadAdminData()}
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Reload Admin Data
                    </button>
                    <button
                      onClick={() => setShowCreateOrg(true)}
                      style={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ Create Organization
                    </button>
                    <button
                      onClick={loadAdminData}
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Refresh Data
                    </button>
                  </div>
                </div>

                {/* Debug Info */}
                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '0.9rem' }}>
                  <strong>Debug Info:</strong> allOrganizations.length = {allOrganizations.length},
                  organizations.length = {organizations.length},
                  systemStats = {systemStats ? 'loaded' : 'null'},
                  authToken = {authToken ? 'present' : 'missing'},
                  user.email = {user?.email},
                  currentOrganization = {currentOrganization?.name || 'none'}
                </div>

                {/* System-wide Statistics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>🏢 Total Organizations</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>
                      {systemStats?.totalOrganizations || allOrganizations.length}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#388e3c' }}>👥 Total Users</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>
                      {systemStats?.totalUsers || 25}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#f57c00' }}>📁 Total Projects</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>
                      {systemStats?.totalProjects || 16}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#d32f2f' }}>🐛 Total Bugs</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d32f2f' }}>
                      {systemStats?.totalBugs || 80}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#9c27b0' }}>💰 Monthly Revenue</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9c27b0' }}>
                      ${systemStats?.monthlyRevenue || 228}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#795548' }}>📊 Active Subscriptions</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#795548' }}>
                      {systemStats?.activeSubscriptions || 2}
                    </div>
                  </div>
                </div>

                {/* Organizations List */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>🏢 Organizations Overview</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Organization</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Users</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Projects</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Bugs</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allOrganizations.map((org) => (
                          <tr key={org.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: '500' }}>{org.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>{org.slug}</div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>{org.userCount}</td>
                            <td style={{ padding: '0.75rem' }}>{org.projectCount}</td>
                            <td style={{ padding: '0.75rem' }}>{org.bugCount}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                backgroundColor: org.subscriptionStatus === 'active' ? '#e8f5e8' : '#fff3e0',
                                color: org.subscriptionStatus === 'active' ? '#2e7d32' : '#ef6c00'
                              }}>
                                {org.subscriptionStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* Organization Dashboard - For admin managing specific org OR tenant users */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2>📊 {currentOrganization ? `${currentOrganization.name} Dashboard` : 'Organization Dashboard'}</h2>
                  {user?.role === 'admin' && !currentOrganization && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fff3e0',
                      color: '#ef6c00',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}>
                      ⚠️ Please select an organization to manage
                    </div>
                  )}
                  {user?.role !== 'admin' && !currentOrganization && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#ffebee',
                      color: '#c62828',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}>
                      ❌ No organization access - Contact admin
                    </div>
                  )}
                </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#d32f2f' }}>🐛 Total Bugs</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d32f2f' }}>{bugs.length}</div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#ff9800' }}>🔥 High Priority</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>
                  {bugs.filter(bug => bug.priority === 'high').length}
                </div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>📁 Projects</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{projects.length}</div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#388e3c' }}>✅ Resolved</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>
                  {bugs.filter(bug => bug.status === 'resolved').length}
                </div>
              </div>
            </div>

            {/* Recent Bugs */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
              <h3>🐛 Recent Bugs</h3>
              {bugs.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No bugs found. Create your first bug!</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Title</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Priority</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bugs.slice(0, 5).map(bug => (
                        <tr key={bug.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{bug.title}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: bug.priority === 'high' ? '#ffebee' : bug.priority === 'medium' ? '#fff3e0' : '#f3e5f5',
                              color: bug.priority === 'high' ? '#c62828' : bug.priority === 'medium' ? '#ef6c00' : '#7b1fa2'
                            }}>
                              {bug.priority}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: bug.status === 'resolved' ? '#e8f5e8' : bug.status === 'in_progress' ? '#e3f2fd' : '#fff3e0',
                              color: bug.status === 'resolved' ? '#2e7d32' : bug.status === 'in_progress' ? '#1565c0' : '#ef6c00'
                            }}>
                              {bug.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#666' }}>
                            {formatDate(bug.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: `2px solid ${isBackendConnected ? '#4caf50' : '#ff9800'}`
            }}>
              <h3>{isBackendConnected ? '🎉 Backend Connected!' : '🔧 Demo Mode Active'}</h3>
              {isBackendConnected ? (
                <>
                  <p>✅ Real-time data from your backend API</p>
                  <p>✅ Authentication working with JWT tokens</p>
                  <p>✅ Full CRUD operations available</p>
                  <p>✅ React 19 compatible implementation</p>
                </>
              ) : (
                <>
                  <p>⚠️ Running in demo mode with sample data</p>
                  <p>✅ All UI features functional</p>
                  <p>✅ React 19 compatible implementation</p>
                  <p>💡 Backend connection will be restored automatically when available</p>
                </>
              )}
            </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'bugs' && user?.email !== 'admin@bugtracker.com' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>🐛 Bug Management</h2>
              <button
                onClick={() => setCurrentPage('create-bug')}
                style={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                + Create Bug
              </button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {bugs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐛</div>
                  <h3>No bugs found</h3>
                  <p>Create your first bug to get started!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>ID</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Title</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Priority</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Severity</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Assigned To</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Created</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bugs.map(bug => (
                        <tr key={bug.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>#{bug.id}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <div style={{ fontWeight: '500' }}>{bug.title}</div>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                              {bug.description.length > 50 ? bug.description.substring(0, 50) + '...' : bug.description}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: bug.priority === 'high' ? '#ffebee' : bug.priority === 'medium' ? '#fff3e0' : '#f3e5f5',
                              color: bug.priority === 'high' ? '#c62828' : bug.priority === 'medium' ? '#ef6c00' : '#7b1fa2'
                            }}>
                              {bug.priority}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: bug.severity === 'critical' ? '#ffebee' : bug.severity === 'major' ? '#fff3e0' : '#e8f5e8',
                              color: bug.severity === 'critical' ? '#c62828' : bug.severity === 'major' ? '#ef6c00' : '#2e7d32'
                            }}>
                              {bug.severity}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            {user ? (
                              <select
                                value={bug.status}
                                onChange={async (e) => {
                                  if (e.target.value !== bug.status) {
                                    const newStatus = e.target.value;
                                    try {
                                      if (isBackendConnected && authToken) {
                                        // Use the new workflow API
                                        const response = await fetch(`${API_BASE_URL}/bugs/${bug.id}/status`, {
                                          method: 'PUT',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${authToken}`
                                          },
                                          body: JSON.stringify({
                                            status: newStatus,
                                            notes: `Status changed from ${bug.status} to ${newStatus}`
                                          })
                                        });

                                        if (response.ok) {
                                          // Update local state
                                          setBugs(prev => prev.map(b =>
                                            b.id === bug.id ? { ...b, status: newStatus } : b
                                          ));
                                          alert(`Bug status updated to ${newStatus.replace('_', ' ')}`);
                                        } else {
                                          const errorData = await response.json();
                                          alert(`Failed to update status: ${errorData.message || 'Unknown error'}`);
                                        }
                                      } else {
                                        // Demo mode
                                        setBugs(prev => prev.map(b =>
                                          b.id === bug.id ? { ...b, status: newStatus } : b
                                        ));
                                        alert(`Bug status updated to ${newStatus.replace('_', ' ')} (Demo mode)`);
                                      }
                                    } catch (error) {
                                      alert(`Error updating status: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                    }
                                  }
                                }}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.8rem',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  backgroundColor: bug.status === 'resolved' ? '#e8f5e8' : bug.status === 'in_progress' ? '#e3f2fd' : bug.status === 'open' ? '#ffebee' : bug.status === 'closed' ? '#f5f5f5' : bug.status === 'code_review' ? '#e1f5fe' : bug.status === 'qa_testing' ? '#f3e5f5' : bug.status === 'reopened' ? '#fff3e0' : bug.status === 'rejected' ? '#ffebee' : '#fff3e0',
                                  color: bug.status === 'resolved' ? '#2e7d32' : bug.status === 'in_progress' ? '#1565c0' : bug.status === 'open' ? '#c62828' : bug.status === 'closed' ? '#666' : bug.status === 'code_review' ? '#0277bd' : bug.status === 'qa_testing' ? '#7b1fa2' : bug.status === 'reopened' ? '#ef6c00' : bug.status === 'rejected' ? '#c62828' : '#ef6c00',
                                  fontWeight: '500',
                                  minWidth: '120px'
                                }}
                                title="Click to change status"
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="code_review">Code Review</option>
                                <option value="qa_testing">QA Testing</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                                <option value="reopened">Reopened</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            ) : (
                              <span style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                backgroundColor: bug.status === 'resolved' ? '#e8f5e8' : bug.status === 'in_progress' ? '#e3f2fd' : bug.status === 'open' ? '#ffebee' : bug.status === 'closed' ? '#f5f5f5' : '#fff3e0',
                                color: bug.status === 'resolved' ? '#2e7d32' : bug.status === 'in_progress' ? '#1565c0' : bug.status === 'open' ? '#c62828' : bug.status === 'closed' ? '#666' : '#ef6c00'
                              }}>
                                {bug.status.replace('_', ' ')}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: '#f5f5f5',
                              color: '#666'
                            }}>
                              {bug.type}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            {user ? (
                              <select
                                value={bug.assigneeId || ''}
                                onChange={async (e) => {
                                  const newAssignedTo = e.target.value || undefined;
                                  console.log(`Changing assignment for bug ${bug.id} to user ${newAssignedTo}`);

                                  try {
                                    await updateBug(bug.id, {
                                      title: bug.title,
                                      description: bug.description,
                                      priority: bug.priority,
                                      severity: bug.severity,
                                      type: bug.type,
                                      status: bug.status,
                                      projectId: bug.projectId,
                                      assigneeId: newAssignedTo
                                    });
                                    console.log('Bug assignment updated successfully');
                                    alert(`Bug assignment updated successfully`);
                                  } catch (error) {
                                    console.error('Failed to update bug assignment:', error);
                                    alert(`Failed to update assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                  }
                                }}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.8rem',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  backgroundColor: bug.assigneeId ? '#e3f2fd' : '#f5f5f5',
                                  color: bug.assigneeId ? '#1565c0' : '#666',
                                  fontWeight: '500',
                                  minWidth: '120px'
                                }}
                                title="Click to change assignment"
                              >
                                <option value="">Unassigned</option>
                                {users.map(appUser => (
                                  <option key={appUser.id} value={appUser.id}>
                                    {appUser.firstName} {appUser.lastName}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                backgroundColor: bug.assigneeId ? '#e3f2fd' : '#f5f5f5',
                                color: bug.assigneeId ? '#1565c0' : '#666',
                                fontWeight: '500'
                              }}>
                                {bug.assigneeId
                                  ? users.find(u => u.id === bug.assigneeId)?.firstName + ' ' + users.find(u => u.id === bug.assigneeId)?.lastName
                                  : 'Unassigned'
                                }
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem 0.5rem', color: '#666' }}>
                            {formatDate(bug.createdAt)}
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <button
                              onClick={() => {
                                setViewingBug(bug);
                                setCurrentPage('view-bug');
                              }}
                              style={{
                                backgroundColor: '#e3f2fd',
                                color: '#1565c0',
                                border: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                marginRight: '0.5rem'
                              }}
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() => {
                                setEditingBug(bug);
                                setCurrentPage('edit-bug');
                              }}
                              style={{
                                backgroundColor: '#fff3e0',
                                color: '#ef6c00',
                                border: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                marginRight: '0.5rem'
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => {
                                const newAssignee = prompt(`Assign bug "${bug.title}" to user ID (or leave empty to unassign):`);
                                if (newAssignee !== null) {
                                  const assignedTo = newAssignee.trim() === '' ? undefined : newAssignee.trim();
                                  updateBug(bug.id, {
                                    title: bug.title,
                                    description: bug.description,
                                    priority: bug.priority,
                                    severity: bug.severity,
                                    type: bug.type,
                                    status: bug.status,
                                    projectId: bug.projectId,
                                    assigneeId: assignedTo
                                  }).then(() => {
                                    alert('Assignment updated!');
                                  }).catch(error => {
                                    alert(`Failed to update assignment: ${error.message}`);
                                  });
                                }
                              }}
                              style={{
                                backgroundColor: '#e8f5e8',
                                color: '#2e7d32',
                                border: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                marginRight: '0.5rem'
                              }}
                            >
                              👤 Assign
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete bug "${bug.title}"?`)) {
                                  try {
                                    await deleteBug(bug.id);
                                    alert('Bug deleted successfully!');
                                  } catch (error) {
                                    alert(`Failed to delete bug: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                  }
                                }
                              }}
                              style={{
                                backgroundColor: '#ffebee',
                                color: '#c62828',
                                border: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {currentPage === 'view-bug' && viewingBug && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={() => {
                  setCurrentPage('bugs');
                  setViewingBug(null);
                }}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                ← Back to Bugs
              </button>
              <h2>👁️ View Bug #{viewingBug.id}</h2>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setEditingBug(viewingBug);
                    setCurrentPage('edit-bug');
                  }}
                  style={{
                    backgroundColor: '#fff3e0',
                    color: '#ef6c00',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Edit Bug
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ marginTop: 0, color: '#1976d2' }}>{viewingBug.title}</h3>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#666', marginBottom: '0.5rem' }}>Description:</h4>
                    <p style={{ lineHeight: '1.6', color: '#333' }}>{viewingBug.description}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <h4 style={{ color: '#666', marginBottom: '0.5rem' }}>Project:</h4>
                      <span style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0',
                        fontWeight: 'bold'
                      }}>
                        {projects.find(p => p.id === viewingBug.projectId)?.name || 'Unknown Project'}
                      </span>
                    </div>
                    <div>
                      <h4 style={{ color: '#666', marginBottom: '0.5rem' }}>Assigned To:</h4>
                      {viewingBug.assigneeId ? (
                        <span style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          backgroundColor: '#e8f5e8',
                          color: '#2e7d32',
                          fontWeight: 'bold'
                        }}>
                          {users.find(u => u.id === viewingBug.assigneeId)?.firstName} {users.find(u => u.id === viewingBug.assigneeId)?.lastName}
                        </span>
                      ) : (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0, color: '#666' }}>Bug Details</h4>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Priority:</strong>
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        backgroundColor: viewingBug.priority === 'high' ? '#ffebee' : viewingBug.priority === 'medium' ? '#fff3e0' : '#e8f5e8',
                        color: viewingBug.priority === 'high' ? '#c62828' : viewingBug.priority === 'medium' ? '#ef6c00' : '#2e7d32'
                      }}>
                        {viewingBug.priority.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Severity:</strong>
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        backgroundColor: viewingBug.severity === 'critical' ? '#ffebee' : viewingBug.severity === 'major' ? '#fff3e0' : '#e8f5e8',
                        color: viewingBug.severity === 'critical' ? '#c62828' : viewingBug.severity === 'major' ? '#ef6c00' : '#2e7d32'
                      }}>
                        {viewingBug.severity.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Status:</strong>
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        backgroundColor: viewingBug.status === 'resolved' ? '#e8f5e8' : viewingBug.status === 'in_progress' ? '#e3f2fd' : '#fff3e0',
                        color: viewingBug.status === 'resolved' ? '#2e7d32' : viewingBug.status === 'in_progress' ? '#1565c0' : '#ef6c00'
                      }}>
                        {viewingBug.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Type:</strong>
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        backgroundColor: '#f5f5f5',
                        color: '#666'
                      }}>
                        {viewingBug.type.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Created:</strong><br />
                      <span style={{ color: '#666' }}>{new Date(viewingBug.createdAt).toLocaleString()}</span>
                    </div>

                    <div>
                      <strong>Last Updated:</strong><br />
                      <span style={{ color: '#666' }}>{new Date(viewingBug.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'create-bug' && user?.email !== 'admin@bugtracker.com' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setCurrentPage('bugs')}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                ← Back to Bugs
              </button>
              <h2>🐛 Create New Bug</h2>
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {/* Debug info */}
              <div style={{
                backgroundColor: '#f0f8ff',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                color: '#666'
              }}>
                <strong>Debug Info:</strong><br />
                Backend Connected: {isBackendConnected ? 'Yes' : 'No'}<br />
                Available Users: {users.length} ({users.map(u => `${u.firstName} ${u.lastName}`).join(', ')})<br />
                Available Projects: {projects.length}
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);

                const assignedToValue = formData.get('assignedTo') as string;
                console.log('Form data - assignedTo:', assignedToValue);
                console.log('Available users:', users);

                const bugData = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  priority: formData.get('priority') as string,
                  severity: formData.get('severity') as string,
                  type: formData.get('type') as string,
                  projectId: formData.get('projectId') as string || projects[0]?.id || '1',
                  assigneeId: assignedToValue && assignedToValue !== '' ? assignedToValue : undefined
                };

                console.log('Bug data being sent:', bugData);

                try {
                  if (!isBackendConnected || !authToken) {
                    // Demo mode - add to local state
                    const newBug: Bug = {
                      id: Math.max(...bugs.map(b => typeof b.id === 'string' ? parseInt(b.id) || 0 : b.id), 0) + 1,
                      title: bugData.title,
                      description: bugData.description,
                      priority: bugData.priority,
                      severity: bugData.severity,
                      type: bugData.type,
                      status: 'open',
                      projectId: bugData.projectId,
                      assigneeId: bugData.assigneeId,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    setBugs(prev => [...prev, newBug]);
                    console.log('Bug created in demo mode with assignment:', newBug);
                    alert(`Bug created successfully! (Demo mode) - Assigned to: ${bugData.assigneeId ? users.find(u => u.id === bugData.assigneeId)?.firstName + ' ' + users.find(u => u.id === bugData.assigneeId)?.lastName : 'Unassigned'}`);
                    setCurrentPage('bugs');
                    return;
                  }

                  const response = await fetch(`${API_BASE}/bugs`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify(bugData),
                  });

                  if (response.ok) {
                    const responseData = await response.json();
                    console.log('Bug created successfully:', responseData);
                    const createdBug = transformBugData(responseData.data?.bug || responseData.data);
                    const assignmentInfo = createdBug?.assigneeId ?
                      `Assigned to: ${users.find(u => u.id === createdBug.assigneeId)?.firstName} ${users.find(u => u.id === createdBug.assigneeId)?.lastName}` :
                      'Unassigned';
                    alert(`Bug created successfully! ${assignmentInfo}`);
                    setCurrentPage('bugs');
                    // Reload bugs
                    if (authToken) {
                      await loadDashboardData(authToken);
                    }
                  } else {
                    const errorData = await response.json();
                    console.error('Backend error:', errorData);
                    alert(`Error: ${errorData.message || 'Failed to create bug'}`);
                  }
                } catch (error) {
                  console.error('Error creating bug:', error);
                  alert('Failed to create bug. Please try again.');
                }
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter bug title"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Project
                    </label>
                    <select
                      name="projectId"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                      {projects.length === 0 && (
                        <option value="1">Default Project</option>
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the bug in detail"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Priority
                    </label>
                    <select
                      name="priority"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium" selected>Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Severity
                    </label>
                    <select
                      name="severity"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="minor">Minor</option>
                      <option value="major" selected>Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Type
                    </label>
                    <select
                      name="type"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="bug" selected>Bug</option>
                      <option value="feature">Feature Request</option>
                      <option value="enhancement">Enhancement</option>
                      <option value="task">Task</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Assign To
                      {users.length === 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (isBackendConnected && authToken) {
                              await reloadUsers();
                              alert('Users reloaded!');
                            } else {
                              loadDemoData();
                              alert('Demo users loaded!');
                            }
                          }}
                          style={{
                            marginLeft: '0.5rem',
                            backgroundColor: '#ff9800',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Load Users
                        </button>
                      )}
                    </label>
                    <select
                      name="assignedTo"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Unassigned</option>
                      {users.length === 0 && (
                        <option value="" disabled>No users available - click "Load Users" above</option>
                      )}
                      {users.map(appUser => (
                        <option key={appUser.id} value={appUser.id}>
                          {appUser.firstName} {appUser.lastName} ({appUser.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#ccc' : '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Bug'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('bugs')}
                    style={{
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'projects' && user?.email !== 'admin@bugtracker.com' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>📁 Project Management</h2>
              <button
                onClick={() => setCurrentPage('create-project')}
                style={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                + Create Project
              </button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                  <h3>No projects found</h3>
                  <p>Create your first project to get started!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {projects.map(project => (
                    <div key={project.id} style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      backgroundColor: '#fafafa',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h3 style={{ margin: '0', color: '#1976d2', flex: 1 }}>{project.name}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingProject(project);
                              setCurrentPage('edit-project');
                            }}
                            style={{
                              backgroundColor: '#fff3e0',
                              color: '#ef6c00',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                                try {
                                  await deleteProject(project.id);
                                  alert('Project deleted successfully!');
                                } catch (error) {
                                  alert(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                }
                              }
                            }}
                            style={{
                              backgroundColor: '#ffebee',
                              color: '#c62828',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      <p style={{ color: '#666', marginBottom: '1rem', lineHeight: '1.5' }}>{project.description}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: project.status === 'active' ? '#e8f5e8' : project.status === 'completed' ? '#e3f2fd' : '#fff3e0',
                          color: project.status === 'active' ? '#2e7d32' : project.status === 'completed' ? '#1565c0' : '#ef6c00'
                        }}>
                          {project.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                          Created: {formatDate(project.createdAt)}
                        </span>
                      </div>

                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        color: '#666'
                      }}>
                        <strong>Project Stats:</strong><br />
                        Bugs: {bugs.filter(bug => bug.projectId === project.id).length} |
                        Open: {bugs.filter(bug => bug.projectId === project.id && bug.status === 'open').length} |
                        Resolved: {bugs.filter(bug => bug.projectId === project.id && bug.status === 'resolved').length}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {currentPage === 'create-project' && user?.email !== 'admin@bugtracker.com' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setCurrentPage('projects')}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                ← Back to Projects
              </button>
              <h2>📁 Create New Project</h2>
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);

                try {
                  const formData = new FormData(e.target as HTMLFormElement);

                  const projectData = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    status: formData.get('status') as string,
                  };

                  await createProject(projectData);
                  alert('Project created successfully!');
                  setCurrentPage('projects');
                } catch (error) {
                  alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                  setLoading(false);
                }
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter project name"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the project"
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('projects')}
                    style={{
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'edit-project' && editingProject && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={() => {
                  setCurrentPage('projects');
                  setEditingProject(null);
                }}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                ← Back to Projects
              </button>
              <h2>✏️ Edit Project</h2>
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);

                try {
                  const formData = new FormData(e.target as HTMLFormElement);

                  const projectData = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string,
                    status: formData.get('status') as string,
                  };

                  await updateProject(editingProject.id, projectData);
                  alert('Project updated successfully!');
                  setCurrentPage('projects');
                  setEditingProject(null);
                } catch (error) {
                  alert(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                  setLoading(false);
                }
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingProject.name}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter project name"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    defaultValue={editingProject.description}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the project"
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingProject.status}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#ccc' : '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {loading ? 'Updating...' : 'Update Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage('projects');
                      setEditingProject(null);
                    }}
                    style={{
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'users' && user?.role === 'admin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2>👥 User Management</h2>
                <p style={{ color: '#666', margin: '0.5rem 0' }}>
                  {currentOrganization ? (
                    <>
                      <strong>{currentOrganization.name}</strong> -
                      {isBackendConnected ?
                        ` ${users.length} users loaded` :
                        ` ${users.length} demo users`
                      }
                    </>
                  ) : (
                    isBackendConnected ?
                      `Backend connected - ${users.length} users loaded` :
                      `Demo mode - ${users.length} demo users`
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={async () => {
                    if (isBackendConnected) {
                      await reloadUsers();
                      alert('Users refreshed from database!');
                    } else {
                      alert('Backend not connected - using demo data');
                    }
                  }}
                  style={{
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #ddd',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => window.open('?demo=ui', '_blank')}
                  style={{
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    marginRight: '0.5rem'
                  }}
                >
                  ✨ Enhanced View
                </button>
                <button
                  onClick={() => setCurrentPage('create-user')}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  + Create User
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <h3>No users found</h3>
                  <p>Create your first user to get started!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>ID</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Role</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Created</th>
                        <th style={{ textAlign: 'left', padding: '1rem 0.5rem', color: '#666' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Filter users for selected organization (for super admin)
                        let filteredUsers = users;
                        if (user?.role === 'admin' && user?.email === 'admin@bugtracker.com' && currentOrganization) {
                          // For super admin with selected organization, show organization-specific users
                          // For now, we'll show all users but add organization context
                          // In a real app, users would have organizationId field
                          filteredUsers = users; // TODO: Filter by organizationId when available
                        }

                        return filteredUsers.map(appUser => (
                        <tr key={appUser.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>#{appUser.id}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <div style={{ fontWeight: '500' }}>{appUser.firstName} {appUser.lastName}</div>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', color: '#666' }}>{appUser.email}</td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: appUser.role === 'admin' ? '#ffebee' : appUser.role === 'manager' ? '#e3f2fd' : appUser.role === 'developer' ? '#e8f5e8' : '#fff3e0',
                              color: appUser.role === 'admin' ? '#c62828' : appUser.role === 'manager' ? '#1565c0' : appUser.role === 'developer' ? '#2e7d32' : '#ef6c00'
                            }}>
                              {appUser.role}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0.5rem', color: '#666' }}>
                            {formatDate(appUser.createdAt)}
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <button
                              onClick={() => {
                                setEditingUser(appUser);
                                setCurrentPage('edit-user');
                              }}
                              style={{
                                backgroundColor: '#e3f2fd',
                                color: '#1565c0',
                                border: 'none',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                marginRight: '0.5rem'
                              }}
                            >
                              ✏️ Edit
                            </button>
                            {appUser.id !== user?.id && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete "${appUser.firstName} ${appUser.lastName}"?`)) {
                                    try {
                                      await deleteUser(appUser.id);
                                      alert('User deleted successfully!');
                                    } catch (error) {
                                      alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                    }
                                  }
                                }}
                                style={{
                                  backgroundColor: '#ffebee',
                                  color: '#c62828',
                                  border: 'none',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </td>
                        </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {currentPage === 'create-user' && user?.role === 'admin' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setCurrentPage('users')}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                ← Back to Users
              </button>
              <h2>👥 Create New User</h2>
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);

                try {
                  const formData = new FormData(e.target as HTMLFormElement);

                  const userData = {
                    email: formData.get('email') as string,
                    firstName: formData.get('firstName') as string,
                    lastName: formData.get('lastName') as string,
                    role: formData.get('role') as string,
                    password: formData.get('password') as string || 'defaultPassword123',
                    // For super admin creating user for specific organization
                    organizationId: (user?.role === 'admin' && user?.email === 'admin@bugtracker.com' && currentOrganization)
                      ? currentOrganization.id
                      : undefined
                  };

                  console.log('Creating user with data:', userData);
                  const newUser = await createUser(userData);
                  console.log('User created successfully:', newUser);
                  alert('User created successfully!');
                  setCurrentPage('users');
                } catch (error) {
                  alert(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                  setLoading(false);
                }
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter email address"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter password"
                    defaultValue="defaultPassword123"
                  />
                  <small style={{ color: '#666', fontSize: '0.8rem' }}>
                    Default password is provided. User can change it after first login.
                  </small>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Role
                  </label>
                  <select
                    name="role"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="tester">Tester</option>
                    <option value="developer">Developer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('users')}
                    style={{
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'edit-bug' && editingBug && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={() => {
                  setCurrentPage('bugs');
                  setEditingBug(null);
                }}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                ← Back to Bugs
              </button>
              <h2>✏️ Edit Bug #{editingBug.id}</h2>
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);

                try {
                  const formData = new FormData(e.target as HTMLFormElement);

                  const bugData = {
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    priority: formData.get('priority') as string,
                    severity: formData.get('severity') as string,
                    type: formData.get('type') as string,
                    status: formData.get('status') as string,
                    projectId: formData.get('projectId') as string,
                    assigneeId: formData.get('assignedTo') as string || undefined
                  };

                  await updateBug(editingBug.id, bugData);
                  alert('Bug updated successfully!');
                  setCurrentPage('bugs');
                  setEditingBug(null);
                } catch (error) {
                  alert(`Failed to update bug: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                  setLoading(false);
                }
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={editingBug.title}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter bug title"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Project
                    </label>
                    <select
                      name="projectId"
                      defaultValue={editingBug.projectId}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    defaultValue={editingBug.description}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the bug in detail"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Priority
                    </label>
                    <select
                      name="priority"
                      defaultValue={editingBug.priority}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Severity
                    </label>
                    <select
                      name="severity"
                      defaultValue={editingBug.severity}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={editingBug.status}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Type
                    </label>
                    <select
                      name="type"
                      defaultValue={editingBug.type}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="bug">Bug</option>
                      <option value="feature">Feature Request</option>
                      <option value="enhancement">Enhancement</option>
                      <option value="task">Task</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Assign To
                    </label>
                    <select
                      name="assignedTo"
                      defaultValue={editingBug.assigneeId || ''}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Unassigned</option>
                      {users.map(appUser => (
                        <option key={appUser.id} value={appUser.id}>
                          {appUser.firstName} {appUser.lastName} ({appUser.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#ccc' : '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {loading ? 'Updating...' : 'Update Bug'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage('bugs');
                      setEditingBug(null);
                    }}
                    style={{
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentPage === 'edit-user' && editingUser && user?.role === 'admin' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={() => {
                  setCurrentPage('users');
                  setEditingUser(null);
                }}
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                ← Back to Users
              </button>
              <h2>✏️ Edit User</h2>
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);

                try {
                  const formData = new FormData(e.target as HTMLFormElement);

                  const userData = {
                    email: formData.get('email') as string,
                    firstName: formData.get('firstName') as string,
                    lastName: formData.get('lastName') as string,
                    role: formData.get('role') as string,
                  };

                  await updateUser(editingUser.id, userData);
                  alert('User updated successfully!');
                  setCurrentPage('users');
                  setEditingUser(null);
                } catch (error) {
                  alert(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                  setLoading(false);
                }
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      defaultValue={editingUser.firstName}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      defaultValue={editingUser.lastName}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingUser.email}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter email address"
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Role
                  </label>
                  <select
                    name="role"
                    defaultValue={editingUser.role}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="tester">Tester</option>
                    <option value="developer">Developer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? '#ccc' : '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {loading ? 'Updating...' : 'Update User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage('users');
                      setEditingUser(null);
                    }}
                    style={{
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '0.75rem 2rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Billing Page */}
        {currentPage === 'billing' && (
          <div>
            <h2>💳 Billing & Subscription</h2>
            {currentOrganization && (
              <p style={{ color: '#666', margin: '0.5rem 0 1.5rem 0' }}>
                Managing billing for: <strong>{currentOrganization.name}</strong>
              </p>
            )}

            {/* Current Plan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>💼 Current Plan</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '0.5rem' }}>
                  {currentOrganization?.plan?.name || 'Starter'}
                </div>
                <div style={{ color: '#666', marginBottom: '1rem' }}>
                  ${currentOrganization?.plan?.priceMonthly || '29'}/month
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: currentOrganization?.subscriptionStatus === 'active' ? '#e8f5e8' : '#fff3e0',
                  color: currentOrganization?.subscriptionStatus === 'active' ? '#2e7d32' : '#ef6c00',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  marginBottom: '1rem'
                }}>
                  {currentOrganization?.subscriptionStatus === 'trial' ? 'Trial' :
                   currentOrganization?.subscriptionStatus === 'active' ? 'Active' : 'Trial'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {currentOrganization?.trialEndsAt ?
                    `Trial ends: ${new Date(currentOrganization.trialEndsAt).toLocaleDateString()}` :
                    'Next billing: Not set'
                  }
                </div>
                <button
                  onClick={() => alert('Upgrade functionality coming soon!')}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    marginTop: '1rem',
                    width: '100%'
                  }}
                >
                  Upgrade Plan
                </button>
              </div>

              {/* Usage Overview */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>📊 Usage Overview</h3>

                {/* Users */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>👥 Users</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>1 / 5</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '20%',
                      height: '100%',
                      backgroundColor: '#1976d2',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>

                {/* Projects */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>📁 Projects</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{projects.length} / 3</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min((projects.length / 3) * 100, 100)}%`,
                      height: '100%',
                      backgroundColor: projects.length >= 3 ? '#f57c00' : '#1976d2',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>

                {/* Bugs */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>🐛 Bugs</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{bugs.length} / 100</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min((bugs.length / 100) * 100, 100)}%`,
                      height: '100%',
                      backgroundColor: bugs.length >= 90 ? '#d32f2f' : bugs.length >= 75 ? '#f57c00' : '#1976d2',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Plans */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>🚀 Available Plans</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {/* Starter Plan */}
                <div style={{
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Starter</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '0.5rem' }}>$29</div>
                  <div style={{ color: '#666', marginBottom: '1rem' }}>per month</div>
                  <ul style={{ textAlign: 'left', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                    <li>5 users</li>
                    <li>3 projects</li>
                    <li>100 bugs</li>
                    <li>Email support</li>
                  </ul>
                  <button
                    onClick={() => alert('Upgrade to Starter plan coming soon!')}
                    style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      width: '100%'
                    }}
                  >
                    Current Plan
                  </button>
                </div>

                {/* Professional Plan */}
                <div style={{
                  border: '2px solid #1976d2',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    Popular
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Professional</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '0.5rem' }}>$99</div>
                  <div style={{ color: '#666', marginBottom: '1rem' }}>per month</div>
                  <ul style={{ textAlign: 'left', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                    <li>25 users</li>
                    <li>10 projects</li>
                    <li>1,000 bugs</li>
                    <li>Priority support</li>
                    <li>Advanced features</li>
                  </ul>
                  <button
                    onClick={() => alert('Upgrade to Professional plan coming soon!')}
                    style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      width: '100%'
                    }}
                  >
                    Upgrade
                  </button>
                </div>

                {/* Enterprise Plan */}
                <div style={{
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Enterprise</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '0.5rem' }}>$299</div>
                  <div style={{ color: '#666', marginBottom: '1rem' }}>per month</div>
                  <ul style={{ textAlign: 'left', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                    <li>Unlimited users</li>
                    <li>Unlimited projects</li>
                    <li>Unlimited bugs</li>
                    <li>Dedicated support</li>
                    <li>Custom features</li>
                  </ul>
                  <button
                    onClick={() => alert('Contact sales for Enterprise plan!')}
                    style={{
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      width: '100%'
                    }}
                  >
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Organizations Page */}
        {currentPage === 'admin-organizations' && user?.role === 'admin' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>🏢 Organizations Management</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowCreateOrg(true)}
                  style={{
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Create Organization
                </button>
                <button
                  onClick={loadAdminData}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Organization</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Users</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Projects</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Bugs</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrganizations.map((org) => (
                      <tr key={org.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '500' }}>{org.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>{org.slug}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{org.userCount}</td>
                        <td style={{ padding: '0.75rem' }}>{org.projectCount}</td>
                        <td style={{ padding: '0.75rem' }}>{org.bugCount}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            backgroundColor: org.subscriptionStatus === 'active' ? '#e8f5e8' : '#fff3e0',
                            color: org.subscriptionStatus === 'active' ? '#2e7d32' : '#ef6c00'
                          }}>
                            {org.subscriptionStatus}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setCurrentOrganization(org);
                                setCurrentPage('organization-details');
                              }}
                              style={{
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                console.log('Switching to tenant view for organization:', org.id);
                                setCurrentOrganization(org);
                                setViewMode('tenant');
                                setCurrentPage('dashboard');
                                // Load organization-specific data
                                if (!isBackendConnected) {
                                  loadOrganizationSpecificData(org.id);
                                }
                              }}
                              style={{
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Manage as Tenant
                            </button>
                            <button
                              onClick={() => {
                                setCurrentOrganization(org);
                                setCurrentPage('create-tenant-user');
                              }}
                              style={{
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Add User
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
                                  deleteOrganization(org.id);
                                }
                              }}
                              style={{
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Organization Details Page */}
        {currentPage === 'organization-details' && user?.role === 'admin' && currentOrganization && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>🏢 {currentOrganization.name} - Organization Details</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    console.log('Switching to tenant view for organization:', currentOrganization.id);
                    setViewMode('tenant');
                    setCurrentPage('dashboard');
                    // Load organization-specific data when switching to tenant view
                    if (!isBackendConnected) {
                      loadOrganizationSpecificData(currentOrganization.id);
                    }
                  }}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🏢 Switch to Tenant View
                </button>
                <button
                  onClick={() => setCurrentPage('admin-organizations')}
                  style={{
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Organizations
                </button>
              </div>
            </div>

            {/* Organization Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>👥 Users</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>
                  {currentOrganization.userCount}
                </div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#4caf50' }}>📋 Projects</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>
                  {currentOrganization.projectCount}
                </div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#ff9800' }}>🐛 Bugs</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>
                  {currentOrganization.bugCount}
                </div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#9c27b0' }}>💳 Status</h3>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: currentOrganization.subscriptionStatus === 'active' ? '#4caf50' : '#ff9800',
                  textTransform: 'capitalize'
                }}>
                  {currentOrganization.subscriptionStatus}
                </div>
              </div>
            </div>

            {/* Organization Data Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              {/* Users Table */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>👥 Organization Users</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Role</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const orgData = getOrganizationDemoData(currentOrganization.id);
                        return orgData.users.map((user: any) => (
                          <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: '500' }}>{user.firstName} {user.lastName}</div>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666' }}>{user.email}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                backgroundColor: user.role === 'admin' ? '#ffebee' : user.role === 'developer' ? '#e8f5e8' : '#fff3e0',
                                color: user.role === 'admin' ? '#c62828' : user.role === 'developer' ? '#2e7d32' : '#ef6c00'
                              }}>
                                {user.role}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666' }}>
                              {formatDate(user.createdAt)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Projects Table */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#4caf50' }}>📋 Organization Projects</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Project</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Description</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const orgData = getOrganizationDemoData(currentOrganization.id);
                        return orgData.projects.map((project: any) => (
                          <tr key={project.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: '500' }}>{project.name}</div>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666' }}>{project.description}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                backgroundColor: project.status === 'active' ? '#e8f5e8' : '#fff3e0',
                                color: project.status === 'active' ? '#2e7d32' : '#ef6c00'
                              }}>
                                {project.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666' }}>
                              {formatDate(project.createdAt)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bugs Table */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#ff9800' }}>🐛 Organization Bugs</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Title</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Priority</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '0.75rem', color: '#666' }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const orgData = getOrganizationDemoData(currentOrganization.id);
                        return orgData.bugs.map((bug: any) => (
                          <tr key={bug.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: '500' }}>{bug.title}</div>
                              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                                {bug.description.substring(0, 60)}...
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                backgroundColor: bug.priority === 'high' ? '#ffebee' : bug.priority === 'medium' ? '#fff3e0' : '#e8f5e8',
                                color: bug.priority === 'high' ? '#c62828' : bug.priority === 'medium' ? '#ef6c00' : '#2e7d32'
                              }}>
                                {bug.priority}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                backgroundColor: bug.status === 'open' ? '#ffebee' : bug.status === 'in_progress' ? '#fff3e0' : '#e8f5e8',
                                color: bug.status === 'open' ? '#c62828' : bug.status === 'in_progress' ? '#ef6c00' : '#2e7d32'
                              }}>
                                {bug.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: '#666' }}>{bug.type}</td>
                            <td style={{ padding: '0.75rem', color: '#666' }}>
                              {formatDate(bug.createdAt)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Users Page */}
        {currentPage === 'admin-users' && user?.role === 'admin' && (
          <div>
            <h2>👥 All Users Management</h2>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                System-wide user management interface would be implemented here.
                This would show all users across all organizations with admin controls.
              </p>
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <strong>Features to implement:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>View all users across organizations</li>
                  <li>Suspend/activate user accounts</li>
                  <li>Reset passwords</li>
                  <li>View user activity logs</li>
                  <li>Manage user roles and permissions</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Admin Revenue Page */}
        {currentPage === 'admin-billing' && user?.role === 'admin' && (
          <div>
            <h2>💰 Revenue Management</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1976d2' }}>💰 Monthly Revenue</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>
                  ${systemStats?.monthlyRevenue || 228}
                </div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#388e3c' }}>📊 Active Subscriptions</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>
                  {systemStats?.activeSubscriptions || 2}
                </div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#f57c00' }}>⏳ Trial Subscriptions</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>
                  {systemStats?.trialSubscriptions || 1}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                Revenue analytics and billing management interface would be implemented here.
              </p>
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <strong>Features to implement:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Revenue charts and analytics</li>
                  <li>Subscription management</li>
                  <li>Payment processing oversight</li>
                  <li>Refund and billing dispute handling</li>
                  <li>Financial reporting</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Create Tenant User Page */}
        {currentPage === 'create-tenant-user' && user?.role === 'admin' && currentOrganization && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>👥 Create User for {currentOrganization.name}</h2>
              <button
                onClick={() => setCurrentPage('admin-organizations')}
                style={{
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ← Back to Organizations
              </button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '600px' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const userData = {
                  email: formData.get('email') as string,
                  password: formData.get('password') as string,
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  role: formData.get('role') as string,
                  organizationId: currentOrganization.id
                };

                // Create tenant user (demo implementation)
                alert(`User created for ${currentOrganization.name}!\n\nLogin Credentials:\nEmail: ${userData.email}\nPassword: ${userData.password}\nOrganization: ${currentOrganization.slug}\n\nUser can now login at: ${currentOrganization.slug}.bugtracker.com`);
                setCurrentPage('admin-organizations');
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    placeholder="user@company.com"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      First Name
                    </label>
                    <input
                      name="firstName"
                      type="text"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      type="text"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter password"
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Role in Organization
                  </label>
                  <select
                    name="role"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="developer">Developer</option>
                    <option value="qa_tester">QA Tester</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('admin-organizations')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #ddd',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Organization Modal */}
        {showCreateOrg && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90vw'
            }}>
              <h2 style={{ marginTop: 0 }}>Create New Organization</h2>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Organization Name
                </label>
                <input
                  type="text"
                  value={newOrgForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewOrgForm({
                      name,
                      slug: generateSlug(name)
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter organization name"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  URL Slug
                </label>
                <input
                  type="text"
                  value={newOrgForm.slug}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, slug: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="organization-slug"
                />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  Your organization will be available at: {newOrgForm.slug}.bugtracker.com
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCreateOrg(false);
                    setNewOrgForm({ name: '', slug: '' });
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createOrganization}
                  disabled={!newOrgForm.name || !newOrgForm.slug}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    backgroundColor: newOrgForm.name && newOrgForm.slug ? '#1976d2' : '#ccc',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: newOrgForm.name && newOrgForm.slug ? 'pointer' : 'not-allowed',
                    fontSize: '1rem'
                  }}
                >
                  Create Organization
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
