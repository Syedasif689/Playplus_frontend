import React, { useState } from 'react';
import API from '../services/api';
import '../styles/Modal.css';

function ForgotPassword({ isOpen, onClose, onSwitchToLogin }) {
    const [step, setStep] = useState(1); // 1: Email, 2: Verify, 3: Reset
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await API.post('/auth/forgot-password', { email });
            // Check response for success
            if (response.data) {
                setSuccess('Verification code sent to your email!');
                setStep(2);
            } else {
                setError('Failed to send verification code. Please try again.');
            }
        } catch (error) {
            setError(error.response?.data || 'Failed to send code. Please try again.');
        }
        setLoading(false);
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await API.post('/auth/verify-code', { email, code });
            // Use response data
            if (response.data && response.data.resetToken) {
                setResetToken(response.data.resetToken);
                setSuccess('Verification successful!');
                setStep(3);
            } else {
                setError('Invalid verification code. Please try again.');
            }
        } catch (error) {
            setError(error.response?.data || 'Invalid verification code. Please try again.');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await API.post('/auth/reset-password', {
                resetToken,
                newPassword
            });
            // Use response data
            if (response.data && response.data.message) {
                setSuccess(response.data.message || 'Password reset successfully!');
            } else {
                setSuccess('Password reset successfully!');
            }
            setTimeout(() => {
                onSwitchToLogin();
                onClose();
            }, 2000);
        } catch (error) {
            setError(error.response?.data || 'Failed to reset password. Please try again.');
        }
        setLoading(false);
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <form onSubmit={handleSendCode}>
                        <h2>Forgot Password</h2>
                        <p>Enter your email to receive a verification code</p>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        <button type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                        <button type="button" className="back-btn" onClick={onSwitchToLogin}>
                            Back to Login
                        </button>
                    </form>
                );
            case 2:
                return (
                    <form onSubmit={handleVerifyCode}>
                        <h2>Verify Code</h2>
                        <p>Enter the 6-digit code sent to {email}</p>
                        <input
                            type="text"
                            placeholder="6-digit verification code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={6}
                            required
                        />
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        <button type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button type="button" className="back-btn" onClick={() => setStep(1)}>
                            Back
                        </button>
                    </form>
                );
            case 3:
                return (
                    <form onSubmit={handleResetPassword}>
                        <h2>Reset Password</h2>
                        <p>Enter your new password</p>
                        <input
                            type="password"
                            placeholder="New password (min 6 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        <button type="submit" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                );
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content forgot-password-modal" onClick={(e) => e.stopPropagation()}>
                {renderStep()}
            </div>
        </div>
    );
}

export default ForgotPassword;