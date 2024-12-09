import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { formatLocalDateTime } from '../utils/timeUtils';

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000/ws/manufacturing/';

export const useWebSocketEvents = () => {
    const [socket, setSocket] = useState(null);
    const [events, setEvents] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    const connectWebSocket = useCallback(() => {
        const newSocket = new WebSocket(WEBSOCKET_URL);

        newSocket.onopen = () => {
            console.log('WebSocket Connected');
            setConnectionStatus('connected');
            
            // Request initial state on connection
            newSocket.send(JSON.stringify({
                type: 'request_initial_state'
            }));
        };

        newSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketEvent(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        newSocket.onclose = () => {
            console.log('WebSocket Disconnected');
            setConnectionStatus('disconnected');
            
            // Attempt reconnection after 3 seconds
            setTimeout(connectWebSocket, 3000);
        };

        setSocket(newSocket);
    }, []);

    const handleWebSocketEvent = (eventData) => {
        switch (eventData.type) {
            case 'initial_state':
                handleInitialState(eventData.data);
                break;
            case 'manufacturing_event':
                handleManufacturingEvent(eventData);
                break;
            case 'workorder_details':
                handleWorkOrderDetails(eventData.data);
                break;
            default:
                console.warn('Unhandled WebSocket event:', eventData);
        }
    };

    const handleInitialState = (initialState) => {
        // Process and store initial state
        console.log('Initial Manufacturing State:', initialState);
        
        // Low stock material notifications
        if (initialState.low_stock_materials.length > 0) {
            initialState.low_stock_materials.forEach(material => {
                toast.warning(`Low Stock Alert: ${material.name} (${material.quantity}/${material.reorder_level})`, {
                    position: "top-right",
                    autoClose: 5000,
                });
            });
        }
    };

    const handleManufacturingEvent = (eventData) => {
        // Central event handling for all manufacturing events
        const { event_type, data } = eventData;

        // Add to events list for tracking
        setEvents(prevEvents => [...prevEvents, { 
            event_type, 
            data, 
            timestamp: formatLocalDateTime(new Date().toISOString()) 
        }]);

        // Specific event type handling with toast notifications
        switch (event_type) {
            case 'work_order.created':
                toast.info(`New Work Order: ${data.product_name} (Qty: ${data.quantity})`, {
                    position: "top-right",
                    autoClose: 3000,
                });
                break;
            case 'work_order.started':
                toast.success(`Work Order Started: ${data.work_order_id}`, {
                    position: "top-right",
                    autoClose: 3000,
                });
                break;
            case 'material.low_stock':
                toast.warning(`Low Stock Alert: ${data.material_name} (${data.current_quantity}/${data.reorder_level})`, {
                    position: "top-right",
                    autoClose: 5000,
                });
                break;
            default:
                console.log('Unhandled Manufacturing Event:', event_type, data);
        }
    };

    const handleWorkOrderDetails = (workOrderDetails) => {
        // Process and potentially store work order details
        console.log('Work Order Details:', workOrderDetails);
    };

    const requestWorkOrderDetails = useCallback((workOrderId) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'request_workorder_details',
                work_order_id: workOrderId
            }));
        }
    }, [socket]);

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [connectWebSocket]);

    return {
        events,
        connectionStatus,
        requestWorkOrderDetails
    };
};
