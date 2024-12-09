import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel 
} from '@mui/material';

const CrudDialog = ({ 
    open, 
    handleClose, 
    handleSubmit, 
    title, 
    fields, 
    initialData = {} 
}) => {
    const [formData, setFormData] = React.useState(initialData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const onSubmit = () => {
        handleSubmit(formData);
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {fields.map((field) => {
                    if (field.type === 'select') {
                        return (
                            <FormControl fullWidth margin="normal" key={field.name}>
                                <InputLabel>{field.label}</InputLabel>
                                <Select
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    label={field.label}
                                    onChange={handleChange}
                                >
                                    {field.options.map((option) => (
                                        <MenuItem 
                                            key={option.value} 
                                            value={option.value}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        );
                    }
                    return (
                        <TextField
                            key={field.name}
                            name={field.name}
                            label={field.label}
                            type={field.type || 'text'}
                            fullWidth
                            margin="normal"
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    );
                })}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="secondary">Cancel</Button>
                <Button onClick={onSubmit} color="primary" variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CrudDialog;
