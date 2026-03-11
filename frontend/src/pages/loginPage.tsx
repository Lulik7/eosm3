import React from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    AppBar, Toolbar, Button, Typography, Container,
    Box, Grid, Avatar, Stack, IconButton, Drawer,
    Paper, TextField, Alert, Snackbar,
    useMediaQuery, useTheme
} from '@mui/material';
import {
    HomeWork as HomeWorkIcon,
    Description as DescriptionIcon,
    Menu as MenuIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import {
    ArrowBackIos as ArrowBackIcon,
    ArrowForwardIos as ArrowForwardIcon
} from '@mui/icons-material';

interface LoginPageProps {
    onLoginSuccess: () => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [mobileOpen, setMobileOpen] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [currentReview, setCurrentReview] = useState(0);
    const navigate = useNavigate();

    // ── Form state — at component level to prevent re-mount on re-render ──
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');

    const INVITE_CODES: Record<string, string> = {
        'SUPPORT2026': 'support',
        'ENGINEER2026': 'engineer',
        'ADMIN2026': 'admin',
    };
    const resolvedRole = INVITE_CODES[inviteCode.toUpperCase()] || 'user';

    const navItems = ['Home', 'About Us', 'Services', 'Our Team', 'Reviews', 'Contacts'];

    const reviewsData = [
        { id: 1, client: 'Tatiana', complex: 'Olimp', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200', text: 'Our constant information and promotion support helped us resolve the issue quickly.' },
        { id: 2, client: 'Michael', complex: 'Skyline', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200', text: 'Everyday practice shows that strengthening city services creates stronger communities.' }
    ];

    const handleAuth = async () => {
        try {
            setError('');
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin
                ? { email, password }
                : { email, password, username, role: resolvedRole };
            const response = await api.post(endpoint, payload);
            if (response.data) {
                await onLoginSuccess();
                const userRole = response.data.data?.user?.role || 'user';
                navigate(`/${userRole}`);
            }
        } catch (err: any) {
            const serverMessage = err.response?.data?.message;
            const status = err.response?.status;
            if (status === 401) setError('Invalid email or password');
            else if (status === 400) setError(serverMessage || 'Please check your input');
            else if (status === 409) setError('This email is already taken');
            else setError(serverMessage || 'Server error. Please try again.');
            setSnackbarMsg(serverMessage || 'An error occurred');
            setSnackbarOpen(true);
        }
    };

    // ── Auth form JSX — NOT a sub-component, just JSX variable ──
    const authFormJSX = (
        <Box sx={{
            p: 4,
            width: '320px',
            bgcolor: 'rgba(255,255,255,0.98)',
            borderRadius: 0,
            boxShadow: '0px 12px 30px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: 2.5,  // увеличен gap для высоты
            borderTop: '4px solid #2b4d7e',
            minHeight: 380,                                        // минимальная высота формы
        }}>
            {/* Mode tabs */}
            <Box sx={{ display: 'flex', borderBottom: '2px solid #e0e0e0', mb: 0.5 }}>
                <Box onClick={() => { setError(''); setIsLogin(true); setInviteCode(''); }}
                     sx={{ flex: 1, textAlign: 'center', py: 1, cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', letterSpacing: 1,
                         color: isLogin ? '#2b4d7e' : '#aaa',
                         borderBottom: isLogin ? '3px solid #2b4d7e' : '3px solid transparent',
                         transition: 'all 0.2s' }}>
                    LOG IN
                </Box>
                <Box onClick={() => { setError(''); setIsLogin(false); setInviteCode(''); }}
                     sx={{ flex: 1, textAlign: 'center', py: 1, cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', letterSpacing: 1,
                         color: !isLogin ? '#2b4d7e' : '#aaa',
                         borderBottom: !isLogin ? '3px solid #2b4d7e' : '3px solid transparent',
                         transition: 'all 0.2s' }}>
                    REGISTER
                </Box>
            </Box>

            {error && (
                <Alert severity="error" variant="filled" sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: 0 }}>
                    {error}
                </Alert>
            )}

            {!isLogin && (
                <TextField
                    fullWidth size="small" label="Name"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
            )}
            <TextField
                fullWidth size="small" label="Email"
                value={email} autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            <TextField
                fullWidth size="small" label="Password" type="password"
                value={password} autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />

            <Button fullWidth variant="contained" onClick={handleAuth}
                    sx={{ bgcolor: '#2b4d7e', py: 1.4, borderRadius: 0, fontWeight: 'bold', '&:hover': { bgcolor: '#1a3254' } }}>
                {isLogin ? 'LOG IN' : 'SIGN UP'}
            </Button>

            {/* Staff Access — always visible below Create a new one */}
            <Box sx={{ borderTop: '2px dashed #bbb', pt: 2, mt: 'auto' }}>
                <Typography sx={{ color: '#444', display: 'block', textAlign: 'center', mb: 1.2, fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>
                    Staff Access Only
                </Typography>
                <TextField
                    fullWidth size="small" label="Enter invite code"
                    value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: 0 },
                        '& .MuiInputLabel-root': { fontSize: '0.75rem', color: '#aaa' },
                        '& .MuiInputBase-input': { fontSize: '0.82rem', color: '#888' },
                    }}
                    helperText={inviteCode && INVITE_CODES[inviteCode.toUpperCase()] ? `✓ Role: ${INVITE_CODES[inviteCode.toUpperCase()]}` : ''}
                    FormHelperTextProps={{ sx: { color: '#2b4d7e', fontWeight: 'bold' } }}
                />
            </Box>
        </Box>
    );

    return (
        <Box sx={{
            minHeight: '100vh', width: '100%',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(/houseback.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', flexDirection: 'column', overflowX: 'hidden'
        }}>

            {/* Top info bar — desktop only */}
            {!isMobile && (
                <Box sx={{ bgcolor: 'white', py: 2 }}>
                    <Container maxWidth={false} sx={{ px: { md: 10 } }}>
                        <Grid container alignItems="center">
                            <Grid item md={3}>
                                <Typography variant="body2" sx={{ color: '#2b4d7e', lineHeight: 1.2 }}>
                                    City Administration<br />Working since 1970
                                </Typography>
                            </Grid>
                            <Grid item md={6}>
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                    <Box sx={{ width: 40, height: 40, bgcolor: '#2b4d7e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <HomeWorkIcon sx={{ color: 'white' }} />
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#2b4d7e', letterSpacing: 1 }}>
                                        SMART CITY MANAGEMENT
                                    </Typography>
                                </Stack>
                            </Grid>
                            <Grid item md={3}>
                                <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2b4d7e' }}>8 800 333 22 33</Typography>
                                    <Button variant="contained" sx={{ bgcolor: '#2b4d7e', borderRadius: 0, textTransform: 'none', '&:hover': { bgcolor: '#1a3254' } }}>
                                        Request a call
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
            )}

            {/* Nav */}
            <AppBar position="static" sx={{ bgcolor: '#2b4d7e' }} elevation={0}>
                <Container maxWidth="lg">
                    <Toolbar sx={{ justifyContent: isMobile ? 'space-between' : 'center', gap: 4 }}>
                        {isMobile && (
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>SMART CITY</Typography>
                        )}
                        {navItems.map((item) => (
                            <Button key={item} color="inherit" sx={{ textTransform: 'none', display: { xs: 'none', md: 'block' } }}>
                                {item}
                            </Button>
                        ))}
                        <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero section */}
            <Container maxWidth={false} sx={{ mt: { xs: 4, md: 8 }, flexGrow: 1, px: { xs: 3, md: 10 }, position: 'relative' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h3" sx={{ color: '#2b4d7e', fontWeight: 800, mb: 2, maxWidth: 700, fontSize: { xs: '1.6rem', sm: '2rem', md: '3rem' } }}>
                            WE WILL FIND YOUR DREAM APARTMENT IN ANY AREA TODAY
                        </Typography>
                        <Typography variant="body1" sx={{ mb: { xs: 3, md: 6 }, color: '#333', fontSize: '1.1rem' }}>
                            Contact us regarding utility services
                        </Typography>
                        <Box sx={{ mb: { xs: 3, md: 6 } }}>
                            <Stack spacing={4}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: '#f5a623', width: 50, height: 50 }}><HomeWorkIcon /></Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Public Utilities</Typography>
                                        <Typography variant="body2">No Middlemen</Typography>
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: '#f5a623', width: 50, height: 50 }}><DescriptionIcon /></Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Payments</Typography>
                                        <Typography variant="body2">Full Transaction</Typography>
                                    </Box>
                                </Stack>
                            </Stack>
                        </Box>
                        <Button variant="contained" sx={{ bgcolor: '#2b4d7e', borderRadius: 0, px: { xs: 3, md: 5 }, py: 2, fontWeight: 'bold' }}>
                            REACH OUT TO US
                        </Button>
                    </Grid>
                </Grid>

                {/* Desktop auth form — absolute on right, same as original design */}
                {!isMobile && (
                    <Box sx={{
                        position: 'absolute',
                        top: 40,
                        right: { md: 40, lg: 100 },
                        zIndex: 10,
                    }}>
                        {authFormJSX}
                    </Box>
                )}
            </Container>

            {/* Mobile auth form — placed AFTER hero block, centered */}
            {isMobile && (
                <Box sx={{ display: 'flex', justifyContent: 'center', px: 3, py: 4, bgcolor: 'rgba(255,255,255,0.5)' }}>
                    <Box sx={{ width: '100%', maxWidth: 400 }}>
                        {authFormJSX}
                    </Box>
                </Box>
            )}

            {/* Stats */}
            <Box sx={{ bgcolor: '#2b4d7e', color: 'white', py: { xs: 6, md: 8 }, mt: { xs: 4, md: 10 } }}>
                <Container maxWidth="xl">
                    <Grid container spacing={4} justifyContent="center" textAlign="center">
                        {[
                            { value: '20+', label: 'Realtors in the team' },
                            { value: '15000', label: 'Deals closed' },
                            { value: '20 years', label: 'Market experience' },
                            { value: '200+', label: 'Offices nationwide' }
                        ].map((stat, index) => (
                            <Grid item xs={6} md={3} key={index}>
                                <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, color: '#f5a623', fontSize: { xs: '1.8rem', md: '3.75rem' } }}>
                                    {stat.value}
                                </Typography>
                                <Typography variant="body1" sx={{ opacity: 0.9, fontSize: { xs: '0.85rem', md: '1rem' } }}>{stat.label}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Services */}
            <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#f9f9f9' }}>
                <Container maxWidth={false} sx={{ px: { xs: 3, md: 10 } }}>
                    <Box textAlign="center" sx={{ mb: { xs: 6, md: 10 } }}>
                        <Typography variant="h2" sx={{ color: '#2b4d7e', fontWeight: 700, mb: 3, textTransform: 'uppercase', fontSize: { xs: '1.3rem', sm: '1.8rem', md: '3rem' } }}>
                            We help you make the right choice
                        </Typography>
                        <Box sx={{ width: 120, height: 5, bgcolor: '#2b4d7e', mx: 'auto' }} />
                    </Box>
                    <Grid container spacing={3}>
                        {[
                            { title: 'Complaints', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800' },
                            { title: 'Parking Fee', img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800' },
                            { title: 'Public Utilities', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800' },
                            { title: 'Education Dept.', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800' }
                        ].map((service, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Paper elevation={0} sx={{ borderRadius: 0, overflow: 'hidden', cursor: 'pointer', '&:hover .service-img': { transform: 'scale(1.07)' } }}>
                                    <Box className="service-img" sx={{
                                        height: { xs: 200, md: 280 },
                                        backgroundImage: `url(${service.img})`,
                                        backgroundSize: 'cover', backgroundPosition: 'center', transition: 'transform 0.4s ease'
                                    }} />
                                    <Box sx={{ p: 1.5, bgcolor: '#2b4d7e', color: 'white', textAlign: 'center', minHeight: 55, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' }}>{service.title}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* About the city */}
            <Box sx={{ py: { xs: 6, md: 12 }, bgcolor: 'white' }}>
                <Container maxWidth="lg">
                    <Box textAlign="center" sx={{ mb: { xs: 4, md: 8 } }}>
                        <Typography variant="h3" sx={{ color: '#2b4d7e', fontWeight: 800, mb: 2, fontSize: { xs: '1.5rem', md: '3rem' } }}>
                            "About Our City"
                        </Typography>
                        <Box sx={{ width: 80, height: 4, bgcolor: '#2b4d7e', mx: 'auto' }} />
                    </Box>
                    <Grid container spacing={5} alignItems="flex-start">
                        <Grid item xs={12} md={4}>
                            <Box component="img" src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800"
                                 sx={{ width: '100%', height: 'auto', display: 'block', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '2px' }} />
                        </Grid>
                        <Grid item xs={12} md={8} sx={{ pl: { md: 6, xs: 0 } }}>
                            <Stack spacing={3}>
                                <Typography variant="body1" sx={{ color: '#333', lineHeight: 1.8 }}>
                                    The City Administration is dedicated to ensuring a high quality of life for all residents by providing efficient public services and fostering sustainable urban development.
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#333', lineHeight: 1.8 }}>
                                    We manage a wide range of essential sectors, including urban planning, public safety, health services, and environmental protection to create a thriving community for everyone.
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Reviews */}
            <Box sx={{ py: { xs: 6, md: 12 }, bgcolor: '#f4f7f9' }}>
                <Container maxWidth="lg">
                    <Box textAlign="center" sx={{ mb: 6 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#2b4d7e', fontSize: { xs: '1.5rem', md: '3rem' } }}>
                            Customer <span style={{ color: '#6396e3' }}>Reviews</span>
                        </Typography>
                        <Box sx={{ width: 60, height: 4, bgcolor: '#6396e3', mx: 'auto', mt: 2, mb: 3 }} />
                    </Box>
                    <Box sx={{ position: 'relative', minHeight: { xs: 'auto', md: '500px' }, display: 'flex', alignItems: 'center', flexDirection: { xs: 'column', md: 'row' } }}>
                        <Box sx={{ position: 'relative', width: { xs: '100%', md: '90%' }, height: { xs: '220px', md: '500px' }, overflow: 'hidden' }}>
                            <Box sx={{ width: '100%', height: '100%', backgroundImage: `url(${reviewsData[currentReview].img})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: '0.6s ease-in-out' }} />
                            <IconButton onClick={() => setCurrentReview((prev) => (prev - 1 + reviewsData.length) % reviewsData.length)}
                                        sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <IconButton onClick={() => setCurrentReview((prev) => (prev + 1) % reviewsData.length)}
                                        sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                <ArrowForwardIcon />
                            </IconButton>
                        </Box>
                        <Paper elevation={10} sx={{
                            position: { xs: 'relative', md: 'absolute' }, right: 0,
                            width: { xs: '100%', md: '45%' },
                            bgcolor: '#2b4d7e', color: 'white', p: { xs: 3, md: 5 }, borderRadius: 0, zIndex: 2
                        }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.4, fontSize: { xs: '1.1rem', md: '1.5rem' } }}>
                                Helped {reviewsData[currentReview].client} choose an apartment in "{reviewsData[currentReview].complex}"
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.8, mb: 3 }}>
                                {reviewsData[currentReview].text}
                            </Typography>
                            <Button variant="outlined" sx={{ color: 'white', borderColor: 'white', borderRadius: 0, px: 4, py: 1, fontWeight: 'bold', '&:hover': { bgcolor: 'white', color: '#2b4d7e' } }}>
                                LEAVE A REQUEST
                            </Button>
                        </Paper>
                    </Box>
                </Container>
            </Box>

            {/* Map */}
            <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#f4f7f9' }}>
                <Container maxWidth="xl">
                    <Box textAlign="center" sx={{ mb: 4 }}>
                        <Typography variant="h3" sx={{ color: '#2b4d7e', fontWeight: 800, mb: 1, fontSize: { xs: '1.2rem', md: '2.5rem' } }}>
                            For any questions call: <span style={{ color: '#6396e3' }}>+972 50 123 45 67</span>
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#111', fontWeight: 500 }}>
                            Tel Aviv, Rothschild Blvd 1, e-mail: info@smartcity.il
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                        <Box sx={{ flex: 1, height: { xs: '280px', md: '500px' } }}>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3381.189574880479!2d34.770287!3d32.063784!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151d4b7e80672651%3A0x63351ecf3e2e032!2sRothschild%20Blvd%2C%20Tel%20Aviv-Yafo%2C%20Israel!5e0!3m2!1sen!2s!4v1700000000000"
                                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
                        </Box>
                        <Paper elevation={0} sx={{ width: { xs: '100%', md: '380px' }, flexShrink: 0, bgcolor: 'rgba(255,255,255,0.97)', p: { xs: 3, md: 5 }, borderRadius: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <Stack spacing={3} sx={{ width: '100%' }}>
                                <Box>
                                    <Typography variant="h5" sx={{ color: '#2b4d7e', fontWeight: 700, mb: 2 }}>Contact Us</Typography>
                                    <Typography variant="body1"><strong>Email:</strong> info@smartcity.il</Typography>
                                    <Typography variant="body1"><strong>Sales:</strong> +972 3 500 06 00</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h5" sx={{ color: '#2b4d7e', fontWeight: 700, mb: 2 }}>Sales Offices</Typography>
                                    <Typography variant="body1"><strong>Address:</strong> 1 Rothschild Blvd, Tel Aviv</Typography>
                                    <Typography variant="body1"><strong>Hours:</strong> Sun-Thu 09:00 - 18:00</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ bgcolor: '#1a2a40', py: 4, color: 'white' }}>
                <Container maxWidth="xl">
                    <Typography variant="body2" align="center" sx={{ opacity: 0.6 }}>
                        © 2026 Smart City Israel. All Rights Reserved.
                    </Typography>
                </Container>
            </Box>

            {/* Mobile nav drawer */}
            <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
                <Box sx={{ width: 240, p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography fontWeight="bold" color="#2b4d7e">MENU</Typography>
                        <IconButton onClick={() => setMobileOpen(false)}><CloseIcon /></IconButton>
                    </Stack>
                    {navItems.map((item) => (
                        <Button key={item} fullWidth sx={{ justifyContent: 'flex-start', color: '#2b4d7e', py: 1 }}>{item}</Button>
                    ))}
                </Box>
            </Drawer>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
                <Alert severity="error" variant="filled">{snackbarMsg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default LoginPage;
