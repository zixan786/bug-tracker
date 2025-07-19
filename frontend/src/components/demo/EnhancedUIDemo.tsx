import React, { useState } from 'react';
import EnhancedTable from '../common/EnhancedTable';
import { enhancedTheme, buttonStyles, cardStyles } from '../../styles/enhanced-theme';

// Demo data
const demoUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@acme.com',
    role: 'admin',
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@acme.com',
    role: 'developer',
    isActive: true,
    createdAt: '2025-01-14T09:30:00Z',
    updatedAt: '2025-01-14T09:30:00Z',
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@acme.com',
    role: 'tester',
    isActive: false,
    createdAt: '2025-01-13T14:15:00Z',
    updatedAt: '2025-01-13T14:15:00Z',
  },
  {
    id: '4',
    firstName: 'Alice',
    lastName: 'Wilson',
    email: 'alice@acme.com',
    role: 'viewer',
    isActive: true,
    createdAt: '2025-01-12T11:45:00Z',
    updatedAt: '2025-01-12T11:45:00Z',
  },
];

const EnhancedUIDemo: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '10%',
      render: (value: string) => (
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: enhancedTheme.typography.fontSize.sm,
          color: enhancedTheme.colors.textSecondary 
        }}>
          #{value}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      width: '30%',
      sortable: true,
      render: (_: any, row: any) => (
        <div>
          <div style={{ fontWeight: enhancedTheme.typography.fontWeight.medium }}>
            {row.firstName} {row.lastName}
          </div>
          <div style={{ 
            fontSize: enhancedTheme.typography.fontSize.sm, 
            color: enhancedTheme.colors.textSecondary 
          }}>
            {row.email}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      width: '20%',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (_: any, row: any) => (
        <span style={{
          padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
          borderRadius: enhancedTheme.borderRadius.sm,
          fontSize: enhancedTheme.typography.fontSize.xs,
          fontWeight: enhancedTheme.typography.fontWeight.medium,
          textTransform: 'uppercase',
          backgroundColor: row.isActive ? enhancedTheme.colors.statusActive : enhancedTheme.colors.statusInactive,
          color: 'white',
        }}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '15%',
      sortable: true,
      render: (value: string) => (
        <span style={{ 
          fontSize: enhancedTheme.typography.fontSize.sm,
          color: enhancedTheme.colors.textSecondary 
        }}>
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', gap: enhancedTheme.spacing.xs }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              alert(`Edit ${row.firstName} ${row.lastName}`);
            }}
            style={{
              ...buttonStyles.base,
              ...buttonStyles.secondary,
              padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
              fontSize: enhancedTheme.typography.fontSize.xs,
            }}
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              alert(`Delete ${row.firstName} ${row.lastName}`);
            }}
            style={{
              ...buttonStyles.base,
              ...buttonStyles.error,
              padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
              fontSize: enhancedTheme.typography.fontSize.xs,
            }}
          >
            🗑️
          </button>
        </div>
      ),
    },
  ];

  const handleRowSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const containerStyle = {
    padding: enhancedTheme.spacing.xl,
    backgroundColor: enhancedTheme.colors.background,
    minHeight: '100vh',
    fontFamily: enhancedTheme.typography.fontFamily,
  };

  const headerStyle = {
    marginBottom: enhancedTheme.spacing.xl,
    textAlign: 'center' as const,
  };

  const titleStyle = {
    fontSize: enhancedTheme.typography.fontSize.xxl,
    fontWeight: enhancedTheme.typography.fontWeight.bold,
    color: enhancedTheme.colors.textPrimary,
    margin: 0,
    marginBottom: enhancedTheme.spacing.sm,
  };

  const subtitleStyle = {
    color: enhancedTheme.colors.textSecondary,
    fontSize: enhancedTheme.typography.fontSize.lg,
    margin: 0,
  };

  const sectionStyle = {
    marginBottom: enhancedTheme.spacing.xl,
  };

  const sectionTitleStyle = {
    fontSize: enhancedTheme.typography.fontSize.xl,
    fontWeight: enhancedTheme.typography.fontWeight.semibold,
    color: enhancedTheme.colors.textPrimary,
    marginBottom: enhancedTheme.spacing.lg,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🎨 Enhanced UI Demo</h1>
        <p style={subtitleStyle}>
          Showcasing the new enhanced table design with hover effects, selection, and improved styling
        </p>
      </div>

      {/* Stats Cards */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>📊 Stats Cards</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: enhancedTheme.spacing.lg,
        }}>
          <div style={cardStyles.container}>
            <div style={cardStyles.body}>
              <div style={{ 
                fontSize: enhancedTheme.typography.fontSize.xxl, 
                fontWeight: enhancedTheme.typography.fontWeight.bold,
                color: enhancedTheme.colors.primary 
              }}>
                {demoUsers.length}
              </div>
              <div style={{ 
                color: enhancedTheme.colors.textSecondary,
                fontSize: enhancedTheme.typography.fontSize.sm 
              }}>
                Total Users
              </div>
            </div>
          </div>

          <div style={cardStyles.container}>
            <div style={cardStyles.body}>
              <div style={{ 
                fontSize: enhancedTheme.typography.fontSize.xxl, 
                fontWeight: enhancedTheme.typography.fontWeight.bold,
                color: enhancedTheme.colors.success 
              }}>
                {demoUsers.filter(u => u.isActive).length}
              </div>
              <div style={{ 
                color: enhancedTheme.colors.textSecondary,
                fontSize: enhancedTheme.typography.fontSize.sm 
              }}>
                Active Users
              </div>
            </div>
          </div>

          <div style={cardStyles.container}>
            <div style={cardStyles.body}>
              <div style={{ 
                fontSize: enhancedTheme.typography.fontSize.xxl, 
                fontWeight: enhancedTheme.typography.fontWeight.bold,
                color: enhancedTheme.colors.roleAdmin 
              }}>
                {demoUsers.filter(u => u.role === 'admin').length}
              </div>
              <div style={{ 
                color: enhancedTheme.colors.textSecondary,
                fontSize: enhancedTheme.typography.fontSize.sm 
              }}>
                Admins
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div style={sectionStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: enhancedTheme.spacing.lg,
        }}>
          <h2 style={sectionTitleStyle}>👥 Enhanced User Table</h2>
          <div style={{ display: 'flex', gap: enhancedTheme.spacing.md }}>
            <button
              style={{
                ...buttonStyles.base,
                ...buttonStyles.secondary,
              }}
            >
              🔄 Refresh
            </button>
            <button
              style={{
                ...buttonStyles.base,
                ...buttonStyles.primary,
              }}
            >
              ➕ Add User
            </button>
          </div>
        </div>

        <EnhancedTable
          columns={columns}
          data={demoUsers}
          selectedRows={selectedUsers}
          onRowSelect={handleRowSelect}
          onRowClick={(row) => alert(`Clicked on ${row.firstName} ${row.lastName}`)}
          emptyMessage="No users found. Click 'Add User' to create the first user."
        />

        <div style={{
          marginTop: enhancedTheme.spacing.lg,
          padding: enhancedTheme.spacing.md,
          backgroundColor: enhancedTheme.colors.primaryLight,
          borderRadius: enhancedTheme.borderRadius.sm,
          fontSize: enhancedTheme.typography.fontSize.sm,
          color: enhancedTheme.colors.primary,
        }}>
          <strong>✨ Features:</strong> Hover effects, row selection, sorting, role badges, status indicators, and responsive design
        </div>
      </div>
    </div>
  );
};

export default EnhancedUIDemo;
