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
  Alert,
  Avatar,
} from "@mui/material";
import { Edit, ArrowBack, Person } from "@mui/icons-material";
import { RootState } from "../store";
import { userAPI } from "../api/users";

const roleColors = {
  admin: "error",
  developer: "primary",
  tester: "warning",
  viewer: "default",
} as const;

function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is admin
  if (currentUser?.role !== "admin") {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Access denied. Only administrators can view user details.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/users")}
          >
            Back to Users
          </Button>
        </Box>
      </Container>
    );
  }

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userAPI.getUserById(parseInt(id!));
      setUser(response.data.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load user");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
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
          <Button variant="outlined" onClick={loadUser}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h6">User not found</Typography>
        <Button onClick={() => navigate("/users")} sx={{ mt: 2 }}>
          Back to Users
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/users")}
          sx={{ mr: 2 }}
        >
          Back to Users
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          User Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/users/${user.id}/edit`)}
        >
          Edit User
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Avatar
              sx={{ 
                width: 100, 
                height: 100, 
                mx: "auto", 
                mb: 2,
                bgcolor: roleColors[user.role],
                fontSize: "2rem"
              }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
              ) : (
                getInitials(user.firstName, user.lastName)
              )}
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              {user.firstName} {user.lastName}
            </Typography>
            
            <Typography variant="body1" color="textSecondary" gutterBottom>
              {user.email}
            </Typography>
            
            <Box display="flex" justifyContent="center" gap={1} mb={2}>
              <Chip
                label={user.role}
                color={roleColors[user.role] as any}
                size="small"
              />
              <Chip
                label={user.isActive ? "Active" : "Inactive"}
                color={user.isActive ? "success" : "default"}
                size="small"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  User ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  #{user.id}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Role
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Account Status
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user.isActive ? "Active" : "Inactive"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Account Created
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(user.createdAt)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Updated
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(user.updatedAt)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Full Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user.firstName} {user.lastName}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Role Permissions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box>
                {user.role === "admin" && (
                  <Typography variant="body2" color="textSecondary">
                    • Full system access<br/>
                    • User management<br/>
                    • Project and bug management<br/>
                    • System configuration
                  </Typography>
                )}
                {user.role === "developer" && (
                  <Typography variant="body2" color="textSecondary">
                    • Create and edit bugs<br/>
                    • Manage assigned projects<br/>
                    • View all projects and bugs<br/>
                    • Comment on bugs
                  </Typography>
                )}
                {user.role === "tester" && (
                  <Typography variant="body2" color="textSecondary">
                    • Create and edit bugs<br/>
                    • View all projects and bugs<br/>
                    • Test and verify bug fixes<br/>
                    • Comment on bugs
                  </Typography>
                )}
                {user.role === "viewer" && (
                  <Typography variant="body2" color="textSecondary">
                    • View projects and bugs<br/>
                    • Read-only access<br/>
                    • Comment on bugs
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default UserDetailsPage;
