import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  MenuItem,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';

export const withCrudList = (
  WrappedComponent, 
  service, 
  config
) => {
  return function CrudListPage(props) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState({
      key: config.defaultSortKey || 'name',
      direction: 'asc'
    });

    // Provide default configuration if not fully specified
    const fullConfig = {
      entityName: config.entityName || 'Item',
      pageTitle: config.pageTitle || 'Items',
      defaultSortKey: config.defaultSortKey || 'id',
      defaultItem: config.defaultItem || {},
      searchFields: config.searchFields || [],
      dialogFields: config.dialogFields || Object.keys(config.defaultItem || {}).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        type: 'text'
      })),
      columns: config.columns || Object.keys(config.defaultItem || {}).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1)
      })),
      addButtonIcon: config.addButtonIcon || <AddIcon />,
    };

    // Fetch items
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching ${fullConfig.entityName}...`);
        const response = await service.getAll();
        
        console.log(`${fullConfig.entityName} response:`, response);
        
        // Normalize the data to ensure it's an array
        const itemsData = Array.isArray(response) ? response : 
                          (response.data && Array.isArray(response.data)) ? response.data :
                          (response.results && Array.isArray(response.results)) ? response.results :
                          [];
        
        console.log(`Processed ${fullConfig.entityName} data:`, itemsData);
        
        setItems(itemsData);
        setIsLoading(false);
      } catch (error) {
        console.error(`Failed to fetch ${fullConfig.entityName}`, error);
        setError(`Failed to fetch ${fullConfig.entityName}: ${error.message}`);
        setItems([]);
        setIsLoading(false);
      }
    };

    // Handle add/edit item
    const handleSaveItem = async () => {
      try {
        if (currentItem.id) {
          // Update existing item
          await service.update(currentItem.id, currentItem);
        } else {
          // Create new item
          await service.create(currentItem);
        }
        fetchItems();
        setOpenDialog(false);
        setCurrentItem(null);
      } catch (error) {
        console.error(`Failed to save ${fullConfig.entityName}`, error);
      }
    };

    // Delete item
    const handleDeleteItem = async (id) => {
      try {
        await service.delete(id);
        fetchItems();
      } catch (error) {
        console.error(`Failed to delete ${fullConfig.entityName}`, error);
      }
    };

    // Open dialog for adding/editing
    const openItemDialog = (item = null) => {
      setCurrentItem(item || fullConfig.defaultItem);
      setOpenDialog(true);
    };

    // Effect to fetch items on component mount
    useEffect(() => {
      fetchItems();
    }, []);

    // Sorting function
    const sortedItems = useMemo(() => {
      // Ensure items is an array before sorting
      const itemsArray = Array.isArray(items) ? items : [];
      
      let sortableItems = [...itemsArray];
      
      if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
      
      return sortableItems.filter(item =>
        fullConfig.searchFields.some(field => 
          item[field] && item[field].toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }, [items, sortConfig, searchTerm]);

    // Handle column sorting
    const handleSort = (key) => {
      setSortConfig(prevSort => {
        // If sorting by the same column, toggle direction
        if (prevSort.key === key) {
          return {
            key,
            direction: prevSort.direction === 'asc' ? 'desc' : 'asc'
          };
        }
        
        // If sorting by a new column, default to ascending
        return {
          key,
          direction: 'asc'
        };
      });
    };

    // Sortable column header component
    const SortableColumnHeader = ({ label, sortKey }) => (
      <TableCell 
        onClick={() => handleSort(sortKey)}
        sx={{ 
          cursor: 'pointer', 
          userSelect: 'none',
          whiteSpace: 'nowrap',
          display: 'table-cell', 
          alignItems: 'center' 
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
          {label}
          {sortConfig.key === sortKey && (
            sortConfig.direction === 'asc' 
              ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 1 }} /> 
              : <ArrowDownwardIcon fontSize="small" sx={{ ml: 1 }} />
          )}
        </Box>
      </TableCell>
    );

    // Render loading state
    if (isLoading) {
      return (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100%"
        >
          <CircularProgress />
        </Box>
      );
    }

    // Render error state
    if (error) {
      return (
        <Alert severity="error">
          {error}
        </Alert>
      );
    }

    return (
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">{fullConfig.pageTitle}</Typography>
          <Button
            variant="contained"
            startIcon={fullConfig.addButtonIcon}
            onClick={() => openItemDialog()}
          >
            {`Add ${fullConfig.entityName}`}
          </Button>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={`Search ${fullConfig.entityName}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {fullConfig.columns.map(col => (
                  <SortableColumnHeader 
                    key={col.key} 
                    label={col.label} 
                    sortKey={col.key}
                  />
                ))}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={fullConfig.columns.length + 1} align="center">
                    No {fullConfig.entityName} found
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item) => (
                  <TableRow key={item.id}>
                    {fullConfig.columns.map(col => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(item, fullConfig) : item[col.key]}
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => openItemDialog(item)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="secondary"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog for Add/Edit */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            {currentItem?.id ? `Edit ${fullConfig.entityName}` : `Add ${fullConfig.entityName}`}
          </DialogTitle>
          <DialogContent>
            {fullConfig.dialogFields.map((field) => (
              <TextField
                key={field.key}
                fullWidth
                margin="normal"
                label={field.label}
                type={field.type || 'text'}
                InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                value={currentItem?.[field.key] || ''}
                onChange={(e) => setCurrentItem(prev => ({
                  ...prev,
                  [field.key]: e.target.value
                }))}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleSaveItem} color="primary" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };
};

export default withCrudList;
