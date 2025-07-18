import React, { useState } from "react";
import {
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import {
  Add,
  BugReport,
  Folder,
  Person,
  Search,
  Analytics,
  Notifications,
  Settings,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";

const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const actions = [
    {
      icon: <BugReport />,
      name: "Create Bug",
      action: () => navigate("/bugs/new"),
      color: "#f44336",
    },
    {
      icon: <Folder />,
      name: "Create Project",
      action: () => navigate("/projects/new"),
      color: "#2196f3",
      requiresRole: ["admin", "developer"],
    },
    {
      icon: <Person />,
      name: "Create User",
      action: () => navigate("/users/new"),
      color: "#4caf50",
      requiresRole: ["admin"],
    },
    {
      icon: <Analytics />,
      name: "View Analytics",
      action: () => navigate("/analytics"),
      color: "#ff9800",
    },
    {
      icon: <Search />,
      name: "Advanced Search",
      action: () => {
        // In a real app, open search modal
        console.log("Open advanced search");
      },
      color: "#9c27b0",
    },
  ];

  const filteredActions = actions.filter((action) => {
    if (!action.requiresRole) return true;
    return action.requiresRole.includes(user?.role || "");
  });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action: typeof actions[0]) => {
    action.action();
    handleClose();
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="quick actions"
        onClick={handleClick}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1300,
        }}
      >
        <Add />
      </Fab>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        {filteredActions.map((action) => (
          <MenuItem
            key={action.name}
            onClick={() => handleActionClick(action)}
          >
            <ListItemIcon sx={{ color: action.color }}>
              {action.icon}
            </ListItemIcon>
            <ListItemText primary={action.name} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default QuickActions;
