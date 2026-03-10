import React, { useState, useEffect } from 'react';
import { useRef } from "react";
import {
    Box, Typography, Paper, Stack,
    Button, IconButton, TextField, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Snackbar, CircularProgress, Divider
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Engineering as EngineeringIcon,
    Person as PersonIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';

import { ticketService } from '../services/ticketService';
import { incidentService } from '../services/incidentService';
import { Ticket } from '../types/ticket';
import { Incident } from '../types/incident';

interface SupportPageProps {
    logout: () => Promise<void>;
}

const supportStaff = ["Michael Scott", "Dwight Schrute", "Jim Halpert", "Pam Beesly", "Ryan Howard", "Kelly Kapoor", "Stanley Hudson", "Kevin Malone", "Angela Martin", "Oscar Martinez"];

const SupportPage: React.FC<SupportPageProps> = ({ logout }) => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const isProcessing = useRef(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [openAdminReport, setOpenAdminReport] = useState(false);
    const [openAssign, setOpenAssign] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);
    const [detailsItem, setDetailsItem] = useState<any>(null);
    const [detailsType, setDetailsType] = useState<'ticket' | 'incident'>('ticket');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedEngineer, setSelectedEngineer] = useState('');
    const [messageText, setMessageText] = useState('');
    const [assignedEngineers, setAssignedEngineers] = useState<Record<string, string>>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        let cancelled = false;
        const loadData = async () => {
            try {
                setLoading(true);
                const ticketsRes = await ticketService.getTickets();
                const incidentsRes = await incidentService.getAll();
                if (cancelled) return;
                setTickets(Array.isArray(ticketsRes) ? ticketsRes : []);
                setIncidents(Array.isArray(incidentsRes) ? incidentsRes : []);
            } catch (error) {
                if (cancelled) return;
                console.error("Load error:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadData();
        return () => { cancelled = true; setLoading(false); };
    }, []);

    const handleAction = (msg: string, sev: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message: msg, severity: sev });
        if (openAssign && selectedItem && selectedEngineer) {
            setAssignedEngineers(prev => ({ ...prev, [selectedItem._id]: selectedEngineer }));
        }
        setOpenAdminReport(false);
        setOpenAssign(false);
        setMessageText('');
        setSelectedEngineer('');
    };

    const handleDeleteTicket = (id: string) => {
        setTickets(prev => prev.filter(t => (t._id || t.id) !== id));
        setSnackbar({ open: true, message: 'Ticket removed from board', severity: 'error' });
    };

    const handleOpenDetails = (item: any, type: 'ticket' | 'incident') => {
        setDetailsItem(item);
        setDetailsType(type);
        setOpenDetails(true);
    };

    const createIncident = async (ticket: Ticket): Promise<void> => {
        try {
            const desc = ticket.description && ticket.description.length >= 10
                ? ticket.description
                : (ticket.description || ticket.title || 'No description').padEnd(10, '.');
            const newIncident = await incidentService.create({
                title: ticket.title, description: desc,
                severity: "medium", type: "other", ticketId: ticket._id
            });
            setIncidents(prev => [newIncident, ...prev]);
            setTickets(prev => prev.map(t =>
                String(t._id || t.id) === String(ticket._id || ticket.id)
                    ? { ...t, status: 'investigating' as Ticket["status"] }
                    : t
            ));
            setSnackbar({ open: true, message: '⚠️ Incident created!', severity: 'success' });
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: 'Failed to create incident', severity: 'error' });
        }
    };

    const handleDeleteIncident = (id: string) => {
        setIncidents(prev => prev.filter(inc => inc._id !== id));
        setSnackbar({ open: true, message: 'Incident deleted', severity: 'error' });
    };

    const getStatusStyles = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'resolved') return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
        if (s === 'closed') return { bg: '#ede7f6', text: '#4527a0', border: '#b39ddb' };
        if (s === 'monitoring') return { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' };
        if (s === 'investigating') return { bg: '#fff8e1', text: '#f57f17', border: '#ffcc02' };
        if (s === 'identified') return { bg: '#fce4ec', text: '#c62828', border: '#ef9a9a' };
        if (s === 'in-progress') return { bg: '#fffde7', text: '#f57f17', border: '#fff59d' };
        return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };
    };

    // Маппинг: статус тикета → статус инцидента
    const ticketToIncidentStatus: Record<string, string> = {
        'investigating': 'investigating',
        'monitoring':    'monitoring',
        'resolved':      'resolved',
        'closed':        'closed',
        'in-progress':   'identified',
        'new':           'new',
    };

    const syncIncidentStatus = async (ticketId: string, newTicketStatus: string) => {
        const linked = incidents.find(inc => {
            const tId = typeof inc.ticketId === 'object'
                ? String((inc.ticketId as any)?._id)
                : String(inc.ticketId);
            return tId === String(ticketId);
        });
        if (!linked) return;
        const incStatus = ticketToIncidentStatus[newTicketStatus];
        if (!incStatus) return;
        try {
            await incidentService.updateStatus(linked._id, incStatus);
            setIncidents(prev => prev.map(inc =>
                inc._id === linked._id ? { ...inc, status: incStatus as any } : inc
            ));
        } catch (e) {
            console.error('Failed to sync incident status', e);
        }
    };

    const onDragEnd = (result: DropResult) => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        const { source, destination, draggableId } = result;
        if (!destination) { isProcessing.current = false; return; }

        const oldStatus = source.droppableId;
        const newStatus = destination.droppableId;
        if (oldStatus === newStatus) { isProcessing.current = false; return; }

        const ticket = tickets.find(t => String(t._id || t.id) === String(draggableId));
        if (!ticket) { isProcessing.current = false; return; }

        // ОПТИМИСТИЧНО обновляем UI сразу — без await
        setTickets(prev => prev.map(t =>
            String(t._id || t.id) === String(ticket._id)
                ? { ...t, status: newStatus as Ticket["status"] }
                : t
        ));

        // Затем делаем запросы в фоне
        const doAsync = async () => { try {
            await ticketService.updateStatus(String(ticket._id), newStatus);

            if (newStatus === "investigating") {
                // Создаём инцидент
                const desc = ticket.description && ticket.description.length >= 10
                    ? ticket.description
                    : (ticket.description || ticket.title || 'No description').padEnd(10, '.');
                const newIncident = await incidentService.create({
                    title: ticket.title, description: desc,
                    severity: "medium", type: "other", ticketId: ticket._id
                });
                setIncidents(prev => [newIncident, ...prev]);
                setSnackbar({ open: true, message: `⚠️ Incident created: ${ticket.title}`, severity: "success" });
            } else {
                // Синхронизируем статус связанного инцидента
                await syncIncidentStatus(String(ticket._id), newStatus);
                const incStatus = ticketToIncidentStatus[newStatus];
                setSnackbar({ open: true, message: incStatus
                        ? `Ticket → ${newStatus.toUpperCase()} | Incident → ${incStatus.toUpperCase()}`
                        : `Ticket → ${newStatus.toUpperCase()}`, severity: "success" });
            }
        } catch (error) {
            console.error(error);
            // Откатываем UI если запрос упал
            setTickets(prev => prev.map(t =>
                String(t._id || t.id) === String(ticket._id)
                    ? { ...t, status: oldStatus as Ticket["status"] }
                    : t
            ));
            setSnackbar({ open: true, message: "Failed to update ticket", severity: "error" });
        } finally {
            isProcessing.current = false;
        }};
        doAsync();
    };

    const renderColumn = (status: string, title: string) => {
        const columnTickets = tickets.filter(t => String(t.status) === String(status));
        const colColors: Record<string, string> = {
            new: '#2b4d7e', investigating: '#f57f17',
            monitoring: '#1565c0', resolved: '#2e7d32', closed: '#4527a0'
        };
        const borderColor = colColors[status] || '#2b4d7e';
        return (
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: borderColor }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: borderColor, textTransform: 'uppercase' }}>
                        {title}
                    </Typography>
                    <Chip label={columnTickets.length} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: borderColor, color: 'white', ml: 'auto' }} />
                </Box>
                <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                        <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                                bgcolor: snapshot.isDraggingOver ? 'rgba(43,77,126,0.1)' : 'rgba(43,77,126,0.03)',
                                p: 1,
                                minHeight: 400,
                                border: `2px dashed ${snapshot.isDraggingOver ? borderColor : 'rgba(43,77,126,0.15)'}`,
                                transition: 'all 0.2s',
                                borderRadius: 1
                            }}
                        >
                            {columnTickets.map((ticket, index) => {
                                const tId = String(ticket._id || ticket.id);
                                return (
                                    <Draggable key={tId} draggableId={tId} index={index}>
                                        {(provided, snapshot) => (
                                            <Paper
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                elevation={snapshot.isDragging ? 6 : 1}
                                                sx={{
                                                    p: 1.5, mb: 1.2, borderRadius: 1,
                                                    borderLeft: `4px solid ${borderColor}`,
                                                    bgcolor: snapshot.isDragging ? '#f0f4ff' : 'white',
                                                    cursor: 'grab',
                                                    userSelect: 'none',
                                                    transition: 'box-shadow 0.2s',
                                                }}
                                            >
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3, mb: 0.8, color: '#1a2a40' }}>
                                                    {ticket.title}
                                                </Typography>
                                                {ticket.type && (
                                                    <Chip label={ticket.type} size="small" sx={{ borderRadius: 1, mb: 0.8, fontSize: '0.62rem', bgcolor: '#e3f2fd', color: '#1565c0', height: 20 }} />
                                                )}
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <IconButton size="small" onClick={() => handleOpenDetails(ticket, 'ticket')} sx={{ color: '#2b4d7e', p: '3px' }} title="Details">
                                                        <InfoIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    {status === 'new' && (
                                                        <IconButton size="small" onClick={() => createIncident(ticket)} sx={{ color: '#d32f2f', p: '3px' }} title="Create Incident">
                                                            <WarningIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    )}
                                                    <IconButton size="small" onClick={() => handleDeleteTicket(tId)} sx={{ color: '#999', p: '3px', ml: 'auto !important' }}>
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Stack>
                                            </Paper>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </Box>
                    )}
                </Droppable>
            </Box>
        );
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress sx={{ color: '#2b4d7e' }} />
        </Box>
    );

    return (
        <Box sx={{ bgcolor: '#f4f7f9', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #2b4d7e', bgcolor: 'white' }}>
                <Typography variant="h4" sx={{ color: '#2b4d7e', fontWeight: 900 }}>CITY CONTROL</Typography>
                <Stack direction="row" spacing={1} sx={{ flexGrow: 1, mx: 4 }} alignItems="center">
                    <TextField
                        size="small" fullWidth placeholder="Search tickets & incidents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setSearchTerm(searchTerm.trim())}
                        sx={{ maxWidth: 350 }}
                    />
                    <Button variant="contained" onClick={() => setSearchTerm(searchTerm.trim())} sx={{ borderRadius: 0, bgcolor: '#2b4d7e', minWidth: 60 }}>OK</Button>
                    <Button variant="outlined" onClick={() => setSearchTerm('')} sx={{ borderRadius: 0, minWidth: 70 }}>Reset</Button>
                </Stack>
                <Stack direction="row" spacing={2}>
                    <Button variant="contained" color="error" startIcon={<WarningIcon />} onClick={() => setOpenAdminReport(true)} sx={{ borderRadius: 0, fontWeight: 'bold' }}>REPORT ADMIN</Button>
                    <Button variant="contained" onClick={async () => { await logout(); navigate('/login'); }} sx={{ borderRadius: 0, bgcolor: '#2b4d7e' }}>EXIT</Button>
                </Stack>
            </Box>

            <Box sx={{ p: 3 }}>
                {/* Dashboard */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 4 }}>
                        {renderColumn('new', 'Incoming')}
                        {renderColumn('investigating', 'Investigating')}
                        {renderColumn('monitoring', 'Monitoring')}
                        {renderColumn('resolved', 'Resolved')}
                        {renderColumn('closed', 'Closed')}
                    </Box>
                </DragDropContext>

                {/* Incidents Table */}
                <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid #2b4d7e' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#2b4d7e' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 900 }}>INCIDENT #</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900 }}>TITLE</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900 }}>STATUS</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900 }}>ENGINEER</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900, textAlign: 'center' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[...incidents]
                                .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
                                .filter(inc => inc.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((row) => {
                                    const styles = getStatusStyles(row.status ?? "new");
                                    return (
                                        <TableRow key={row._id} hover>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem' }}>{row.incidentNumber}</TableCell>
                                            <TableCell>
                                                <Typography onClick={() => handleOpenDetails(row, 'incident')}
                                                            sx={{ cursor: 'pointer', color: '#2b4d7e', textDecoration: 'underline', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                    {row.title}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 150 }}>
                                                <Select
                                                    size="small"
                                                    value={row.status ?? 'new'}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        try {
                                                            await incidentService.updateStatus(row._id, newStatus);
                                                            setIncidents(prev => prev.map(inc =>
                                                                inc._id === row._id ? { ...inc, status: newStatus as any } : inc
                                                            ));
                                                            setSnackbar({ open: true, message: `Status → ${newStatus.toUpperCase()}`, severity: 'success' });
                                                        } catch {
                                                            setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
                                                        }
                                                    }}
                                                    sx={{
                                                        borderRadius: 0, fontWeight: 'bold', fontSize: '0.72rem',
                                                        color: styles.text, bgcolor: styles.bg,
                                                        border: `1px solid ${styles.border}`,
                                                        width: '100%', maxWidth: 145,
                                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                        '& .MuiSelect-icon': { color: styles.text },
                                                        '& .MuiSelect-select': { py: '5px', px: '8px' }
                                                    }}
                                                >
                                                    {['new','investigating','identified','monitoring','resolved','closed'].map(s => {
                                                        const st = getStatusStyles(s);
                                                        return (
                                                            <MenuItem key={s} value={s} sx={{ fontSize: '0.72rem', fontWeight: 'bold', color: st.text }}>
                                                                {s.toUpperCase()}
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <IconButton size="small" title="Assign Engineer" onClick={() => { setSelectedItem(row); setOpenAssign(true); }} sx={{ color: '#2b4d7e', p: 0.5 }}>
                                                        <EngineeringIcon fontSize="small"/>
                                                    </IconButton>
                                                    <Typography variant="caption" sx={{ color: assignedEngineers[row._id] ? '#2b4d7e' : '#aaa', fontWeight: assignedEngineers[row._id] ? 'bold' : 'normal' }}>
                                                        {assignedEngineers[row._id] || '—'}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" color="error" onClick={() => handleDeleteIncident(row._id)}><DeleteIcon fontSize="small"/></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Details Dialog */}
            <Dialog open={openDetails} onClose={() => setOpenDetails(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 0 } }}>
                <DialogTitle sx={{ bgcolor: detailsType === 'ticket' ? '#2b4d7e' : '#d32f2f', color: 'white', fontWeight: 900 }}>
                    {detailsType === 'ticket' ? '🎫 TICKET DETAILS' : '⚠️ INCIDENT DETAILS'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {detailsItem && (
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">TITLE</Typography>
                                <Typography variant="body1" fontWeight="bold">{detailsItem.title}</Typography>
                            </Box>
                            {detailsItem.description && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">DESCRIPTION</Typography>
                                    <Typography variant="body2">{detailsItem.description}</Typography>
                                </Box>
                            )}
                            <Divider />
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                    <Person sx={{ color: '#2b4d7e', fontSize: 18 }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">CREATED BY</Typography>
                                </Stack>
                                <Typography variant="body2" fontWeight="bold">
                                    {detailsItem.createdBy?.username || detailsItem.createdBy?.email || detailsItem.createdBy || '—'}
                                </Typography>
                                {detailsItem.createdBy?.email && (
                                    <Typography variant="caption" color="text.secondary">{detailsItem.createdBy.email}</Typography>
                                )}
                            </Box>
                            <Divider />
                            <Stack direction="row" spacing={3}>
                                {detailsItem.status && <Box><Typography variant="caption" color="text.secondary">STATUS</Typography><Typography variant="body2" fontWeight="bold">{detailsItem.status.toUpperCase()}</Typography></Box>}
                                {detailsItem.type && <Box><Typography variant="caption" color="text.secondary">TYPE</Typography><Typography variant="body2" fontWeight="bold">{detailsItem.type}</Typography></Box>}
                                {detailsItem.severity && <Box><Typography variant="caption" color="text.secondary">SEVERITY</Typography><Typography variant="body2" fontWeight="bold">{detailsItem.severity.toUpperCase()}</Typography></Box>}
                            </Stack>
                            {(detailsItem.createdAt || detailsItem.date) && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary">DATE</Typography>
                                    <Typography variant="body2">{detailsItem.createdAt ? new Date(detailsItem.createdAt).toLocaleString() : detailsItem.date}</Typography>
                                </Box>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    {detailsType === 'ticket' && detailsItem && (
                        <Button variant="contained" color="error" startIcon={<WarningIcon />}
                                onClick={() => { createIncident(detailsItem); setOpenDetails(false); }}
                                sx={{ borderRadius: 0, fontWeight: 'bold' }}>
                            CREATE INCIDENT
                        </Button>
                    )}
                    <Button onClick={() => setOpenDetails(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Assign Engineer */}
            <Dialog open={openAssign} onClose={() => setOpenAssign(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>DISPATCH SPECIALIST</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                        <InputLabel>Select Engineer</InputLabel>
                        <Select label="Select Engineer" value={selectedEngineer} onChange={(e) => setSelectedEngineer(e.target.value)}>
                            {supportStaff.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
                    <Button variant="contained" disabled={!selectedEngineer} onClick={() => handleAction(`Engineer ${selectedEngineer} assigned!`)}>Confirm</Button>
                </DialogActions>
            </Dialog>

            {/* Admin Report */}
            <Dialog open={openAdminReport} onClose={() => setOpenAdminReport(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 900 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <WarningIcon />
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>URGENT ADMIN REPORT</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Describe the critical issue requiring immediate admin intervention.
                    </Typography>
                    <TextField fullWidth multiline rows={5} variant="outlined"
                               placeholder="Describe the situation in detail..."
                               value={messageText} onChange={(e) => setMessageText(e.target.value)}
                               autoFocus sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f4f7f9' }}>
                    <Button onClick={() => setOpenAdminReport(false)} color="inherit" sx={{ fontWeight: 'bold' }}>CANCEL</Button>
                    <Button variant="contained" color="error" disabled={!messageText.trim()}
                            onClick={() => handleAction('Critical report sent to administrator!', 'success')}
                            sx={{ borderRadius: 0, fontWeight: 'bold', px: 3 }}>
                        SEND REPORT
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

// Fix: PersonIcon used directly
const Person = PersonIcon;

export default SupportPage;
