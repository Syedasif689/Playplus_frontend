import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Navbar.css";
import defaultVideos from "../data/videos";
import { useAuth } from '../contexts/AuthContext';
import { videoApi } from '../services/api';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

function Navbar() {
  const [searchText, setSearchText] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { user, logout } = useAuth();

  // Load all videos from database and localStorage
  useEffect(() => {
    const loadVideos = async () => {
      try {
        // Get videos from database
        const response = await videoApi.getAll();
        const dbVideos = response.data || [];
        
        // Get videos from localStorage
        const localVideos = JSON.parse(localStorage.getItem("videos") || "[]");
        
        // Combine all videos
        const allVideosCombined = [...dbVideos, ...localVideos, ...defaultVideos];
        
        // Remove duplicates by id
        const uniqueVideos = [];
        const seenIds = new Set();
        allVideosCombined.forEach(video => {
          if (video.id && !seenIds.has(video.id)) {
            seenIds.add(video.id);
            uniqueVideos.push(video);
          }
        });
        
        setAllVideos(uniqueVideos);
      } catch (error) {
        console.error('Error loading videos for search:', error);
        // Fallback to localStorage and default videos
        const localVideos = JSON.parse(localStorage.getItem("videos") || "[]");
        setAllVideos([...localVideos, ...defaultVideos]);
      }
    };
    
    loadVideos();
  }, []);

  // Search videos based on input
  useEffect(() => {
    if (searchText.trim() !== "") {
      const results = allVideos.filter(video => {
        const searchLower = searchText.toLowerCase();
        return (
          video.title?.toLowerCase().includes(searchLower) ||
          video.creator?.toLowerCase().includes(searchLower) ||
          video.description?.toLowerCase().includes(searchLower)
        );
      }).slice(0, 10); // Show top 10 results
      
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchText.trim() !== "") {
      // If there are results, show them in a search page
      navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
      setShowSearchResults(false);
      setSearchText("");
    }
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
      } else if (searchText.trim() !== "") {
        handleSearchSubmit(e);
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
          <Link to="/trending">Trending</Link>
          {user && <Link to="/subscriptions">Subscriptions</Link>}
          <Link to="/upload">Upload</Link>
          {user && <Link to="/milestones">🏆 Milestones</Link>}
        </div>

        <div className="nav-actions">
          {/* Search Input */}
          <div className="search-container" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="search-form">
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
                  <button type="button" className="clear-search-btn" onClick={handleClearSearch}>
                    ✕
                  </button>
                ) : (
                  <button type="submit" className="search-icon-btn">
                    🔍
                  </button>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="search-results-dropdown">
                {searchResults.length > 0 ? (
                  <>
                    <div className="search-results-header">
                      <span>{searchResults.length} results found</span>
                    </div>
                    {searchResults.map((video, index) => (
                      <div
                        key={video.id}
                        className={`search-result-item ${selectedIndex === index ? "selected" : ""}`}
                        onClick={() => handleVideoSelect(video.id)}
                      >
                        <div className="result-thumbnail">
                          <img src={video.thumbnail || 'https://picsum.photos/300/180'} alt={video.title} />
                        </div>
                        <div className="result-info">
                          <div className="result-title">{video.title}</div>
                          <div className="result-creator">{video.creator || 'Unknown'}</div>
                          <div className="result-meta">
                            <span>{video.views || 0} views</span>
                            {video.uploadedAt && (
                              <span>• {new Date(video.uploadedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="search-results-footer">
                      <button onClick={handleSearchSubmit} className="search-all-btn">
                        See all results for "{searchText}"
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-results-dropdown">
                    <p>No videos found for "{searchText}"</p>
                    <p className="search-suggestion">Try different keywords</p>
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