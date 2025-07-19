// Enhanced UI Theme and Styles for Bug Tracker
export const enhancedTheme = {
  colors: {
    primary: '#1976d2',
    primaryLight: '#e3f2fd',
    primaryDark: '#1565c0',
    secondary: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    // Background colors
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceHover: '#f5f5f5',
    
    // Text colors
    textPrimary: '#212121',
    textSecondary: '#666666',
    textMuted: '#999999',
    
    // Border colors
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    borderDark: '#cccccc',
    
    // Status colors
    statusActive: '#4caf50',
    statusInactive: '#f44336',
    statusPending: '#ff9800',
    statusCompleted: '#2196f3',
    
    // Role colors
    roleAdmin: '#f50057',
    roleUser: '#2196f3',
    roleDeveloper: '#4caf50',
    roleTester: '#ff9800',
    roleViewer: '#9c27b0',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    round: '50%',
  },
  
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    md: '0 4px 8px rgba(0,0,0,0.1)',
    lg: '0 8px 16px rgba(0,0,0,0.1)',
    xl: '0 16px 32px rgba(0,0,0,0.1)',
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

// Enhanced Table Styles
export const tableStyles = {
  container: {
    backgroundColor: enhancedTheme.colors.surface,
    borderRadius: enhancedTheme.borderRadius.md,
    boxShadow: enhancedTheme.shadows.sm,
    overflow: 'hidden',
    border: `1px solid ${enhancedTheme.colors.border}`,
  },
  
  header: {
    backgroundColor: enhancedTheme.colors.background,
    borderBottom: `2px solid ${enhancedTheme.colors.border}`,
  },
  
  headerCell: {
    padding: enhancedTheme.spacing.md,
    fontWeight: enhancedTheme.typography.fontWeight.semibold,
    color: enhancedTheme.colors.textPrimary,
    fontSize: enhancedTheme.typography.fontSize.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  
  row: {
    borderBottom: `1px solid ${enhancedTheme.colors.borderLight}`,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  
  rowHover: {
    backgroundColor: enhancedTheme.colors.primaryLight,
    transform: 'translateY(-1px)',
    boxShadow: enhancedTheme.shadows.sm,
  },
  
  rowSelected: {
    backgroundColor: enhancedTheme.colors.primaryLight,
    borderLeft: `4px solid ${enhancedTheme.colors.primary}`,
  },
  
  cell: {
    padding: enhancedTheme.spacing.md,
    color: enhancedTheme.colors.textPrimary,
    fontSize: enhancedTheme.typography.fontSize.md,
    verticalAlign: 'middle' as const,
  },
  
  badge: {
    padding: `${enhancedTheme.spacing.xs} ${enhancedTheme.spacing.sm}`,
    borderRadius: enhancedTheme.borderRadius.sm,
    fontSize: enhancedTheme.typography.fontSize.xs,
    fontWeight: enhancedTheme.typography.fontWeight.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
};

// Button Styles
export const buttonStyles = {
  base: {
    padding: `${enhancedTheme.spacing.sm} ${enhancedTheme.spacing.md}`,
    borderRadius: enhancedTheme.borderRadius.sm,
    border: 'none',
    cursor: 'pointer',
    fontSize: enhancedTheme.typography.fontSize.md,
    fontWeight: enhancedTheme.typography.fontWeight.medium,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: enhancedTheme.spacing.xs,
  },
  
  primary: {
    backgroundColor: enhancedTheme.colors.primary,
    color: 'white',
    boxShadow: enhancedTheme.shadows.sm,
  },
  
  secondary: {
    backgroundColor: enhancedTheme.colors.surface,
    color: enhancedTheme.colors.textPrimary,
    border: `1px solid ${enhancedTheme.colors.border}`,
  },
  
  success: {
    backgroundColor: enhancedTheme.colors.success,
    color: 'white',
  },
  
  warning: {
    backgroundColor: enhancedTheme.colors.warning,
    color: 'white',
  },
  
  error: {
    backgroundColor: enhancedTheme.colors.error,
    color: 'white',
  },
};

// Form Styles
export const formStyles = {
  container: {
    backgroundColor: enhancedTheme.colors.surface,
    padding: enhancedTheme.spacing.xl,
    borderRadius: enhancedTheme.borderRadius.md,
    boxShadow: enhancedTheme.shadows.md,
    border: `1px solid ${enhancedTheme.colors.border}`,
  },
  
  field: {
    marginBottom: enhancedTheme.spacing.lg,
  },
  
  label: {
    display: 'block',
    marginBottom: enhancedTheme.spacing.sm,
    fontWeight: enhancedTheme.typography.fontWeight.medium,
    color: enhancedTheme.colors.textPrimary,
    fontSize: enhancedTheme.typography.fontSize.md,
  },
  
  input: {
    width: '100%',
    padding: enhancedTheme.spacing.md,
    border: `1px solid ${enhancedTheme.colors.border}`,
    borderRadius: enhancedTheme.borderRadius.sm,
    fontSize: enhancedTheme.typography.fontSize.md,
    transition: 'border-color 0.2s ease',
  },
  
  inputFocus: {
    borderColor: enhancedTheme.colors.primary,
    outline: 'none',
    boxShadow: `0 0 0 2px ${enhancedTheme.colors.primaryLight}`,
  },
};

// Card Styles
export const cardStyles = {
  container: {
    backgroundColor: enhancedTheme.colors.surface,
    borderRadius: enhancedTheme.borderRadius.md,
    boxShadow: enhancedTheme.shadows.sm,
    border: `1px solid ${enhancedTheme.colors.border}`,
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  
  hover: {
    boxShadow: enhancedTheme.shadows.md,
    transform: 'translateY(-2px)',
  },
  
  header: {
    padding: enhancedTheme.spacing.lg,
    borderBottom: `1px solid ${enhancedTheme.colors.borderLight}`,
    backgroundColor: enhancedTheme.colors.background,
  },
  
  body: {
    padding: enhancedTheme.spacing.lg,
  },
  
  footer: {
    padding: enhancedTheme.spacing.lg,
    borderTop: `1px solid ${enhancedTheme.colors.borderLight}`,
    backgroundColor: enhancedTheme.colors.background,
  },
};

// Utility functions
export const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin': return enhancedTheme.colors.roleAdmin;
    case 'developer': return enhancedTheme.colors.roleDeveloper;
    case 'tester': case 'qa_tester': return enhancedTheme.colors.roleTester;
    case 'viewer': return enhancedTheme.colors.roleViewer;
    default: return enhancedTheme.colors.roleUser;
  }
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': case 'open': return enhancedTheme.colors.statusActive;
    case 'inactive': case 'closed': return enhancedTheme.colors.statusInactive;
    case 'pending': case 'in_progress': return enhancedTheme.colors.statusPending;
    case 'completed': case 'resolved': return enhancedTheme.colors.statusCompleted;
    default: return enhancedTheme.colors.textSecondary;
  }
};
