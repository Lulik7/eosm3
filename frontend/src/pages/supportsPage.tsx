import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box, Typography, Paper, Stack,
    Button, IconButton, TextField, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Snackbar, CircularProgress, Divider, Badge, List, ListItem, ListItemText,
    Drawer, useMediaQuery, useTheme
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Engineering as EngineeringIcon,
    Info as InfoIcon,
    Menu as MenuIcon,
    Close as CloseIcon,
    MoveToInbox as InboxIcon,
    Chat as ChatIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { ticketService } from '../services/ticketService';
import { incidentService } from '../services/incidentService';
import { Ticket } from '../types/ticket';
import { Incident } from '../types/incident';

interface SupportPageProps {
    logout: () => Promise<void>;
}

const BASE_URL = 'http://localhost:3000';

const supportStaff = [
    "Michael Scott","Dwight Schrute","Jim Halpert","Pam Beesly","Ryan Howard",
    "Kelly Kapoor","Stanley Hudson","Kevin Malone","Angela Martin","Oscar Martinez"
];

const getStatusStyles = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved')     return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
    if (s === 'closed')       return { bg: '#ede7f6', text: '#4527a0', border: '#b39ddb' };
    if (s === 'monitoring')   return { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' };
    if (s === 'investigating') return { bg: '#fff8e1', text: '#f57f17', border: '#ffcc02' };
    if (s === 'identified')   return { bg: '#fce4ec', text: '#c62828', border: '#ef9a9a' };
    if (s === 'in-progress')  return { bg: '#fffde7', text: '#f57f17', border: '#fff59d' };
    return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };
};

const TICKET_TO_INCIDENT: Record<string, string> = {
    new: 'new', investigating: 'investigating', monitoring: 'monitoring',
    resolved: 'resolved', closed: 'closed', 'in-progress': 'identified',
};

const INCIDENT_TO_TICKET: Record<string, string> = {
    new: 'new', investigating: 'investigating', identified: 'investigating',
    'in-progress': 'investigating', monitoring: 'monitoring',
    resolved: 'resolved', closed: 'closed',
};

// ── Isolated dialog — текст хранится локально, не вызывает ре-рендер родителя ──
interface AdminReportDialogProps {
    open: boolean;
    isSmall: boolean;
    onClose: () => void;
    onSend: (text: string) => Promise<void>;
}
const AdminReportDialog: React.FC<AdminReportDialogProps> = React.memo(({ open, isSmall, onClose, onSend }) => {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const handleSend = async () => {
        const txt = text.trim();
        if (!txt || sending) return;
        setSending(true);
        try { await onSend(txt); setText(''); onClose(); }
        finally { setSending(false); }
    };
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isSmall}>
            <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 900 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <WarningIcon />
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>URGENT ADMIN REPORT</Typography>
                    </Stack>
                    {isSmall && <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>}
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Describe the critical issue requiring immediate admin intervention.
                </Typography>
                <TextField
                    fullWidth multiline rows={5}
                    placeholder="Describe the situation in detail..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    autoFocus
                />
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f4f7f9' }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 'bold' }}>CANCEL</Button>
                <Button variant="contained" color="error" onClick={handleSend} disabled={sending}
                        sx={{ borderRadius: 0, fontWeight: 'bold', px: 3 }}>
                    {sending ? <CircularProgress size={20} color="inherit" /> : 'SEND REPORT'}
                </Button>
            </DialogActions>
        </Dialog>
    );
});

interface InboxDialogProps {
    open: boolean;
    isSmall: boolean;
    inbox: any[];
    onClose: () => void;
    onSend: (text: string) => Promise<void>;
}
const InboxDialog: React.FC<InboxDialogProps> = React.memo(({ open, isSmall, inbox, onClose, onSend }) => {
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const handleSend = async () => {
        if (!reply.trim() || sending) return;
        setSending(true);
        try { await onSend(reply); setReply(''); }
        finally { setSending(false); }
    };
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={isSmall}>
            <DialogTitle sx={{ bgcolor: '#2b4d7e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <ChatIcon />
                    <Typography fontWeight={900}>Incoming Messages</Typography>
                </Stack>
                <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <List disablePadding>
                    {inbox.length === 0 ? (
                        <ListItem><ListItemText primary="No messages" secondary="Your inbox is empty" /></ListItem>
                    ) : inbox.map((msg: any, i: number) => (
                        <React.Fragment key={msg._id}>
                            {i > 0 && <Divider />}
                            <ListItem alignItems="flex-start" sx={{ bgcolor: msg.read ? 'transparent' : 'rgba(43,77,126,0.05)' }}>
                                <ListItemText
                                    primary={
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography fontWeight={msg.read ? 400 : 700}
                                                        sx={{ color: '#2b4d7e', textTransform: 'capitalize', fontSize: '0.9rem' }}>
                                                From: {msg.fromUsername} ({msg.from})
                                            </Typography>
                                            {!msg.read && <Chip label="NEW" size="small" sx={{ bgcolor: '#2b4d7e', color: 'white', fontSize: '0.6rem', height: 18 }} />}
                                        </Stack>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>{msg.text}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(msg.createdAt).toLocaleString()}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </DialogContent>
            <DialogContent sx={{ borderTop: '1px solid #e0e0e0', pt: 2 }}>
                <Typography variant="caption" sx={{ color: '#999', textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                    Send message to Admin
                </Typography>
                <Stack direction="row" spacing={1}>
                    <TextField
                        fullWidth size="small" multiline maxRows={3}
                        placeholder="Type your message..."
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    />
                    <Button variant="contained" onClick={handleSend} disabled={sending}
                            sx={{ bgcolor: '#2b4d7e', borderRadius: 0, minWidth: 48, px: 1.5, '&:hover': { bgcolor: '#1a3254' } }}>
                        {sending ? <CircularProgress size={16} color="inherit" /> : '➤'}
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
        </Dialog>
    );
});

const SupportPage: React.FC<SupportPageProps> = ({ logout }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmall  = useMediaQuery(theme.breakpoints.down('sm'));
    const isProcessing = useRef(false);

    const [tickets,           setTickets]           = useState<Ticket[]>([]);
    const [incidents,         setIncidents]          = useState<Incident[]>([]);
    const [loading,           setLoading]            = useState(true);
    const [searchTerm,        setSearchTerm]         = useState('');
    const [drawerOpen,        setDrawerOpen]         = useState(false);
    const [inboxOpen,         setInboxOpen]          = useState(false);
    const [inbox,             setInbox]              = useState<any[]>([]);
    const [unreadCount,       setUnreadCount]        = useState(0);

    const [openAdminReport,   setOpenAdminReport]    = useState(false);
    const [openAssign,        setOpenAssign]         = useState(false);
    const [openDetails,       setOpenDetails]        = useState(false);
    const [detailsItem,       setDetailsItem]        = useState<any>(null);
    const [detailsType,       setDetailsType]        = useState<'ticket'|'incident'>('ticket');
    const [selectedItem,      setSelectedItem]       = useState<any>(null);
    const [selectedEngineer,  setSelectedEngineer]   = useState('');
    const [assignedEngineers, setAssignedEngineers]  = useState<Record<string,string>>({});
    const [snackbar,          setSnackbar]           = useState({ open: false, message: '', severity: 'success' as 'success'|'error' });

    const showSnack = useCallback((message: string, severity: 'success'|'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [t, i] = await Promise.all([ticketService.getTickets(), incidentService.getAll()]);
                if (cancelled) return;
                setTickets(Array.isArray(t) ? t : []);
                setIncidents(Array.isArray(i) ? i : []);
            } catch (e) { console.error(e); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, []);

    // ── Messaging ─────────────────────────────────────────────────────────────
    const fetchMessages = useCallback(async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/messages/inbox`, { withCredentials: true });
            const msgs = Array.isArray(res.data) ? res.data : [];
            setInbox(msgs);
            setUnreadCount(msgs.filter((m: any) => !m.read).length);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchMessages();
        const t = setInterval(fetchMessages, 30000);
        return () => clearInterval(t);
    }, [fetchMessages]);

    const handleSendToAdmin = useCallback(async (text: string) => {
        if (!text.trim()) return;
        try {
            await axios.post(`${BASE_URL}/api/messages`, { to: 'admin', text }, { withCredentials: true });
            showSnack('Message sent to Admin!');
        } catch (err: any) {
            const detail = err?.response?.data?.message || err?.response?.status || err?.message || 'unknown';
            console.error('Send message error:', detail, err?.response?.data);
            showSnack(`Error: ${detail}`, 'error');
        }
    }, [showSnack]);

    const handleOpenInbox = useCallback(async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/messages/inbox`, { withCredentials: true });
            const msgs = Array.isArray(res.data) ? res.data : [];
            msgs.forEach((m: any) => {
                if (!m.read) {
                    axios.patch(`${BASE_URL}/api/messages/${m._id}/read`, {}, { withCredentials: true }).catch(() => {});
                }
            });
            setInbox(msgs.map((m: any) => ({ ...m, read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
        setInboxOpen(true);
    }, []);

    // ── Ticket actions ────────────────────────────────────────────────────────
    const handleDeleteTicket = useCallback((id: string) => {
        setTickets(prev => prev.filter(t => String(t._id || t.id) !== id));
        showSnack('Ticket removed', 'error');
    }, [showSnack]);

    const handleOpenDetails = useCallback((item: any, type: 'ticket'|'incident') => {
        setDetailsItem(item);
        setDetailsType(type);
        setOpenDetails(true);
    }, []);

    const createIncident = useCallback(async (ticket: Ticket) => {
        try {
            const desc = ticket.description && ticket.description.length >= 10
                ? ticket.description
                : (ticket.description || ticket.title || 'No description').padEnd(10, '.');
            const newInc = await incidentService.create({
                title: ticket.title, description: desc,
                severity: 'medium', type: 'other', ticketId: ticket._id,
            });
            setIncidents(prev => [newInc, ...prev]);
            setTickets(prev => prev.map(t =>
                String(t._id || t.id) === String(ticket._id || ticket.id)
                    ? { ...t, status: 'investigating' as Ticket['status'] } : t
            ));
            showSnack('⚠️ Incident created!');
        } catch {
            showSnack('Failed to create incident', 'error');
        }
    }, [showSnack]);

    const handleDeleteIncident = useCallback((id: string) => {
        setIncidents(prev => prev.filter(inc => inc._id !== id));
        showSnack('Incident deleted', 'error');
    }, [showSnack]);

    const handleIncidentStatusChange = useCallback(async (rowId: string, newStatus: string, ticketId: any) => {
        try {
            await incidentService.updateStatus(rowId, newStatus);
            setIncidents(prev => prev.map(inc => inc._id === rowId ? { ...inc, status: newStatus as any } : inc));
            const ticketStatus = INCIDENT_TO_TICKET[newStatus];
            if (ticketStatus && ticketId) {
                const tid = typeof ticketId === 'object' ? String((ticketId as any)?._id) : String(ticketId);
                setTickets(prev => prev.map(t =>
                    String(t._id || t.id) === tid ? { ...t, status: ticketStatus as Ticket['status'] } : t
                ));
            }
            showSnack(`Status → ${newStatus.toUpperCase()}`);
        } catch {
            showSnack('Failed to update status', 'error');
        }
    }, [showSnack]);

    const syncIncidentStatus = useCallback(async (ticketId: string, newTicketStatus: string) => {
        setIncidents(prev => {
            const linked = prev.find(inc => {
                const tid = typeof inc.ticketId === 'object'
                    ? String((inc.ticketId as any)?._id) : String(inc.ticketId);
                return tid === String(ticketId);
            });
            if (!linked) return prev;
            const incStatus = TICKET_TO_INCIDENT[newTicketStatus];
            if (!incStatus) return prev;
            incidentService.updateStatus(linked._id, incStatus).catch(console.error);
            return prev.map(inc => inc._id === linked._id ? { ...inc, status: incStatus as any } : inc);
        });
    }, []);

    const onDragEnd = useCallback((result: DropResult) => {
        if (isProcessing.current) return;
        const { source, destination, draggableId } = result;
        if (!destination || source.droppableId === destination.droppableId) return;
        const oldStatus = source.droppableId;
        const newStatus = destination.droppableId;
        const ticket = tickets.find(t => String(t._id || t.id) === String(draggableId));
        if (!ticket) return;
        isProcessing.current = true;

        setTickets(prev => prev.map(t =>
            String(t._id || t.id) === String(ticket._id)
                ? { ...t, status: newStatus as Ticket['status'] } : t
        ));

        (async () => {
            try {
                await ticketService.updateStatus(String(ticket._id), newStatus);
                if (newStatus === 'investigating') {
                    const desc = ticket.description && ticket.description.length >= 10
                        ? ticket.description
                        : (ticket.description || ticket.title || 'No description').padEnd(10, '.');
                    const newInc = await incidentService.create({
                        title: ticket.title, description: desc,
                        severity: 'medium', type: 'other', ticketId: ticket._id,
                    });
                    setIncidents(prev => [newInc, ...prev]);
                    showSnack(`⚠️ Incident created: ${ticket.title}`);
                } else {
                    await syncIncidentStatus(String(ticket._id), newStatus);
                    const incStatus = TICKET_TO_INCIDENT[newStatus];
                    showSnack(incStatus
                        ? `Ticket → ${newStatus.toUpperCase()} | Incident → ${incStatus.toUpperCase()}`
                        : `Ticket → ${newStatus.toUpperCase()}`);
                }
            } catch {
                setTickets(prev => prev.map(t =>
                    String(t._id || t.id) === String(ticket._id)
                        ? { ...t, status: oldStatus as Ticket['status'] } : t
                ));
                showSnack('Failed to update ticket', 'error');
            } finally {
                isProcessing.current = false;
            }
        })();
    }, [tickets, showSnack, syncIncidentStatus]);

    // ── Kanban column (memoised — only rerenders when tickets change) ─────────
    const renderColumn = useCallback((status: string, title: string) => {
        const colTickets = tickets.filter(t => String(t.status) === status);
        const colColors: Record<string, string> = {
            new: '#2b4d7e', investigating: '#f57f17', monitoring: '#1565c0',
            resolved: '#2e7d32', closed: '#4527a0',
        };
        const color = colColors[status] || '#2b4d7e';
        return (
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color, textTransform: 'uppercase' }}>{title}</Typography>
                    <Chip label={colTickets.length} size="small"
                          sx={{ height: 20, fontSize: '0.72rem', bgcolor: color, color: 'white', ml: 'auto' }} />
                </Box>
                <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                        <Box ref={provided.innerRef} {...provided.droppableProps} sx={{
                            bgcolor: snapshot.isDraggingOver ? 'rgba(43,77,126,0.1)' : 'rgba(43,77,126,0.03)',
                            p: 1, minHeight: isSmall ? 300 : 400,
                            border: `2px dashed ${snapshot.isDraggingOver ? color : 'rgba(43,77,126,0.15)'}`,
                            transition: 'all 0.2s', borderRadius: 1,
                        }}>
                            {colTickets.map((ticket, index) => {
                                const tId = String(ticket._id || ticket.id);
                                return (
                                    <Draggable key={tId} draggableId={tId} index={index}>
                                        {(provided, snapshot) => (
                                            <Paper ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                   elevation={snapshot.isDragging ? 6 : 1}
                                                   sx={{ p: 1.5, mb: 1.2, borderRadius: 1, borderLeft: `4px solid ${color}`,
                                                       bgcolor: snapshot.isDragging ? '#f0f4ff' : 'white',
                                                       cursor: 'grab', userSelect: 'none', transition: 'box-shadow 0.2s' }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, mb: 0.8, color: '#1a2a40' }}>
                                                    {ticket.title}
                                                </Typography>
                                                {ticket.type && (
                                                    <Chip label={ticket.type} size="small"
                                                          sx={{ borderRadius: 1, mb: 0.8, fontSize: '0.72rem', bgcolor: '#e3f2fd', color: '#1565c0', height: 22 }} />
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
    }, [tickets, isSmall, handleOpenDetails, createIncident, handleDeleteTicket]);

    const filteredIncidents = useMemo(() =>
            [...incidents]
                .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
                .filter(inc => inc.title.toLowerCase().includes(searchTerm.toLowerCase())),
        [incidents, searchTerm]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress sx={{ color: '#2b4d7e' }} />
        </Box>
    );

    return (
        <Box sx={{ bgcolor: '#f4f7f9', minHeight: '100vh' }}>

            {/* ── Header ── */}
            <Box sx={{ p: 2, px: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', borderBottom: '3px solid #2b4d7e', bgcolor: 'white', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant={isSmall ? 'h6' : 'h5'} sx={{ color: '#2b4d7e', fontWeight: 900 }}>CITY CONTROL</Typography>

                {!isSmall && (
                    <Stack direction="row" spacing={1} sx={{ flexGrow: 1, mx: 2, maxWidth: 400 }} alignItems="center">
                        <TextField size="small" fullWidth placeholder="Search tickets & incidents..."
                                   value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                   sx={{ maxWidth: 300 }} />
                        <Button variant="outlined" onClick={() => setSearchTerm('')} sx={{ borderRadius: 0 }}>↺</Button>
                    </Stack>
                )}

                {isMobile ? (
                    <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#2b4d7e' }}>
                        <MenuIcon />
                    </IconButton>
                ) : (
                    <Stack direction="row" spacing={1.5}>
                        <Button variant="contained" color="error" startIcon={<WarningIcon />}
                                onClick={() => setOpenAdminReport(true)} sx={{ borderRadius: 0, fontWeight: 'bold' }}>
                            REPORT ADMIN
                        </Button>
                        <IconButton onClick={handleOpenInbox} sx={{ color: '#2b4d7e', border: '1px solid #2b4d7e' }}>
                            <Badge badgeContent={unreadCount} color="error"><InboxIcon /></Badge>
                        </IconButton>
                        <Button variant="contained" onClick={async () => { await logout(); navigate('/login'); }}
                                sx={{ borderRadius: 0, bgcolor: '#2b4d7e' }}>EXIT</Button>
                    </Stack>
                )}
            </Box>

            {/* Mobile search */}
            {isSmall && (
                <Box sx={{ px: 2, py: 1, bgcolor: '#e8eef5', display: 'flex', gap: 1 }}>
                    <TextField size="small" fullWidth placeholder="Search..." value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                               sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
                    <Button variant="contained" onClick={() => setSearchTerm('')}
                            sx={{ borderRadius: 0, bgcolor: '#2b4d7e', minWidth: 40 }}>↺</Button>
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
                                onClick={() => { setOpenAdminReport(true); setDrawerOpen(false); }}
                                sx={{ borderRadius: 0, fontWeight: 'bold' }}>REPORT ADMIN</Button>
                        <Button fullWidth onClick={() => { handleOpenInbox(); setDrawerOpen(false); }}
                                startIcon={<Badge badgeContent={unreadCount} color="error"><InboxIcon /></Badge>}
                                sx={{ justifyContent: 'flex-start', color: '#2b4d7e', border: '1px solid #2b4d7e', borderRadius: 0, py: 1 }}>
                            Inbox {unreadCount > 0 ? `(${unreadCount})` : ''}
                        </Button>
                        <Button variant="contained" fullWidth onClick={async () => { await logout(); navigate('/login'); }}
                                sx={{ borderRadius: 0, bgcolor: '#2b4d7e' }}>EXIT</Button>
                    </Stack>
                </Box>
            </Drawer>

            <Box sx={{ p: { xs: 1.5, md: 3 } }}>

                {/* ── Kanban ── */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                        {[
                            { status: 'new',          title: 'Incoming' },
                            { status: 'investigating', title: 'Investigating' },
                            { status: 'monitoring',   title: 'Monitoring' },
                            { status: 'resolved',     title: 'Resolved' },
                            { status: 'closed',       title: 'Closed' },
                        ].map(({ status, title }) => (
                            <Box key={status} sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '1 1 calc(33% - 8px)', md: 1 }, minWidth: 0 }}>
                                {renderColumn(status, title)}
                            </Box>
                        ))}
                    </Box>
                </DragDropContext>

                {/* ── Incidents Table ── */}
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
                            {filteredIncidents.map((row) => {
                                const styles = getStatusStyles(row.status ?? 'new');
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
                                                    onChange={(e) => handleIncidentStatusChange(row._id, e.target.value, row.ticketId)}
                                                    sx={{ borderRadius: 0, fontWeight: 'bold', fontSize: '0.875rem',
                                                        color: styles.text, bgcolor: styles.bg, border: `1px solid ${styles.border}`,
                                                        width: '100%', maxWidth: 130,
                                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                        '& .MuiSelect-icon': { color: styles.text },
                                                        '& .MuiSelect-select': { py: '4px', px: '6px' } }}>
                                                {['new','investigating','identified','monitoring','resolved','closed'].map(s => {
                                                    const st = getStatusStyles(s);
                                                    return (
                                                        <MenuItem key={s} value={s}
                                                                  sx={{ fontSize: '0.875rem', fontWeight: 'bold', color: st.text }}>
                                                            {s.toUpperCase()}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </Select>
                                        </TableCell>
                                        {!isSmall && (
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <IconButton size="small"
                                                                onClick={() => { setSelectedItem(row); setOpenAssign(true); }}
                                                                sx={{ color: '#2b4d7e', p: 0.5 }}>
                                                        <EngineeringIcon fontSize="small" />
                                                    </IconButton>
                                                    <Typography variant="caption"
                                                                sx={{ color: assignedEngineers[row._id] ? '#2b4d7e' : '#aaa',
                                                                    fontWeight: assignedEngineers[row._id] ? 'bold' : 'normal' }}>
                                                        {assignedEngineers[row._id] || '—'}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        )}
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" onClick={() => handleDeleteIncident(row._id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* ── Details Dialog ── */}
            <Dialog open={openDetails} onClose={() => setOpenDetails(false)} fullWidth maxWidth="sm" fullScreen={isSmall}
                    PaperProps={{ sx: { borderRadius: 0 } }}>
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
                                    <Typography variant="body2">
                                        {detailsItem.createdAt ? new Date(detailsItem.createdAt).toLocaleString() : detailsItem.date}
                                    </Typography>
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

            {/* ── Assign Engineer ── */}
            <Dialog open={openAssign} onClose={() => setOpenAssign(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>DISPATCH SPECIALIST</DialogTitle>
                <DialogContent sx={{ minWidth: { xs: 280, sm: 300 }, pt: 2 }}>
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                        <InputLabel>Select Engineer</InputLabel>
                        <Select label="Select Engineer" value={selectedEngineer}
                                onChange={(e) => setSelectedEngineer(e.target.value)}>
                            {supportStaff.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
                    <Button variant="contained" disabled={!selectedEngineer} onClick={() => {
                        if (selectedItem && selectedEngineer) {
                            setAssignedEngineers(prev => ({ ...prev, [selectedItem._id]: selectedEngineer }));
                            showSnack(`Engineer ${selectedEngineer} assigned!`);
                        }
                        setOpenAssign(false);
                        setSelectedEngineer('');
                    }}>Confirm</Button>
                </DialogActions>
            </Dialog>

            {/* ── Admin Report Dialog ── */}
            <AdminReportDialog
                open={openAdminReport}
                isSmall={isSmall}
                onClose={() => setOpenAdminReport(false)}
                onSend={handleSendToAdmin}
            />

            {/* ── Inbox Dialog ── */}
            <InboxDialog
                open={inboxOpen}
                isSmall={isSmall}
                inbox={inbox}
                onClose={() => setInboxOpen(false)}
                onSend={handleSendToAdmin}
            />

            <Snackbar open={snackbar.open} autoHideDuration={3000}
                      onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default SupportPage;
