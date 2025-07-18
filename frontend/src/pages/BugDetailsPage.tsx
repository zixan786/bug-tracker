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
} from "@mui/material";
import { Edit, ArrowBack } from "@mui/icons-material";
import { RootState } from "../store";
import { bugAPI } from "../api/bugs";

function BugDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [bug, setBug] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadBug();
    }
  }, [id]);

  const loadBug = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await bugAPI.getBugById(parseInt(id!));
      setBug(response.data.data.bug);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load bug");
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
          <Button variant="outlined" onClick={loadBug}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!bug) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h6">Bug not found</Typography>
        <Button onClick={() => navigate("/bugs")} sx={{ mt: 2 }}>
          Back to Bugs
        </Button>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canEdit = bug.reporter?.id === user?.id || user?.role === "admin";

  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/bugs")}
          sx={{ mr: 2 }}
        >
          Back to Bugs
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Bug #{bug.id}
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/bugs/${bug.id}/edit`)}
          >
            Edit Bug
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {bug.title}
            </Typography>

            <Box display="flex" gap={1} mb={3}>
              <Chip label={bug.status?.replace("_", " ")} color="primary" />
              <Chip label={bug.priority} color="secondary" />
              <Chip label={bug.severity} />
              <Chip label={bug.type} variant="outlined" />
            </Box>

            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {bug.description}
            </Typography>

            {bug.stepsToReproduce && (
              <>
                <Typography variant="h6" gutterBottom>
                  Steps to Reproduce
                </Typography>
                <Typography variant="body1" paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {bug.stepsToReproduce}
                </Typography>
              </>
            )}

            {bug.expectedBehavior && (
              <>
                <Typography variant="h6" gutterBottom>
                  Expected Behavior
                </Typography>
                <Typography variant="body1" paragraph>
                  {bug.expectedBehavior}
                </Typography>
              </>
            )}

            {bug.actualBehavior && (
              <>
                <Typography variant="h6" gutterBottom>
                  Actual Behavior
                </Typography>
                <Typography variant="body1" paragraph>
                  {bug.actualBehavior}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bug Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Project
              </Typography>
              <Typography variant="body1">
                {bug.project?.name}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Reporter
              </Typography>
              <Typography variant="body1">
                {bug.reporter?.firstName} {bug.reporter?.lastName}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Assignee
              </Typography>
              <Typography variant="body1">
                {bug.assignee
                  ? `${bug.assignee.firstName} ${bug.assignee.lastName}`
                  : "Unassigned"}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Created
              </Typography>
              <Typography variant="body1">
                {formatDate(bug.createdAt)}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Last Updated
              </Typography>
              <Typography variant="body1">
                {formatDate(bug.updatedAt)}
              </Typography>
            </Box>

            {bug.dueDate && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Due Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(bug.dueDate)}
                </Typography>
              </Box>
            )}

            {bug.environment && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Environment
                </Typography>
                <Typography variant="body1">
                  {bug.environment}
                </Typography>
              </Box>
            )}

            {bug.browserVersion && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Browser
                </Typography>
                <Typography variant="body1">
                  {bug.browserVersion}
                </Typography>
              </Box>
            )}

            {bug.operatingSystem && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Operating System
                </Typography>
                <Typography variant="body1">
                  {bug.operatingSystem}
                </Typography>
              </Box>
            )}

            {bug.estimatedHours && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Estimated Hours
                </Typography>
                <Typography variant="body1">
                  {bug.estimatedHours}
                </Typography>
              </Box>
            )}

            {bug.actualHours && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Actual Hours
                </Typography>
                <Typography variant="body1">
                  {bug.actualHours}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default BugDetailsPage;
