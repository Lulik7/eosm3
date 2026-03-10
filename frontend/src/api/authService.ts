import api from './axios';

export const logoutUser = async () => {
    try {
        //  бэкенд по этому адресу очищает куки accessToken и refreshToken
        await api.post('/auth/logout');
    } catch (error) {
        console.error('Ошибка при выходе:', error);
    }
};