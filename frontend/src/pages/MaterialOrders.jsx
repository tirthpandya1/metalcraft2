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
    InputLabel
} from '@mui/material';

import { materialOrderService } from '../services/api';

const MaterialOrders = () => {
    const [materialOrders, setMaterialOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderStatusFilter, setOrderStatusFilter] = useState('');

    // Fetch material orders
    useEffect(() => {
        const fetchMaterialOrders = async () => {
            try {
                const params = orderStatusFilter ? { status: orderStatusFilter } : {};
                const response = await materialOrderService.getAll(params);
                setMaterialOrders(response);
            } catch (error) {
                console.error('Error fetching material orders:', error);
            }
        };

        fetchMaterialOrders();
    }, [orderStatusFilter]);

    // Open order details dialog
    const handleOpenOrderDetails = (order) => {
        setSelectedOrder(order);
    };

    // Close order details dialog
    const handleCloseOrderDetails = () => {
        setSelectedOrder(null);
    };

    // Approve order
    const handleApproveOrder = async (orderId) => {
        try {
            const response = await materialOrderService.approveOrder(orderId);
            // Update the orders list
            setMaterialOrders(materialOrders.map(order => 
                order.id === orderId ? response.order : order
            ));
        } catch (error) {
            console.error('Error approving order:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Material Orders
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
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="ORDERED">Ordered</MenuItem>
                    <MenuItem value="PARTIALLY_RECEIVED">Partially Received</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
            </FormControl>

            {/* Material Orders Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Order Number</TableCell>
                            <TableCell>Supplier</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Total Cost</TableCell>
                            <TableCell>Expected Delivery</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {materialOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{order.order_number}</TableCell>
                                <TableCell>{order.supplier.name}</TableCell>
                                <TableCell>{order.status}</TableCell>
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
                                    {order.status === 'PENDING' && (
                                        <Button 
                                            variant="contained" 
                                            color="success"
                                            onClick={() => handleApproveOrder(order.id)}
                                            sx={{ ml: 1 }}
                                        >
                                            Approve
                                        </Button>
                                    )}
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
                            <Typography>Supplier: {selectedOrder.supplier.name}</Typography>
                            <Typography>Status: {selectedOrder.status}</Typography>
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
                                        <TableCell>Material</TableCell>
                                        <TableCell>Quantity Ordered</TableCell>
                                        <TableCell>Quantity Received</TableCell>
                                        <TableCell>Unit Price</TableCell>
                                        <TableCell>Total Price</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedOrder.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.material.name}</TableCell>
                                            <TableCell>{item.quantity_ordered}</TableCell>
                                            <TableCell>{item.quantity_received}</TableCell>
                                            <TableCell>${item.unit_price}</TableCell>
                                            <TableCell>${item.total_price}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

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

export default MaterialOrders;
