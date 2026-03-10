import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Stack,
    Button, IconButton, TextField, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Snackbar,
    Menu, MenuItem, CircularProgress
} from '@mui/material';
import {
    Email as EmailIcon,
    Build as BuildIcon,
    SupportAgent as SupportIcon,
    AdminPanelSettings as AdminIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ИСПРАВЛЕНО: добавлено поле ticketId в интерфейс
interface EngineerTask {
    _id: string;
    incidentNumber: string;
    location: string;
    createdAt: string;
    title: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'new' | 'in-progress' | 'resolved' | 'open';
    description: string;
    ticketId?: { ticketNumber: string };
}

interface EngineerPageProps {
    logout: () => Promise<void>;
}

const EngineerPage: React.FC<EngineerPageProps> = ({ logout }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tasks, setTasks] = useState<EngineerTask[]>([]);

    const [statusAnchor, setStatusAnchor] = useState<{ el: HTMLElement, taskId: string } | null>(null);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [openSupportDialog, setOpenSupportDialog] = useState(false);
    const [openAdminDialog, setOpenAdminDialog] = useState(false);
    const [openInfoDialog, setOpenInfoDialog] = useState(false);
    const [selectedTask, setSelectedTask] = useState<EngineerTask | null>(null);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // ИСПРАВЛЕНО: единый базовый URL
    const BASE_URL = 'http://localhost:3000';

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/api/incidents?limit=40`, { withCredentials: true });

            const result = response.data;

            if (Array.isArray(result)) {
                setTasks(result);
            } else if (result && typeof result === 'object') {
                const possibleArray = result.incidents || result.data || Object.values(result).find(val => Array.isArray(val));
                if (Array.isArray(possibleArray)) {
                    setTasks(possibleArray as EngineerTask[]);
                } else {
                    setTasks([]);
                    console.error('Массив не найден внутри объекта:', result);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.overflowX = 'hidden';
    }, []);

    const showMessage = (msg: string, sev: 'success' | 'error' = 'success') =>
        setSnackbar({ open: true, message: msg, severity: sev });

    const deleteTask = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this incident from DB?')) {
            try {
                // ИСПРАВЛЕНО: единый порт 3000
                await axios.delete(`${BASE_URL}/api/incidents/${id}`, { withCredentials: true });
                setTasks(tasks.filter(t => t._id !== id));
                showMessage('Incident deleted from database', 'error');
            } catch (error) {
                showMessage('Delete failed', 'error');
            }
        }
    };

    const updateStatus = async (taskId: string, newStatus: string) => {
        try {
            // ИСПРАВЛЕНО: правильный эндпоинт /status
            await axios.patch(`${BASE_URL}/api/incidents/${taskId}/status`, { status: newStatus }, { withCredentials: true });
            setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus as any } : t));
            setStatusAnchor(null);
            showMessage(`Status updated to ${newStatus}`);
        } catch (error) {
            showMessage('Status update failed', 'error');
        }
    };

    const filteredTasks = tasks.filter(task =>
        (task.location ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.incidentNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return '#27ae60';
            case 'in-progress': return '#e67e22';
            case 'new': return '#d32f2f';
            default: return '#7f8c8d';
        }
    };

    return (
        <Box sx={{
            bgcolor: '#fafafa', minHeight: '100vh', width: '100vw', maxWidth: '100%',
            display: 'flex', flexDirection: 'column',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(/eng-back.jpg)',
            backgroundSize: 'cover', backgroundAttachment: 'fixed',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #e67e22', bgcolor: '#1a1a1a', color: 'white' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <BuildIcon sx={{ color: '#e67e22' }} />
                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1 }}>ENGINEER TERMINAL</Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ flexGrow: 1, mx: 3, maxWidth: 450 }}>
                    <TextField
                        size="small" fullWidth placeholder="Search by Incident # or Location..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: 0 }}
                    />
                    <Button variant="contained" onClick={() => setSearchTerm('')} sx={{ bgcolor: '#555', borderRadius: 0 }}>Reset</Button>
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Button variant="contained" startIcon={<SupportIcon />} onClick={() => setOpenSupportDialog(true)} sx={{ bgcolor: '#2b4d7e', borderRadius: 0 }}>Support</Button>
                    <Button variant="contained" startIcon={<AdminIcon />} onClick={() => setOpenAdminDialog(true)} sx={{ bgcolor: '#d32f2f', borderRadius: 0 }}>Admin</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            await logout();
                            navigate('/login');
                        }}
                        sx={{ color: 'white', borderRadius: 0, ml: 1, bgcolor: '#2b4d7e', '&:hover': { bgcolor: '#1a3254' } }}
                    >
                        EXIT
                    </Button>
                </Stack>
            </Box>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                        <CircularProgress sx={{ color: '#e67e22' }} />
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 0, border: '2px solid #e67e22' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#1a1a1a' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>INCIDENT #</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>LOCATION</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>DATE</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>TITLE</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>TICKET</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>STATUS (CLICK)</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900, textAlign: 'center' }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#888' }}>
                                            No incidents found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <TableRow key={task._id} hover>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#e67e22' }}>
                                                {task.incidentNumber}
                                            </TableCell>

                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {task.location ?? '—'}
                                            </TableCell>

                                            <TableCell>
                                                {new Date(task.createdAt).toLocaleDateString()}
                                            </TableCell>

                                            <TableCell>
                                                <Typography
                                                    onClick={() => { setSelectedTask(task); setOpenInfoDialog(true); }}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        color: '#2b4d7e',
                                                        textDecoration: 'underline',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {task.title}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {task.ticketId?.ticketNumber ?? '—'}
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={task.status.toUpperCase()}
                                                    onClick={(e) => setStatusAnchor({ el: e.currentTarget, taskId: task._id })}
                                                    sx={{
                                                        borderRadius: 0,
                                                        width: '120px',
                                                        fontWeight: 'bold',
                                                        bgcolor: getStatusColor(task.status),
                                                        color: 'white',
                                                        '&:hover': { opacity: 0.8 }
                                                    }}
                                                />
                                            </TableCell>

                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => { setSelectedTask(task); setOpenUpdate(true); }}
                                                        sx={{ color: '#e67e22', border: '1px solid' }}
                                                    >
                                                        <EmailIcon fontSize="small" />
                                                    </IconButton>

                                                    <IconButton
                                                        size="small"
                                                        onClick={() => deleteTask(task._id)}
                                                        sx={{ color: '#d32f2f', border: '1px solid' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            {/* Меню статуса */}
            <Menu anchorEl={statusAnchor?.el} open={Boolean(statusAnchor)} onClose={() => setStatusAnchor(null)}>
                <MenuItem onClick={() => statusAnchor && updateStatus(statusAnchor.taskId, 'new')}>NEW</MenuItem>
                <MenuItem onClick={() => statusAnchor && updateStatus(statusAnchor.taskId, 'in-progress')}>IN PROGRESS</MenuItem>
                <MenuItem onClick={() => statusAnchor && updateStatus(statusAnchor.taskId, 'resolved')}>RESOLVED</MenuItem>
            </Menu>

            {/* Footer */}
            <Box sx={{ bgcolor: '#1a2a40', py: 4, color: 'white', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>© 2026 Smart City Israel. All Rights Reserved.</Typography>
            </Box>

            {/* Диалог Info */}
            <Dialog open={openInfoDialog} onClose={() => setOpenInfoDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ bgcolor: '#1a1a1a', color: '#e67e22', fontWeight: 900 }}>
                    DETAILS: {selectedTask?.incidentNumber}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Description:</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>{selectedTask?.description}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Severity: {selectedTask?.severity?.toUpperCase()}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenInfoDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог Update */}
            <Dialog open={openUpdate} onClose={() => setOpenUpdate(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: '#e67e22', color: 'white' }}>Update Task</DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <TextField fullWidth multiline rows={3} label="Maintenance Notes" variant="outlined" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUpdate(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { setOpenUpdate(false); showMessage('Report Sent'); }} sx={{ bgcolor: '#e67e22' }}>Submit</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог Support */}
            <Dialog open={openSupportDialog} onClose={() => setOpenSupportDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: '#2b4d7e', color: 'white' }}>CONTACT SUPPORT</DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <TextField fullWidth multiline rows={3} label="Message" variant="outlined" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSupportDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { setOpenSupportDialog(false); showMessage('Sent to Support'); }} sx={{ bgcolor: '#2b4d7e' }}>Send</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог Admin */}
            <Dialog open={openAdminDialog} onClose={() => setOpenAdminDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white' }}>ADMIN REPORT</DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <TextField fullWidth multiline rows={3} label="Details" variant="outlined" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdminDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { setOpenAdminDialog(false); showMessage('Emergency report sent'); }} sx={{ bgcolor: '#d32f2f' }}>Send</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default EngineerPage;
