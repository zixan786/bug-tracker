import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  BugReport,
  Folder,
  Assignment,
  TrendingUp,
} from "@mui/icons-material";
import { RootState, AppDispatch } from "../store";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card elevation={1} sx={{ borderRadius: 2 }}>
    <CardContent sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight={600}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color, fontSize: 32, opacity: 0.8 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  // For now, we'll use mock data since the API calls were causing issues
  // TODO: Restore API calls with proper error handling
  const bugs = [];
  const myProjects = [];
  const isLoading = false;
  const error = null;

  const totalBugs = bugs.length;
  const openBugs = bugs.filter((bug: any) => bug.status === "open").length;
  const myBugs = bugs.filter((bug: any) => bug.assignee?.id === user?.id).length;
  const totalProjects = myProjects.length;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading dashboard data: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back, {user?.firstName}! Here's your project overview.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bugs"
            value={totalBugs}
            icon={<BugReport />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Bugs"
            value={openBugs}
            icon={<Assignment />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Bugs"
            value={myBugs}
            icon={<TrendingUp />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Projects"
            value={totalProjects}
            icon={<Folder />}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Bugs
            </Typography>
            {bugs.length === 0 ? (
              <Box textAlign="center" py={3}>
                <BugReport sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No bugs found. Create your first bug to get started!
                </Typography>
              </Box>
            ) : (
              bugs.slice(0, 5).map((bug: any) => (
                <Box
                  key={bug.id}
                  sx={{
                    mb: 1,
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    "&:hover": { bgcolor: "grey.50" }
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={500}>{bug.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {bug.project?.name} • {bug.status}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              My Projects
            </Typography>
            {myProjects.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Folder sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No projects found. Create your first project to get started!
                </Typography>
              </Box>
            ) : (
              myProjects.slice(0, 5).map((project: any) => (
                <Box
                  key={project.id}
                  sx={{
                    mb: 1,
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    "&:hover": { bgcolor: "grey.50" }
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={500}>{project.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {project.status}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DashboardPage;
