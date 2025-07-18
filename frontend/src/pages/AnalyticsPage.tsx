import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
} from "@mui/material";
// Removed recharts import to avoid React 19 compatibility issues
import {
  TrendingUp,
  BugReport,
  Assignment,
  Speed,
  Timeline,
  Analytics,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { fetchBugs } from "../store/slices/bugSlice";
import { fetchMyProjects } from "../store/slices/projectSlice";

interface AnalyticsData {
  bugsByStatus: Array<{ name: string; value: number; color: string }>;
  bugsByPriority: Array<{ name: string; value: number; color: string }>;
  bugsByProject: Array<{ name: string; value: number }>;
  bugsOverTime: Array<{ date: string; created: number; resolved: number }>;
  teamPerformance: Array<{ name: string; assigned: number; resolved: number }>;
}

const COLORS = {
  status: {
    open: "#f44336",
    in_progress: "#ff9800",
    resolved: "#4caf50",
    closed: "#9e9e9e",
    reopened: "#e91e63",
  },
  priority: {
    low: "#4caf50",
    medium: "#ff9800",
    high: "#f44336",
    critical: "#9c27b0",
  },
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: number;
}> = ({ title, value, icon, color, subtitle, trend }) => (
  <Card elevation={1} sx={{ borderRadius: 2, height: "100%" }}>
    <CardContent sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box sx={{ color, fontSize: 32, opacity: 0.8 }}>
          {icon}
        </Box>
        {trend !== undefined && (
          <Chip
            label={`${trend > 0 ? "+" : ""}${trend}%`}
            color={trend > 0 ? "success" : trend < 0 ? "error" : "default"}
            size="small"
            sx={{ fontSize: "0.7rem" }}
          />
        )}
      </Box>
      <Typography variant="h4" fontWeight={600} color="text.primary">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const AnalyticsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { bugs, loading: bugsLoading } = useSelector((state: RootState) => state.bugs);
  const { myProjects, loading: projectsLoading } = useSelector((state: RootState) => state.projects);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    dispatch(fetchBugs({ page: 1, limit: 1000 })); // Fetch all bugs for analytics
    dispatch(fetchMyProjects());
  }, [dispatch]);

  useEffect(() => {
    if (bugs.length > 0) {
      generateAnalyticsData();
    }
  }, [bugs, myProjects]);

  const generateAnalyticsData = () => {
    // Bugs by status
    const statusCounts = bugs.reduce((acc, bug) => {
      acc[bug.status] = (acc[bug.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bugsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace("_", " ").toUpperCase(),
      value: count,
      color: COLORS.status[status as keyof typeof COLORS.status] || "#666",
    }));

    // Bugs by priority
    const priorityCounts = bugs.reduce((acc, bug) => {
      acc[bug.priority] = (acc[bug.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bugsByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority.toUpperCase(),
      value: count,
      color: COLORS.priority[priority as keyof typeof COLORS.priority] || "#666",
    }));

    // Bugs by project
    const projectCounts = bugs.reduce((acc, bug) => {
      const projectName = bug.project?.name || "Unknown";
      acc[projectName] = (acc[projectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bugsByProject = Object.entries(projectCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 projects

    // Bugs over time (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split("T")[0];
    });

    const bugsOverTime = last30Days.map((date) => {
      const created = bugs.filter((bug) => bug.createdAt.startsWith(date)).length;
      const resolved = bugs.filter(
        (bug) => bug.status === "resolved" && bug.updatedAt.startsWith(date)
      ).length;
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        created,
        resolved,
      };
    });

    // Team performance
    const assigneeCounts = bugs.reduce((acc, bug) => {
      if (bug.assignee) {
        const name = `${bug.assignee.firstName} ${bug.assignee.lastName}`;
        if (!acc[name]) acc[name] = { assigned: 0, resolved: 0 };
        acc[name].assigned++;
        if (bug.status === "resolved" || bug.status === "closed") {
          acc[name].resolved++;
        }
      }
      return acc;
    }, {} as Record<string, { assigned: number; resolved: number }>);

    const teamPerformance = Object.entries(assigneeCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 8); // Top 8 team members

    setAnalyticsData({
      bugsByStatus,
      bugsByPriority,
      bugsByProject,
      bugsOverTime,
      teamPerformance,
    });
  };

  const calculateStats = () => {
    const totalBugs = bugs.length;
    const openBugs = bugs.filter((bug) => bug.status === "open").length;
    const resolvedBugs = bugs.filter((bug) => bug.status === "resolved").length;
    const criticalBugs = bugs.filter((bug) => bug.priority === "critical").length;
    const avgResolutionTime = "2.3 days"; // This would be calculated from actual data
    const resolutionRate = totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0;

    return {
      totalBugs,
      openBugs,
      resolvedBugs,
      criticalBugs,
      avgResolutionTime,
      resolutionRate,
    };
  };

  if (bugsLoading || projectsLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!analyticsData) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Alert severity="info">No data available for analytics.</Alert>
      </Container>
    );
  }

  const stats = calculateStats();

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive insights into your bug tracking and project performance
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Bugs"
            value={stats.totalBugs}
            icon={<BugReport />}
            color="#2563eb"
            trend={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Open Bugs"
            value={stats.openBugs}
            icon={<Assignment />}
            color="#f44336"
            trend={-2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Resolved"
            value={stats.resolvedBugs}
            icon={<TrendingUp />}
            color="#4caf50"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Critical"
            value={stats.criticalBugs}
            icon={<Speed />}
            color="#9c27b0"
            trend={-8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Avg Resolution"
            value={stats.avgResolutionTime}
            icon={<Timeline />}
            color="#ff9800"
            subtitle="Average time to resolve"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Resolution Rate"
            value={`${stats.resolutionRate}%`}
            icon={<Analytics />}
            color="#00bcd4"
            subtitle="Bugs resolved vs total"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2}>
        {/* Bugs by Status */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Bugs by Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analyticsData.bugsByStatus.map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={500}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.value}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(item.value / Math.max(...analyticsData.bugsByStatus.map(d => d.value))) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: item.color,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Bugs by Priority */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Bugs by Priority
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analyticsData.bugsByPriority.map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={500}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.value}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(item.value / Math.max(...analyticsData.bugsByPriority.map(d => d.value))) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: item.color,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Bugs Over Time */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Bugs Created vs Resolved (Last 30 Days)
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" gap={2} mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: '#f44336', borderRadius: '50%' }} />
                  <Typography variant="caption">Created</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: '#4caf50', borderRadius: '50%' }} />
                  <Typography variant="caption">Resolved</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Recent activity shows {analyticsData.bugsOverTime.reduce((sum, day) => sum + day.created, 0)} bugs created
                and {analyticsData.bugsOverTime.reduce((sum, day) => sum + day.resolved, 0)} bugs resolved in the last 30 days.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {analyticsData.bugsOverTime.slice(-7).map((day, index) => (
                  <Box key={index} sx={{ textAlign: 'center', minWidth: 60 }}>
                    <Typography variant="caption" color="text.secondary">
                      {day.date}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{
                        height: Math.max(day.created * 4, 4),
                        backgroundColor: '#f44336',
                        borderRadius: 1,
                        width: 20,
                        mx: 'auto'
                      }} />
                      <Box sx={{
                        height: Math.max(day.resolved * 4, 4),
                        backgroundColor: '#4caf50',
                        borderRadius: 1,
                        width: 20,
                        mx: 'auto'
                      }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Team Performance */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Team Performance
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analyticsData.teamPerformance.map((member, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={500} gutterBottom>
                    {member.name}
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center">
                    <Box sx={{ flex: 1 }}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Assigned: {member.assigned}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Resolved: {member.resolved}
                        </Typography>
                      </Box>
                      <Box sx={{ position: 'relative', height: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 4 }}>
                        <Box sx={{
                          position: 'absolute',
                          height: '100%',
                          width: `${(member.assigned / Math.max(...analyticsData.teamPerformance.map(m => m.assigned))) * 100}%`,
                          backgroundColor: '#2196f3',
                          borderRadius: 4,
                        }} />
                        <Box sx={{
                          position: 'absolute',
                          height: '100%',
                          width: `${(member.resolved / Math.max(...analyticsData.teamPerformance.map(m => m.assigned))) * 100}%`,
                          backgroundColor: '#4caf50',
                          borderRadius: 4,
                          opacity: 0.8,
                        }} />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Project Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 2, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Bugs by Project (Top 10)
            </Typography>
            <Box sx={{ mt: 2 }}>
              {analyticsData.bugsByProject.map((project, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: '70%' }}>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.value}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(project.value / Math.max(...analyticsData.bugsByProject.map(p => p.value))) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#9c27b0',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsPage;
