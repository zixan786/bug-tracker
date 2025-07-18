import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  Dashboard,
  BugReport,
  Folder,
  Person,
  TrendingUp,
} from "@mui/icons-material";
import { RootState } from "../store";

function HomePage() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const quickActions = [
    {
      title: "View Dashboard",
      description: "Get an overview of your bugs and projects",
      icon: <Dashboard sx={{ fontSize: 40 }} />,
      action: () => navigate("/dashboard"),
      color: "#2196f3",
    },
    {
      title: "Browse Bugs",
      description: "View and manage all bugs in the system",
      icon: <BugReport sx={{ fontSize: 40 }} />,
      action: () => navigate("/bugs"),
      color: "#f44336",
    },
    {
      title: "My Projects",
      description: "Manage your projects and team collaboration",
      icon: <Folder sx={{ fontSize: 40 }} />,
      action: () => navigate("/projects"),
      color: "#4caf50",
    },
    {
      title: "Profile",
      description: "Update your profile and account settings",
      icon: <Person sx={{ fontSize: 40 }} />,
      action: () => navigate("/profile"),
      color: "#ff9800",
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to BugTracker
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Hello, {user?.firstName}! Ready to squash some bugs today?
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Your comprehensive bug tracking and project management solution
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                <Box sx={{ color: action.color, mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" component="div" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                  variant="contained"
                  onClick={action.action}
                  sx={{ backgroundColor: action.color }}
                >
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 4, textAlign: "center", backgroundColor: "#f5f5f5" }}>
        <TrendingUp sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Track, Manage, and Resolve
        </Typography>
        <Typography variant="body1" color="textSecondary" mb={3}>
          BugTracker helps you efficiently manage bugs, collaborate with your team,
          and deliver high-quality software. Start by exploring your dashboard or
          creating your first project.
        </Typography>
        <Box>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/dashboard")}
            sx={{ mr: 2 }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/bugs")}
          >
            Browse Bugs
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default HomePage;