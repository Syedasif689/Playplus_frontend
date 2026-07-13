import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);


    useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    API.get("/user/me")
        .then(res => {
            setUser(res.data);
            localStorage.setItem(
                "user",
                JSON.stringify(res.data)
            );
        })
        .catch(() => logout());
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

    localStorage.setItem("token", token);

    const profile = await API.get("/user/me");

       setUser(profile.data);

     localStorage.setItem(
       "user",
       JSON.stringify(profile.data)
     );
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data || 'Login failed' };
        }
    };
     const loading = false;
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
        loading,
       
    }}
>
            {children}
        </AuthContext.Provider>
    );
};