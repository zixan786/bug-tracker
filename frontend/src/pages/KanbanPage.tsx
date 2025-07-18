import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add,
  MoreVert,
  BugReport,
  Assignment,
  CheckCircle,
  Cancel,
  Refresh,
  ViewColumn,
} from "@mui/icons-material";
// import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { fetchBugs } from "../store/slices/bugSlice";
import { Bug } from "../store/slices/bugSlice";

const statusColumns = [
  {
    id: "open",
    title: "Open",
    color: "#f44336",
    icon: <BugReport />,
  },
  {
    id: "in_progress",
    title: "In Progress",
    color: "#ff9800",
    icon: <Assignment />,
  },
  {
    id: "resolved",
    title: "Resolved",
    color: "#4caf50",
    icon: <CheckCircle />,
  },
  {
    id: "closed",
    title: "Closed",
    color: "#9e9e9e",
    icon: <Cancel />,
  },
];

const priorityColors = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
  critical: "#9c27b0",
};

const BugCard: React.FC<{ bug: Bug; index: number }> = ({ bug, index }) => {
  return (
        <Card
          elevation={1}
          sx={{
            mb: 1,
            borderRadius: 2,
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              elevation: 2,
              transform: "translateY(-2px)",
            },
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                #{bug.id}
              </Typography>
              <Box display="flex" gap={0.5}>
                <Chip
                  label={bug.priority}
                  size="small"
                  sx={{
                    bgcolor: priorityColors[bug.priority],
                    color: "white",
                    fontSize: "0.65rem",
                    height: 18,
                  }}
                />
                <IconButton size="small" sx={{ p: 0.25 }}>
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Title */}
            <Typography
              variant="body2"
              fontWeight={500}
              sx={{
                mb: 1,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {bug.title}
            </Typography>

            {/* Project */}
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              {bug.project?.name}
            </Typography>

            {/* Footer */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={0.5}>
                {bug.assignee ? (
                  <Tooltip title={`${bug.assignee.firstName} ${bug.assignee.lastName}`}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                      {bug.assignee.firstName[0]}{bug.assignee.lastName[0]}
                    </Avatar>
                  </Tooltip>
                ) : (
                  <Avatar sx={{ width: 24, height: 24, bgcolor: "grey.300" }}>
                    ?
                  </Avatar>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {new Date(bug.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
  );
};

const KanbanColumn: React.FC<{
  column: typeof statusColumns[0];
  bugs: Bug[];
  onAddBug: () => void;
}> = ({ column, bugs, onAddBug }) => {
  return (
    <Paper elevation={1} sx={{ borderRadius: 2, height: "fit-content", minHeight: 400 }}>
      {/* Column Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "grey.50",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ color: column.color }}>{column.icon}</Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {column.title}
            </Typography>
            <Chip
              label={bugs.length}
              size="small"
              sx={{
                bgcolor: column.color,
                color: "white",
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          </Box>
          <IconButton size="small" onClick={onAddBug}>
            <Add fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Column Content */}
          <Box
            sx={{
              p: 1,
              minHeight: 300,
              transition: "background-color 0.2s ease-in-out",
            }}
          >
            {bugs.map((bug, index) => (
              <BugCard key={bug.id} bug={bug} index={index} />
            ))}
            
            {bugs.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  color: "text.secondary",
                }}
              >
                <Typography variant="body2">No bugs in this column</Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={onAddBug}
                  sx={{ mt: 1 }}
                >
                  Add Bug
                </Button>
              </Box>
            )}
          </Box>
    </Paper>
  );
};

const KanbanPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { bugs, loading } = useSelector((state: RootState) => state.bugs);
  const [bugsByStatus, setBugsByStatus] = useState<Record<string, Bug[]>>({});

  useEffect(() => {
    dispatch(fetchBugs({ page: 1, limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    // Group bugs by status
    const grouped = bugs.reduce((acc, bug) => {
      const status = bug.status || "open";
      if (!acc[status]) acc[status] = [];
      acc[status].push(bug);
      return acc;
    }, {} as Record<string, Bug[]>);

    setBugsByStatus(grouped);
  }, [bugs]);

  // Removed drag and drop functionality for React 19 compatibility

  const handleAddBug = (status: string) => {
    // In a real app, navigate to create bug page with pre-selected status
    console.log(`Add bug to ${status}`);
  };

  const handleRefresh = () => {
    dispatch(fetchBugs({ page: 1, limit: 1000 }));
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
            Kanban Board
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visual overview of bugs organized by status
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            size="medium"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleAddBug("open")}
            size="medium"
          >
            Add Bug
          </Button>
        </Box>
      </Box>

      {/* Kanban Board */}
        <Grid container spacing={2}>
          {statusColumns.map((column) => (
            <Grid item xs={12} sm={6} md={3} key={column.id}>
              <KanbanColumn
                column={column}
                bugs={bugsByStatus[column.id] || []}
                onAddBug={() => handleAddBug(column.id)}
              />
            </Grid>
          ))}
        </Grid>

      {/* Stats */}
      <Box mt={3}>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Board Statistics
          </Typography>
          <Grid container spacing={2}>
            {statusColumns.map((column) => (
              <Grid item xs={6} sm={3} key={column.id}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={600} color={column.color}>
                    {bugsByStatus[column.id]?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {column.title}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default KanbanPage;
