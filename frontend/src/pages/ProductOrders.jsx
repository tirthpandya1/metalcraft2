import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip
} from '@mui/material';

import { productOrderService } from '../services/api';

const ProductOrders = () => {
    const [productOrders, setProductOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderStatusFilter, setOrderStatusFilter] = useState('');

    // Status color mapping
    const statusColorMap = {
        'DRAFT': 'default',
        'PENDING': 'warning',
        'CONFIRMED': 'info',
        'IN_PRODUCTION': 'primary',
        'QUALITY_CHECK': 'secondary',
        'READY_TO_SHIP': 'info',
        'SHIPPED': 'success',
        'DELIVERED': 'success',
        'CANCELLED': 'error',
        'RETURNED': 'error'
    };

    // Fetch product orders
    useEffect(() => {
        const fetchProductOrders = async () => {
            try {
                const params = orderStatusFilter ? { status: orderStatusFilter } : {};
                const response = await productOrderService.getAll(params);
                setProductOrders(response);
            } catch (error) {
                console.error('Error fetching product orders:', error);
            }
        };

        fetchProductOrders();
    }, [orderStatusFilter]);

    // Open order details dialog
    const handleOpenOrderDetails = (order) => {
        setSelectedOrder(order);
    };

    // Close order details dialog
    const handleCloseOrderDetails = () => {
        setSelectedOrder(null);
    };

    // Update order status
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await productOrderService.updateStatus(orderId, newStatus);
            
            // Update the orders list
            setProductOrders(productOrders.map(order => 
                order.id === orderId ? response.order : order
            ));
            
            // Close the dialog if it's open
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(response.order);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    // Add tracking information
    const handleAddTrackingInfo = async (orderId, trackingInfo) => {
        try {
            const response = await productOrderService.addTrackingInfo(orderId, trackingInfo);
            
            // Update the orders list
            setProductOrders(productOrders.map(order => 
                order.id === orderId ? response.order : order
            ));
            
            // Close the dialog if it's open
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(response.order);
            }
        } catch (error) {
            console.error('Error adding tracking info:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Product Orders
            </Typography>

            {/* Status Filter */}
            <FormControl sx={{ mb: 2, minWidth: 200 }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                    value={orderStatusFilter}
                    label="Filter by Status"
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                    <MenuItem value="">All Orders</MenuItem>
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                    <MenuItem value="IN_PRODUCTION">In Production</MenuItem>
                    <MenuItem value="QUALITY_CHECK">Quality Check</MenuItem>
                    <MenuItem value="READY_TO_SHIP">Ready to Ship</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="DELIVERED">Delivered</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    <MenuItem value="RETURNED">Returned</MenuItem>
                </Select>
            </FormControl>

            {/* Product Orders Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Order Number</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Total Cost</TableCell>
                            <TableCell>Expected Delivery</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{order.order_number}</TableCell>
                                <TableCell>{order.customer.name}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={order.status} 
                                        color={statusColorMap[order.status] || 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>${order.total_cost}</TableCell>
                                <TableCell>
                                    {order.expected_delivery_date || 'Not Set'}
                                </TableCell>
                                <TableCell>
                                    <Button 
                                        variant="outlined" 
                                        color="primary"
                                        onClick={() => handleOpenOrderDetails(order)}
                                    >
                                        View Details
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Order Details Dialog */}
            {selectedOrder && (
                <Dialog 
                    open={!!selectedOrder} 
                    onClose={handleCloseOrderDetails}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>Order Details: {selectedOrder.order_number}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6">Order Information</Typography>
                            <Typography>Customer: {selectedOrder.customer.name}</Typography>
                            <Typography>
                                Status: 
                                <Chip 
                                    label={selectedOrder.status} 
                                    color={statusColorMap[selectedOrder.status] || 'default'}
                                    size="small"
                                    sx={{ ml: 1 }}
                                />
                            </Typography>
                            <Typography>Total Cost: ${selectedOrder.total_cost}</Typography>
                            <Typography>
                                Expected Delivery: {selectedOrder.expected_delivery_date || 'Not Set'}
                            </Typography>
                        </Box>

                        <Typography variant="h6">Order Items</Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Unit Price</TableCell>
                                        <TableCell>Total Price</TableCell>
                                        <TableCell>Production Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedOrder.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.product.name}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>${item.unit_price}</TableCell>
                                            <TableCell>${item.total_price}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={item.production_status} 
                                                    color="primary" 
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Status Update Section */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6">Update Order Status</Typography>
                            <Select
                                value={selectedOrder.status}
                                onChange={(e) => handleUpdateOrderStatus(
                                    selectedOrder.id, 
                                    e.target.value
                                )}
                                fullWidth
                            >
                                {Object.keys(statusColorMap).map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>

                        {/* Tracking Information */}
                        {selectedOrder.status === 'SHIPPED' && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6">Tracking Information</Typography>
                                <Typography>
                                    Tracking Number: {selectedOrder.tracking_number || 'Not Available'}
                                </Typography>
                                <Typography>
                                    Shipping Method: {selectedOrder.shipping_method || 'Not Available'}
                                </Typography>
                            </Box>
                        )}

                        {/* Invoice Details */}
                        {selectedOrder.invoice && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6">Invoice Details</Typography>
                                <Typography>Invoice Number: {selectedOrder.invoice.invoice_number}</Typography>
                                <Typography>Total Amount: ${selectedOrder.invoice.total_amount}</Typography>
                                <Typography>Payment Status: {selectedOrder.invoice.payment_status}</Typography>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseOrderDetails}>Close</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

export default ProductOrders;
