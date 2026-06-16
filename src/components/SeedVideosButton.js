import React, { useState } from 'react';
import { seedVideos } from '../services/seedService';

function SeedVideosButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSeed = async () => {
        setLoading(true);
        setMessage('Seeding videos...');
        
        const result = await seedVideos();
        
        if (result.success) {
            setMessage(' Videos seeded successfully! Refresh the page.');
        } else {
            setMessage('❌ Failed to seed videos: ' + result.error);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <button 
                onClick={handleSeed} 
                disabled={loading}
                style={{
                    padding: '12px 24px',
                    background: '#3ea6ff',
                    color: 'black',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '16px'
                }}
            >
                {loading ? 'Seeding...' : '📤 Seed Videos to Database'}
            </button>
            {message && <p style={{ marginTop: '10px', color: '#f1f1f1' }}>{message}</p>}
        </div>
    );
}

export default SeedVideosButton;