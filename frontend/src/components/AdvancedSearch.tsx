import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Chip,
  Typography,
  Autocomplete,
} from "@mui/material";
import {
  Search,
  Clear,
  FilterList,
} from "@mui/icons-material";

interface AdvancedSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}

interface SearchFilters {
  keyword?: string;
  status?: string[];
  priority?: string[];
  severity?: string[];
  type?: string[];
  assignee?: string[];
  reporter?: string[];
  project?: string[];
  createdAfter?: Date | null;
  createdBefore?: Date | null;
  updatedAfter?: Date | null;
  updatedBefore?: Date | null;
  tags?: string[];
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const severityOptions = [
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
  { value: "blocker", label: "Blocker" },
];

const typeOptions = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "task", label: "Task" },
];

// Mock data - in real app, fetch from API
const mockUsers = [
  { id: 1, name: "John Developer", email: "john@example.com" },
  { id: 2, name: "Jane Tester", email: "jane@example.com" },
  { id: 3, name: "Admin User", email: "admin@example.com" },
];

const mockProjects = [
  { id: 1, name: "E-commerce Platform" },
  { id: 2, name: "Mobile App" },
  { id: 3, name: "API Gateway" },
];

const mockTags = [
  "frontend", "backend", "database", "ui/ux", "performance", 
  "security", "mobile", "api", "urgent", "enhancement"
];

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ open, onClose, onSearch }) => {
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleFilterChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    }).length;
  };

  return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Search />
            <Typography variant="h6" fontWeight={600}>
              Advanced Search
            </Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={`${getActiveFiltersCount()} filters`}
                size="small"
                color="primary"
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Keyword Search */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search Keywords"
                placeholder="Search in title, description, comments..."
                value={filters.keyword || ""}
                onChange={(e) => handleFilterChange("keyword", e.target.value)}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={statusOptions}
                getOptionLabel={(option) => option.label}
                value={statusOptions.filter(opt => filters.status?.includes(opt.value)) || []}
                onChange={(_, value) => handleFilterChange("status", value.map(v => v.value))}
                renderInput={(params) => (
                  <TextField {...params} label="Status" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Priority */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={priorityOptions}
                getOptionLabel={(option) => option.label}
                value={priorityOptions.filter(opt => filters.priority?.includes(opt.value)) || []}
                onChange={(_, value) => handleFilterChange("priority", value.map(v => v.value))}
                renderInput={(params) => (
                  <TextField {...params} label="Priority" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Severity */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={severityOptions}
                getOptionLabel={(option) => option.label}
                value={severityOptions.filter(opt => filters.severity?.includes(opt.value)) || []}
                onChange={(_, value) => handleFilterChange("severity", value.map(v => v.value))}
                renderInput={(params) => (
                  <TextField {...params} label="Severity" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Type */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={typeOptions}
                getOptionLabel={(option) => option.label}
                value={typeOptions.filter(opt => filters.type?.includes(opt.value)) || []}
                onChange={(_, value) => handleFilterChange("type", value.map(v => v.value))}
                renderInput={(params) => (
                  <TextField {...params} label="Type" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Assignee */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={mockUsers}
                getOptionLabel={(option) => option.name}
                value={mockUsers.filter(user => filters.assignee?.includes(user.id.toString())) || []}
                onChange={(_, value) => handleFilterChange("assignee", value.map(v => v.id.toString()))}
                renderInput={(params) => (
                  <TextField {...params} label="Assignee" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.name}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Project */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={mockProjects}
                getOptionLabel={(option) => option.name}
                value={mockProjects.filter(proj => filters.project?.includes(proj.id.toString())) || []}
                onChange={(_, value) => handleFilterChange("project", value.map(v => v.id.toString()))}
                renderInput={(params) => (
                  <TextField {...params} label="Project" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.name}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Date Filters */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Date Filters
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Created After"
                type="date"
                value={filters.createdAfter ? filters.createdAfter.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange("createdAfter", e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Created Before"
                type="date"
                value={filters.createdBefore ? filters.createdBefore.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange("createdBefore", e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={mockTags}
                value={filters.tags || []}
                onChange={(_, value) => handleFilterChange("tags", value)}
                renderInput={(params) => (
                  <TextField {...params} label="Tags" placeholder="Add tags..." />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleClear}
            startIcon={<Clear />}
            disabled={getActiveFiltersCount() === 0}
          >
            Clear All
          </Button>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSearch}
            variant="contained"
            startIcon={<Search />}
          >
            Search
          </Button>
        </DialogActions>
      </Dialog>
  );
};

export default AdvancedSearch;
