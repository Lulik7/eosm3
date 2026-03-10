import api from '../api/axios';
import {useNavigate} from 'react-router-dom';
import {useState} from 'react';
import {
    AppBar, Toolbar, Button, Typography, Container,
    Box, Grid, Avatar, Stack, IconButton, Drawer,
    Paper, TextField, Alert, Snackbar
} from '@mui/material';
import {
    HomeWork as HomeWorkIcon,
    Description as DescriptionIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';
import {
    ArrowBackIos as ArrowBackIcon,
    ArrowForwardIos as ArrowForwardIcon
} from '@mui/icons-material';

interface LoginPageProps {
    onLoginSuccess: () => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [currentReview, setCurrentReview] = useState(0);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('user');
    const [inviteCode, setInviteCode] = useState('');

    // Секретные коды → роли
    const INVITE_CODES: Record<string, string> = {
        'SUPPORT2026': 'support',
        'ENGINEER2026': 'engineer',
        'ADMIN2026': 'admin',
    };

    const resolvedRole = INVITE_CODES[inviteCode.toUpperCase()] || 'user';
    const [error, setError] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const navItems = ['Home', 'About Us', 'Services', 'Our Team', 'Reviews', 'Contacts'];

    const reviewsData = [
        {
            id: 1, client: 'Tatiana', complex: 'Olimp',
            img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200',
            text: 'Our constant information and promotion support...'
        },
        {
            id: 2, client: 'Michael', complex: 'Skyline',
            img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200',
            text: 'Everyday practice shows that strengthening...'
        }
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
            console.error("Детальная ошибка авторизации:", err.response?.data);
            const serverMessage = err.response?.data?.message;
            const status = err.response?.status;
            if (status === 401) setError("Неверный логин или пароль");
            else if (status === 400) setError(serverMessage || "Ошибка в заполненных данных");
            else if (status === 409) setError("Этот Email уже занят");
            else setError(serverMessage || "Ошибка сервера. Попробуйте позже.");
            setSnackbarMsg(serverMessage || "Произошла ошибка");
            setSnackbarOpen(true);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh', width: '100%',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(/houseback.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', flexDirection: 'column', overflowX: 'hidden'
        }}>

            {/* 1. ВЕРХНЯЯ ЧАСТЬ */}
            <Box sx={{bgcolor: 'white', py: 2, display: {xs: 'none', md: 'block'}}}>
                <Container maxWidth={false} sx={{px: {md: 10}}}>
                    <Grid container alignItems="center">
                        <Grid item md={3}>
                            <Typography variant="body2" sx={{color: '#2b4d7e', lineHeight: 1.2}}>
                                City Administration<br/>Working since 1970
                            </Typography>
                        </Grid>
                        <Grid item md={6}>
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                <Box sx={{width: 40, height: 40, bgcolor: '#2b4d7e', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <HomeWorkIcon sx={{color: 'white'}}/>
                                </Box>
                                <Typography variant="h5" sx={{fontWeight: 800, color: '#2b4d7e', letterSpacing: 1}}>
                                    SMART CITY MANAGEMENT
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item md={3}>
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
                                <Typography variant="body1" sx={{fontWeight: 'bold', color: '#2b4d7e', whiteSpace: 'nowrap'}}>
                                    8 800 333 22 33
                                </Typography>
                                <Button variant="contained" sx={{bgcolor: '#2b4d7e', borderRadius: 0, textTransform: 'none', px: 2, py: 1, fontSize: '0.875rem', whiteSpace: 'nowrap', '&:hover': {bgcolor: '#1a3254'}}}>
                                    Request a call
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* 2. НАВИГАЦИЯ */}
            <AppBar position="static" sx={{bgcolor: '#2b4d7e'}} elevation={0}>
                <Container maxWidth="lg">
                    <Toolbar sx={{justifyContent: 'center', gap: 4}}>
                        {navItems.map((item) => (
                            <Button key={item} color="inherit" sx={{textTransform: 'none', display: {xs: 'none', md: 'block'}}}>
                                {item}
                            </Button>
                        ))}
                        <IconButton color="inherit" sx={{display: {md: 'none'}}} onClick={handleDrawerToggle}>
                            <MenuIcon/>
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* 3. ОСНОВНОЙ КОНТЕНТ */}
            <Container maxWidth={false} sx={{mt: 8, flexGrow: 1, px: {xs: 2, md: 10}}}>
                <Grid container spacing={2} justifyContent="space-between">
                    <Grid item xs={12} md={6}>
                        <Typography variant="h3" sx={{color: '#2b4d7e', fontWeight: 800, mb: 2, maxWidth: 700, fontSize: {xs: '1.8rem', md: '3rem'}}}>
                            WE WILL FIND YOUR DREAM APARTMENT IN ANY AREA TODAY
                        </Typography>
                        <Typography variant="body1" sx={{mb: 6, color: '#333', fontSize: '1.1rem'}}>
                            Contact us regarding utility services
                        </Typography>
                        <Box sx={{mb: 6}}>
                            <Stack spacing={4}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{bgcolor: '#f5a623', width: 50, height: 50}}><HomeWorkIcon/></Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Public Utilities</Typography>
                                        <Typography variant="body2">No Middlemen</Typography>
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{bgcolor: '#f5a623', width: 50, height: 50}}><DescriptionIcon/></Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Payments</Typography>
                                        <Typography variant="body2">Full Transaction</Typography>
                                    </Box>
                                </Stack>
                            </Stack>
                        </Box>
                        <Button variant="contained" sx={{bgcolor: '#2b4d7e', borderRadius: 0, px: 5, py: 2, fontWeight: 'bold'}}>
                            REACH OUT TO US
                        </Button>
                    </Grid>
                </Grid>
            </Container>

            {/* ФОРМА АВТОРИЗАЦИИ — ширина 260px как было оригинально */}
            <Grid item xs={12} md={6} sx={{
                display: 'flex',
                justifyContent: {xs: 'center', md: 'flex-end'},
                alignItems: 'flex-start',
                position: 'relative',
                px: {xs: 2, md: 0}
            }}>
                <Box sx={{
                    p: 4,
                    width: '260px',         // ВОССТАНОВЛЕНО: оригинальная ширина
                    minHeight: '340px',
                    bgcolor: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: 0,
                    mt: {md: -50, xs: 4},
                    mr: {md: 15, xs: 0},
                    boxShadow: '0px 12px 30px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 2,
                    zIndex: 10,
                    borderTop: '4px solid #2b4d7e'
                }}>
                    <Typography variant="button" sx={{color: '#2b4d7e', fontWeight: 900, textAlign: 'center', mb: 0.5, display: 'block', letterSpacing: 1}}>
                        {isLogin ? 'Authorization' : 'Registration'}
                    </Typography>

                    {error && (
                        <Alert severity="error" variant="filled" sx={{fontSize: '0.7rem', py: 0.5, borderRadius: 0, '& .MuiAlert-icon': {fontSize: '1rem'}}}>
                            {error}
                        </Alert>
                    )}

                    {!isLogin && (
                        <TextField fullWidth size="small" label="Username" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)} sx={{'& .MuiOutlinedInput-root': {borderRadius: 0}}}/>
                    )}

                    <TextField fullWidth size="small" label="Email" variant="outlined" value={email} autoComplete="off" onChange={(e) => setEmail(e.target.value)} sx={{'& .MuiOutlinedInput-root': {borderRadius: 0}}}/>
                    <TextField fullWidth size="small" label="Password" type="password" variant="outlined" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} sx={{'& .MuiOutlinedInput-root': {borderRadius: 0}}}/>

                    <Button fullWidth variant="contained" onClick={handleAuth} sx={{bgcolor: '#2b4d7e', py: 1.2, borderRadius: 0, fontWeight: 'bold', mt: 1, '&:hover': {bgcolor: '#1a3254'}}}>
                        {isLogin ? 'LOG IN' : 'SIGN UP'}
                    </Button>

                    <Box sx={{textAlign: 'center', mt: 1}}>
                        <Typography variant="caption" sx={{color: '#666', display: 'block', fontSize: '0.65rem'}}>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </Typography>
                        <Button onClick={() => {setError(''); setIsLogin(!isLogin); setRole('user'); setInviteCode('');}} sx={{textTransform: 'none', color: '#2b4d7e', fontSize: '0.75rem', fontWeight: 800, p: 0, '&:hover': {background: 'none', textDecoration: 'underline'}}}>
                            {isLogin ? "Create a new one" : "Log in here"}
                        </Button>
                    </Box>

                    {/* СЛУЖЕБНЫЙ ВХОД — только при регистрации */}
                    {!isLogin && (
                        <Box sx={{borderTop: '1px dashed #ccc', pt: 1.5, mt: 0.5}}>
                            <Typography variant="caption" sx={{color: '#999', display: 'block', textAlign: 'center', mb: 1, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 1}}>
                                Staff Access
                            </Typography>
                            <TextField
                                fullWidth size="small"
                                label="Введите код"
                                variant="outlined"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                sx={{'& .MuiOutlinedInput-root': {borderRadius: 0}}}
                                helperText={inviteCode && INVITE_CODES[inviteCode.toUpperCase()]
                                    ? `✓ ${INVITE_CODES[inviteCode.toUpperCase()]}`
                                    : ''}
                                FormHelperTextProps={{sx: {color: '#2b4d7e', fontWeight: 'bold'}}}
                            />
                        </Box>
                    )}
                </Box>
            </Grid>

            {/* 4. СТАТИСТИКА */}
            <Grid item xs={12}>
                <Box sx={{bgcolor: '#2b4d7e', color: 'white', py: 8, mt: 10}}>
                    <Container maxWidth="xl">
                        <Grid container spacing={4} justifyContent="center" textAlign="center">
                            {[
                                {value: '20+', label: 'Realtors in the team'},
                                {value: '15000', label: 'Deals closed'},
                                {value: '20 years', label: 'Market experience'},
                                {value: '200+', label: 'Offices nationwide'}
                            ].map((stat, index) => (
                                <Grid item xs={6} md={3} key={index}>
                                    <Typography variant="h2" sx={{fontWeight: 800, mb: 1, color: '#f5a623', fontSize: {xs: '2rem', md: '3.75rem'}}}>
                                        {stat.value}
                                    </Typography>
                                    <Typography variant="body1" sx={{opacity: 0.9}}>{stat.label}</Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>
            </Grid>

            {/* 5. УСЛУГИ — HOVER на фото */}
            <Grid item xs={12}>
                <Box sx={{py: 10, bgcolor: '#f9f9f9'}}>
                    <Container maxWidth={false} sx={{px: {xs: 2, md: 10}}}>
                        <Box textAlign="center" sx={{mb: 12}}>
                            <Typography variant="h2" sx={{color: '#2b4d7e', fontWeight: 700, mb: 3, textTransform: 'uppercase', fontSize: {xs: '1.4rem', md: '3.75rem'}}}>
                                We help you make the right choice
                            </Typography>
                            <Box sx={{width: 150, height: 6, bgcolor: '#2b4d7e', mx: 'auto'}}/>
                        </Box>
                        <Grid container spacing={3}>
                            {[
                                {title: 'Complaints', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800'},
                                {title: 'Parking Fee', img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800'},
                                {title: 'Public Utilities', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800'},
                                {title: 'Education Department', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800'}
                            ].map((service, index) => (
                                <Grid item xs={12} sm={6} md={3} key={index}>
                                    <Paper elevation={0} sx={{
                                        borderRadius: 0, overflow: 'hidden', cursor: 'pointer',
                                        '&:hover .service-img': {transform: 'scale(1.07)'}
                                    }}>
                                        <Box className="service-img" sx={{
                                            height: 280,
                                            backgroundImage: `url(${service.img})`,
                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                            transition: 'transform 0.4s ease'
                                        }}/>
                                        <Box sx={{p: 1.5, bgcolor: '#2b4d7e', color: 'white', textAlign: 'center', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                            <Typography sx={{fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase'}}>{service.title}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>
            </Grid>

            {/* 6. О ГОРОДЕ */}
            <Grid item xs={12}>
                <Box sx={{py: 12, bgcolor: 'white'}}>
                    <Container maxWidth="lg">
                        <Box textAlign="center" sx={{mb: 8}}>
                            <Typography variant="h3" sx={{color: '#2b4d7e', fontWeight: 800, mb: 2}}>
                                "About Our City"
                            </Typography>
                            <Box sx={{width: 80, height: 4, bgcolor: '#2b4d7e', mx: 'auto'}}/>
                        </Box>
                        <Grid container spacing={5} sx={{alignItems: 'flex-start'}}>
                            <Grid item xs={12} md={4}>
                                <Box component="img" src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800"
                                     sx={{width: '100%', height: 'auto', display: 'block', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '2px'}}/>
                            </Grid>
                            <Grid item xs={12} md={8} sx={{pl: {md: 6, xs: 0}}}>
                                <Stack spacing={3}>
                                    <Typography variant="body1" sx={{color: '#333', lineHeight: 1.8, fontSize: '1.05rem'}}>
                                        The City Administration is dedicated to ensuring a high quality of life for all residents
                                        by providing efficient public services and fostering sustainable urban development.
                                        Our primary goal is to maintain transparency and accessibility in municipal governance.
                                    </Typography>
                                    <Typography variant="body1" sx={{color: '#333', lineHeight: 1.8, fontSize: '1.05rem'}}>
                                        We manage a wide range of essential sectors, including urban planning, public safety,
                                        health services, and environmental protection to create a thriving community for everyone.
                                    </Typography>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
            </Grid>

            {/* ОТЗЫВЫ */}
            <Box sx={{py: 12, bgcolor: '#f4f7f9'}}>
                <Container maxWidth="lg">
                    <Box textAlign="center" sx={{mb: 6}}>
                        <Typography variant="h3" sx={{fontWeight: 800, color: '#2b4d7e'}}>
                            Customer <span style={{color: '#6396e3'}}>Reviews</span>
                        </Typography>
                        <Box sx={{width: 60, height: 4, bgcolor: '#6396e3', mx: 'auto', mt: 2, mb: 3}}/>
                        <Typography variant="body1" sx={{color: '#666', maxWidth: 700, mx: 'auto'}}>
                            We will find the best apartment for you from over 120 verified developers for free
                        </Typography>
                    </Box>
                    <Box sx={{position: 'relative', minHeight: {xs: 'auto', md: '500px'}, display: 'flex', alignItems: 'center'}}>
                        <Box sx={{position: 'relative', width: '90%', height: {xs: '300px', md: '500px'}, overflow: 'hidden'}}>
                            <Box sx={{
                                width: '100%', height: '100%',
                                backgroundImage: `url(${reviewsData[currentReview].img})`,
                                backgroundSize: 'cover', backgroundPosition: 'center',
                                transition: '0.6s ease-in-out'
                            }}/>
                            <IconButton onClick={() => setCurrentReview((prev) => (prev - 1 + reviewsData.length) % reviewsData.length)}
                                        sx={{position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': {bgcolor: 'rgba(255,255,255,0.4)'}}}>
                                <ArrowBackIcon/>
                            </IconButton>
                            <IconButton onClick={() => setCurrentReview((prev) => (prev + 1) % reviewsData.length)}
                                        sx={{position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': {bgcolor: 'rgba(255,255,255,0.4)'}}}>
                                <ArrowForwardIcon/>
                            </IconButton>
                        </Box>
                        <Paper elevation={10} sx={{
                            position: 'absolute', right: 0,
                            width: {xs: '90%', md: '45%'},
                            bgcolor: '#2b4d7e', color: 'white', p: 5, borderRadius: 0, zIndex: 2
                        }}>
                            <Typography variant="h5" sx={{fontWeight: 700, mb: 3, lineHeight: 1.4}}>
                                Helped {reviewsData[currentReview].client} choose an apartment in "{reviewsData[currentReview].complex}"
                            </Typography>
                            <Typography variant="body1" sx={{opacity: 0.9, lineHeight: 1.8, mb: 4}}>
                                {reviewsData[currentReview].text}
                            </Typography>
                            <Button variant="outlined" sx={{color: 'white', borderColor: 'white', borderRadius: 0, px: 4, py: 1, fontWeight: 'bold', '&:hover': {bgcolor: 'white', color: '#2b4d7e'}}}>
                                LEAVE A REQUEST
                            </Button>
                            <Stack direction="row" spacing={1} sx={{mt: 4, justifyContent: 'flex-end'}}>
                                {reviewsData.map((_, index) => (
                                    <Box key={index} onClick={() => setCurrentReview(index)} sx={{
                                        width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                                        bgcolor: currentReview === index ? 'white' : 'rgba(255,255,255,0.3)'
                                    }}/>
                                ))}
                            </Stack>
                        </Paper>
                    </Box>
                </Container>
            </Box>

            {/* 7. КАРТА */}
            <Box sx={{py: 10, position: 'relative', bgcolor: '#f4f7f9', overflow: 'hidden'}}>
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.5), rgba(255,255,255,0.5)), url(/houseback.jpg)',
                    backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4, zIndex: 1
                }}/>
                <Container maxWidth="xl" sx={{position: 'relative', zIndex: 2}}>
                    <Box textAlign="center" sx={{mb: 6}}>
                        <Typography variant="h3" sx={{color: '#2b4d7e', fontWeight: 800, mb: 2, fontSize: {xs: '1.3rem', md: '3rem'}}}>
                            For any questions call: <span style={{color: '#6396e3'}}>+972 50 123 45 67</span>
                        </Typography>
                        <Typography variant="body1" sx={{color: '#111', fontWeight: 500}}>
                            Tel Aviv, Rothschild Blvd 1, e-mail: info@smartcity.il
                        </Typography>
                    </Box>
                    <Box sx={{
                        position: 'relative', width: '100%',
                        height: {xs: 'auto', md: '600px'},
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        display: 'flex', flexDirection: {xs: 'column', md: 'row'},
                        bgcolor: 'transparent'
                    }}>
                        <Box sx={{flex: 1, height: {xs: '300px', md: '100%'}, zIndex: 3}}>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3381.189574880479!2d34.770287!3d32.063784!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151d4b7e80672651%3A0x63351ecf3e2e032!2sRothschild%20Blvd%2C%20Tel%20Aviv-Yafo%2C%20Israel!5e0!3m2!1sen!2s!4v1700000000000"
                                width="100%" height="100%" style={{border: 0}} allowFullScreen loading="lazy"
                            />
                        </Box>
                        <Paper elevation={0} sx={{
                            width: {xs: '100%', md: '450px'},
                            bgcolor: 'rgba(255, 255, 255, 0.95)', p: 6, borderRadius: 0, zIndex: 4,
                            display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            alignItems: 'center', textAlign: 'center', borderLeft: {md: '1px solid #eee'}
                        }}>
                            <Stack spacing={4} sx={{width: '100%', alignItems: 'center'}}>
                                <Box>
                                    <Typography variant="h5" sx={{color: '#2b4d7e', fontWeight: 700, mb: 3}}>Contact Us</Typography>
                                    <Typography variant="body1"><strong>Email:</strong> info@smartcity.il</Typography>
                                    <Typography variant="body1"><strong>Sales:</strong> +972 3 500 06 00</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h5" sx={{color: '#2b4d7e', fontWeight: 700, mb: 3}}>Sales Offices</Typography>
                                    <Typography variant="body1"><strong>Address:</strong> 1 Rothschild Blvd, Tel Aviv</Typography>
                                    <Typography variant="body1"><strong>Hours:</strong> Sun-Thu 09:00 - 18:00</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                </Container>
            </Box>

            {/* FOOTER */}
            <Box sx={{bgcolor: '#1a2a40', py: 4, color: 'white'}}>
                <Container maxWidth="xl">
                    <Typography variant="body2" align="center" sx={{opacity: 0.6}}>
                        © 2026 Smart City Israel. All Rights Reserved.
                    </Typography>
                </Container>
            </Box>

            {/* МОБИЛЬНОЕ МЕНЮ */}
            <Drawer anchor="right" open={mobileOpen} onClose={handleDrawerToggle}>
                <Box sx={{width: 250, p: 2}}>
                    {navItems.map((item) => (
                        <Button key={item} fullWidth sx={{justifyContent: 'flex-start', color: '#2b4d7e'}}>{item}</Button>
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
