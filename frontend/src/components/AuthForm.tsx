
import { Paper, Typography, TextField, Button, Box, Stack } from '@mui/material';
import React from 'react';
import {useState} from "react";

export const AuthForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    const toggleForm = () => {
        setIsLogin(!isLogin);
    };

    return (
        <Paper elevation={3} sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: 2 }}>
            <Typography variant="h5" color="#2b4d7e" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase' }}>
                {isLogin ? 'Log In' : 'Sign Up'}
            </Typography>
            <Stack spacing={3}>
                <TextField fullWidth label="Username or Email" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
                <TextField fullWidth label="Password" type="password" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
                {!isLogin && (
                    <TextField fullWidth label="Confirm Password" type="password" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
                )}
                <Button variant="contained" size="large" sx={{ bgcolor: '#2b4d7e', borderRadius: 0, textTransform: 'uppercase', mt: 2 }}>
                    {isLogin ? 'Log In' : 'Sign Up'}
                </Button>
                <Typography variant="body2" color="textSecondary" align="center">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <Button variant="text" onClick={toggleForm} sx={{ color: '#2b4d7e', p: 0, minWidth: 0 }}>
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </Button>
                </Typography>
            </Stack>
        </Paper>
    );
};