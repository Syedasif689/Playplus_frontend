import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import VideoCard from '../components/VideoCard';
import '../styles/History.css';
import {
    MdHistory,
    MdDeleteSweep,
    MdHistoryToggleOff,
    MdSchedule,
    MdMoreVert,
    MdDeleteOutline,
    MdShare
} from "react-icons/md";

function History() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);

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

    // Close dropdown when clicking outside

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

   const handleRemove = async (id) => {
    // Remove immediately from UI
    setHistory(prev => prev.filter(item => item.id !== id));
    setOpenMenuId(null);

    try {
        await userApi.removeHistoryItem(id);
    } catch (err) {
        alert("Failed to remove video from history");
        console.error(err);

        // Reload history if backend deletion fails
        const response = await userApi.getHistory();
        setHistory(response.data);
    }
};
    const handleShare = async (id) => {
        const url = `${window.location.origin}/watch/${id}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Watch this video', url });
            } else {
                await navigator.clipboard.writeText(url);
                alert('✅ Link copied to clipboard!');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                alert('Failed to share');
                console.error(err);
            }
        }
        setOpenMenuId(null);
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
                <h1 className="history-title">
                    <MdHistory className="history-title-icon" />
                    Watch History
                </h1>
                {history.length > 0 && (
                    <button className="clear-history-btn" onClick={handleClearHistory}>
                        <MdDeleteSweep />
                        <span>Clear All</span>
                    </button>
                )}
            </div>
            {error && <div className="history-error">{error}</div>}
            {history.length === 0 ? (
                <div className="no-history">
                    <div className="no-history-icon">
                        <MdHistoryToggleOff />
                    </div>
                    <p>You haven't watched any videos yet.</p>
                    <Link to="/" className="browse-btn">Browse Videos</Link>
                </div>
            ) : (
                <div className="history-grid">
  {history.map(item => (
    <div key={item.id} className="history-item">
      {/* Thumbnail & card are wrapped */}
      <div className="history-item-wrapper">
        <VideoCard
          id={item.id}
          title={item.title}
          creator={item.creator}
          thumbnail={item.thumbnail}
          views={item.views}
          likes={item.likes}
          // ❌ No 'actions' prop – we place buttons outside
        />
      </div>

      {/* --- More button & dropdown – OUTSIDE the wrapper --- */}
      <button
        className="more-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenMenuId(openMenuId === item.id ? null : item.id);
        }}
        aria-label="More actions"
      >
        <MdMoreVert size={32} />
      </button>

      {openMenuId === item.id && (
        <div className="dropdown-menu">
          <button
            className="dropdown-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemove(item.id);
            }}
          >
            <MdDeleteOutline size={20} />
            Remove from History
          </button>
          <button
            className="dropdown-item"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare(item.id);
            }}
          >
            <MdShare size={20} />
            Share
          </button>
        </div>
      )}

      <span className="watched-date">
        <MdSchedule />
        {new Date(item.watchedAt).toLocaleString()}
      </span>
    </div>
  ))}
</div>
            )}
        </div>
    );
}

export default History;