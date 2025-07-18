import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  Chip,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { bugAPI } from '../api/bugs';
import { canTransitionBugStatus } from '../utils/permissions';

interface BugStatusChangerProps {
  bug: {
    id: number;
    status: string;
    title: string;
  };
  user: {
    id: number;
    role: string;
  } | null;
  onStatusChange?: (bugId: number, newStatus: string) => void;
  showChip?: boolean;
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "code_review", label: "Code Review" },
  { value: "qa_testing", label: "QA Testing" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
  { value: "rejected", label: "Rejected" },
];

const statusColors = {
  open: "error",
  in_progress: "warning",
  code_review: "info",
  qa_testing: "secondary",
  resolved: "success",
  closed: "default",
  reopened: "warning",
  rejected: "error",
} as const;

const BugStatusChanger: React.FC<BugStatusChangerProps> = ({
  bug,
  user,
  onStatusChange,
  showChip = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: "", 
    severity: "success" as "success" | "error" 
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;

    // Check if user can make this transition
    if (!canTransitionBugStatus(user.role, bug.status, newStatus)) {
      setSnackbar({
        open: true,
        message: `You cannot transition from ${bug.status} to ${newStatus}`,
        severity: "error"
      });
      handleMenuClose();
      return;
    }

    setLoading(true);
    try {
      await bugAPI.transitionBugStatus(
        bug.id, 
        newStatus, 
        `Status changed from ${bug.status} to ${newStatus}`
      );
      
      setSnackbar({
        open: true,
        message: `Bug status updated to ${newStatus}`,
        severity: "success"
      });

      // Call the callback if provided
      if (onStatusChange) {
        onStatusChange(bug.id, newStatus);
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to update bug status",
        severity: "error"
      });
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  const getAvailableStatusTransitions = () => {
    if (!user) return [];
    return statusOptions.filter(option => 
      option.value !== bug.status && 
      canTransitionBugStatus(user.role, bug.status, option.value)
    );
  };

  const availableTransitions = getAvailableStatusTransitions();

  return (
    <>
      <Box display="flex" alignItems="center" gap={0.5}>
        {showChip && (
          <Chip
            label={bug.status?.replace("_", " ")}
            color={statusColors[bug.status as keyof typeof statusColors] as any}
            size="small"
            sx={{
              fontSize: "0.7rem",
              height: 22,
            }}
          />
        )}
        {user && availableTransitions.length > 0 && (
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            disabled={loading}
            sx={{ p: 0.25 }}
            title="Change Status"
          >
            <PlayArrow fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        {availableTransitions.map((statusOption) => (
          <MenuItem
            key={statusOption.value}
            onClick={() => handleStatusChange(statusOption.value)}
            disabled={loading}
          >
            <PlayArrow sx={{ mr: 1, fontSize: 16 }} />
            <ListItemText primary={statusOption.label} />
          </MenuItem>
        ))}
        {availableTransitions.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary="No transitions available" />
          </MenuItem>
        )}
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BugStatusChanger;
