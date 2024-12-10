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
import { productService } from '../services/api';  

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
    
    // New state for dynamic options with initial state
    const [dynamicOptions, setDynamicOptions] = useState({
      products: []
    });

    // Sorting state
    const [sortConfig, setSortConfig] = useState({
      key: config.defaultSortKey || 'name',
      direction: 'asc'
    });

    // Provide default configuration if not fully specified
    const fullConfig = useMemo(() => {
      console.log('Current dynamic options:', dynamicOptions);
      const baseConfig = {
        ...config,
        entityName: config.entityName || 'Item',
        pageTitle: config.pageTitle || 'Items',
        defaultSortKey: config.defaultSortKey || 'id',
        defaultItem: config.defaultItem || {},
        searchFields: config.searchFields || [],
        dialogFields: (config.dialogFields || []).map(field => {
          // Special handling for product field
          if (field.key === 'product') {
            console.log('Configuring product field with options:', dynamicOptions.products);
            return {
              ...field,
              type: 'select',
              options: dynamicOptions.products
            };
          }
          return field;
        }),
        columns: config.columns || Object.keys(config.defaultItem || {}).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1)
        })),
        addButtonIcon: config.addButtonIcon || <AddIcon />,
        renderView: config.renderView || 'table',
        renderCardView: config.renderCardView || null,
      };

      return baseConfig;
    }, [config, dynamicOptions.products]);

    // Fetch dynamic options (like products)
    const fetchDynamicOptions = async () => {
      try {
        console.log('Attempting to fetch products...');
        
        // Fetch products
        const productsResponse = await productService.getAll();
        
        console.log('Raw products response:', productsResponse);
        
        // Determine the actual product data
        let productData = productsResponse;
        if (productsResponse.data) {
          productData = productsResponse.data;
        }
        
        // Ensure productData is an array
        const products = Array.isArray(productData) ? productData : [];
        
        console.log('Processed products:', products);
        
        const productOptions = products.map(product => ({
          value: product.id,
          label: product.name
        }));

        console.log('Product options:', productOptions);

        // Directly update the state
        setDynamicOptions(prev => ({
          ...prev,
          products: productOptions
        }));
      } catch (error) {
        console.error('Failed to fetch dynamic options', error);
      }
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
        // Validate required and custom fields
        const validationErrors = fullConfig.dialogFields
          .filter(field => field.required || field.validate)
          .reduce((errors, field) => {
            const value = currentItem[field.key];
            
            // Check required fields
            if (field.required && (value === undefined || value === null || value === '')) {
              errors.push(`${field.label} is required`);
            }
            
            // Run custom validation if exists
            if (field.validate) {
              const validationResult = field.validate(value);
              if (validationResult) {
                errors.push(validationResult);
              }
            }
            
            return errors;
          }, []);

        if (validationErrors.length > 0) {
          setError(validationErrors.join(', '));
          return;
        }

        // Prepare data by converting to appropriate types and removing undefined/null values
        const cleanData = fullConfig.dialogFields.reduce((data, field) => {
          const value = currentItem[field.key];
          
          // Skip undefined or null values for optional fields
          if (value === undefined || value === null) {
            if (!field.required) return data;
            return data;
          }

          // Convert to appropriate type
          switch (field.type) {
            case 'number':
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                data[field.key] = numValue;
              }
              break;
            case 'text':
            default:
              data[field.key] = value;
          }
          
          return data;
        }, {});

        if (currentItem.id) {
          // Update existing item
          await service.update(currentItem.id, cleanData);
        } else {
          // Create new item
          await service.create(cleanData);
        }
        fetchItems();
        setOpenDialog(false);
        setCurrentItem(null);
        setError(null);
      } catch (error) {
        console.error(`Failed to save ${fullConfig.entityName}`, error);
        
        // Extract error message from backend response
        const errorMessage = error.response?.data?.detail || 
                             error.response?.data?.error || 
                             error.message || 
                             `Failed to save ${fullConfig.entityName}`;
        
        setError(errorMessage);
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

    // Effect to fetch dynamic options and items
    useEffect(() => {
      console.log('Fetching dynamic options and items...');
      fetchDynamicOptions();
      fetchItems();
    }, []);

    // Filtered and searched items
    const filteredAndSearchedItems = useMemo(() => {
      if (!items || items.length === 0) return [];

      // Normalize search term
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();

      // If no search term, return all items
      if (!normalizedSearchTerm) return items;

      // Perform search across multiple fields
      return items.filter(item => {
        // If no search fields specified, search across all fields
        const searchFields = fullConfig.searchFields.length > 0 
          ? fullConfig.searchFields 
          : Object.keys(item);

        // Check if any of the specified fields match the search term
        return searchFields.some(field => {
          // Get the value of the field, handling nested objects
          const value = field.split('.').reduce((obj, key) => 
            obj && obj[key] !== undefined ? obj[key] : '', item);

          // Convert to string and check if it includes the search term
          const stringValue = String(value).toLowerCase();
          return stringValue.includes(normalizedSearchTerm);
        });
      });
    }, [items, searchTerm, fullConfig.searchFields]);

    // Sorted and filtered items
    const sortedFilteredItems = useMemo(() => {
      if (!filteredAndSearchedItems) return [];

      // Create a copy to avoid mutating the original array
      return [...filteredAndSearchedItems].sort((a, b) => {
        const key = sortConfig.key;
        
        // Handle nested keys (like 'product.name')
        const getNestedValue = (obj, path) => {
          return path.split('.').reduce((o, k) => 
            o && o[k] !== undefined ? o[k] : '', obj);
        };

        const valueA = getNestedValue(a, key);
        const valueB = getNestedValue(b, key);

        // Compare values
        if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }, [filteredAndSearchedItems, sortConfig]);

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
            sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 1 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 1 }} />
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
          className="dark-theme min-h-screen p-6"
        >
          <CircularProgress />
        </Box>
      );
    }

    // Render error state
    if (error) {
      // Ensure error is converted to a string or a valid React node
      const errorMessage = (() => {
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        if (error.response && error.response.data) {
          // Handle axios error responses
          const errorData = error.response.data;
          if (typeof errorData === 'string') return errorData;
          if (errorData.message) return errorData.message;
          return JSON.stringify(errorData);
        }
        return 'An unexpected error occurred';
      })();

      return (
        <Alert severity="error" className="dark-theme min-h-screen p-6">
          {errorMessage}
        </Alert>
      );
    }

    return (
      <Box sx={{ flexGrow: 1 }} className="dark-theme min-h-screen p-6">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" className="text-foreground">{fullConfig.pageTitle}</Typography>
          <Button
            variant="contained"
            startIcon={fullConfig.addButtonIcon}
            onClick={() => openItemDialog()}
            className="btn btn-primary px-4 py-2"
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
            className="text-foreground"
          />
        </Box>

        {/* Render view based on configuration */}
        {fullConfig.renderView === 'card' && fullConfig.renderCardView ? (
          fullConfig.renderCardView(sortedFilteredItems, openItemDialog, handleDeleteItem)
        ) : (
          <TableContainer>
            <Table className="w-full text-sm">
              <TableHead>
                <TableRow className="border-b border-border">
                  {fullConfig.columns.map(col => (
                    <SortableColumnHeader 
                      key={col.key} 
                      label={col.label} 
                      sortKey={col.key}
                    />
                  ))}
                  <TableCell className="px-4 py-3 text-right text-foreground-muted">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFilteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={fullConfig.columns.length + 1} align="center" className="px-4 py-3 text-foreground-muted">
                      No {fullConfig.entityName} found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedFilteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-background-secondary transition-tokyo">
                      {fullConfig.columns.map(col => (
                        <TableCell key={col.key} className="px-4 py-3 text-foreground">
                          {col.render ? col.render(item, fullConfig) : item[col.key]}
                        </TableCell>
                      ))}
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <IconButton 
                            color="primary" 
                            onClick={() => openItemDialog(item)}
                            className="btn btn-secondary px-3 py-1 text-xs"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="secondary"
                            onClick={() => handleDeleteItem(item.id)}
                            className="btn btn-destructive px-3 py-1 text-xs"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Dialog for Add/Edit */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="md" 
          fullWidth
          className="dark-theme"
        >
          <DialogTitle className="text-foreground">
            {currentItem?.id ? `Edit ${fullConfig.entityName}` : `Add ${fullConfig.entityName}`}
          </DialogTitle>
          <DialogContent>
            {fullConfig.dialogFields.map((field) => {
              // Log the options for select fields
              if (field.type === 'select') {
                console.log(`Options for ${field.key}:`, field.options);
              }

              return (
                <TextField
                  key={field.key}
                  fullWidth
                  margin="normal"
                  label={field.label}
                  type={field.type === 'select' ? 'text' : field.type || 'text'}
                  select={field.type === 'select'}
                  multiline={field.multiline}
                  rows={field.multiline ? 3 : undefined}
                  value={currentItem?.[field.key] || ''}
                  onChange={(e) => setCurrentItem(prev => ({
                    ...prev,
                    [field.key]: e.target.value
                  }))}
                  className="text-foreground"
                >
                  {field.type === 'select' && field.options && field.options.map((option) => (
                    <MenuItem 
                      key={option.value} 
                      value={option.value}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              );
            })}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="secondary" className="btn btn-secondary px-4 py-2">
              Cancel
            </Button>
            <Button onClick={handleSaveItem} color="primary" variant="contained" className="btn btn-primary px-4 py-2">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };
};

export default withCrudList;
