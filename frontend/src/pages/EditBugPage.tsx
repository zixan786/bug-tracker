import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Save, Cancel, ArrowBack } from "@mui/icons-material";
import { RootState } from "../store";
import { bugAPI } from "../api/bugs";
import { projectAPI } from "../api/projects";
import { userAPI } from "../api/users";

function EditBugPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: "",
    priority: "medium",
    severity: "minor",
    type: "bug",
    status: "open",
    environment: "",
    browserVersion: "",
    operatingSystem: "",
    projectId: "",
    assigneeId: "",
  });
  
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadBug();
      loadProjects();
      loadUsers();
    }
  }, [id]);

  const loadBug = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await bugAPI.getBugById(parseInt(id!));
      const bug = response.data.data.bug;
      
      // Check if user can edit this bug
      if (bug.reporter?.id !== user?.id && user?.role !== "admin") {
        setError("You don't have permission to edit this bug");
        return;
      }
      
      setFormData({
        title: bug.title || "",
        description: bug.description || "",
        stepsToReproduce: bug.stepsToReproduce || "",
        expectedBehavior: bug.expectedBehavior || "",
        actualBehavior: bug.actualBehavior || "",
        priority: bug.priority || "medium",
        severity: bug.severity || "minor",
        type: bug.type || "bug",
        status: bug.status || "open",
        environment: bug.environment || "",
        browserVersion: bug.browserVersion || "",
        operatingSystem: bug.operatingSystem || "",
        projectId: bug.project?.id?.toString() || "",
        assigneeId: bug.assignee?.id?.toString() || "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load bug");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getMyProjects({ limit: 100 });
      setProjects(response.data.data.projects || []);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required");
      }
      if (!formData.projectId) {
        throw new Error("Project is required");
      }

      // Prepare data for API
      const bugData = {
        ...formData,
        projectId: parseInt(formData.projectId),
        assigneeId: formData.assigneeId ? parseInt(formData.assigneeId) : null,
      };

      // Update bug via API
      const response = await bugAPI.updateBug(parseInt(id!), bugData);
      
      console.log("Bug updated successfully:", response.data);
      
      // Navigate back to bug details
      navigate(`/bugs/${id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update bug";
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !formData.title) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/bugs")}
          >
            Back to Bugs
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/bugs/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to Bug
        </Button>
        <Typography variant="h4" gutterBottom>
          Edit Bug
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Update bug information and assignment
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bug Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Brief description of the bug"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                rows={4}
                placeholder="Detailed description of the bug"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Project</InputLabel>
                <Select
                  value={formData.projectId}
                  label="Project"
                  onChange={(e) => handleSelectChange("projectId", e.target.value)}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={formData.assigneeId}
                  label="Assignee"
                  onChange={(e) => handleSelectChange("assigneeId", e.target.value)}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName} ({user.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleSelectChange("status", e.target.value)}
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="reopened">Reopened</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => handleSelectChange("priority", e.target.value)}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity"
                  onChange={(e) => handleSelectChange("severity", e.target.value)}
                >
                  <MenuItem value="minor">Minor</MenuItem>
                  <MenuItem value="major">Major</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="blocker">Blocker</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => handleSelectChange("type", e.target.value)}
                >
                  <MenuItem value="bug">Bug</MenuItem>
                  <MenuItem value="feature">Feature Request</MenuItem>
                  <MenuItem value="improvement">Improvement</MenuItem>
                  <MenuItem value="task">Task</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/bugs/${id}`)}
              disabled={isSubmitting}
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={<Save />}
            >
              {isSubmitting ? "Updating..." : "Update Bug"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default EditBugPage;
