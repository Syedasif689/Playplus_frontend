import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import ForgotPassword from './ForgotPassword';
import '../styles/Modal.css';

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { login } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);
        if (result.success) {
            onClose();
            window.location.reload();
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
    try {
        console.log('Google credential received:', credentialResponse);
        
        // The credential is the ID token
        const idToken = credentialResponse.credential;
        console.log('ID Token:', idToken);
        
        // Decode the JWT token to get user info
        const decodedToken = parseJwt(idToken);
        console.log('Decoded token:', decodedToken);
        
        // User info from decoded token
        const userInfo = {
            sub: decodedToken.sub,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture
        };
        console.log('User info:', userInfo);
        
        // Send to backend
        const loginResponse = await API.post('/auth/google-login', {
            googleId: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            profilePicture: userInfo.picture
        });

        const { token, id, username, email } = loginResponse.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ id, username, email, profileImage: userInfo.picture }));
        
        onClose();
        window.location.reload();
    } catch (error) {
        console.error('Google login error:', error);
        setError('Google login failed. Please try again.');
    }
};

// Helper function to parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return null;
    }
}

    const handleGoogleError = () => {
        setError('Google login failed. Please try again.');
    };

    // If Forgot Password is open, show that modal instead
    if (showForgotPassword) {
        return (
            <ForgotPassword
                isOpen={true}
                onClose={() => {
                    setShowForgotPassword(false);
                    onClose();
                }}
                onSwitchToLogin={() => {
                    setShowForgotPassword(false);
                }}
            />
        );
    }

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Sign in to Play+</h2>
                        <button className="modal-close" onClick={onClose}>×</button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" disabled={loading} className="modal-submit-btn">
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="divider">
                        <span>or continue with</span>
                    </div>

                    <div className="google-login-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap
                            theme="filled_black"
                            shape="rectangular"
                            text="signin_with"
                            width="100%"
                        />
                    </div>

                    <div className="modal-footer">
                        <p>
                            Don't have an account?{' '}
                            <button className="modal-link" onClick={onSwitchToSignup}>
                                Sign up
                            </button>
                        </p>
                        <p>
                            <button 
                                className="modal-link forgot-password-link" 
                                onClick={() => setShowForgotPassword(true)}
                            >
                                Forgot Password?
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}

export default LoginModal;