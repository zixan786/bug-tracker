import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
} from "@mui/material";
import { Save, Cancel } from "@mui/icons-material";
import { RootState } from "../store";
import { bugAPI } from "../api/bugs";
import { projectAPI } from "../api/projects";

function CreateBugPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    environment: "",
    browserVersion: "",
    operatingSystem: "",
    projectId: "",
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load projects for the dropdown
    const loadProjects = async () => {
      try {
        const response = await projectAPI.getMyProjects({ limit: 100 });
        setProjects(response.data.data.projects || []);
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    };
    loadProjects();

    // Pre-select project if provided in URL
    const projectId = searchParams.get('projectId');
    if (projectId) {
      setFormData(prev => ({
        ...prev,
        projectId: projectId
      }));
    }
  }, [searchParams]);

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

      // Create bug via API
      const response = await bugAPI.createBug({
        ...formData,
        projectId: parseInt(formData.projectId),
      });

      console.log("Bug created successfully:", response.data);

      // Navigate back to bugs page
      navigate("/bugs");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create bug");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Bug
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Report a new bug or issue
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
              <TextField
                fullWidth
                label="Environment"
                name="environment"
                value={formData.environment}
                onChange={handleChange}
                placeholder="e.g., Production, Staging, Development"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Steps to Reproduce"
                name="stepsToReproduce"
                value={formData.stepsToReproduce}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="1. Step one&#10;2. Step two&#10;3. Step three"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Behavior"
                name="expectedBehavior"
                value={formData.expectedBehavior}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="What should happen"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Actual Behavior"
                name="actualBehavior"
                value={formData.actualBehavior}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="What actually happens"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Browser Version"
                name="browserVersion"
                value={formData.browserVersion}
                onChange={handleChange}
                placeholder="e.g., Chrome 120.0.0.0"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Operating System"
                name="operatingSystem"
                value={formData.operatingSystem}
                onChange={handleChange}
                placeholder="e.g., Windows 11, macOS 14.0"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/bugs")}
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
              {isSubmitting ? "Creating..." : "Create Bug"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default CreateBugPage;
