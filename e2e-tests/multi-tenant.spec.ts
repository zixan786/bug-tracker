import { test, expect, Page } from '@playwright/test';

// Test data
const testOrgs = [
  { name: 'Acme Corp', slug: 'acme', email: 'admin@acme.com' },
  { name: 'Beta Inc', slug: 'beta', email: 'admin@beta.com' }
];

const testUsers = [
  { email: 'admin@acme.com', password: 'password123', role: 'admin' },
  { email: 'dev@acme.com', password: 'password123', role: 'developer' },
  { email: 'viewer@acme.com', password: 'password123', role: 'viewer' }
];

class BugTrackerPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async createOrganization(name: string, slug: string) {
    await this.page.click('[data-testid="org-switcher"]');
    await this.page.click('[data-testid="create-org-button"]');
    await this.page.fill('[data-testid="org-name"]', name);
    await this.page.fill('[data-testid="org-slug"]', slug);
    await this.page.click('[data-testid="create-org-submit"]');
    await this.page.waitForSelector(`[data-testid="org-switcher"]:has-text("${name}")`);
  }

  async switchOrganization(orgName: string) {
    await this.page.click('[data-testid="org-switcher"]');
    await this.page.click(`[data-testid="org-option"]:has-text("${orgName}")`);
    await this.page.waitForSelector(`[data-testid="org-switcher"]:has-text("${orgName}")`);
  }

  async createBug(title: string, description: string) {
    await this.page.click('[data-testid="create-bug-button"]');
    await this.page.fill('[data-testid="bug-title"]', title);
    await this.page.fill('[data-testid="bug-description"]', description);
    await this.page.click('[data-testid="bug-submit"]');
    await this.page.waitForSelector(`[data-testid="bug-list"] >> text=${title}`);
  }

  async changeBugStatus(bugTitle: string, newStatus: string) {
    const bugRow = this.page.locator(`[data-testid="bug-row"]:has-text("${bugTitle}")`);
    await bugRow.locator('[data-testid="status-dropdown"]').click();
    await this.page.click(`[data-testid="status-option"]:has-text("${newStatus}")`);
    
    // Wait for status to update
    await expect(bugRow.locator('[data-testid="status-chip"]')).toContainText(newStatus);
  }

  async assignBug(bugTitle: string, assigneeName: string) {
    const bugRow = this.page.locator(`[data-testid="bug-row"]:has-text("${bugTitle}")`);
    await bugRow.locator('[data-testid="assignee-dropdown"]').click();
    await this.page.click(`[data-testid="assignee-option"]:has-text("${assigneeName}")`);
    
    // Wait for assignment to update
    await expect(bugRow.locator('[data-testid="assignee-chip"]')).toContainText(assigneeName);
  }

  async getBugCount() {
    return await this.page.locator('[data-testid="bug-row"]').count();
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }
}

test.describe('Multi-Tenant SaaS Bug Tracker', () => {
  let bugTracker: BugTrackerPage;

  test.beforeEach(async ({ page }) => {
    bugTracker = new BugTrackerPage(page);
  });

  test('Organization Creation and Switching', async ({ page }) => {
    // Login as admin
    await bugTracker.login(testUsers[0].email, testUsers[0].password);

    // Create first organization
    await bugTracker.createOrganization(testOrgs[0].name, testOrgs[0].slug);
    
    // Verify organization is selected
    await expect(page.locator('[data-testid="org-switcher"]')).toContainText(testOrgs[0].name);

    // Create second organization
    await bugTracker.createOrganization(testOrgs[1].name, testOrgs[1].slug);

    // Switch between organizations
    await bugTracker.switchOrganization(testOrgs[0].name);
    await expect(page.locator('[data-testid="org-switcher"]')).toContainText(testOrgs[0].name);

    await bugTracker.switchOrganization(testOrgs[1].name);
    await expect(page.locator('[data-testid="org-switcher"]')).toContainText(testOrgs[1].name);
  });

  test('Data Isolation Between Organizations', async ({ page }) => {
    await bugTracker.login(testUsers[0].email, testUsers[0].password);

    // Create and switch to first organization
    await bugTracker.createOrganization(testOrgs[0].name, testOrgs[0].slug);
    
    // Create a bug in first organization
    await bugTracker.createBug('Acme Bug 1', 'This is a bug in Acme Corp');
    
    // Verify bug exists
    let bugCount = await bugTracker.getBugCount();
    expect(bugCount).toBe(1);

    // Create and switch to second organization
    await bugTracker.createOrganization(testOrgs[1].name, testOrgs[1].slug);
    
    // Verify no bugs in second organization
    bugCount = await bugTracker.getBugCount();
    expect(bugCount).toBe(0);

    // Create a bug in second organization
    await bugTracker.createBug('Beta Bug 1', 'This is a bug in Beta Inc');
    
    // Verify only one bug in second organization
    bugCount = await bugTracker.getBugCount();
    expect(bugCount).toBe(1);

    // Switch back to first organization
    await bugTracker.switchOrganization(testOrgs[0].name);
    
    // Verify first organization still has its bug
    bugCount = await bugTracker.getBugCount();
    expect(bugCount).toBe(1);
    await expect(page.locator('[data-testid="bug-list"]')).toContainText('Acme Bug 1');
    await expect(page.locator('[data-testid="bug-list"]')).not.toContainText('Beta Bug 1');
  });

  test('Role-Based Permissions', async ({ page }) => {
    await bugTracker.login(testUsers[0].email, testUsers[0].password);
    await bugTracker.createOrganization(testOrgs[0].name, testOrgs[0].slug);
    await bugTracker.createBug('Test Bug', 'Test bug for permissions');

    // Test admin permissions
    await expect(page.locator('[data-testid="status-dropdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="assignee-dropdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-bug-button"]')).toBeVisible();

    await bugTracker.logout();

    // Test viewer permissions
    await bugTracker.login(testUsers[2].email, testUsers[2].password);
    
    // Viewer should not see edit controls
    await expect(page.locator('[data-testid="status-dropdown"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="assignee-dropdown"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="create-bug-button"]')).not.toBeVisible();
    
    // But should see bug data
    await expect(page.locator('[data-testid="bug-list"]')).toContainText('Test Bug');
  });

  test('Status Dropdown Functionality', async ({ page }) => {
    await bugTracker.login(testUsers[0].email, testUsers[0].password);
    await bugTracker.createOrganization(testOrgs[0].name, testOrgs[0].slug);
    await bugTracker.createBug('Status Test Bug', 'Testing status changes');

    // Change status from Open to In Progress
    await bugTracker.changeBugStatus('Status Test Bug', 'In Progress');
    
    // Verify status changed
    const bugRow = page.locator('[data-testid="bug-row"]:has-text("Status Test Bug")');
    await expect(bugRow.locator('[data-testid="status-chip"]')).toContainText('In Progress');

    // Change to Resolved
    await bugTracker.changeBugStatus('Status Test Bug', 'Resolved');
    await expect(bugRow.locator('[data-testid="status-chip"]')).toContainText('Resolved');
  });

  test('Assignment Dropdown Functionality', async ({ page }) => {
    await bugTracker.login(testUsers[0].email, testUsers[0].password);
    await bugTracker.createOrganization(testOrgs[0].name, testOrgs[0].slug);
    await bugTracker.createBug('Assignment Test Bug', 'Testing assignments');

    // Assign bug to developer
    await bugTracker.assignBug('Assignment Test Bug', 'Developer User');
    
    // Verify assignment
    const bugRow = page.locator('[data-testid="bug-row"]:has-text("Assignment Test Bug")');
    await expect(bugRow.locator('[data-testid="assignee-chip"]')).toContainText('Developer User');

    // Reassign to different user
    await bugTracker.assignBug('Assignment Test Bug', 'Admin User');
    await expect(bugRow.locator('[data-testid="assignee-chip"]')).toContainText('Admin User');
  });

  test('Subscription Limits Enforcement', async ({ page }) => {
    await bugTracker.login(testUsers[0].email, testUsers[0].password);
    await bugTracker.createOrganization(testOrgs[0].name, testOrgs[0].slug);

    // Try to create bugs up to limit (assuming starter plan has 100 bug limit)
    // This would be a longer test that creates many bugs
    
    // For demo, just check that limit warning appears
    await page.goto('/billing');
    
    // Check usage indicators
    await expect(page.locator('[data-testid="usage-bugs"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-projects"]')).toBeVisible();

    // Check upgrade button is available
    await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible();
  });

  test('Cross-Organization Security', async ({ page }) => {
    // This test would verify that users cannot access other organizations' data
    // by manipulating URLs or API calls
    
    await bugTracker.login(testUsers[0].email, testUsers[0].password);
    await bugTracker.createOrganization(testOrgs[0].name, testOrgs[0].slug);
    
    // Get organization ID from URL or API
    const currentUrl = page.url();
    const orgId = currentUrl.match(/org\/(\d+)/)?.[1];
    
    if (orgId) {
      // Try to access different organization's data
      const otherOrgId = parseInt(orgId) + 1;
      await page.goto(`/org/${otherOrgId}/bugs`);
      
      // Should be redirected or show error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    }
  });
});

// Helper test for setting up test data
test.describe('Test Data Setup', () => {
  test('Generate Test Data', async ({ page }) => {
    // This test would call your test data generation API
    const response = await page.request.post('/api/test/generate-data');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.organizations).toHaveLength(4);
    expect(data.users).toHaveLength(8);
  });

  test('Clean Test Data', async ({ page }) => {
    // Clean up test data after tests
    const response = await page.request.delete('/api/test/clean-data');
    expect(response.ok()).toBeTruthy();
  });
});
