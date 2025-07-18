import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Search,
  Folder,
  Group,
} from "@mui/icons-material";
import { RootState } from "../store";
import { projectAPI } from "../api/projects";

const statusColors = {
  active: "success",
  inactive: "default",
  completed: "info",
  archived: "warning",
} as const;

function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await projectAPI.getMyProjects({ limit: 100 });
      setMyProjects(response.data.data.projects || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleDelete = async (project: any) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await projectAPI.deleteProject(project.id);
        // Reload projects after deletion
        loadProjects();
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to delete project");
      }
    }
    handleMenuClose();
  };

  const handleEdit = (project: any) => {
    navigate(`/projects/${project.id}/edit`);
    handleMenuClose();
  };

  const handleView = (project: any) => {
    navigate(`/projects/${project.id}`);
    handleMenuClose();
  };

  const filteredProjects = myProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading projects: {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={loadProjects}>
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
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your development projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/projects/new")}
          size="medium"
        >
          Create Project
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Folder sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {searchTerm ? "No projects found" : "No projects yet"}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm
              ? "Try adjusting your search terms"
              : "Create your first project to get started!"
            }
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/projects/new")}
            >
              Create Project
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
              <Card
                elevation={1}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    elevation: 3,
                    transform: "translateY(-2px)"
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {project.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, project)}
                      sx={{ p: 0.5 }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>

                  <Chip
                    label={project.status}
                    color={statusColors[project.status] as any}
                    size="small"
                    sx={{ mb: 1.5, fontSize: "0.75rem", height: 24 }}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {project.description || "No description"}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1}>
                    <Group fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {project.members?.length || 0} members
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 1.5, pt: 0 }}>
                  <Button
                    size="small"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    sx={{ fontSize: "0.75rem" }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                    sx={{ fontSize: "0.75rem" }}
                  >
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleView(selectedProject)}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEdit(selectedProject)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {(selectedProject?.owner?.id === user?.id || user?.role === "admin") && (
          <MenuItem onClick={() => handleDelete(selectedProject)} sx={{ color: "error.main" }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Container>
  );
}

export default ProjectsPage;
