import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { Edit, ArrowBack, Add } from "@mui/icons-material";
import { RootState } from "../store";
import { projectAPI } from "../api/projects";
import { userAPI } from "../api/users"; // You should have this for fetching users


function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [project, setProject] = useState<any>(null);
   const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  // Load project and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [projectRes, usersRes] = await Promise.all([
          projectAPI.getProjectById(Number(id)),
          userAPI.getUsers({ limit: 100 }),
        ]);
        setProject(projectRes.data.data.project);
        setUsers(usersRes.data.data.users);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await projectAPI.getProjectById(parseInt(id!));
      setProject(response.data.data.project);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };


    // Add member handler
  const handleAddMember = async () => {
    if (!selectedUser) {
      setError("Please select a user to add.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await projectAPI.addMember(Number(id), Number(selectedUser));
      setSuccess("Member added successfully!");
      // Optionally reload project members
      const projectRes = await projectAPI.getProjectById(Number(id));
      setProject(projectRes.data.data.project);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to add member");
    } finally {
      setIsLoading(false);
    }
  };

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
          {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={loadProject}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h6">Project not found</Typography>
        <Button onClick={() => navigate("/projects")} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canEdit = project.owner?.id === user?.id || user?.role === "admin";

  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/projects")}
          sx={{ mr: 2 }}
        >
          Back to Projects
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {project.name}
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/projects/${project.id}/edit`)}
          >
            Edit Project
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}



      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Add Member</Typography>
        <FormControl sx={{ minWidth: 200, mr: 2 }}>
          <InputLabel>User</InputLabel>
          <Select
            value={selectedUser}
            label="User"
            onChange={e => setSelectedUser(e.target.value)}
          >
            <MenuItem value="">Select user</MenuItem>
            {users
              .filter(u => !project.members.some((m: any) => m.id === u.id))
              .map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleAddMember}
          disabled={isLoading || !selectedUser}
        >
          Add Member
        </Button>
      </Box>

       <Box>
        <Typography variant="h6">Project Members</Typography>
        <ul>
          {project.members.map((member: any) => (
            <li key={member.id}>
              {member.firstName} {member.lastName} ({member.email})
            </li>
          ))}
        </ul>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h5" sx={{ flexGrow: 1 }}>
                Project Overview
              </Typography>
              <Chip
                label={project.status}
                color={project.status === "active" ? "success" : "default"}
              />
            </Box>

            <Typography variant="body1" paragraph>
              {project.description || "No description provided"}
            </Typography>

            {project.repository && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Repository
                </Typography>
                <Typography variant="body1">
                  <a href={project.repository} target="_blank" rel="noopener noreferrer">
                    {project.repository}
                  </a>
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Project Bugs */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Project Bugs</Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate(`/bugs/new?projectId=${project.id}`)}
              >
                Add Bug
              </Button>
            </Box>

            {project.bugs && project.bugs.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Assignee</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.bugs.map((bug: any) => (
                      <TableRow
                        key={bug.id}
                        hover
                        onClick={() => navigate(`/bugs/${bug.id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{bug.id}</TableCell>
                        <TableCell>{bug.title}</TableCell>
                        <TableCell>
                          <Chip label={bug.status} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={bug.priority} size="small" />
                        </TableCell>
                        <TableCell>
                          {bug.assignee
                            ? `${bug.assignee.firstName} ${bug.assignee.lastName}`
                            : "Unassigned"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No bugs found for this project.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Owner
              </Typography>
              <Typography variant="body1">
                {project.owner?.firstName} {project.owner?.lastName}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Created
              </Typography>
              <Typography variant="body1">
                {formatDate(project.createdAt)}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {formatDate(project.updatedAt)}
              </Typography>
            </Box>

            {project.startDate && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Start Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(project.startDate)}
                </Typography>
              </Box>
            )}

            {project.endDate && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  End Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(project.endDate)}
                </Typography>
              </Box>
            )}

            {project.members && project.members.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Team Members ({project.members.length})
                </Typography>
                {project.members.map((member: any) => (
                  <Typography key={member.id} variant="body2">
                    {member.firstName} {member.lastName}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ProjectDetailsPage;
