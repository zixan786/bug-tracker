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
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  People,
} from "@mui/icons-material";
import { RootState } from "../store";
import { userAPI } from "../api/users";

const roleColors = {
  admin: "error",
  developer: "primary",
  tester: "warning",
  viewer: "default",
} as const;

function UsersPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Access denied. Only administrators can manage users.
        </Alert>
      </Container>
    );
  }

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userAPI.getUsers({
        page: page + 1,
        limit: rowsPerPage,
      });
      setUsers(response.data.data.users || []);
      setTotalCount(response.data.data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
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
    // TODO: Implement search functionality
    console.log("Searching for:", searchTerm);
  };

  const handleDelete = async (userId: number) => {
    if (userId === user?.id) {
      alert("You cannot delete your own account");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userAPI.deleteUser(userId);
        loadUsers(); // Reload users after deletion
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to delete user");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredUsers = users.filter(u =>
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading users: {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={loadUsers}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600} color="text.primary">
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user accounts and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/users/new")}
          size="medium"
        >
          Create User
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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

      {/* Users Table */}
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <People sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No users found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {searchTerm ? "Try adjusting your search terms" : "Create your first user to get started!"}
                    </Typography>
                    {!searchTerm && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate("/users/new")}
                      >
                        Create User
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ py: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      #{u.id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {u.firstName} {u.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={u.role}
                      color={roleColors[u.role] as any}
                      size="small"
                      sx={{ fontSize: "0.75rem", height: 24 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={u.isActive ? "Active" : "Inactive"}
                      color={u.isActive ? "success" : "default"}
                      size="small"
                      sx={{ fontSize: "0.75rem", height: 24 }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(u.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Box display="flex" gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/users/${u.id}`)}
                        sx={{ p: 0.5 }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/users/${u.id}/edit`)}
                        sx={{ p: 0.5 }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      {u.id !== user?.id && (
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(u.id)}
                          color="error"
                          sx={{ p: 0.5 }}
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
    </Container>
  );
}

export default UsersPage;
