import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import VideoCard from '../components/VideoCard';
import '../styles/History.css';

function History() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const loadHistory = async () => {
            try {
                const response = await userApi.getHistory();
                setHistory(response.data);
            } catch (err) {
                setError('Failed to load watch history');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [user]);

    const handleClearHistory = async () => {
        if (!window.confirm('Clear your entire watch history?')) return;
        try {
            await userApi.clearHistory();
            setHistory([]);
            alert('✅ History cleared!');
        } catch (err) {
            alert('Failed to clear history');
        }
    };

    if (!user) {
        return (
            <div className="history-container">
                <p>Please login to view your history.</p>
                <Link to="/" className="browse-btn">Go Home</Link>
            </div>
        );
    }

    if (loading) return <div className="history-container"><p>Loading history...</p></div>;

    return (
        <div className="history-container">
            <div className="history-header">
                <h1>📜 Watch History</h1>
                {history.length > 0 && (
                    <button className="clear-history-btn" onClick={handleClearHistory}>
                        Clear All
                    </button>
                )}
            </div>
            {error && <div className="history-error">{error}</div>}
            {history.length === 0 ? (
                <div className="no-history">
                    <p>You haven't watched any videos yet.</p>
                    <Link to="/" className="browse-btn">Browse Videos</Link>
                </div>
            ) : (
                <div className="history-grid">
                    {history.map(item => (
                        <div key={item.id} className="history-item">
                            <VideoCard
                                id={item.id}
                                title={item.title}
                                creator={item.creator}
                                thumbnail={item.thumbnail}
                                views={item.views}
                                likes={item.likes}
                            />
                            <span className="watched-date">
                                Watched: {new Date(item.watchedAt).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default History;