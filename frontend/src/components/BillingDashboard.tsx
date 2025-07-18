import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CreditCard,
  TrendingUp,
  People,
  BugReport,
  Folder,
  Warning,
  CheckCircle,
} from '@mui/icons-material';

interface Plan {
  id: number;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  features: Record<string, boolean>;
  limits: {
    maxUsers: number;
    maxProjects: number;
    maxBugs: number;
    storageMb: number;
  };
}

interface Subscription {
  id: number;
  status: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  plan: Plan;
}

interface Usage {
  users: { current: number; limit: number };
  projects: { current: number; limit: number };
  bugs: { current: number; limit: number };
  storage: { current: number; limit: number };
}

const BillingDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const orgId = localStorage.getItem('currentOrganizationId');
      const token = localStorage.getItem('token');

      const [subResponse, usageResponse, plansResponse] = await Promise.all([
        fetch(`/api/organizations/${orgId}/subscription`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/organizations/${orgId}/usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/plans', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.data.subscription);
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData.data.usage);
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.data.plans);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'primary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleUpgrade = async (planId: number) => {
    try {
      const orgId = localStorage.getItem('currentOrganizationId');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/organizations/${orgId}/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.data.checkoutUrl;
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to upgrade subscription');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to upgrade subscription');
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  const isTrialing = subscription?.status === 'trialing';
  const trialDaysLeft = subscription?.trialEnd ? 
    Math.ceil((new Date(subscription.trialEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Billing & Subscription
      </Typography>

      {/* Trial Warning */}
      {isTrialing && trialDaysLeft <= 7 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Your trial expires in {trialDaysLeft} days. Upgrade now to continue using all features.
          </Typography>
          <Button 
            variant="contained" 
            size="small" 
            sx={{ mt: 1 }}
            onClick={() => setUpgradeDialogOpen(true)}
          >
            Upgrade Now
          </Button>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Plan */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CreditCard color="primary" />
                <Typography variant="h6">Current Plan</Typography>
              </Box>
              
              {subscription ? (
                <>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {subscription.plan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ${subscription.plan.priceMonthly}/month
                  </Typography>
                  
                  <Chip 
                    label={subscription.status.replace('_', ' ').toUpperCase()}
                    color={subscription.status === 'active' ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2">
                    {isTrialing ? 
                      `Trial ends: ${formatDate(subscription.trialEnd!)}` :
                      `Next billing: ${formatDate(subscription.currentPeriodEnd)}`
                    }
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">No active subscription</Typography>
              )}
              
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={() => setUpgradeDialogOpen(true)}
              >
                {subscription?.plan.slug === 'enterprise' ? 'Manage Plan' : 'Upgrade Plan'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <TrendingUp color="primary" />
                <Typography variant="h6">Usage Overview</Typography>
              </Box>
              
              {usage && (
                <Box>
                  {/* Users */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <People fontSize="small" />
                        <Typography variant="body2">Users</Typography>
                      </Box>
                      <Typography variant="body2">
                        {usage.users.current} / {usage.users.limit === -1 ? '∞' : usage.users.limit}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getUsagePercentage(usage.users.current, usage.users.limit)}
                      color={getUsageColor(getUsagePercentage(usage.users.current, usage.users.limit))}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  {/* Projects */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Folder fontSize="small" />
                        <Typography variant="body2">Projects</Typography>
                      </Box>
                      <Typography variant="body2">
                        {usage.projects.current} / {usage.projects.limit === -1 ? '∞' : usage.projects.limit}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getUsagePercentage(usage.projects.current, usage.projects.limit)}
                      color={getUsageColor(getUsagePercentage(usage.projects.current, usage.projects.limit))}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  {/* Bugs */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <BugReport fontSize="small" />
                        <Typography variant="body2">Bugs</Typography>
                      </Box>
                      <Typography variant="body2">
                        {usage.bugs.current} / {usage.bugs.limit === -1 ? '∞' : usage.bugs.limit}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getUsagePercentage(usage.bugs.current, usage.bugs.limit)}
                      color={getUsageColor(getUsagePercentage(usage.bugs.current, usage.bugs.limit))}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Choose Your Plan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {plans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.id}>
                <Card 
                  variant={subscription?.plan.id === plan.id ? "outlined" : "elevation"}
                  sx={{ 
                    height: '100%',
                    border: subscription?.plan.id === plan.id ? 2 : 1,
                    borderColor: subscription?.plan.id === plan.id ? 'primary.main' : 'divider'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {plan.name}
                      {subscription?.plan.id === plan.id && (
                        <Chip label="Current" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${plan.priceMonthly}
                      <Typography component="span" variant="body2" color="text.secondary">
                        /month
                      </Typography>
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        • {plan.limits.maxUsers === -1 ? 'Unlimited' : plan.limits.maxUsers} users
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        • {plan.limits.maxProjects === -1 ? 'Unlimited' : plan.limits.maxProjects} projects
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        • {plan.limits.maxBugs === -1 ? 'Unlimited' : plan.limits.maxBugs} bugs
                      </Typography>
                    </Box>

                    <Button
                      variant={subscription?.plan.id === plan.id ? "outlined" : "contained"}
                      fullWidth
                      disabled={subscription?.plan.id === plan.id}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {subscription?.plan.id === plan.id ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingDashboard;
