import React from 'react';
import { enhancedTheme } from '../../styles/enhanced-theme';
import OrganizationSwitcher from './OrganizationSwitcher';

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

interface HeaderProps {
  user: User | null;
  currentOrganization: Organization | null;
  organizations: Organization[];
  viewMode: 'admin' | 'tenant';
  showOrgSwitcher: boolean;
  setShowOrgSwitcher: (show: boolean) => void;
  onSwitchOrganization: (org: Organization) => void;
  onSwitchToAdminView: () => void;
  onLoadOrganizations: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  currentOrganization,
  organizations,
  viewMode,
  showOrgSwitcher,
  setShowOrgSwitcher,
  onSwitchOrganization,
  onSwitchToAdminView,
  onLoadOrganizations,
  onLogout,
}) => {
  const headerStyle = {
    background: `linear-gradient(135deg, ${enhancedTheme.colors.primary} 0%, ${enhancedTheme.colors.primaryDark} 100%)`,
    color: 'white',
    padding: `${enhancedTheme.spacing.md} ${enhancedTheme.spacing.xl}`,
    boxShadow: enhancedTheme.shadows.md,
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: enhancedTheme.spacing.sm,
    fontSize: enhancedTheme.typography.fontSize.xl,
    fontWeight: enhancedTheme.typography.fontWeight.bold,
    textDecoration: 'none',
    color: 'white',
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: enhancedTheme.spacing.lg,
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: enhancedTheme.spacing.sm,
    fontSize: enhancedTheme.typography.fontSize.sm,
  };

  const buttonStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
    borderRadius: enhancedTheme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: enhancedTheme.typography.fontSize.sm,
    transition: 'all 0.2s ease',
  };

  const buttonHoverStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        {/* Logo */}
        <div style={logoStyle}>
          🐛 Bug Tracker
        </div>

        {/* Right Section */}
        <div style={rightSectionStyle}>
          {/* View Mode Indicator */}
          {user?.email === 'admin@bugtracker.com' && (
            <div style={{
              padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: enhancedTheme.borderRadius.sm,
              fontSize: enhancedTheme.typography.fontSize.xs,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {viewMode === 'admin' ? '🔧 Admin View' : '🏢 Tenant View'}
            </div>
          )}

          {/* Organization Switcher */}
          {user && (
            <OrganizationSwitcher
              user={user}
              currentOrganization={currentOrganization}
              organizations={organizations}
              viewMode={viewMode}
              showOrgSwitcher={showOrgSwitcher}
              setShowOrgSwitcher={setShowOrgSwitcher}
              onSwitchOrganization={onSwitchOrganization}
              onSwitchToAdminView={onSwitchToAdminView}
              onLoadOrganizations={onLoadOrganizations}
            />
          )}

          {/* User Info */}
          {user && (
            <div style={userInfoStyle}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: enhancedTheme.borderRadius.round,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: enhancedTheme.typography.fontSize.sm,
                fontWeight: enhancedTheme.typography.fontWeight.bold,
              }}>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: enhancedTheme.typography.fontWeight.medium }}>
                  Welcome, {user.firstName}!
                </div>
                <div style={{ 
                  fontSize: enhancedTheme.typography.fontSize.xs, 
                  opacity: 0.8 
                }}>
                  {user.role}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={onLogout}
              style={buttonStyle}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, buttonHoverStyle);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, buttonStyle);
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
