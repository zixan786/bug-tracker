import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  Snackbar,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  BugReport,
} from "@mui/icons-material";
import { RootState } from "../store";
import { bugAPI } from "../api/bugs";
import { projectAPI } from "../api/projects";
import { userAPI } from "../api/users";
import { canTransitionBugStatus } from "../utils/permissions";

const priorityColors = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
} as const;

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

// Available status transitions for display
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

function BugsPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [bugs, setBugs] = useState<any[]>([]);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [localFilters, setLocalFilters] = useState({
    status: "",
    priority: "",
    projectId: "",
  });

  // Status change functionality
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  // Load data on component mount and when filters change
  useEffect(() => {
    loadBugs();
    loadProjects();
    loadUsers();
  }, [page, rowsPerPage, localFilters]);

  const loadBugs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await bugAPI.getBugs({
        page: page + 1,
        limit: rowsPerPage,
        filters: {
          ...localFilters,
          search: searchTerm,
        },
      });
      setBugs(response.data.data.bugs || []);
      setTotalCount(response.data.data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load bugs");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getMyProjects({ limit: 100 });
      setMyProjects(response.data.data.projects || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers({ limit: 100 });
      setUsers(response.data.data.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    loadBugs();
  };

  const handleFilterChange = (filterName: string, value: string) => {
    const newFilters = { ...localFilters, [filterName]: value };
    setLocalFilters(newFilters);
    setPage(0);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this bug?")) {
      try {
        await bugAPI.deleteBug(id);
        // Reload bugs after deletion
        loadBugs();
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to delete bug");
      }
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading bugs: {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={loadBugs}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600} color="text.primary">
            Bug Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage software issues
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/bugs/new")}
          size="medium"
        >
          Create Bug
        </Button>
      </Box>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search bugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={localFilters.status}
                label="Status"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={localFilters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange("priority", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select
                value={localFilters.projectId}
                label="Project"
                onChange={(e) => handleFilterChange("projectId", e.target.value)}
              >
                <MenuItem value="">All Projects</MenuItem>
                {myProjects.map((project) => (
                  <MenuItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Bugs Table */}
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table
            size="small"
            sx={{
              tableLayout: "fixed",
              width: "100%"
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: "80px" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: "25%" }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: "15%" }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: "12%" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: "12%" }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: "15%" }}>Assignee</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: "10%" }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5, width: "11%", textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {bugs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 4 }}>
                    <BugReport sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No bugs found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Create your first bug to get started!
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate("/bugs/new")}
                    >
                      Create Bug
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              bugs.map((bug) => (
                <TableRow key={bug.id} hover>
                  <TableCell sx={{ py: 1, overflow: "hidden" }}>
                    <Typography variant="body2" fontWeight={500}>
                      #{bug.id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, overflow: "hidden" }}>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      title={bug.title}
                    >
                      {bug.title}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, overflow: "hidden" }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      title={bug.project?.name}
                    >
                      {bug.project?.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, overflow: "hidden" }}>
                    {user ? (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={bug.status}
                          onChange={async (e) => {
                            if (e.target.value !== bug.status) {
                              const newStatus = e.target.value;

                              // Check if user can make this transition
                              if (!canTransitionBugStatus(user.role, bug.status, newStatus)) {
                                setSnackbar({
                                  open: true,
                                  message: `You cannot transition from ${bug.status} to ${newStatus}`,
                                  severity: "error"
                                });
                                return;
                              }

                              setStatusChangeLoading(true);
                              try {
                                await bugAPI.transitionBugStatus(bug.id, newStatus, `Status changed from ${bug.status} to ${newStatus}`);

                                // Update the bug in the local state
                                setBugs(prevBugs =>
                                  prevBugs.map(b =>
                                    b.id === bug.id
                                      ? { ...b, status: newStatus }
                                      : b
                                  )
                                );

                                setSnackbar({
                                  open: true,
                                  message: `Bug status updated to ${newStatus.replace('_', ' ')}`,
                                  severity: "success"
                                });
                              } catch (err: any) {
                                setSnackbar({
                                  open: true,
                                  message: err.response?.data?.message || "Failed to update bug status",
                                  severity: "error"
                                });
                              } finally {
                                setStatusChangeLoading(false);
                              }
                            }
                          }}
                          sx={{
                            fontSize: "0.75rem",
                            height: 32,
                            backgroundColor: statusColors[bug.status as keyof typeof statusColors] === "error" ? "#ffebee" :
                                           statusColors[bug.status as keyof typeof statusColors] === "warning" ? "#fff3e0" :
                                           statusColors[bug.status as keyof typeof statusColors] === "success" ? "#e8f5e8" :
                                           statusColors[bug.status as keyof typeof statusColors] === "info" ? "#e1f5fe" :
                                           statusColors[bug.status as keyof typeof statusColors] === "secondary" ? "#f3e5f5" :
                                           "#f5f5f5",
                            "& .MuiSelect-select": {
                              py: 0.5,
                              fontSize: "0.75rem"
                            }
                          }}
                          disabled={statusChangeLoading}
                        >
                          {statusOptions.map((status) => (
                            <MenuItem
                              key={status.value}
                              value={status.value}
                              disabled={!canTransitionBugStatus(user.role, bug.status, status.value) && status.value !== bug.status}
                            >
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={bug.status?.replace("_", " ")}
                        color={statusColors[bug.status] as any}
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          height: 22,
                          maxWidth: "100%"
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1, overflow: "hidden" }}>
                    <Chip
                      label={bug.priority}
                      color={priorityColors[bug.priority] as any}
                      size="small"
                      sx={{
                        fontSize: "0.7rem",
                        height: 22,
                        maxWidth: "100%"
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1, overflow: "hidden" }}>
                    {user ? (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={bug.assigneeId || ''}
                          onChange={async (e) => {
                            const newAssigneeId = e.target.value ? parseInt(e.target.value as string) : null;

                            try {
                              await bugAPI.updateBug(bug.id, {
                                assigneeId: newAssigneeId
                              });

                              // Update the bug in the local state
                              setBugs(prevBugs =>
                                prevBugs.map(b =>
                                  b.id === bug.id
                                    ? {
                                        ...b,
                                        assigneeId: newAssigneeId,
                                        assignee: newAssigneeId ? users.find(u => u.id === newAssigneeId) : null
                                      }
                                    : b
                                )
                              );

                              setSnackbar({
                                open: true,
                                message: `Bug assignment updated successfully`,
                                severity: "success"
                              });
                            } catch (err: any) {
                              setSnackbar({
                                open: true,
                                message: err.response?.data?.message || "Failed to update bug assignment",
                                severity: "error"
                              });
                            }
                          }}
                          sx={{
                            fontSize: "0.75rem",
                            height: 32,
                            backgroundColor: bug.assigneeId ? "#e3f2fd" : "#f5f5f5",
                            "& .MuiSelect-select": {
                              py: 0.5,
                              fontSize: "0.75rem"
                            }
                          }}
                          disabled={statusChangeLoading}
                        >
                          <MenuItem value="">
                            Unassigned
                          </MenuItem>
                          {users.map((userOption) => (
                            <MenuItem key={userOption.id} value={userOption.id}>
                              {userOption.firstName} {userOption.lastName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={bug.assignee ? `${bug.assignee.firstName} ${bug.assignee.lastName}` : "Unassigned"}
                      >
                        {bug.assignee ? `${bug.assignee.firstName} ${bug.assignee.lastName}` : "Unassigned"}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1, overflow: "hidden" }}>
                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                      {formatDate(bug.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, textAlign: "center", overflow: "hidden" }}>
                    <Box display="flex" gap={0.25} justifyContent="center" alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/bugs/${bug.id}`)}
                        sx={{ p: 0.25 }}
                        title="View Details"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/bugs/${bug.id}/edit`)}
                        sx={{ p: 0.25 }}
                        title="Edit Bug"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      {(bug.reporter?.id === user?.id || user?.role === "admin") && (
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(bug.id)}
                          color="error"
                          sx={{ p: 0.25 }}
                          title="Delete Bug"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: 1, borderColor: "divider" }}
        />
        </TableContainer>
      </Paper>

      {/* Status Change Snackbar */}
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
    </Container>
  );
}

export default BugsPage;
