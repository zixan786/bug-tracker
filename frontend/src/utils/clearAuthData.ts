/**
 * Utility function to clear authentication data from localStorage
 * This helps prevent automatic login on page refresh
 */
export const clearAuthData = (): void => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    console.log('Authentication data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

/**
 * Check if there's any authentication data in localStorage
 */
export const hasAuthData = (): boolean => {
  try {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    return !!(token && user);
  } catch (error) {
    console.error('Error checking auth data:', error);
    return false;
  }
};
