import React, { useState, useEffect } from 'react';
import { useRef } from "react";
import {
    Box, Typography, Paper, Stack,
    Button, IconButton, TextField, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Snackbar, CircularProgress
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Email as EmailIcon,
    Edit as EditIcon,
    Warning as WarningIcon,
    Engineering as EngineeringIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';

// --- ИМПОРТ СЕРВИСОВ ---
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

    // Состояния для диалогов
    const [openAdminReport, setOpenAdminReport] = useState(false);
    const [openUserMail, setOpenUserMail] = useState(false);
    const [openEngineerMail, setOpenEngineerMail] = useState(false);
    const [openAssign, setOpenAssign] = useState(false);
    const [openEditStatus, setOpenEditStatus] = useState(false);

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedEngineer, setSelectedEngineer] = useState('');
    const [messageText, setMessageText] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {

        const loadData = async () => {

            try {

                setLoading(true)

                const ticketsRes = await ticketService.getTickets()
                const incidentsRes = await incidentService.getAll()

                setTickets(ticketsRes)
                setIncidents(incidentsRes)

            } catch (error) {

                console.error("Load error:", error)

            } finally {

                setLoading(false)

            }

        }

        loadData()

    }, [])

    const handleReset = () => { setSearchTerm(''); };

    const handleAction = (msg: string, sev: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message: msg, severity: sev });
        setOpenAdminReport(false);
        setOpenUserMail(false);
        setOpenEngineerMail(false);
        setOpenAssign(false);
        setOpenEditStatus(false);
        setMessageText('');
        setSelectedEngineer('');
    };

    // Удаление ТИКЕТА (с дашборда)
    const handleDeleteTicket = (id: string) => {
        setTickets(prev => prev.filter(t => (t._id || t.id) !== id));
        setSnackbar({ open: true, message: 'Ticket removed from board', severity: 'error' });
    };


//CreateIncident
    const createIncident = async (ticket: Ticket): Promise<void> => {

        try {

            const incidentData: Partial<Incident> = {

                title: ticket.title,
                description: ticket.description ?? "",
                severity: "medium",
                type: "other",
                ticketId: ticket._id

            }

            const newIncident = await incidentService.create(incidentData);

            setIncidents(prev => [...prev, newIncident]);

            setTickets(prev =>
                prev.filter(t => (t._id || t.id) !== (ticket._id || ticket.id))
            );

        } catch (error) {
            console.error(error);
        }

    };
    // Удаление ИНЦИДЕНТА (из таблицы)
    const handleDeleteIncident = (id: string) => {
        setIncidents(prev => prev.filter(inc => inc._id !== id));
        setSnackbar({ open: true, message: 'Incident permanently deleted', severity: 'error' });
    };

    const getStatusStyles = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'resolved' || s === 'done') return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
        if (s === 'in-progress' || s === 'active') return { bg: '#fffde7', text: '#f57f17', border: '#fff59d' };
        return { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' };
    };

    // -----Drag & Drop------

    const onDragEnd = async (result: DropResult) => {

        if (isProcessing.current) return;
        isProcessing.current = true;

        const { source, destination, draggableId } = result;

        if (!destination) {
            isProcessing.current = false;
            return;
        }

        const oldStatus = source.droppableId;
        const newStatus = destination.droppableId;

        if (oldStatus === newStatus) {
            isProcessing.current = false;
            return;
        }

        const ticket = tickets.find(
            t => String(t._id || t.id) === String(draggableId)
        );

        if (!ticket) {
            isProcessing.current = false;
            return;
        }

        try {

            await ticketService.updateStatus(String(ticket._id), newStatus);

            setTickets((prev: Ticket[]) =>
                prev.map((t: Ticket) =>
                    String(t._id || t.id) === String(ticket._id)
                        ? { ...t, status: newStatus as Ticket["status"] }
                        : t
                )
            );

            if (oldStatus === "new" && newStatus === "investigating") {

                const incidentData: Partial<Incident> = {
                    title: ticket.title,
                    description: ticket.description ?? "",
                    severity: "medium",
                    type: "other",
                    ticketId: ticket._id
                };

                const newIncident = await incidentService.create(incidentData);

                setIncidents(prev => [...prev, newIncident]);

                setTickets(prev =>
                    prev.filter(t => String(t._id) !== String(ticket._id))
                );

                setSnackbar({
                    open: true,
                    message: "Incident created from ticket",
                    severity: "success"
                });

            }

        } catch (error) {

            console.error(error);

            setSnackbar({
                open: true,
                message: "Failed to update ticket",
                severity: "error"
            });

        } finally {

            isProcessing.current = false;

        }

    };

    const renderColumn = (status: string, title: string) => {

        return (

            <Box sx={{ flex: 1, mx: 1 }}>

                <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                    {title}
                </Typography>

                <Droppable droppableId={status}>

                    {(provided) => (

                        <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                                bgcolor: "rgba(43,77,126,0.05)",
                                p: 1,
                                minHeight: "300px",
                                border: "1px solid rgba(43,77,126,0.2)"
                            }}
                        >

                            {tickets
                                .filter(t => String(t.status) === String(status))
                                .map((ticket, index) => {

                                    const tId = String(ticket._id || ticket.id);

                                    return (

                                        <Draggable key={tId} draggableId={tId} index={index}>

                                            {(provided) => (

                                                <Paper
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    sx={{
                                                        p: 2,
                                                        mb: 1.5,
                                                        borderRadius: 0,
                                                        borderLeft: "6px solid #2b4d7e",
                                                        bgcolor: "white"
                                                    }}
                                                >

                                                    <Typography sx={{ fontWeight: 800 }}>
                                                        {ticket.title}
                                                    </Typography>

                                                </Paper>

                                            )}

                                        </Draggable>

                                    )

                                })}


                            {provided.placeholder}

                        </Box>

                    )}

                </Droppable>

            </Box>

        )

    }

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress sx={{ color: '#2b4d7e' }} />
        </Box>
    );

    return (
        <Box sx={{ bgcolor: '#f4f7f9', minHeight: '100vh', backgroundImage: 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(/houseback.jpg)', backgroundSize: 'cover' }}>

            {/* Header */}
            <Box sx={{ p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #2b4d7e', bgcolor: 'white' }}>
                <Typography variant="h4" sx={{ color: '#2b4d7e', fontWeight: 900 }}>CITY CONTROL</Typography>
                <Stack direction="row" spacing={2} sx={{ flexGrow: 1, mx: 4 }}>
                    <TextField size="small" fullWidth placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ maxWidth: 350 }} />
                    <Button variant="outlined" onClick={handleReset}>Reset</Button>
                </Stack>
                <Stack direction="row" spacing={2}>
                    <Button variant="contained" color="error" startIcon={<WarningIcon />} onClick={() => setOpenAdminReport(true)} sx={{ borderRadius: 0, fontWeight: 'bold' }}>REPORT ADMIN</Button>
                    <Button variant="contained" onClick={async () => { await logout(); navigate('/login'); }} sx={{ borderRadius: 0, bgcolor: '#2b4d7e' }}>EXIT</Button>
                </Stack>
            </Box>

            <Box sx={{ p: 3 }}>
                {/* Dashboard */}
                <Box sx={{ display: 'flex', gap: 3, mb: 5 }}>
                    <DragDropContext onDragEnd={onDragEnd}>
                        {renderColumn('new', 'Incoming')}
                        {renderColumn('investigating', 'Investigating')}
                        {renderColumn('monitoring', 'Monitoring')}
                        {renderColumn('resolved', 'Resolved')}
                        {renderColumn('closed', 'Closed')}
                    </DragDropContext>
                </Box>

                {/* Table */}
                <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid #2b4d7e' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#2b4d7e' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 900 }}>INCIDENT #</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900 }}>TITLE</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900 }}>STATUS</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 900, textAlign: 'center' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {incidents
                                .filter(inc => inc.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((row) => {

                                    const styles = getStatusStyles(row.status ?? "new");

                                    return (
                                        <TableRow key={row._id} hover>

                                            <TableCell sx={{ fontWeight: 800 }}>
                                                {row.incidentNumber}
                                            </TableCell>

                                            <TableCell>
                                                {row.title}
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={(row.status ?? "new").toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        borderRadius: 0,
                                                        fontWeight: 'bold',
                                                        bgcolor: styles.bg,
                                                        color: styles.text,
                                                        border: `1px solid ${styles.border}`,
                                                        width: '90px'
                                                    }}
                                                />
                                            </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <IconButton size="small" color="info" onClick={() => { setSelectedItem(row); setOpenEditStatus(true); }}><EditIcon fontSize="small"/></IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteIncident(row._id)}><DeleteIcon fontSize="small"/></IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* --- ДИАЛОГИ --- */}

            {/* Назначение инженера (Dashboard) */}
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

            {/* Сообщение Юзеру (Dashboard Incoming) */}
            <Dialog open={openUserMail} onClose={() => setOpenUserMail(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ bgcolor: '#2b4d7e', color: 'white' }}>REPLY TO USER</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField fullWidth multiline rows={4} placeholder="Type your response to the user..." value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenUserMail(false)}>Cancel</Button><Button variant="contained" onClick={() => handleAction('Message sent to user!')}>Send</Button></DialogActions>
            </Dialog>

            {/* Инструкции Инженеру (Dashboard Active) */}
            <Dialog open={openEngineerMail} onClose={() => setOpenEngineerMail(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ bgcolor: '#1a2a40', color: 'white' }}>TECHNICAL INSTRUCTIONS</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField fullWidth multiline rows={4} placeholder="Instructions for the engineer..." value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenEngineerMail(false)}>Cancel</Button><Button variant="contained" color="secondary" onClick={() => handleAction('Instructions sent!')}>Send</Button></DialogActions>
            </Dialog>




            {/* --- ADMIN REPORT DIALOG (Header Red Button) --- */}
            <Dialog open={openAdminReport} onClose={() => setOpenAdminReport(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 900 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <WarningIcon />
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>URGENT ADMIN REPORT</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
                        Please describe the critical issue or violation that requires immediate intervention by the City Control system administrator.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={5}
                        variant="outlined"
                        placeholder="Describe the situation in detail..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        autoFocus
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 0 }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f4f7f9' }}>
                    <Button onClick={() => setOpenAdminReport(false)} color="inherit" sx={{ fontWeight: 'bold' }}>
                        CANCEL
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={!messageText.trim()}
                        onClick={() => handleAction('Critical report has been successfully sent to the administrator!', 'success')}
                        sx={{ borderRadius: 0, fontWeight: 'bold', px: 3 }}
                    >
                        SEND REPORT
                    </Button>
                </DialogActions>
            </Dialog>


            {/* Редактирование статуса (Table Actions) */}
            <Dialog open={openEditStatus} onClose={() => setOpenEditStatus(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>CHANGE STATUS</DialogTitle>
                <DialogContent sx={{ minWidth: 250, pt: 1 }}>
                    <Button fullWidth variant="outlined" sx={{ mb: 1 }} onClick={() => handleAction('Status: Active')}>Set ACTIVE</Button>
                    <Button fullWidth variant="contained" color="success" onClick={() => handleAction('Status: Done')}>Set DONE</Button>
                </DialogContent>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>




    );
};

export default SupportPage;