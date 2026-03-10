//
//
//
// import React, { useState, useEffect } from 'react';
// import {
//     Box, Typography, Paper, Stack, Button, IconButton, TextField,
//     Chip, Table, TableBody, TableCell, TableContainer, TableHead,
//     TableRow, Avatar, Snackbar, Alert, Fade, MenuItem, Select,
//     FormControl, InputLabel, Badge, Menu, Dialog, DialogTitle,
//     DialogContent, List, ListItem, ListItemText, Divider, DialogActions, Tooltip
// } from '@mui/material';
// import {
//     AdminPanelSettings as AdminIcon,
//     Logout as LogoutIcon,
//     Security as SecurityIcon,
//     SettingsSuggest as SettingsIcon,
//     Assessment as StatsIcon,
//     Send as SendIcon,
//     Chat as ChatIcon,
//     MoveToInbox as InboxIcon,
//     EditNote as EditIcon,
//     DeleteOutline as RemoveIcon
// } from '@mui/icons-material';
// import { useNavigate } from 'react-router-dom';
//
// // --- Types ---
// interface SystemLog {
//     id: number;
//     user: string;
//     action: string;
//     time: string;
//     severity: 'low' | 'high';
//     details?: string;
// }
//
// interface AdminPageProps {
//     logout: () => Promise<void>;
// }
//
// const mockLogs: SystemLog[] = [
//      { id: 1, user: 'Engineer_01', action: 'Modified Ticket TKT-2005', time: '15:30:12', severity: 'low', details: 'Updated the server configuration for project X.' },
//      { id: 2, user: 'System', action: 'Daily Backup Completed', time: '15:00:00', severity: 'low', details: 'Automatic system backup to S3 cloud storage.' },
//      { id: 3, user: 'Lulik7', action: 'Access Denied: Restricted Area', time: '14:45:10', severity: 'high', details: 'User attempted to access /admin/security without credentials.' },
//      { id: 4, user: 'Admin_Valery', action: 'Server Reboot Initiated', time: '14:30:05', severity: 'high', details: 'Planned maintenance reboot for kernel update.' },
//      { id: 5, user: 'Dev_User', action: 'Push to production branch', time: '14:15:22', severity: 'low', details: 'Merged branch feat/ui-fix into main.' },
//      { id: 6, user: 'Security_Bot', action: 'Intrusion detection scan', time: '14:00:00', severity: 'low', details: 'Full system security scan completed. 0 threats.' },
//      { id: 7, user: 'Manager_X', action: 'Updated user permissions', time: '13:45:10', severity: 'low', details: 'Granted Editor rights to Intern_JS.' },
//      { id: 8, user: 'Engineer_02', action: 'Database optimization', time: '13:20:45', severity: 'low', details: 'Reindexed SQL tables for better query performance.' },
//      { id: 9, user: 'Unknown_IP', action: 'Brute force attempt blocked', time: '13:10:02', severity: 'high', details: 'Blocked IP 192.168.1.55 after 5 failed attempts.' },
//      { id: 10, user: 'Support_Team', action: 'Closed 15 support tickets', time: '12:55:30', severity: 'low', details: 'End of shift ticket cleanup.' },
//      { id: 11, user: 'Auto_Scaling', action: 'Added 2 new instances', time: '12:40:15', severity: 'low', details: 'Traffic spike detected. Scaling up cluster.' },
//      { id: 12, user: 'Lulik7', action: 'System Config Modified', time: '12:15:00', severity: 'high', details: 'Modified environment variables for API gateway.' },
//      { id: 13, user: 'Senior_Dev', action: 'Code audit completed', time: '11:50:44', severity: 'low', details: 'Quarterly security audit for microservices.' },
//      { id: 14, user: 'Intern_JS', action: 'Fixed CSS layout issue', time: '11:30:10', severity: 'low', details: 'Adjusted padding in navigation bar.' },
//      { id: 15, user: 'Cloud_Sentry', action: 'S3 Bucket policy updated', time: '11:10:00', severity: 'low', details: 'Changed bucket ACL to private.' },
//      { id: 16, user: 'Lulik7', action: 'Multiple login failures', time: '10:45:33', severity: 'high', details: 'User locked out for 30 minutes.' },
//      { id: 17, user: 'Engineer_01', action: 'Patch v2.4 applied', time: '10:20:15', severity: 'low', details: 'Hotfix for login timeout issue.' },
//      { id: 18, user: 'DevOps_Unit', action: 'Jenkins pipeline restored', time: '10:05:00', severity: 'low', details: 'Fixed groovy script in build pipeline.' },
//      { id: 19, user: 'Admin_Valery', action: 'New API Key generated', time: '09:50:12', severity: 'high', details: 'Internal system key for automated scripts.' },
//      { id: 20, user: 'System', action: 'Memory cleanup routine', time: '09:30:00', severity: 'low', details: 'Garbage collection triggered manually.' },
//  ];
//
// const steamAnimation = {
//     '0%': { transform: 'translateY(0) scaleX(1)', opacity: 0 },
//     '15%': { opacity: 0.9 },
//     '100%': { transform: 'translateY(-80px) scaleX(3)', opacity: 0 },
// };
//
// const floatAnimation = {
//     '0%, 100%': { transform: 'translateY(0)' },
//     '50%': { transform: 'translateY(-12px)' },
// };
//
// const AdminPage: React.FC<AdminPageProps> = ({ logout }) => {
//     const navigate = useNavigate();
//
//     // --- States ---
//     const [isLoading, setIsLoading] = useState(true);
//     const [logs, setLogs] = useState<SystemLog[]>(mockLogs);
//     const [snackbar, setSnackbar] = useState(false);
//     const [snackbarMsg, setSnackbarMsg] = useState('');
//     const [recipient, setRecipient] = useState('');
//     const [message, setMessage] = useState('');
//     const [isInboxOpen, setIsInboxOpen] = useState(false);
//     const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
//     const [tempDetails, setTempDetails] = useState('');
//
//     // --- Settings Menu State ---
//     const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//     const openMenu = Boolean(anchorEl);
//
//     const primaryMain = '#2b4d7e';
//     const secondaryMain = '#f5a623';
//
//     useEffect(() => {
//         const timer = setTimeout(() => setIsLoading(false), 2000);
//         return () => clearTimeout(timer);
//     }, []);
//
//     // --- Handlers ---
//     const handleOpenSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
//         setAnchorEl(event.currentTarget);
//     };
//
//     const handleCloseSettings = () => {
//         setAnchorEl(null);
//     };
//
//     const handleOpenInbox = () => setIsInboxOpen(true);
//     const handleCloseInbox = () => setIsInboxOpen(false);
//
//     const handleRowClick = (log: SystemLog) => {
//         setSelectedLog(log);
//         setTempDetails(log.details || '');
//     };
//
//     const handleSaveReport = () => {
//         if (selectedLog) {
//             setLogs(logs.map(l => l.id === selectedLog.id ? { ...l, details: tempDetails } : l));
//             setSnackbarMsg('Report updated successfully!');
//             setSnackbar(true);
//             setSelectedLog(null);
//         }
//     };
//
//     const handleDeleteRow = (e: React.MouseEvent, id: number) => {
//         e.stopPropagation();
//         setLogs(logs.filter(log => log.id !== id));
//         setSnackbarMsg('Task record deleted from system.');
//         setSnackbar(true);
//     };
//
//     if (isLoading) {
//         return (
//             <Box sx={{ height: '100vh', width: '100vw', bgcolor: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
//                 <Box sx={{ animation: 'float 3.5s ease-in-out infinite', '@keyframes float': floatAnimation, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                     <Box sx={{ display: 'flex', mb: 1.5, gap: 2 }}>
//                         {[0, 0.6, 1.2].map((delay, i) => (
//                             <Box key={i} sx={{ width: 6, height: 35, bgcolor: '#ffffff', borderRadius: '50%', filter: 'blur(5px)', animation: `steam 2.8s infinite ease-in-out ${delay}s`, '@keyframes steam': steamAnimation }} />
//                         ))}
//                     </Box>
//                     <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
//                         <Box sx={{ width: 125, height: 85, bgcolor: '#ffffff', borderRadius: '5px 5px 60px 60px', boxShadow: 'inset -15px -10px 20px rgba(0,0,0,0.1), 0 15px 35px rgba(0,0,0,0.7)', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
//                             <Box sx={{ width: '100%', height: 28, bgcolor: '#5d4037', borderRadius: '50%', position: 'absolute', top: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//                                 <Box sx={{ width: 16, height: 16, bgcolor: '#f5ebe0', borderRadius: '50% 50% 0 0', transform: 'rotate(-45deg)', '&::after': { content: '""', position: 'absolute', width: 16, height: 16, bgcolor: '#f5ebe0', borderRadius: '50% 50% 0 0', left: 9, bottom: -9, transform: 'rotate(90deg)' } }} />
//                             </Box>
//                         </Box>
//                         <Box sx={{ width: 48, height: 58, border: '10px solid #ffffff', borderRadius: '50%', ml: -4.5, mt: -1, zIndex: -1 }} />
//                     </Box>
//                     <Box sx={{ width: 170, height: 16, mt: -1, borderRadius: '50%', background: 'radial-gradient(ellipse at center, #ffffff 0%, #bcbcbc 100%)', boxShadow: '0 12px 25px rgba(0,0,0,0.8)' }} />
//                 </Box>
//                 <Typography variant="h2" sx={{ mt: 7, color: 'white', letterSpacing: 8 }}>ADMIN'S BREAK</Typography>
//             </Box>
//         );
//     }
//
//     return (
//         <Fade in={!isLoading} timeout={1000}>
//             <Box sx={{
//                 minHeight: '100vh', display: 'flex', flexDirection: 'column',
//                 backgroundImage: `linear-gradient(rgba(244, 246, 248, 0.85), rgba(244, 246, 248, 0.85)), url('/houseback.jpg')`,
//                 backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'
//             }}>
//                 {/* HEADER */}
//                 <Box sx={{
//                     bgcolor: primaryMain, color: 'white', p: 2, px: 4,
//                     display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//                     borderBottom: `4px solid ${secondaryMain}`
//                 }}>
//                     <Typography variant="h6" sx={{ fontWeight: 'bold' }}>SYSTEM ROOT</Typography>
//
//                     <Stack direction="row" spacing={1} alignItems="center">
//                         <Button color="inherit" onClick={() => navigate('/engineer')}>Engineer Page</Button>
//                         <Button color="inherit" onClick={() => navigate('/support')}>Support Page</Button>
//                         <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 1 }} />
//                         <Button startIcon={<SettingsIcon />} color="inherit" onClick={handleOpenSettings}>Settings</Button>
//                         <Button variant="contained" startIcon={<LogoutIcon />} onClick={logout} sx={{ bgcolor: secondaryMain, ml: 2, color: 'white', '&:hover': { bgcolor: '#e6951d' } }}>Exit</Button>
//                     </Stack>
//
//                     <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseSettings} PaperProps={{ sx: { width: 300, mt: 1.5, boxShadow: 5 } }}>
//                         <MenuItem onClick={handleCloseSettings}>Admin Profile</MenuItem>
//                         <MenuItem onClick={handleCloseSettings}>User Management</MenuItem>
//                         <MenuItem onClick={handleCloseSettings}>System Configuration</MenuItem>
//                         <Divider />
//                         <MenuItem onClick={handleCloseSettings}>Server Logs</MenuItem>
//                         <MenuItem onClick={handleCloseSettings}>Security Settings</MenuItem>
//                     </Menu>
//                 </Box>
//
//                 {/* CONTENT AREA */}
//                 <Box sx={{ p: 4 }}>
//                     <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4} alignItems="flex-start">
//                         {/* Sidebar */}
//                         <Box sx={{ width: { xs: '100%', lg: '350px' }, position: { lg: 'sticky' }, top: 32 }}>
//                             <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}><StatsIcon sx={{ mr: 1, verticalAlign: 'middle', color: primaryMain }} /> System Pulse</Typography>
//                             <Stack spacing={2} sx={{ mb: 4 }}>
//                                 {[{ label: 'Network Load', value: '24%', color: '#27ae60' }, { label: 'Active Sessions', value: '156', color: primaryMain }, { label: 'Security Threats', value: '0', color: '#d32f2f' }].map((item, idx) => (
//                                     <Paper key={idx} sx={{ p: 2, borderRadius: 1, borderLeft: `6px solid ${item.color}`, boxShadow: 2, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
//                                         <Typography variant="caption" color="text.secondary">{item.label}</Typography>
//                                         <Typography variant="h4" sx={{ fontWeight: 900, color: item.color }}>{item.value}</Typography>
//                                     </Paper>
//                                 ))}
//                             </Stack>
//
//                             <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}><ChatIcon sx={{ mr: 1, verticalAlign: 'middle', color: primaryMain }} /> Messenger</Typography>
//                             <Paper sx={{ p: 3, borderRadius: 1, boxShadow: 2, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
//                                 <Stack spacing={2}>
//                                     <FormControl fullWidth size="small"><InputLabel>Recipient</InputLabel>
//                                         <Select value={recipient} label="Recipient" onChange={(e) => setRecipient(e.target.value)}>
//                                             <MenuItem value="user">User</MenuItem><MenuItem value="support">Support</MenuItem><MenuItem value="engineer">Engineer</MenuItem>
//                                         </Select>
//                                     </FormControl>
//                                     <TextField fullWidth multiline rows={2} placeholder="Message..." size="small" value={message} onChange={(e) => setMessage(e.target.value)} />
//                                     <Stack direction="row" spacing={1}>
//                                         <Button fullWidth variant="contained" startIcon={<SendIcon />} onClick={() => {setSnackbarMsg('Message sent!'); setSnackbar(true); setMessage('');}} sx={{ bgcolor: primaryMain }}>Send</Button>
//                                         <Button variant="outlined" sx={{ borderColor: primaryMain, color: primaryMain }} onClick={handleOpenInbox}>
//                                             <Badge badgeContent={4} color="error"><InboxIcon /></Badge>
//                                         </Button>
//                                     </Stack>
//                                 </Stack>
//                             </Paper>
//                         </Box>
//
//                         {/* Table Area */}
//                         <Box sx={{ flexGrow: 1, width: '100%' }}>
//                             <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
//                                 <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle', color: primaryMain }} /> Operator Activity Log
//                             </Typography>
//                             <TableContainer component={Paper} sx={{ borderRadius: 1, boxShadow: 3, bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
//                                 <Table stickyHeader>
//                                     <TableHead>
//                                         <TableRow>
//                                             <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold' }}>TIME</TableCell>
//                                             <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold' }}>OPERATOR</TableCell>
//                                             <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold' }}>ACTION</TableCell>
//                                             <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold' }}>LEVEL</TableCell>
//                                             <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold', textAlign: 'center' }}>ACTIONS</TableCell>
//                                         </TableRow>
//                                     </TableHead>
//                                     <TableBody>
//                                         {logs.map((log) => (
//                                             <TableRow key={log.id} hover onClick={() => handleRowClick(log)} sx={{ cursor: 'pointer' }}>
//                                                 <TableCell sx={{ fontFamily: 'Monospace' }}>{log.time}</TableCell>
//                                                 <TableCell>
//                                                     <Stack direction="row" spacing={1} alignItems="center">
//                                                         <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: secondaryMain }}>{log.user[0]}</Avatar>
//                                                         <Typography variant="body2">{log.user}</Typography>
//                                                     </Stack>
//                                                 </TableCell>
//                                                 <TableCell>{log.action}</TableCell>
//                                                 <TableCell>
//                                                     <Chip label={log.severity.toUpperCase()} size="small" sx={{ bgcolor: log.severity === 'high' ? '#fdecea' : '#e3f2fd', color: log.severity === 'high' ? '#d32f2f' : primaryMain }} />
//                                                 </TableCell>
//                                                 <TableCell>
//                                                     <Stack direction="row" spacing={1} justifyContent="center">
//                                                         <IconButton size="small"><EditIcon fontSize="small" sx={{ color: primaryMain }} /></IconButton>
//                                                         <IconButton size="small" onClick={(e) => handleDeleteRow(e, log.id)} sx={{ color: '#d32f2f' }}><RemoveIcon fontSize="small" /></IconButton>
//                                                     </Stack>
//                                                 </TableCell>
//                                             </TableRow>
//                                         ))}
//                                     </TableBody>
//                                 </Table>
//                             </TableContainer>
//                         </Box>
//                     </Stack>
//                 </Box>
//
//                 {/* Dialogs */}
//                 <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} fullWidth maxWidth="sm">
//                     <DialogTitle sx={{ bgcolor: primaryMain, color: 'white' }}>Work Performance Report</DialogTitle>
//                     <DialogContent dividers>
//                         <Stack spacing={3} sx={{ mt: 1 }}>
//                             <TextField label="Work Details" fullWidth multiline rows={6} value={tempDetails} onChange={(e) => setTempDetails(e.target.value)} />
//                         </Stack>
//                     </DialogContent>
//                     <DialogActions>
//                         <Button onClick={() => setSelectedLog(null)}>Cancel</Button>
//                         <Button onClick={handleSaveReport} variant="contained" sx={{ bgcolor: secondaryMain }}>Save</Button>
//                     </DialogActions>
//                 </Dialog>
//
//                 <Dialog open={isInboxOpen} onClose={handleCloseInbox} fullWidth maxWidth="xs">
//                     <DialogTitle sx={{ bgcolor: primaryMain, color: 'white' }}>Incoming Messages</DialogTitle>
//                     <DialogContent dividers>
//                         <List>
//                             <ListItem button><ListItemText primary="Engineer" secondary="Backup online." /></ListItem>
//                             <Divider />
//                             <ListItem button><ListItemText primary="Support" secondary="User reset." /></ListItem>
//                         </List>
//                     </DialogContent>
//                     <DialogActions><Button onClick={handleCloseInbox}>Close</Button></DialogActions>
//                 </Dialog>
//
//                 <Snackbar open={snackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
//                     <Alert severity={snackbarMsg.includes('deleted') ? "error" : "success"} variant="filled">{snackbarMsg}</Alert>
//                 </Snackbar>
//             </Box>
//         </Fade>
//     );
// };
//
// export default AdminPage;

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Stack, Button, IconButton, TextField,
    Chip, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Avatar, Snackbar, Alert, Fade, MenuItem, Select,
    FormControl, InputLabel, Badge, Menu, Dialog, DialogTitle,
    DialogContent, List, ListItem, ListItemText, Divider, DialogActions, Tooltip
} from '@mui/material';
import {
    Logout as LogoutIcon,
    Security as SecurityIcon,
    SettingsSuggest as SettingsIcon,
    Assessment as StatsIcon,
    Send as SendIcon,
    Chat as ChatIcon,
    MoveToInbox as InboxIcon,
    EditNote as EditIcon,
    DeleteOutline as RemoveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- Types ---
interface SystemLog {
    _id: string; // ID из MongoDB
    incidentNumber?: string;
    user?: string;
    title: string;
    action?: string;
    createdAt: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
}

interface AdminPageProps {
    logout: () => Promise<void>;
}

const steamAnimation = {
    '0%': { transform: 'translateY(0) scaleX(1)', opacity: 0 },
    '15%': { opacity: 0.9 },
    '100%': { transform: 'translateY(-80px) scaleX(3)', opacity: 0 },
};

const floatAnimation = {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-12px)' },
};

const AdminPage: React.FC<AdminPageProps> = ({ logout }) => {
    const navigate = useNavigate();

    // --- States ---
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('');
    const [isInboxOpen, setIsInboxOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
    const [tempDetails, setTempDetails] = useState('');

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const primaryMain = '#2b4d7e';
    const secondaryMain = '#f5a623';

    // --- ФУНКЦИЯ ЗАГРУЗКИ ИЗ БАЗЫ (DOCKER) ---
    const fetchTasks = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/incidents?limit=40', { withCredentials: true });
            console.log("Данные из Docker:", response.data);

            const result = response.data;
            if (Array.isArray(result)) {
                setLogs(result);
            } else if (result && typeof result === 'object') {
                const possibleArray = result.incidents || result.data || Object.values(result).find(val => Array.isArray(val));
                setLogs(Array.isArray(possibleArray) ? possibleArray : []);
            }
        } catch (error) {
            console.error("Ошибка загрузки из базы:", error);
            setLogs([]);
        } finally {
            // Искусственная задержка для анимации чашки
            setTimeout(() => setIsLoading(false), 2000);
        }
    };

    useEffect(() => {
        fetchTasks();
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.overflowX = 'hidden';
    }, []);

    const showMessage = (msg: string, sev: 'success' | 'error' = 'success') =>
        setSnackbar({ open: true, message: msg, severity: sev });

    // --- Handlers ---
    const handleOpenSettings = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleCloseSettings = () => setAnchorEl(null);

    const handleRowClick = (log: SystemLog) => {
        setSelectedLog(log);
        setTempDetails(log.description || '');
    };

    const handleSaveReport = async () => {
        if (selectedLog) {
            try {
                await axios.patch(`http://localhost:3000/api/incidents/${selectedLog._id}`,
                    { description: tempDetails },
                    { withCredentials: true }
                );
                setLogs(logs.map(l => l._id === selectedLog._id ? { ...l, description: tempDetails } : l));
                showMessage('Report updated successfully!');
                setSelectedLog(null);
            } catch (e) {
                showMessage("Update failed", "error");
            }
        }
    };

    const handleDeleteRow = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Delete incident from database?")) {
            try {
                await axios.delete(`http://localhost:3000/api/incidents/${id}`, { withCredentials: true });
                setLogs(logs.filter(log => log._id !== id));
                showMessage('Incident deleted from system.', 'error');
            } catch (e) {
                showMessage("Delete failed", "error");
            }
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ height: '100vh', width: '100vw', bgcolor: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ animation: 'float 3.5s ease-in-out infinite', '@keyframes float': floatAnimation, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', mb: 1.5, gap: 2 }}>
                        {[0, 0.6, 1.2].map((delay, i) => (
                            <Box key={i} sx={{ width: 6, height: 35, bgcolor: '#ffffff', borderRadius: '50%', filter: 'blur(5px)', animation: `steam 2.8s infinite ease-in-out ${delay}s`, '@keyframes steam': steamAnimation }} />
                        ))}
                    </Box>
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 125, height: 85, bgcolor: '#ffffff', borderRadius: '5px 5px 60px 60px', boxShadow: 'inset -15px -10px 20px rgba(0,0,0,0.1), 0 15px 35px rgba(0,0,0,0.7)', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
                            <Box sx={{ width: '100%', height: 28, bgcolor: '#5d4037', borderRadius: '50%', position: 'absolute', top: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Box sx={{ width: 16, height: 16, bgcolor: '#f5ebe0', borderRadius: '50% 50% 0 0', transform: 'rotate(-45deg)', '&::after': { content: '""', position: 'absolute', width: 16, height: 16, bgcolor: '#f5ebe0', borderRadius: '50% 50% 0 0', left: 9, bottom: -9, transform: 'rotate(90deg)' } }} />
                            </Box>
                        </Box>
                        <Box sx={{ width: 48, height: 58, border: '10px solid #ffffff', borderRadius: '50%', ml: -4.5, mt: -1, zIndex: -1 }} />
                    </Box>
                    <Box sx={{ width: 170, height: 16, mt: -1, borderRadius: '50%', background: 'radial-gradient(ellipse at center, #ffffff 0%, #bcbcbc 100%)', boxShadow: '0 12px 25px rgba(0,0,0,0.8)' }} />
                </Box>
                <Typography variant="h2" sx={{ mt: 7, color: 'white', letterSpacing: 8 }}>ADMIN'S BREAK</Typography>
            </Box>
        );
    }

    return (
        <Fade in={!isLoading} timeout={1000}>
            <Box sx={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                backgroundImage: `linear-gradient(rgba(244, 246, 248, 0.85), rgba(244, 246, 248, 0.85)), url('/houseback.jpg')`,
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'
            }}>
                {/* HEADER */}
                <Box sx={{ bgcolor: primaryMain, color: 'white', p: 2, px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `4px solid ${secondaryMain}` }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>SYSTEM ROOT</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button color="inherit" onClick={() => navigate('/engineer')}>Engineer Page</Button>
                        <Button color="inherit" onClick={() => navigate('/support')}>Support Page</Button>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 1 }} />
                        <Button startIcon={<SettingsIcon />} color="inherit" onClick={handleOpenSettings}>Settings</Button>
                        <Button variant="contained" startIcon={<LogoutIcon />} onClick={logout} sx={{ bgcolor: secondaryMain, ml: 2, color: 'white', '&:hover': { bgcolor: '#e6951d' } }}>Exit</Button>
                    </Stack>
                    <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseSettings} PaperProps={{ sx: { width: 300, mt: 1.5, boxShadow: 5 } }}>
                        <MenuItem onClick={handleCloseSettings}>Admin Profile</MenuItem>
                        <MenuItem onClick={handleCloseSettings}>User Management</MenuItem>
                        <Divider />
                        <MenuItem onClick={handleCloseSettings}>Server Logs</MenuItem>
                        <MenuItem onClick={handleCloseSettings}>Security Settings</MenuItem>
                    </Menu>
                </Box>

                {/* CONTENT AREA */}
                <Box sx={{ p: 4 }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4} alignItems="flex-start">
                        {/* Sidebar */}
                        <Box sx={{ width: { xs: '100%', lg: '350px' }, position: { lg: 'sticky' }, top: 32 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}><StatsIcon sx={{ mr: 1, verticalAlign: 'middle', color: primaryMain }} /> System Pulse</Typography>
                            <Stack spacing={2} sx={{ mb: 4 }}>
                                {[{ label: 'Network Load', value: '24%', color: '#27ae60' }, { label: 'Active Sessions', value: '156', color: primaryMain }, { label: 'Security Threats', value: '0', color: '#d32f2f' }].map((item, idx) => (
                                    <Paper key={idx} sx={{ p: 2, borderRadius: 1, borderLeft: `6px solid ${item.color}`, boxShadow: 2, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
                                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, color: item.color }}>{item.value}</Typography>
                                    </Paper>
                                ))}
                            </Stack>

                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}><ChatIcon sx={{ mr: 1, verticalAlign: 'middle', color: primaryMain }} /> Messenger</Typography>
                            <Paper sx={{ p: 3, borderRadius: 1, boxShadow: 2, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
                                <Stack spacing={2}>
                                    <FormControl fullWidth size="small"><InputLabel>Recipient</InputLabel>
                                        <Select value={recipient} label="Recipient" onChange={(e) => setRecipient(e.target.value)}>
                                            <MenuItem value="support">Support</MenuItem><MenuItem value="engineer">Engineer</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField fullWidth multiline rows={2} placeholder="Message..." size="small" value={message} onChange={(e) => setMessage(e.target.value)} />
                                    <Stack direction="row" spacing={1}>
                                        <Button fullWidth variant="contained" startIcon={<SendIcon />} onClick={() => {showMessage('Message sent!'); setMessage('');}} sx={{ bgcolor: primaryMain }}>Send</Button>
                                        <Button variant="outlined" sx={{ borderColor: primaryMain, color: primaryMain }} onClick={() => setIsInboxOpen(true)}>
                                            <Badge badgeContent={4} color="error"><InboxIcon /></Badge>
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Box>

                        {/* Table Area */}
                        <Box sx={{ flexGrow: 1, width: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle', color: primaryMain }} /> Operator Activity Log
                            </Typography>
                            <TableContainer component={Paper} sx={{ borderRadius: 1, boxShadow: 3, bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold' }}>TIME</TableCell>
                                            <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold' }}>INCIDENT #</TableCell>
                                            <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold' }}>TITLE</TableCell>
                                            <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold' }}>SEVERITY</TableCell>
                                            <TableCell sx={{ bgcolor: primaryMain, color: 'white', fontWeight: 'bold', textAlign: 'center' }}>ACTIONS</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log._id} hover onClick={() => handleRowClick(log)} sx={{ cursor: 'pointer' }}>
                                                <TableCell sx={{ fontFamily: 'Monospace' }}>{new Date(log.createdAt).toLocaleTimeString()}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{log.incidentNumber || 'N/A'}</TableCell>
                                                <TableCell>{log.title}</TableCell>
                                                <TableCell>
                                                    <Chip label={log.severity.toUpperCase()} size="small" sx={{
                                                        bgcolor: (log.severity === 'high' || log.severity === 'critical') ? '#fdecea' : '#e3f2fd',
                                                        color: (log.severity === 'high' || log.severity === 'critical') ? '#d32f2f' : primaryMain
                                                    }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <IconButton size="small"><EditIcon fontSize="small" sx={{ color: primaryMain }} /></IconButton>
                                                        <IconButton size="small" onClick={(e) => handleDeleteRow(e, log._id)} sx={{ color: '#d32f2f' }}><RemoveIcon fontSize="small" /></IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Stack>
                </Box>

                {/* Dialogs */}
                <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ bgcolor: primaryMain, color: 'white' }}>Work Performance Report</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <TextField label="Description" fullWidth multiline rows={6} value={tempDetails} onChange={(e) => setTempDetails(e.target.value)} />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSelectedLog(null)}>Cancel</Button>
                        <Button onClick={handleSaveReport} variant="contained" sx={{ bgcolor: secondaryMain }}>Save</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={isInboxOpen} onClose={() => setIsInboxOpen(false)} fullWidth maxWidth="xs">
                    <DialogTitle sx={{ bgcolor: primaryMain, color: 'white' }}>Incoming Messages</DialogTitle>
                    <DialogContent dividers>
                        <List>
                            <ListItem button><ListItemText primary="Engineer" secondary="Backup online." /></ListItem>
                            <Divider />
                            <ListItem button><ListItemText primary="Support" secondary="User reset." /></ListItem>
                        </List>
                    </DialogContent>
                    <DialogActions><Button onClick={() => setIsInboxOpen(false)}>Close</Button></DialogActions>
                </Dialog>

                <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </Fade>
    );
};

export default AdminPage;