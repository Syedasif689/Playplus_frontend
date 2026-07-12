import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import API from '../services/api';

function GoogleLoginButton({ onSuccess, onError }) {
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

            const {
    token,
    id,
    username,
    email,
    profileImage
} = loginResponse.data;

localStorage.setItem(
    "user",
    JSON.stringify({
        id,
        username,
        email,
        profileImage
    })
);
            
            if (onSuccess) {
                onSuccess(loginResponse.data);
            }
            
            window.location.reload();
        } catch (error) {
            console.error('Google login error:', error);
            if (onError) {
                onError(error);
            }
        }
    };

    return (
        <div className="google-login-wrapper">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={onError}
                useOneTap
                theme="filled_black"
                shape="rectangular"
                text="signin_with"
            />
        </div>
    );
}

export default GoogleLoginButton;