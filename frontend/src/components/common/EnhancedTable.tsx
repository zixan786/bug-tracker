import React, { useState } from 'react';
import { tableStyles, getRoleColor, getStatusColor } from '../../styles/enhanced-theme';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface EnhancedTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  selectedRows?: string[];
  onRowSelect?: (rowId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

const EnhancedTable: React.FC<EnhancedTableProps> = ({
  columns,
  data,
  onRowClick,
  selectedRows = [],
  onRowSelect,
  loading = false,
  emptyMessage = 'No data available'
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const renderBadge = (text: string, type: 'role' | 'status') => {
    const color = type === 'role' ? getRoleColor(text) : getStatusColor(text);
    return (
      <span
        style={{
          ...tableStyles.badge,
          backgroundColor: color,
          color: 'white',
        }}
      >
        {text}
      </span>
    );
  };

  const getRowStyle = (rowId: string) => {
    const isSelected = selectedRows.includes(rowId);
    const isHovered = hoveredRow === rowId;
    
    return {
      ...tableStyles.row,
      ...(isSelected ? tableStyles.rowSelected : {}),
      ...(isHovered ? tableStyles.rowHover : {}),
    };
  };

  if (loading) {
    return (
      <div style={tableStyles.container}>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <div style={{ marginBottom: '1rem' }}>🔄</div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={tableStyles.container}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={tableStyles.header}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...tableStyles.headerCell,
                  width: column.width,
                  cursor: column.sortable ? 'pointer' : 'default',
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {column.label}
                  {column.sortable && (
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  ...tableStyles.cell,
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#666',
                  fontStyle: 'italic',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={row.id}
                style={getRowStyle(row.id)}
                onMouseEnter={() => setHoveredRow(row.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => {
                  if (onRowSelect) {
                    onRowSelect(row.id);
                  }
                  if (onRowClick) {
                    onRowClick(row);
                  }
                }}
              >
                {columns.map((column) => (
                  <td key={column.key} style={tableStyles.cell}>
                    {column.render ? (
                      column.render(row[column.key], row)
                    ) : column.key === 'role' ? (
                      renderBadge(row[column.key], 'role')
                    ) : column.key === 'status' ? (
                      renderBadge(row[column.key], 'status')
                    ) : (
                      row[column.key]
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EnhancedTable;
