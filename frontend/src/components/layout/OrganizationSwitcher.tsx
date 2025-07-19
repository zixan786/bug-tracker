import React from 'react';
import { enhancedTheme } from '../../styles/enhanced-theme';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationSwitcherProps {
  user: User;
  currentOrganization: Organization | null;
  organizations: Organization[];
  viewMode: 'admin' | 'tenant';
  showOrgSwitcher: boolean;
  setShowOrgSwitcher: (show: boolean) => void;
  onSwitchOrganization: (org: Organization) => void;
  onSwitchToAdminView: () => void;
  onLoadOrganizations: () => void;
}

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  user,
  currentOrganization,
  organizations,
  viewMode,
  showOrgSwitcher,
  setShowOrgSwitcher,
  onSwitchOrganization,
  onSwitchToAdminView,
  onLoadOrganizations,
}) => {
  const dropdownButtonStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: `${enhancedTheme.spacing.sm} ${enhancedTheme.spacing.md}`,
    borderRadius: enhancedTheme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: enhancedTheme.typography.fontSize.sm,
    display: 'flex',
    alignItems: 'center',
    gap: enhancedTheme.spacing.sm,
    transition: 'all 0.2s ease',
    position: 'relative' as const,
  };

  const dropdownStyle = {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    backgroundColor: enhancedTheme.colors.surface,
    color: enhancedTheme.colors.textPrimary,
    border: `1px solid ${enhancedTheme.colors.border}`,
    borderRadius: enhancedTheme.borderRadius.md,
    boxShadow: enhancedTheme.shadows.lg,
    minWidth: '280px',
    zIndex: 1001,
    marginTop: enhancedTheme.spacing.sm,
    overflow: 'hidden',
  };

  const dropdownHeaderStyle = {
    padding: enhancedTheme.spacing.md,
    borderBottom: `1px solid ${enhancedTheme.colors.borderLight}`,
    fontWeight: enhancedTheme.typography.fontWeight.semibold,
    backgroundColor: enhancedTheme.colors.background,
    fontSize: enhancedTheme.typography.fontSize.sm,
  };

  const dropdownItemStyle = {
    padding: enhancedTheme.spacing.md,
    cursor: 'pointer',
    borderBottom: `1px solid ${enhancedTheme.colors.borderLight}`,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: enhancedTheme.spacing.sm,
  };

  const dropdownItemHoverStyle = {
    backgroundColor: enhancedTheme.colors.primaryLight,
    color: enhancedTheme.colors.primary,
  };

  const getCurrentDisplayText = () => {
    if (currentOrganization) {
      return viewMode === 'tenant' 
        ? `Tenant View: ${currentOrganization.name}` 
        : `Managing: ${currentOrganization.name}`;
    }
    return 'Select Organization to Manage';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowOrgSwitcher(!showOrgSwitcher)}
        style={dropdownButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        🏢 {getCurrentDisplayText()}
        <span style={{ fontSize: enhancedTheme.typography.fontSize.xs }}>▼</span>
      </button>

      {showOrgSwitcher && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={dropdownStyle}
        >
          <div style={dropdownHeaderStyle}>
            Select Organization to Manage
          </div>

          {/* Debug info */}
          <div style={{
            padding: enhancedTheme.spacing.sm,
            borderBottom: `1px solid ${enhancedTheme.colors.borderLight}`,
            fontSize: enhancedTheme.typography.fontSize.xs,
            color: enhancedTheme.colors.textSecondary,
            backgroundColor: enhancedTheme.colors.background,
          }}>
            Debug: {organizations.length} organizations available
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadOrganizations();
              }}
              style={{
                marginLeft: enhancedTheme.spacing.sm,
                padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
                fontSize: enhancedTheme.typography.fontSize.xs,
                backgroundColor: enhancedTheme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: enhancedTheme.borderRadius.sm,
                cursor: 'pointer',
              }}
            >
              🔄 Load
            </button>
          </div>

          {/* Back to Admin View option - Only for super admin */}
          {user.email === 'admin@bugtracker.com' && (
            <div
              onClick={onSwitchToAdminView}
              style={{
                ...dropdownItemStyle,
                backgroundColor: !currentOrganization ? enhancedTheme.colors.primaryLight : 'white',
                fontWeight: !currentOrganization ? enhancedTheme.typography.fontWeight.semibold : 'normal',
                color: enhancedTheme.colors.primary,
              }}
              onMouseEnter={(e) => {
                if (currentOrganization) {
                  Object.assign(e.currentTarget.style, dropdownItemHoverStyle);
                }
              }}
              onMouseLeave={(e) => {
                if (currentOrganization) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = enhancedTheme.colors.primary;
                }
              }}
            >
              🏠 System Admin View
            </div>
          )}

          {organizations.length === 0 ? (
            <div style={{
              ...dropdownItemStyle,
              color: enhancedTheme.colors.textSecondary,
              fontStyle: 'italic',
              cursor: 'default',
            }}>
              No organizations available. Click "🔄 Reload Admin Data" to load.
            </div>
          ) : (
            organizations.map((org) => (
              <div
                key={org.id}
                onClick={() => onSwitchOrganization(org)}
                style={{
                  ...dropdownItemStyle,
                  backgroundColor: currentOrganization?.id === org.id ? enhancedTheme.colors.primaryLight : 'white',
                  fontWeight: currentOrganization?.id === org.id ? enhancedTheme.typography.fontWeight.semibold : 'normal',
                }}
                onMouseEnter={(e) => {
                  if (currentOrganization?.id !== org.id) {
                    Object.assign(e.currentTarget.style, dropdownItemHoverStyle);
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentOrganization?.id !== org.id) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = enhancedTheme.colors.textPrimary;
                  }
                }}
              >
                <div>
                  <div style={{ fontWeight: enhancedTheme.typography.fontWeight.medium }}>
                    {org.name}
                  </div>
                  <div style={{ 
                    fontSize: enhancedTheme.typography.fontSize.xs, 
                    color: enhancedTheme.colors.textSecondary 
                  }}>
                    {org.slug}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationSwitcher;
