import React, { useState } from 'react';
import EnhancedTable from '../common/EnhancedTable';
import { enhancedTheme, buttonStyles, cardStyles } from '../../styles/enhanced-theme';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface UsersPageProps {
  users: User[];
  currentOrganization: Organization | null;
  isBackendConnected: boolean;
  onRefresh: () => void;
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UsersPage: React.FC<UsersPageProps> = ({
  users,
  currentOrganization,
  isBackendConnected,
  onRefresh,
  onCreateUser,
  onEditUser,
  onDeleteUser,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '15%',
      render: (value: string) => (
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: enhancedTheme.typography.fontSize.sm,
          color: enhancedTheme.colors.textSecondary 
        }}>
          #{value.slice(-8)}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      width: '25%',
      sortable: true,
      render: (_: any, row: User) => (
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
      width: '15%',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (_: any, row: User) => (
        <span style={{
          padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
          borderRadius: enhancedTheme.borderRadius.sm,
          fontSize: enhancedTheme.typography.fontSize.xs,
          fontWeight: enhancedTheme.typography.fontWeight.medium,
          textTransform: 'uppercase',
          backgroundColor: row.isActive !== false ? enhancedTheme.colors.statusActive : enhancedTheme.colors.statusInactive,
          color: 'white',
        }}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
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
      width: '15%',
      render: (_: any, row: User) => (
        <div style={{ display: 'flex', gap: enhancedTheme.spacing.xs }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditUser(row);
            }}
            style={{
              ...buttonStyles.base,
              ...buttonStyles.secondary,
              padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
              fontSize: enhancedTheme.typography.fontSize.xs,
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete ${row.firstName} ${row.lastName}?`)) {
                onDeleteUser(row.id);
              }
            }}
            style={{
              ...buttonStyles.base,
              ...buttonStyles.error,
              padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
              fontSize: enhancedTheme.typography.fontSize.xs,
            }}
          >
            🗑️ Delete
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

  const pageHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: enhancedTheme.spacing.xl,
  };

  const titleStyle = {
    fontSize: enhancedTheme.typography.fontSize.xxl,
    fontWeight: enhancedTheme.typography.fontWeight.bold,
    color: enhancedTheme.colors.textPrimary,
    margin: 0,
  };

  const subtitleStyle = {
    color: enhancedTheme.colors.textSecondary,
    margin: `${enhancedTheme.spacing.sm} 0`,
    fontSize: enhancedTheme.typography.fontSize.md,
  };

  const actionsStyle = {
    display: 'flex',
    gap: enhancedTheme.spacing.md,
    alignItems: 'center',
  };

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <h2 style={titleStyle}>👥 User Management</h2>
          <p style={subtitleStyle}>
            {currentOrganization ? (
              <>
                <strong>{currentOrganization.name}</strong> -
                {isBackendConnected
                  ? ` ${users.length} users loaded`
                  : ` ${users.length} demo users`
                }
              </>
            ) : (
              'Manage system users'
            )}
          </p>
        </div>

        <div style={actionsStyle}>
          <button
            onClick={onRefresh}
            style={{
              ...buttonStyles.base,
              ...buttonStyles.secondary,
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={onCreateUser}
            style={{
              ...buttonStyles.base,
              ...buttonStyles.primary,
            }}
          >
            ➕ Create User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: enhancedTheme.spacing.lg,
        marginBottom: enhancedTheme.spacing.xl,
      }}>
        <div style={cardStyles.container}>
          <div style={cardStyles.body}>
            <div style={{ 
              fontSize: enhancedTheme.typography.fontSize.xxl, 
              fontWeight: enhancedTheme.typography.fontWeight.bold,
              color: enhancedTheme.colors.primary 
            }}>
              {users.length}
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
              {users.filter(u => u.isActive !== false).length}
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
              {users.filter(u => u.role === 'admin').length}
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

      {/* Users Table */}
      <EnhancedTable
        columns={columns}
        data={users}
        selectedRows={selectedUsers}
        onRowSelect={handleRowSelect}
        emptyMessage={
          currentOrganization 
            ? `No users found for ${currentOrganization.name}. Click "Create User" to add the first user.`
            : 'No users found. Click "Create User" to add the first user.'
        }
      />
    </div>
  );
};

export default UsersPage;
