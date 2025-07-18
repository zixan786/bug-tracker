import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Bug {
  id: number;
  title: string;
  description: string;
  priority: string;
  severity: string;
  status: string;
  type: string;
  projectId: number;
  assigneeId?: number;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AppUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<User | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
    try {
      console.log('Attempting login with:', { email, password });
      console.log('API URL:', `${API_BASE}/auth/login`);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        console.log('Login successful, user data:', data.data.user);
        setUser(data.data.user);
        setAuthToken(data.data.token);
        setIsBackendConnected(true);
        setCurrentPage('dashboard');

        // Save session to localStorage for persistence
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));

        // Load initial data
        await loadDashboardData(data.data.token);
        console.log('Dashboard data loaded, users count:', users.length);
      } else {
        console.error('Login failed:', data);
        alert(`Login failed: ${data.message || 'Unknown error'}. Click OK to use demo mode.`);

        // Fallback to demo mode
        if (email === 'admin@bugtracker.com' && password === 'admin123') {
          setUser({
            id: 1,
            email,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          });
          setIsBackendConnected(false);
          loadDemoData();
          setCurrentPage('dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Backend connection failed. Using demo mode.');

      // Fallback to demo mode
      if (email === 'admin@bugtracker.com' && password === 'admin123') {
        setUser({
          id: 1,
          email,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        });
        setIsBackendConnected(false);
        loadDemoData();
        setCurrentPage('dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    // Demo bugs data
    const demoBugs: Bug[] = [
      {
        id: 1,
        title: "Login button not working on mobile",
        description: "Users report that the login button is unresponsive on mobile devices",
        priority: "high",
        severity: "major",
        status: "open",
        type: "bug",
        projectId: 1,
        assigneeId: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 2,
        title: "Dashboard loading slowly",
        description: "The dashboard takes more than 5 seconds to load with large datasets",
        priority: "medium",
        severity: "minor",
        status: "in_progress",
        type: "performance",
        projectId: 1,
        assigneeId: 2,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 3,
        title: "Add dark mode support",
        description: "Users have requested a dark mode theme for better accessibility",
        priority: "low",
        severity: "minor",
        status: "open",
        type: "feature",
        projectId: 1,
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 4,
        title: "Email notifications not sending",
        description: "Critical bug: email notifications for new assignments are not being sent",
        priority: "high",
        severity: "critical",
        status: "open",
        type: "bug",
        projectId: 2,
        assigneeId: 1,
        createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        updatedAt: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: 5,
        title: "User profile update successful",
        description: "Fixed issue where user profile updates were not saving correctly",
        priority: "medium",
        severity: "major",
        status: "resolved",
        type: "bug",
        projectId: 1,
        assigneeId: 2,
        createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    // Demo projects data
    const demoProjects: Project[] = [
      {
        id: 1,
        name: "Bug Tracker Application",
        description: "Main bug tracking and project management application",
        status: "active",
        createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 2,
        name: "Mobile App Development",
        description: "Cross-platform mobile application for bug tracking",
        status: "active",
        createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 3,
        name: "API Documentation",
        description: "Comprehensive API documentation and examples",
        status: "completed",
        createdAt: new Date(Date.now() - 5184000000).toISOString(), // 60 days ago
        updatedAt: new Date(Date.now() - 2592000000).toISOString()
      }
    ];

    // Demo users data
    const demoUsers: AppUser[] = [
      {
        id: 1,
        email: "admin@bugtracker.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        createdAt: new Date(Date.now() - 5184000000).toISOString(), // 60 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 2,
        email: "developer@bugtracker.com",
        firstName: "John",
        lastName: "Developer",
        role: "developer",
        createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 3,
        email: "tester@bugtracker.com",
        firstName: "Jane",
        lastName: "Tester",
        role: "tester",
        createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 4,
        email: "manager@bugtracker.com",
        firstName: "Mike",
        lastName: "Manager",
        role: "manager",
        createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    setBugs(demoBugs);
    setProjects(demoProjects);
    setUsers(demoUsers);
  };

  // Function to reload users from backend
  const reloadUsers = async () => {
    if (!isBackendConnected || !authToken) return;

    try {
      const usersResponse = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data.users || []);
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
        id: Math.max(...projects.map(p => p.id), 0) + 1,
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
        const newProject = data.data.project;
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

  const deleteProject = async (projectId: number) => {
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
  const createUser = async (userData: { email: string; firstName: string; lastName: string; role: string; password?: string }) => {
    if (!isBackendConnected || !authToken) {
      // Demo mode - just add to local state
      const newUser: AppUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
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

  const updateProject = async (projectId: number, projectData: { name: string; description: string; status: string }) => {
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
        const updatedProject = data.data.project;
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

  const updateUser = async (userId: number, userData: { email: string; firstName: string; lastName: string; role: string }) => {
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

  const deleteUser = async (userId: number) => {
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
  const updateBug = async (bugId: number, bugData: {
    title: string;
    description: string;
    priority: string;
    severity: string;
    type: string;
    status: string;
    assigneeId?: number;
    projectId: number;
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
        const updatedBug = data.data.bug;
        setBugs(prev => prev.map(b => b.id === bugId ? updatedBug : b));
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

  const deleteBug = async (bugId: number) => {
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
        setBugs(bugsData.data.bugs || []);
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
        setProjects(projectsData.data.projects || []);
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
        setUsers(usersData.data.users || []);
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
            Email: admin@bugtracker.com<br />
            Password: admin123
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
        <div>
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
          {user?.role === 'admin' && (
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
              👥 Users
            </button>
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
            <h2>📊 Dashboard</h2>
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
                            {new Date(bug.createdAt).toLocaleDateString()}
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

        {currentPage === 'bugs' && (
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
                                  const newAssignedTo = e.target.value ? parseInt(e.target.value) : undefined;
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
                            {new Date(bug.createdAt).toLocaleDateString()}
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
                                  const assignedTo = newAssignee.trim() === '' ? undefined : parseInt(newAssignee);
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

        {currentPage === 'create-bug' && (
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
                  projectId: parseInt(formData.get('projectId') as string) || (projects[0]?.id || 1),
                  assigneeId: assignedToValue && assignedToValue !== '' ? parseInt(assignedToValue) : undefined
                };

                console.log('Bug data being sent:', bugData);

                try {
                  if (!isBackendConnected || !authToken) {
                    // Demo mode - add to local state
                    const newBug: Bug = {
                      id: Math.max(...bugs.map(b => b.id), 0) + 1,
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
                    const createdBug = responseData.data?.bug || responseData.data;
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

        {currentPage === 'projects' && (
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
                          Created: {new Date(project.createdAt).toLocaleDateString()}
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
        {currentPage === 'create-project' && (
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
                  {isBackendConnected ?
                    `Backend connected - ${users.length} users loaded` :
                    `Demo mode - ${users.length} demo users`
                  }
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
                      {users.map(appUser => (
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
                            {new Date(appUser.createdAt).toLocaleDateString()}
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
                      ))}
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
                    password: formData.get('password') as string || 'defaultPassword123'
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
                    projectId: parseInt(formData.get('projectId') as string),
                    assigneeId: formData.get('assignedTo') ? parseInt(formData.get('assignedTo') as string) : undefined
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
      </main>
    </div>
  );
}

export default App;
