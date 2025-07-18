import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Business,
  Add,
  Check,
  KeyboardArrowDown,
  Settings,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';

interface Organization {
  id: number;
  name: string;
  slug: string;
  role: string;
  subscriptionStatus: string;
  isActive: boolean;
  trialEndsAt?: string;
  plan?: {
    name: string;
    slug: string;
  };
}

const OrganizationSwitcher: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state for creating organization
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    slug: ''
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.data.organizations);
        
        // Set current organization (first active one or first one)
        const activeOrg = data.data.organizations.find((org: Organization) => org.isActive) || 
                         data.data.organizations[0];
        if (activeOrg) {
          setCurrentOrg(activeOrg);
          // Store in localStorage for API calls
          localStorage.setItem('currentOrganizationId', activeOrg.id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOrgSwitch = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem('currentOrganizationId', org.id.toString());
    handleMenuClose();
    // Trigger app refresh or navigation
    window.location.reload();
  };

  const handleCreateOrg = async () => {
    if (!newOrgForm.name || !newOrgForm.slug) return;

    setLoading(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newOrgForm)
      });

      if (response.ok) {
        const data = await response.json();
        await loadOrganizations();
        setCreateDialogOpen(false);
        setNewOrgForm({ name: '', slug: '' });
        
        // Switch to new organization
        const newOrg = data.data.organization;
        handleOrgSwitch({
          ...newOrg,
          role: 'owner',
          isActive: true
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Create organization error:', error);
      alert('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewOrgForm({
      name,
      slug: generateSlug(name)
    });
  };

  const getStatusChip = (org: Organization) => {
    if (!org.isActive) {
      return <Chip label="Inactive" color="error" size="small" />;
    }
    
    if (org.subscriptionStatus === 'trial') {
      const daysLeft = org.trialEndsAt ? 
        Math.ceil((new Date(org.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return <Chip label={`Trial (${daysLeft}d)`} color="warning" size="small" />;
    }
    
    return <Chip label={org.plan?.name || 'Active'} color="success" size="small" />;
  };

  if (!currentOrg) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleMenuOpen}
        startIcon={<Business />}
        endIcon={<KeyboardArrowDown />}
        sx={{
          color: 'inherit',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="body2" fontWeight={600}>
            {currentOrg.name}
          </Typography>
          <Typography variant="caption" color="inherit" opacity={0.7}>
            {currentOrg.role}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 280 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="overline" color="text.secondary">
            Organizations
          </Typography>
        </Box>
        
        {organizations.map((org) => (
          <MenuItem
            key={org.id}
            onClick={() => handleOrgSwitch(org)}
            selected={org.id === currentOrg.id}
          >
            <ListItemIcon>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {org.name.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight={500}>
                    {org.name}
                  </Typography>
                  {org.id === currentOrg.id && <Check fontSize="small" color="primary" />}
                </Box>
              }
              secondary={
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {org.role}
                  </Typography>
                  {getStatusChip(org)}
                </Box>
              }
            />
          </MenuItem>
        ))}

        <Divider />
        
        <MenuItem onClick={() => setCreateDialogOpen(true)}>
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText primary="Create Organization" />
        </MenuItem>

        <MenuItem onClick={() => window.location.href = '/settings/organization'}>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Organization Settings" />
        </MenuItem>
      </Menu>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Organization</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Organization Name"
              value={newOrgForm.name}
              onChange={(e) => handleNameChange(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="URL Slug"
              value={newOrgForm.slug}
              onChange={(e) => setNewOrgForm({ ...newOrgForm, slug: e.target.value })}
              margin="normal"
              required
              helperText={`Your organization will be available at: ${newOrgForm.slug}.bugtracker.com`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateOrg} 
            variant="contained"
            disabled={loading || !newOrgForm.name || !newOrgForm.slug}
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrganizationSwitcher;
