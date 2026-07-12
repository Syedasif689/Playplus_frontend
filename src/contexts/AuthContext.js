import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await API.post('/auth/login', { username, password });
           const {
    token,
    id,
    username: userName,
    email,
    profileImage
} = response.data;
localStorage.setItem("token", token);

localStorage.setItem(
    "user",
    JSON.stringify({
        id,
        username: userName,
        email,
        profileImage
    })
);

setUser({
    id,
    username: userName,
    email,
    profileImage
});
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data || 'Login failed' };
        }
    };

    const signup = async (userData) => {
        try {
            await API.post('/auth/signup', userData);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data || 'Signup failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider
    value={{
        user,
        setUser,
        login,
        signup,
        logout,
        loading
    }}
>
            {children}
        </AuthContext.Provider>
    );
};