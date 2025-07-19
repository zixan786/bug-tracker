import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Error,
  Warning,
  Info,
  PlayArrow,
  Stop,
  Refresh,
} from '@mui/icons-material';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  steps: string[];
  expectedResult: string;
  actualResult?: string;
}

const TestingDashboard: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);

  useEffect(() => {
    initializeTestCases();
  }, []);

  const initializeTestCases = () => {
    const cases: TestCase[] = [
      // Organization Management Tests
      {
        id: 'org-create',
        name: 'Create Organization',
        description: 'Test creating a new organization',
        category: 'Organization',
        status: 'pending',
        steps: [
          'Click organization switcher',
          'Click "Create Organization"',
          'Enter organization name and slug',
          'Click "Create Organization"',
          'Verify organization appears in switcher'
        ],
        expectedResult: 'New organization created and selected'
      },
      {
        id: 'org-switch',
        name: 'Switch Organizations',
        description: 'Test switching between organizations',
        category: 'Organization',
        status: 'pending',
        steps: [
          'Open organization switcher',
          'Select different organization',
          'Verify URL/context changes',
          'Check data isolation'
        ],
        expectedResult: 'Successfully switched with proper data isolation'
      },
      
      // Role-Based Access Tests
      {
        id: 'role-admin',
        name: 'Admin Role Permissions',
        description: 'Test admin role can access all features',
        category: 'Permissions',
        status: 'pending',
        steps: [
          'Login as admin user',
          'Check status dropdown shows all options',
          'Check assignment dropdown works',
          'Verify can create/edit/delete bugs',
          'Check organization settings access'
        ],
        expectedResult: 'Admin has full access to all features'
      },
      {
        id: 'role-viewer',
        name: 'Viewer Role Restrictions',
        description: 'Test viewer role has read-only access',
        category: 'Permissions',
        status: 'pending',
        steps: [
          'Login as viewer user',
          'Check status dropdown is disabled/hidden',
          'Check assignment dropdown is disabled',
          'Verify cannot create/edit bugs',
          'Check organization settings restricted'
        ],
        expectedResult: 'Viewer has read-only access only'
      },

      // Data Isolation Tests
      {
        id: 'data-isolation',
        name: 'Cross-Tenant Data Isolation',
        description: 'Verify data isolation between organizations',
        category: 'Security',
        status: 'pending',
        steps: [
          'Create bug in Organization A',
          'Switch to Organization B',
          'Verify Organization A bug not visible',
          'Create bug in Organization B',
          'Switch back to Organization A',
          'Verify only Organization A bugs visible'
        ],
        expectedResult: 'Complete data isolation between organizations'
      },

      // Subscription Tests
      {
        id: 'subscription-limits',
        name: 'Subscription Limit Enforcement',
        description: 'Test subscription limits are enforced',
        category: 'Billing',
        status: 'pending',
        steps: [
          'Check current plan limits',
          'Try to exceed user limit',
          'Try to exceed project limit',
          'Try to exceed bug limit',
          'Verify upgrade prompts shown'
        ],
        expectedResult: 'Limits enforced with upgrade prompts'
      },

      // UI/UX Tests
      {
        id: 'status-dropdown',
        name: 'Status Dropdown Functionality',
        description: 'Test enhanced status dropdown works correctly',
        category: 'UI/UX',
        status: 'pending',
        steps: [
          'Open bug list',
          'Click status dropdown on a bug',
          'Select new status',
          'Verify status updates immediately',
          'Check audit trail created'
        ],
        expectedResult: 'Status changes work smoothly with proper feedback'
      },
      {
        id: 'assignment-dropdown',
        name: 'Assignment Dropdown Functionality',
        description: 'Test assignment dropdown works correctly',
        category: 'UI/UX',
        status: 'pending',
        steps: [
          'Open bug list',
          'Click assignment dropdown',
          'Select team member',
          'Verify assignment updates',
          'Check notification sent'
        ],
        expectedResult: 'Assignment changes work with proper notifications'
      }
    ];

    setTestCases(cases);
  };

  const runTest = async (testCase: TestCase) => {
    setRunningTests(prev => new Set([...prev, testCase.id]));
    setTestCases(prev => prev.map(tc => 
      tc.id === testCase.id ? { ...tc, status: 'running' } : tc
    ));

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock test result (in real implementation, this would run actual tests)
    const success = Math.random() > 0.3; // 70% success rate for demo
    const status = success ? 'passed' : 'failed';
    const actualResult = success ? testCase.expectedResult : 'Test failed - see details';

    setTestCases(prev => prev.map(tc => 
      tc.id === testCase.id ? { 
        ...tc, 
        status, 
        actualResult 
      } : tc
    ));

    setTestResults(prev => ({
      ...prev,
      [testCase.id]: {
        status,
        timestamp: new Date().toISOString(),
        details: success ? 'All steps completed successfully' : 'Step 3 failed: Expected behavior not observed'
      }
    }));

    setRunningTests(prev => {
      const newSet = new Set(prev);
      newSet.delete(testCase.id);
      return newSet;
    });
  };

  const runAllTests = async () => {
    for (const testCase of testCases) {
      if (testCase.status === 'pending' || testCase.status === 'failed') {
        await runTest(testCase);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const resetTests = () => {
    setTestCases(prev => prev.map(tc => ({ 
      ...tc, 
      status: 'pending', 
      actualResult: undefined 
    })));
    setTestResults({});
    setRunningTests(new Set());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle color="success" />;
      case 'failed': return <Error color="error" />;
      case 'running': return <LinearProgress sx={{ width: 20 }} />;
      default: return <Info color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'warning';
      default: return 'default';
    }
  };

  const categories = ['all', ...new Set(testCases.map(tc => tc.category))];
  const filteredTests = selectedCategory === 'all' 
    ? testCases 
    : testCases.filter(tc => tc.category === selectedCategory);

  const testStats = {
    total: testCases.length,
    passed: testCases.filter(tc => tc.status === 'passed').length,
    failed: testCases.filter(tc => tc.status === 'failed').length,
    running: testCases.filter(tc => tc.status === 'running').length,
    pending: testCases.filter(tc => tc.status === 'pending').length
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Multi-Tenant SaaS Testing Dashboard
      </Typography>

      {/* Test Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{testStats.total}</Typography>
              <Typography variant="body2">Total Tests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{testStats.passed}</Typography>
              <Typography variant="body2">Passed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">{testStats.failed}</Typography>
              <Typography variant="body2">Failed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{testStats.running}</Typography>
              <Typography variant="body2">Running</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="text.secondary">{testStats.pending}</Typography>
              <Typography variant="body2">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          startIcon={<PlayArrow />}
          onClick={runAllTests}
          disabled={runningTests.size > 0}
        >
          Run All Tests
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />}
          onClick={resetTests}
        >
          Reset Tests
        </Button>
        
        {/* Category Filter */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categories.map(category => (
            <Chip
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Test Cases */}
      <Box>
        {filteredTests.map(testCase => (
          <Accordion key={testCase.id}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                {getStatusIcon(testCase.status)}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{testCase.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testCase.description}
                  </Typography>
                </Box>
                <Chip 
                  label={testCase.status} 
                  color={getStatusColor(testCase.status) as any}
                  size="small"
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    runTest(testCase);
                  }}
                  disabled={runningTests.has(testCase.id)}
                >
                  {runningTests.has(testCase.id) ? 'Running...' : 'Run Test'}
                </Button>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Test Steps:</Typography>
                  <List dense>
                    {testCase.steps.map((step, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Typography variant="body2">{index + 1}.</Typography>
                        </ListItemIcon>
                        <ListItemText primary={step} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Expected Result:</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>{testCase.expectedResult}</Typography>
                  
                  {testCase.actualResult && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>Actual Result:</Typography>
                      <Alert severity={testCase.status === 'passed' ? 'success' : 'error'}>
                        {testCase.actualResult}
                      </Alert>
                    </>
                  )}
                  
                  {testResults[testCase.id] && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last run: {new Date(testResults[testCase.id].timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default TestingDashboard;
