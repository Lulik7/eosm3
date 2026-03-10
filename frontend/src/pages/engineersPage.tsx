import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Stack,
    Button, IconButton, TextField, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Snackbar, Menu, MenuItem, CircularProgress,
    Select, Divider, Avatar
} from '@mui/material';
import {
    Build as BuildIcon,
    SupportAgent as SupportIcon,
    AdminPanelSettings as AdminIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface IncidentUpdate {
    _id?: string;
    message: string;
    author?: { username: string } | string;
    createdAt?: string;
    isPublic?: boolean;
}

interface EngineerTask {
    _id: string;
    incidentNumber: string;
    location?: string;
    createdAt: string;
    title: string;
    type?: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: string;
    description?: string;
    ticketId?: { ticketNumber?: string; title?: string } | string;
    createdBy?: { username: string; email?: string } | string;
    assignedTo?: { username: string } | string;
    updates?: IncidentUpdate[];
}

interface EngineerPageProps {
    logout: () => Promise<void>;
}

const BASE_URL = 'http://localhost:3000';

const getStatusStyles = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'resolved') return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
    if (s === 'closed') return { bg: '#ede7f6', text: '#4527a0', border: '#b39ddb' };
    if (s === 'monitoring') return { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' };
    if (s === 'investigating') return { bg: '#fff8e1', text: '#f57f17', border: '#ffcc02' };
    if (s === 'identified') return { bg: '#fce4ec', text: '#c62828', border: '#ef9a9a' };
    if (s === 'in-progress') return { bg: '#fffde7', text: '#f57f17', border: '#fff59d' };
    return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };
};

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'critical': return '#d32f2f';
        case 'high': return '#e67e22';
        case 'medium': return '#f9a825';
        case 'low': return '#388e3c';
        default: return '#7f8c8d';
    }
};

const EngineerPage: React.FC<EngineerPageProps> = ({ logout }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tasks, setTasks] = useState<EngineerTask[]>([]);

    const [openDetails, setOpenDetails] = useState(false);
    const [selectedTask, setSelectedTask] = useState<EngineerTask | null>(null);
    const [noteText, setNoteText] = useState('');
    const [sendingNote, setSendingNote] = useState(false);

    const [openSupportDialog, setOpenSupportDialog] = useState(false);
    const [openAdminDialog, setOpenAdminDialog] = useState(false);
    const [supportMsg, setSupportMsg] = useState('');
    const [adminMsg, setAdminMsg] = useState('');

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const showMessage = (msg: string, sev: 'success' | 'error' = 'success') =>
        setSnackbar({ open: true, message: msg, severity: sev });

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/api/incidents?limit=100`, { withCredentials: true });
            const result = response.data;
            const arr = Array.isArray(result) ? result
                : result?.data || result?.incidents || [];
            setTasks(arr);
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const openIncidentDetails = async (task: EngineerTask) => {
        // Загружаем полные данные инцидента
        try {
            const res = await axios.get(`${BASE_URL}/api/incidents/${task._id}`, { withCredentials: true });
            const full = res.data?.data || res.data;
            setSelectedTask(full);
        } catch {
            setSelectedTask(task);
        }
        setNoteText('');
        setOpenDetails(true);
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            await axios.patch(`${BASE_URL}/api/incidents/${taskId}/status`, { status: newStatus }, { withCredentials: true });
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
            if (selectedTask?._id === taskId) {
                setSelectedTask(prev => prev ? { ...prev, status: newStatus } : prev);
            }
            showMessage(`Статус → ${newStatus.toUpperCase()}`);
        } catch {
            showMessage('Не удалось обновить статус', 'error');
        }
    };

    const handleSendNote = async () => {
        if (!noteText.trim() || !selectedTask) return;
        setSendingNote(true);
        try {
            await axios.post(
                `${BASE_URL}/api/incidents/${selectedTask._id}/updates`,
                { message: noteText.trim(), isPublic: true },
                { withCredentials: true }
            );
            // Перезагружаем инцидент чтобы увидеть новое обновление
            const res = await axios.get(`${BASE_URL}/api/incidents/${selectedTask._id}`, { withCredentials: true });
            const full = res.data?.data || res.data;
            setSelectedTask(full);
            setNoteText('');
            showMessage('Замечание отправлено');
        } catch {
            showMessage('Не удалось отправить замечание', 'error');
        } finally {
            setSendingNote(false);
        }
    };

    const handleDeleteIncident = async (id: string) => {
        if (!window.confirm('Удалить инцидент из базы?')) return;
        try {
            await axios.delete(`${BASE_URL}/api/incidents/${id}`, { withCredentials: true });
            setTasks(prev => prev.filter(t => t._id !== id));
            showMessage('Инцидент удалён', 'error');
        } catch {
            showMessage('Ошибка удаления', 'error');
        }
    };

    const filteredTasks = tasks.filter(task =>
        (task.location ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.incidentNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAuthorName = (author: any) => {
        if (!author) return 'Unknown';
        if (typeof author === 'object') return author.username || author.email || 'Unknown';
        return author;
    };

    return (
        <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #e67e22', bgcolor: '#1a1a1a', color: 'white' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <BuildIcon sx={{ color: '#e67e22' }} />
                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1 }}>ENGINEER TERMINAL</Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ flexGrow: 1, mx: 3, maxWidth: 450 }} alignItems="center">
                    <TextField
                        size="small" fullWidth placeholder="Search by Incident # or Title..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setSearchTerm(searchTerm.trim())}
                        sx={{ bgcolor: 'white', borderRadius: 0 }}
                    />
                    <Button variant="contained" onClick={() => setSearchTerm(searchTerm.trim())} sx={{ bgcolor: '#e67e22', borderRadius: 0, minWidth: 50 }}>OK</Button>
                    <Button variant="contained" onClick={() => setSearchTerm('')} sx={{ bgcolor: '#555', borderRadius: 0 }}>Reset</Button>
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Button variant="contained" startIcon={<SupportIcon />} onClick={() => setOpenSupportDialog(true)} sx={{ bgcolor: '#2b4d7e', borderRadius: 0 }}>Support</Button>
                    <Button variant="contained" startIcon={<AdminIcon />} onClick={() => setOpenAdminDialog(true)} sx={{ bgcolor: '#d32f2f', borderRadius: 0 }}>Admin</Button>
                    <Button variant="contained" onClick={async () => { await logout(); navigate('/login'); }} sx={{ bgcolor: '#444', borderRadius: 0 }}>EXIT</Button>
                </Stack>
            </Box>

            {/* Table */}
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
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>DATE</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>TITLE</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>SEVERITY</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900 }}>STATUS</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 900, textAlign: 'center' }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#888' }}>No incidents found</TableCell>
                                    </TableRow>
                                ) : filteredTasks.map((task) => {
                                    const st = getStatusStyles(task.status);
                                    return (
                                        <TableRow key={task._id} hover>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#e67e22', fontSize: '0.8rem' }}>
                                                {task.incidentNumber}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem' }}>
                                                {new Date(task.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    onClick={() => openIncidentDetails(task)}
                                                    sx={{ cursor: 'pointer', color: '#2b4d7e', textDecoration: 'underline', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                >
                                                    {task.title}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={task.severity?.toUpperCase()}
                                                    size="small"
                                                    sx={{ bgcolor: getSeverityColor(task.severity), color: 'white', fontWeight: 'bold', borderRadius: 0, fontSize: '0.65rem' }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 145 }}>
                                                <Select
                                                    size="small"
                                                    value={task.status ?? 'new'}
                                                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                                    sx={{
                                                        borderRadius: 0, fontWeight: 'bold', fontSize: '0.72rem',
                                                        color: st.text, bgcolor: st.bg,
                                                        border: `1px solid ${st.border}`,
                                                        width: '100%', maxWidth: 145,
                                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                        '& .MuiSelect-icon': { color: st.text },
                                                        '& .MuiSelect-select': { py: '5px', px: '8px' }
                                                    }}
                                                >
                                                    {['new', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'].map(s => {
                                                        const ss = getStatusStyles(s);
                                                        return <MenuItem key={s} value={s} sx={{ fontSize: '0.72rem', fontWeight: 'bold', color: ss.text }}>{s.toUpperCase()}</MenuItem>;
                                                    })}
                                                </Select>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <IconButton size="small" onClick={() => openIncidentDetails(task)} sx={{ color: '#2b4d7e', border: '1px solid #2b4d7e' }} title="Details">
                                                        <InfoIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDeleteIncident(task._id)} sx={{ color: '#d32f2f', border: '1px solid #d32f2f' }} title="Delete">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            {/* Footer */}
            <Box sx={{ bgcolor: '#1a2a40', py: 3, color: 'white', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>© 2026 Smart City Israel. All Rights Reserved.</Typography>
            </Box>

            {/* === ДЕТАЛИ ИНЦИДЕНТА === */}
            <Dialog open={openDetails} onClose={() => setOpenDetails(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 0 } }}>
                <DialogTitle sx={{ bgcolor: '#1a1a1a', color: '#e67e22', fontWeight: 900, pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#e67e22' }}>
                            ⚙️ {selectedTask?.incidentNumber} — {selectedTask?.title}
                        </Typography>
                        <Chip
                            label={selectedTask?.severity?.toUpperCase()}
                            sx={{ bgcolor: getSeverityColor(selectedTask?.severity || ''), color: 'white', fontWeight: 'bold', borderRadius: 0 }}
                        />
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {selectedTask && (
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 450 }}>

                            {/* Левая панель — информация */}
                            <Box sx={{ flex: 1, p: 3, borderRight: { md: '1px solid #eee' } }}>
                                <Typography variant="overline" color="text.secondary">Описание</Typography>
                                <Typography variant="body2" sx={{ mb: 2, color: '#333' }}>
                                    {selectedTask.description || '—'}
                                </Typography>

                                <Divider sx={{ mb: 2 }} />

                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="overline" color="text.secondary">Статус</Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Select
                                                size="small"
                                                value={selectedTask.status ?? 'new'}
                                                onChange={(e) => handleStatusChange(selectedTask._id, e.target.value)}
                                                sx={{
                                                    borderRadius: 0, fontWeight: 'bold', fontSize: '0.78rem',
                                                    color: getStatusStyles(selectedTask.status).text,
                                                    bgcolor: getStatusStyles(selectedTask.status).bg,
                                                    border: `1px solid ${getStatusStyles(selectedTask.status).border}`,
                                                    minWidth: 160,
                                                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                }}
                                            >
                                                {['new', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'].map(s => {
                                                    const ss = getStatusStyles(s);
                                                    return <MenuItem key={s} value={s} sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: ss.text }}>{s.toUpperCase()}</MenuItem>;
                                                })}
                                            </Select>
                                        </Box>
                                    </Box>

                                    {selectedTask.type && (
                                        <Box>
                                            <Typography variant="overline" color="text.secondary">Тип</Typography>
                                            <Typography variant="body2" fontWeight="bold">{selectedTask.type}</Typography>
                                        </Box>
                                    )}

                                    {selectedTask.createdBy && (
                                        <Box>
                                            <Typography variant="overline" color="text.secondary">Создал</Typography>
                                            <Typography variant="body2" fontWeight="bold">{getAuthorName(selectedTask.createdBy)}</Typography>
                                        </Box>
                                    )}

                                    {selectedTask.assignedTo && (
                                        <Box>
                                            <Typography variant="overline" color="text.secondary">Назначен</Typography>
                                            <Typography variant="body2" fontWeight="bold">{getAuthorName(selectedTask.assignedTo)}</Typography>
                                        </Box>
                                    )}

                                    <Box>
                                        <Typography variant="overline" color="text.secondary">Дата создания</Typography>
                                        <Typography variant="body2">{new Date(selectedTask.createdAt).toLocaleString()}</Typography>
                                    </Box>

                                    {selectedTask.ticketId && (
                                        <Box>
                                            <Typography variant="overline" color="text.secondary">Связанный тикет</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {typeof selectedTask.ticketId === 'object'
                                                    ? selectedTask.ticketId.ticketNumber || selectedTask.ticketId.title
                                                    : selectedTask.ticketId}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>

                            {/* Правая панель — лог обновлений + форма */}
                            <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
                                    Журнал работ ({selectedTask.updates?.length || 0})
                                </Typography>

                                <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 280, mb: 2, pr: 1 }}>
                                    {(!selectedTask.updates || selectedTask.updates.length === 0) ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            Записей пока нет
                                        </Typography>
                                    ) : (
                                        [...selectedTask.updates].reverse().map((upd, i) => (
                                            <Box key={upd._id || i} sx={{ mb: 1.5, p: 1.5, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0', borderLeft: '3px solid #e67e22' }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Avatar sx={{ width: 22, height: 22, bgcolor: '#e67e22', fontSize: '0.6rem' }}>
                                                            {getAuthorName(upd.author).charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Typography variant="caption" fontWeight="bold" color="#e67e22">
                                                            {getAuthorName(upd.author)}
                                                        </Typography>
                                                    </Stack>
                                                    {upd.createdAt && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(upd.createdAt).toLocaleString()}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                                <Typography variant="body2" sx={{ color: '#333' }}>{upd.message}</Typography>
                                            </Box>
                                        ))
                                    )}
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
                                    Добавить замечание
                                </Typography>
                                <TextField
                                    fullWidth multiline rows={3}
                                    placeholder="Опишите выполненные работы или замечание..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                                />
                                <Button
                                    variant="contained"
                                    endIcon={<SendIcon />}
                                    disabled={!noteText.trim() || sendingNote}
                                    onClick={handleSendNote}
                                    sx={{ bgcolor: '#e67e22', borderRadius: 0, fontWeight: 'bold', alignSelf: 'flex-end' }}
                                >
                                    {sendingNote ? 'Отправка...' : 'Отправить'}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ bgcolor: '#f5f5f5', px: 3 }}>
                    <Button onClick={() => setOpenDetails(false)} sx={{ fontWeight: 'bold' }}>Закрыть</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог Support */}
            <Dialog open={openSupportDialog} onClose={() => setOpenSupportDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: '#2b4d7e', color: 'white' }}>CONTACT SUPPORT</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField fullWidth multiline rows={3} label="Message" variant="outlined" value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSupportDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { setOpenSupportDialog(false); setSupportMsg(''); showMessage('Sent to Support'); }} sx={{ bgcolor: '#2b4d7e' }}>Send</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог Admin */}
            <Dialog open={openAdminDialog} onClose={() => setOpenAdminDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white' }}>ADMIN REPORT</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField fullWidth multiline rows={3} label="Details" variant="outlined" value={adminMsg} onChange={(e) => setAdminMsg(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdminDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { setOpenAdminDialog(false); setAdminMsg(''); showMessage('Report sent'); }} sx={{ bgcolor: '#d32f2f' }}>Send</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default EngineerPage;
