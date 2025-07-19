import React from 'react';
import { enhancedTheme } from '../../styles/enhanced-theme';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface NavigationProps {
  user: User | null;
  currentPage: string;
  viewMode: 'admin' | 'tenant';
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  user,
  currentPage,
  viewMode,
  onPageChange,
}) => {
  const navStyle = {
    backgroundColor: enhancedTheme.colors.surface,
    borderBottom: `1px solid ${enhancedTheme.colors.border}`,
    padding: `0 ${enhancedTheme.spacing.xl}`,
    boxShadow: enhancedTheme.shadows.sm,
  };

  const navContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: enhancedTheme.spacing.lg,
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const navItemStyle = {
    background: 'none',
    border: 'none',
    color: enhancedTheme.colors.textSecondary,
    cursor: 'pointer',
    fontSize: enhancedTheme.typography.fontSize.md,
    padding: `${enhancedTheme.spacing.md} ${enhancedTheme.spacing.lg}`,
    borderRadius: enhancedTheme.borderRadius.sm,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: enhancedTheme.spacing.sm,
    textDecoration: 'none',
    fontWeight: enhancedTheme.typography.fontWeight.medium,
  };

  const activeNavItemStyle = {
    ...navItemStyle,
    background: enhancedTheme.colors.primaryLight,
    color: enhancedTheme.colors.primary,
    fontWeight: enhancedTheme.typography.fontWeight.semibold,
  };

  const getNavItemStyle = (page: string, additionalPages: string[] = []) => {
    const isActive = currentPage === page || additionalPages.includes(currentPage);
    return isActive ? activeNavItemStyle : navItemStyle;
  };

  const isNavItemActive = (page: string, additionalPages: string[] = []) => {
    return currentPage === page || additionalPages.includes(currentPage);
  };

  // Don't show navigation if no user
  if (!user) return null;

  return (
    <nav style={navStyle}>
      <div style={navContainerStyle}>
        {/* Dashboard - Always visible */}
        <button
          onClick={() => onPageChange('dashboard')}
          style={getNavItemStyle('dashboard')}
          onMouseEnter={(e) => {
            if (!isNavItemActive('dashboard')) {
              e.currentTarget.style.backgroundColor = enhancedTheme.colors.surfaceHover;
              e.currentTarget.style.color = enhancedTheme.colors.textPrimary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isNavItemActive('dashboard')) {
              e.currentTarget.style.backgroundColor = 'none';
              e.currentTarget.style.color = enhancedTheme.colors.textSecondary;
            }
          }}
        >
          🏠 Dashboard
        </button>

        {/* Admin-only navigation */}
        {user.email === 'admin@bugtracker.com' && viewMode === 'admin' && (
          <>
            <button
              onClick={() => onPageChange('admin-organizations')}
              style={getNavItemStyle('admin-organizations', ['organization-details', 'create-tenant-user'])}
              onMouseEnter={(e) => {
                if (!isNavItemActive('admin-organizations', ['organization-details', 'create-tenant-user'])) {
                  e.currentTarget.style.backgroundColor = enhancedTheme.colors.surfaceHover;
                  e.currentTarget.style.color = enhancedTheme.colors.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isNavItemActive('admin-organizations', ['organization-details', 'create-tenant-user'])) {
                  e.currentTarget.style.backgroundColor = 'none';
                  e.currentTarget.style.color = enhancedTheme.colors.textSecondary;
                }
              }}
            >
              🏢 Organizations
            </button>
          </>
        )}

        {/* Tenant navigation - Hidden for super admin in admin mode */}
        {user.email !== 'admin@bugtracker.com' || viewMode === 'tenant' ? (
          <>
            <button
              onClick={() => onPageChange('projects')}
              style={getNavItemStyle('projects', ['create-project'])}
              onMouseEnter={(e) => {
                if (!isNavItemActive('projects', ['create-project'])) {
                  e.currentTarget.style.backgroundColor = enhancedTheme.colors.surfaceHover;
                  e.currentTarget.style.color = enhancedTheme.colors.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isNavItemActive('projects', ['create-project'])) {
                  e.currentTarget.style.backgroundColor = 'none';
                  e.currentTarget.style.color = enhancedTheme.colors.textSecondary;
                }
              }}
            >
              📁 Projects
            </button>

            <button
              onClick={() => onPageChange('bugs')}
              style={getNavItemStyle('bugs', ['create-bug'])}
              onMouseEnter={(e) => {
                if (!isNavItemActive('bugs', ['create-bug'])) {
                  e.currentTarget.style.backgroundColor = enhancedTheme.colors.surfaceHover;
                  e.currentTarget.style.color = enhancedTheme.colors.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isNavItemActive('bugs', ['create-bug'])) {
                  e.currentTarget.style.backgroundColor = 'none';
                  e.currentTarget.style.color = enhancedTheme.colors.textSecondary;
                }
              }}
            >
              🐛 Bugs
            </button>

            <button
              onClick={() => onPageChange('users')}
              style={getNavItemStyle('users', ['create-user'])}
              onMouseEnter={(e) => {
                if (!isNavItemActive('users', ['create-user'])) {
                  e.currentTarget.style.backgroundColor = enhancedTheme.colors.surfaceHover;
                  e.currentTarget.style.color = enhancedTheme.colors.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isNavItemActive('users', ['create-user'])) {
                  e.currentTarget.style.backgroundColor = 'none';
                  e.currentTarget.style.color = enhancedTheme.colors.textSecondary;
                }
              }}
            >
              👥 Team
            </button>

            <button
              onClick={() => onPageChange('billing')}
              style={getNavItemStyle('billing')}
              onMouseEnter={(e) => {
                if (!isNavItemActive('billing')) {
                  e.currentTarget.style.backgroundColor = enhancedTheme.colors.surfaceHover;
                  e.currentTarget.style.color = enhancedTheme.colors.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isNavItemActive('billing')) {
                  e.currentTarget.style.backgroundColor = 'none';
                  e.currentTarget.style.color = enhancedTheme.colors.textSecondary;
                }
              }}
            >
              💳 Billing
            </button>
          </>
        ) : null}

        {/* Back to Admin View - Only for super admin in tenant mode */}
        {user.email === 'admin@bugtracker.com' && viewMode === 'tenant' && (
          <button
            onClick={() => onPageChange('admin-organizations')}
            style={{
              ...navItemStyle,
              backgroundColor: enhancedTheme.colors.warning,
              color: 'white',
              marginLeft: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = enhancedTheme.colors.warning;
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = enhancedTheme.colors.warning;
              e.currentTarget.style.opacity = '1';
            }}
          >
            🔙 Back to Admin View
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
