import React from 'react';
import SeedVideosButton from '../components/SeedVideosButton';

function Admin() {
    return (
        
        <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            padding: '40px 20px',
            color: '#f1f1f1'
        }}>
            
            <h1>Admin Panel</h1>
            <p>Use this page to seed videos to the database.</p>
            <SeedVideosButton />
        </div>
    );
}

export default Admin;