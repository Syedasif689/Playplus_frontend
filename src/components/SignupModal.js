import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';
import '../styles/Modal.css';

const GOOGLE_CLIENT_ID =  process.env.REACT_APP_GOOGLE_CLIENT_ID;

function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const { signup } = useAuth();

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        const result = await signup({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName
        });

        if (result.success) {
            setSuccess('Account created successfully! Please sign in.');
            setTimeout(() => {
                onSwitchToLogin();
                onClose();
            }, 2000);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // Decode the credential to get user info
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    Authorization: `Bearer ${credentialResponse.credential}`
                }
            });
            const userInfo = await response.json();
            
            // Send to backend
            const loginResponse = await API.post('/auth/google-login', {
                googleId: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                profilePicture: userInfo.picture
            });

            const { token, id, username, email } = loginResponse.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ id, username, email }));
            
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Google signup error:', error);
            setError('Google signup failed. Please try again.');
        }
    };

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Create an account</h2>
                        <button className="modal-close" onClick={onClose}>×</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Full Name (Optional)"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>
                        
                        <div className="form-group">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password (min. 6 characters)"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        
                        <button type="submit" disabled={loading} className="modal-submit-btn">
                            {loading ? 'Creating account...' : 'Sign up'}
                        </button>
                    </form>

                    <div className="divider">
                        <span>or continue with</span>
                    </div>

                    <div className="google-login-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google signup failed. Please try again.')}
                            useOneTap
                            theme="filled_black"
                            shape="rectangular"
                            text="signup_with"
                            width="100%"
                        />
                    </div>

                    <div className="modal-footer">
                        <p>
                            Already have an account?{' '}
                            <button className="modal-link" onClick={onSwitchToLogin}>
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}

export default SignupModal;