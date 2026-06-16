import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Navbar.css";
import defaultVideos from "../data/videos";
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

function Navbar() {
  const [searchText, setSearchText] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { user, logout } = useAuth();

  // Get all videos
  const allVideos = useMemo(() => {
    const uploadedVideos = JSON.parse(localStorage.getItem("videos")) || [];
    return [...uploadedVideos, ...defaultVideos];
  }, []);

  // Search videos based on input
  useEffect(() => {
    if (searchText.trim() !== "") {
      const results = allVideos.filter(video =>
        video.title.toLowerCase().includes(searchText.toLowerCase()) ||
        video.creator?.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 8);
      setSearchResults(results);
      setShowSearchResults(true);
      setSelectedIndex(-1);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchText, allVideos]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
        setSearchText("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVideoSelect = (videoId) => {
    navigate(`/watch/${videoId}`);
    setShowSearchResults(false);
    setSearchText("");
    setSearchResults([]);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setShowSearchResults(false);
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleVideoSelect(searchResults[selectedIndex].id);
      } else if (searchResults.length > 0) {
        handleVideoSelect(searchResults[0].id);
      }
    } else if (e.key === "Escape") {
      setShowSearchResults(false);
      setSearchText("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <h2>▶ Play+</h2>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/">Trending</Link>
          <Link to="/">Subscriptions</Link>
          <Link to="/upload">Upload</Link>
        </div>

        <div className="nav-actions">
          {/* Search Input - Always Visible */}
          <div className="search-container" ref={searchContainerRef}>
            <div className="search-input-container">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search videos..."
                className="search-input-field"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => searchText.trim() !== "" && setShowSearchResults(true)}
              />
              {searchText ? (
                <button className="clear-search-btn" onClick={handleClearSearch}>
                  ✕
                </button>
              ) : (
                <button className="search-icon-btn">
                  🔍
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="search-results-dropdown">
                {searchResults.length > 0 ? (
                  <>
                    <div className="search-results-header">
                      <span>Search Results</span>
                    </div>
                    {searchResults.map((video, index) => (
                      <div
                        key={video.id}
                        className={`search-result-item ${selectedIndex === index ? "selected" : ""}`}
                        onClick={() => handleVideoSelect(video.id)}
                      >
                        <div className="result-thumbnail">
                          <img src={video.thumbnail} alt={video.title} />
                        </div>
                        <div className="result-info">
                          <div className="result-title">{video.title}</div>
                          <div className="result-creator">{video.creator}</div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="no-results-dropdown">
                    <p>No videos found for "{searchText}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Authentication Buttons */}
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="profile-link">
                <span className="profile-avatar-small">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="username">{user.username}</span>
              </Link>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLoginModal(true)}>
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </>
  );
}

export default Navbar;