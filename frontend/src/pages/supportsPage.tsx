import React, { useState, useEffect } from 'react';
import { useRef } from "react";
import {
    Box, Typography, Paper, Stack,
    Button, IconButton, TextField, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Snackbar, CircularProgress, Divider,
    Drawer, useMediaQuery, useTheme
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Engineering as EngineeringIcon,
    Person as PersonIcon,
    Info as InfoIcon,
    Menu as MenuIcon,
    Close as CloseIcon
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const isProcessing = useRef(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);

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
        if (openAssign && selectedItem && selectedEngineer)
            setAssignedEngineers(prev => ({ ...prev, [selectedItem._id]: selectedEngineer }));
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
        setDetailsItem(item); setDetailsType(type); setOpenDetails(true);
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
                    ? { ...t, status: 'investigating' as Ticket["status"] } : t
            ));
            setSnackbar({ open: true, message: '⚠️ Incident created!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create incident', severity: 'error' });
        }
    };

    const handleDeleteIncident = (id: string) => {
        setIncidents(prev => prev.filter(inc => inc._id !== id));
        setSnackbar({ open: true, message: 'Incident deleted', severity: 'error' });
    };

    const getStatusStyles = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'resolved')      return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
        if (s === 'closed')        return { bg: '#ede7f6', text: '#4527a0', border: '#b39ddb' };
        if (s === 'monitoring')    return { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' };
        if (s === 'investigating')  return { bg: '#fff8e1', text: '#f57f17', border: '#ffcc02' };
        if (s === 'identified')    return { bg: '#fce4ec', text: '#c62828', border: '#ef9a9a' };
        if (s === 'in-progress')   return { bg: '#fffde7', text: '#f57f17', border: '#fff59d' };
        return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };
    };

    const ticketToIncidentStatus: Record<string, string> = {
        'investigating': 'investigating', 'monitoring': 'monitoring',
        'resolved': 'resolved', 'closed': 'closed', 'in-progress': 'identified', 'new': 'new',
    };

    const syncIncidentStatus = async (ticketId: string, newTicketStatus: string) => {
        const linked = incidents.find(inc => {
            const tId = typeof inc.ticketId === 'object' ? String((inc.ticketId as any)?._id) : String(inc.ticketId);
            return tId === String(ticketId);
        });
        if (!linked) return;
        const incStatus = ticketToIncidentStatus[newTicketStatus];
        if (!incStatus) return;
        try {
            await incidentService.updateStatus(linked._id, incStatus);
            setIncidents(prev => prev.map(inc => inc._id === linked._id ? { ...inc, status: incStatus as any } : inc));
        } catch (e) { console.error('Failed to sync incident status', e); }
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

        setTickets(prev => prev.map(t =>
            String(t._id || t.id) === String(ticket._id) ? { ...t, status: newStatus as Ticket["status"] } : t
        ));

        const doAsync = async () => { try {
            await ticketService.updateStatus(String(ticket._id), newStatus);
            if (newStatus === "investigating") {
                const desc = ticket.description && ticket.description.length >= 10
                    ? ticket.description : (ticket.description || ticket.title || 'No description').padEnd(10, '.');
                const newIncident = await incidentService.create({
                    title: ticket.title, description: desc, severity: "medium", type: "other", ticketId: ticket._id
                });
                setIncidents(prev => [newIncident, ...prev]);
                setSnackbar({ open: true, message: `⚠️ Incident created: ${ticket.title}`, severity: "success" });
            } else {
                await syncIncidentStatus(String(ticket._id), newStatus);
                const incStatus = ticketToIncidentStatus[newStatus];
                setSnackbar({ open: true, message: incStatus
                        ? `Ticket → ${newStatus.toUpperCase()} | Incident → ${incStatus.toUpperCase()}`
                        : `Ticket → ${newStatus.toUpperCase()}`, severity: "success" });
            }
        } catch (error) {
            setTickets(prev => prev.map(t =>
                String(t._id || t.id) === String(ticket._id) ? { ...t, status: oldStatus as Ticket["status"] } : t
            ));
            setSnackbar({ open: true, message: "Failed to update ticket", severity: "error" });
        } finally { isProcessing.current = false; }};
        doAsync();
    };

    const renderColumn = (status: string, title: string) => {
        const columnTickets = tickets.filter(t => String(t.status) === String(status));
        const colColors: Record<string, string> = {
            new: '#2b4d7e', investigating: '#f57f17', monitoring: '#1565c0', resolved: '#2e7d32', closed: '#4527a0'
        };
        const borderColor = colColors[status] || '#2b4d7e';
        return (
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: borderColor }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: borderColor, textTransform: 'uppercase' }}>{title}</Typography>
                    <Chip label={columnTickets.length} size="small" sx={{ height: 20, fontSize: '0.72rem', bgcolor: borderColor, color: 'white', ml: 'auto' }} />
                </Box>
                <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                        <Box ref={provided.innerRef} {...provided.droppableProps} sx={{
                            bgcolor: snapshot.isDraggingOver ? 'rgba(43,77,126,0.1)' : 'rgba(43,77,126,0.03)',
                            p: 1, minHeight: isSmall ? 300 : 400,
                            border: `2px dashed ${snapshot.isDraggingOver ? borderColor : 'rgba(43,77,126,0.15)'}`,
                            transition: 'all 0.2s', borderRadius: 1
                        }}>
                            {columnTickets.map((ticket, index) => {
                                const tId = String(ticket._id || ticket.id);
                                return (
                                    <Draggable key={tId} draggableId={tId} index={index}>
                                        {(provided, snapshot) => (
                                            <Paper ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                   elevation={snapshot.isDragging ? 6 : 1}
                                                   sx={{ p: 1.5, mb: 1.2, borderRadius: 1, borderLeft: `4px solid ${borderColor}`,
                                                       bgcolor: snapshot.isDragging ? '#f0f4ff' : 'white',
                                                       cursor: 'grab', userSelect: 'none', transition: 'box-shadow 0.2s' }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, mb: 0.8, color: '#1a2a40' }}>
                                                    {ticket.title}
                                                </Typography>
                                                {ticket.type && (
                                                    <Chip label={ticket.type} size="small" sx={{ borderRadius: 1, mb: 0.8, fontSize: '0.72rem', bgcolor: '#e3f2fd', color: '#1565c0', height: 22 }} />
                                                )}
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <IconButton size="small" onClick={() => handleOpenDetails(ticket, 'ticket')} sx={{ color: '#2b4d7e', p: '3px' }}>
                                                        <InfoIcon sx={{ fontSize: 17 }} />
                                                    </IconButton>
                                                    {status === 'new' && (
                                                        <IconButton size="small" onClick={() => createIncident(ticket)} sx={{ color: '#d32f2f', p: '3px' }}>
                                                            <WarningIcon sx={{ fontSize: 17 }} />
                                                        </IconButton>
                                                    )}
                                                    <IconButton size="small" onClick={() => handleDeleteTicket(tId)} sx={{ color: '#999', p: '3px', ml: 'auto !important' }}>
                                                        <DeleteIcon sx={{ fontSize: 17 }} />
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
            <Box sx={{ p: 2, px: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #2b4d7e', bgcolor: 'white', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant={isSmall ? 'h6' : 'h5'} sx={{ color: '#2b4d7e', fontWeight: 900 }}>CITY CONTROL</Typography>

                {!isSmall && (
                    <Stack direction="row" spacing={1} sx={{ flexGrow: 1, mx: 2, maxWidth: 400 }} alignItems="center">
                        <TextField size="small" fullWidth placeholder="Search tickets & incidents..."
                                   value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && setSearchTerm(searchTerm.trim())}
                                   sx={{ maxWidth: 300 }} />
                        <Button variant="contained" onClick={() => setSearchTerm(searchTerm.trim())} sx={{ borderRadius: 0, bgcolor: '#2b4d7e', minWidth: 50 }}>OK</Button>
                        <Button variant="outlined" onClick={() => setSearchTerm('')} sx={{ borderRadius: 0 }}>↺</Button>
                    </Stack>
                )}

                {isMobile ? (
                    <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#2b4d7e' }}>
                        <MenuIcon />
                    </IconButton>
                ) : (
                    <Stack direction="row" spacing={1.5}>
                        <Button variant="contained" color="error" startIcon={<WarningIcon />} onClick={() => setOpenAdminReport(true)} sx={{ borderRadius: 0, fontWeight: 'bold' }}>REPORT ADMIN</Button>
                        <Button variant="contained" onClick={async () => { await logout(); navigate('/login'); }} sx={{ borderRadius: 0, bgcolor: '#2b4d7e' }}>EXIT</Button>
                    </Stack>
                )}
            </Box>

            {/* Mobile search */}
            {isSmall && (
                <Box sx={{ px: 2, py: 1, bgcolor: '#e8eef5', display: 'flex', gap: 1 }}>
                    <TextField size="small" fullWidth placeholder="Search..." value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                               sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
                    <Button variant="contained" onClick={() => setSearchTerm('')} sx={{ borderRadius: 0, bgcolor: '#2b4d7e', minWidth: 40 }}>↺</Button>
                </Box>
            )}

            {/* Mobile Drawer */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 240, p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography fontWeight="bold">MENU</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
                    </Stack>
                    <Stack spacing={1}>
                        <Button variant="contained" color="error" startIcon={<WarningIcon />} fullWidth
                                onClick={() => { setOpenAdminReport(true); setDrawerOpen(false); }} sx={{ borderRadius: 0, fontWeight: 'bold' }}>REPORT ADMIN</Button>
                        <Button variant="contained" fullWidth onClick={async () => { await logout(); navigate('/login'); }}
                                sx={{ borderRadius: 0, bgcolor: '#2b4d7e' }}>EXIT</Button>
                    </Stack>
                </Box>
            </Drawer>

            <Box sx={{ p: { xs: 1.5, md: 3 } }}>
                {/* Kanban Board */}
                <DragDropContext onDragEnd={onDragEnd}>
                    {/* Desktop: all 5 columns in a row. Mobile: wrap into rows of 2-3 */}
                    <Box sx={{
                        display: 'flex', gap: 1.5, mb: 4,
                        flexWrap: { xs: 'wrap', md: 'nowrap' },
                    }}>
                        <Box sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '1 1 calc(33% - 8px)', md: 1 }, minWidth: 0 }}>
                            {renderColumn('new', 'Incoming')}
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '1 1 calc(33% - 8px)', md: 1 }, minWidth: 0 }}>
                            {renderColumn('investigating', 'Investigating')}
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '1 1 calc(33% - 8px)', md: 1 }, minWidth: 0 }}>
                            {renderColumn('monitoring', 'Monitoring')}
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '1 1 calc(33% - 8px)', md: 1 }, minWidth: 0 }}>
                            {renderColumn('resolved', 'Resolved')}
                        </Box>
                        <Box sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '1 1 calc(33% - 8px)', md: 1 }, minWidth: 0 }}>
                            {renderColumn('closed', 'Closed')}
                        </Box>
                    </Box>
                </DragDropContext>

                {/* Incidents Table */}
                <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid #2b4d7e', overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: { xs: 480, md: 'auto' } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#2b4d7e' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>INC #</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>TITLE</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>STATUS</TableCell>
                                {!isSmall && <TableCell sx={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>ENGINEER</TableCell>}
                                <TableCell sx={{ color: 'white', fontWeight: 900, textAlign: 'center', fontSize: '1rem' }}>ACT</TableCell>
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
                                            <TableCell sx={{ fontWeight: 800, fontSize: '1rem' }}>{row.incidentNumber}</TableCell>
                                            <TableCell>
                                                <Typography onClick={() => handleOpenDetails(row, 'incident')}
                                                            sx={{ cursor: 'pointer', color: '#2b4d7e', textDecoration: 'underline', fontWeight: 'bold', fontSize: '1rem' }}>
                                                    {row.title}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 130 }}>
                                                <Select size="small" value={row.status ?? 'new'}
                                                        onChange={async (e) => {
                                                            const newStatus = e.target.value;
                                                            // Map incident status → ticket status for the kanban board
                                                            const incidentToTicketStatus: Record<string, string> = {
                                                                'new': 'new',
                                                                'investigating': 'investigating',
                                                                'identified': 'investigating',
                                                                'in-progress': 'investigating',
                                                                'monitoring': 'monitoring',
                                                                'resolved': 'resolved',
                                                                'closed': 'closed',
                                                            };
                                                            try {
                                                                await incidentService.updateStatus(row._id, newStatus);
                                                                // Update incident in table
                                                                setIncidents(prev => prev.map(inc => inc._id === row._id ? { ...inc, status: newStatus as any } : inc));
                                                                // Sync linked ticket on the kanban board
                                                                const ticketStatus = incidentToTicketStatus[newStatus];
                                                                if (ticketStatus && row.ticketId) {
                                                                    const linkedTicketId = typeof row.ticketId === 'object'
                                                                        ? String((row.ticketId as any)?._id)
                                                                        : String(row.ticketId);
                                                                    setTickets(prev => prev.map(t =>
                                                                        String(t._id || t.id) === linkedTicketId
                                                                            ? { ...t, status: ticketStatus as Ticket['status'] }
                                                                            : t
                                                                    ));
                                                                }
                                                                setSnackbar({ open: true, message: `Status → ${newStatus.toUpperCase()}`, severity: 'success' });
                                                            } catch {
                                                                setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
                                                            }
                                                        }}
                                                        sx={{ borderRadius: 0, fontWeight: 'bold', fontSize: '0.875rem',
                                                            color: styles.text, bgcolor: styles.bg, border: `1px solid ${styles.border}`,
                                                            width: '100%', maxWidth: 130,
                                                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                            '& .MuiSelect-icon': { color: styles.text },
                                                            '& .MuiSelect-select': { py: '4px', px: '6px' } }}>
                                                    {['new','investigating','identified','monitoring','resolved','closed'].map(s => {
                                                        const st = getStatusStyles(s);
                                                        return <MenuItem key={s} value={s} sx={{ fontSize: '0.875rem', fontWeight: 'bold', color: st.text }}>{s.toUpperCase()}</MenuItem>;
                                                    })}
                                                </Select>
                                            </TableCell>
                                            {!isSmall && (
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <IconButton size="small" onClick={() => { setSelectedItem(row); setOpenAssign(true); }} sx={{ color: '#2b4d7e', p: 0.5 }}>
                                                            <EngineeringIcon fontSize="small" />
                                                        </IconButton>
                                                        <Typography variant="caption" sx={{ color: assignedEngineers[row._id] ? '#2b4d7e' : '#aaa', fontWeight: assignedEngineers[row._id] ? 'bold' : 'normal' }}>
                                                            {assignedEngineers[row._id] || '—'}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                            )}
                                            <TableCell align="center">
                                                <IconButton size="small" color="error" onClick={() => handleDeleteIncident(row._id)}><DeleteIcon fontSize="small" /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Details Dialog */}
            <Dialog open={openDetails} onClose={() => setOpenDetails(false)} fullWidth maxWidth="sm" fullScreen={isSmall} PaperProps={{ sx: { borderRadius: 0 } }}>
                <DialogTitle sx={{ bgcolor: detailsType === 'ticket' ? '#2b4d7e' : '#d32f2f', color: 'white', fontWeight: 900 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={900}>{detailsType === 'ticket' ? '🎫 TICKET DETAILS' : '⚠️ INCIDENT DETAILS'}</Typography>
                        {isSmall && <IconButton size="small" onClick={() => setOpenDetails(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>}
                    </Stack>
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
                                <Typography variant="caption" color="text.secondary" fontWeight="bold">CREATED BY</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {detailsItem.createdBy?.username || detailsItem.createdBy?.email || detailsItem.createdBy || '—'}
                                </Typography>
                            </Box>
                            <Divider />
                            <Stack direction="row" spacing={3} flexWrap="wrap">
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
                                sx={{ borderRadius: 0, fontWeight: 'bold' }}>CREATE INCIDENT</Button>
                    )}
                    <Button onClick={() => setOpenDetails(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Assign Engineer */}
            <Dialog open={openAssign} onClose={() => setOpenAssign(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>DISPATCH SPECIALIST</DialogTitle>
                <DialogContent sx={{ minWidth: { xs: 280, sm: 300 }, pt: 2 }}>
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
            <Dialog open={openAdminReport} onClose={() => setOpenAdminReport(false)} fullWidth maxWidth="sm" fullScreen={isSmall}>
                <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 900 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <WarningIcon />
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>URGENT ADMIN REPORT</Typography>
                        </Stack>
                        {isSmall && <IconButton size="small" onClick={() => setOpenAdminReport(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>}
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Describe the critical issue requiring immediate admin intervention.
                    </Typography>
                    <TextField fullWidth multiline rows={5} placeholder="Describe the situation in detail..."
                               value={messageText} onChange={(e) => setMessageText(e.target.value)}
                               autoFocus sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f4f7f9' }}>
                    <Button onClick={() => setOpenAdminReport(false)} color="inherit" sx={{ fontWeight: 'bold' }}>CANCEL</Button>
                    <Button variant="contained" color="error" disabled={!messageText.trim()}
                            onClick={() => handleAction('Critical report sent to administrator!', 'success')}
                            sx={{ borderRadius: 0, fontWeight: 'bold', px: 3 }}>SEND REPORT</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

const Person = PersonIcon;
export default SupportPage;
