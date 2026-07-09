import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";
import defaultVideos from "../data/videos";
import { useAuth } from '../contexts/AuthContext';
import { videoApi } from '../services/api';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import "../styles/Navbar.css";
import {
    MdHome,
    MdSubscriptions,
    MdOutlineVideoCall,
    MdHistory,
    MdThumbUp,
    MdLogout,
    MdLogin,
    MdSearch,
    MdWhatshot,
    MdAccountCircle,
    MdNotifications
} from "react-icons/md";
import { FaTrophy } from "react-icons/fa";

function Navbar() {
    const [searchText, setSearchText] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [allVideos, setAllVideos] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);
    const { user, logout } = useAuth();

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    // Load videos for search
    useEffect(() => {
        const loadVideos = async () => {
            try {
                const response = await videoApi.getAll();
                const dbVideos = response.data || [];
                const localVideos = JSON.parse(localStorage.getItem("videos") || "[]");
                const allVideosCombined = [...dbVideos, ...localVideos, ...defaultVideos];
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
                const localVideos = JSON.parse(localStorage.getItem("videos") || "[]");
                setAllVideos([...localVideos, ...defaultVideos]);
            }
        };
        loadVideos();
    }, []);

    // Search logic
    useEffect(() => {
        if (searchText.trim() !== "") {
            const results = allVideos.filter(video => {
                const searchLower = searchText.toLowerCase();
                return (
                    video.title?.toLowerCase().includes(searchLower) ||
                    video.creator?.toLowerCase().includes(searchLower) ||
                    video.description?.toLowerCase().includes(searchLower)
                );
            }).slice(0, 10);
            setSearchResults(results);
            setShowSearchResults(true);
            setSelectedIndex(-1);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [searchText, allVideos]);

    // Close search on outside click
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

    // Close sidebar on outside click
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (sidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('.hamburger')) {
                closeSidebar();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [sidebarOpen]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    // Handlers
    const handleVideoSelect = (videoId) => {
        navigate(`/watch/${videoId}`);
        setShowSearchResults(false);
        setSearchText("");
        setSearchResults([]);
        closeSidebar();
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchText.trim() !== "") {
            navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
            setShowSearchResults(false);
            setSearchText("");
            searchInputRef.current?.blur();
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
            setSelectedIndex(prev => prev < searchResults.length - 1 ? prev + 1 : prev);
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
            searchInputRef.current?.blur();
        }
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            logout();
            navigate("/");
            closeSidebar();
        }
    };

    return (
        <>
            {/* ===== TOP NAVBAR ===== */}
            <nav className="navbar" role="navigation" aria-label="Main navigation">
                <div className="nav-left">
                    <button
                        className="hamburger"
                        onClick={toggleSidebar}
                        aria-label="Toggle navigation menu"
                        aria-expanded={sidebarOpen}
                    >
                        <span></span><span></span><span></span>
                    </button>
                    <div
                        className="logo"
                        onClick={() => { navigate("/"); closeSidebar(); }}
                        role="button"
                        tabIndex={0}
                        aria-label="Home"
                    >
                        <h2>▶ Play+</h2>
                    </div>
                </div>

                <div className="nav-center">
                    <div className="search-container" ref={searchContainerRef}>
                        <form onSubmit={handleSearchSubmit} className="search-form" role="search">
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
                                    aria-label="Search videos"
                                    autoComplete="off"
                                />
                                {searchText ? (
                                    <button
                                        type="button"
                                        className="clear-search-btn"
                                        onClick={handleClearSearch}
                                        aria-label="Clear search"
                                    >
                                        ✕
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="search-icon-btn"
                                        aria-label="Submit search"
                                    >
                                        <MdSearch size={22} />
                                    </button>
                                )}
                            </div>
                        </form>

                        {showSearchResults && (
                            <div
                                className="search-results-dropdown"
                                role="listbox"
                                aria-label="Search results"
                            >
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
                                                role="option"
                                                aria-selected={selectedIndex === index}
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleVideoSelect(video.id);
                                                }}
                                            >
                                                <div className="result-thumbnail">
                                                    <img
                                                        src={video.thumbnail || 'https://picsum.photos/300/180'}
                                                        alt={video.title}
                                                        loading="lazy"
                                                    />
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
                                            <button
                                                onClick={handleSearchSubmit}
                                                className="search-all-btn"
                                            >
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
                </div>

                <div className="nav-right">
                    {user ? (
                        <>
                            <Link
                                to="/notifications"
                                className="notification-btn hidden-mobile"
                                aria-label="Notifications"
                            >
                                <MdNotifications size={26} />
                                {/* Optional badge — uncomment if you have notification count */}
                                {/* <span className="notification-badge">3</span> */}
                            </Link>
                            <Link to="/profile" className="profile-link" aria-label="Profile">
                                <MdAccountCircle size={35} />
                                <span className="username">{user.username}</span>
                            </Link>
                        </>
                    ) : (
                        <button
                            className="login-btn"
                            onClick={() => setShowLoginModal(true)}
                            aria-label="Login"
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>

            {/* ===== SIDEBAR OVERLAY ===== */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
                aria-hidden="true"
            ></div>

            {/* ===== SIDEBAR ===== */}
            <aside
                className={`sidebar ${sidebarOpen ? 'open' : ''}`}
                aria-hidden={!sidebarOpen}
                role="navigation"
                aria-label="Sidebar navigation"
            >
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/play+-logo.png" alt="Play+" className="sidebar-logo-image" />
                        <h2>Play+</h2>
                    </div>
                    <button
                        className="sidebar-close"
                        onClick={closeSidebar}
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                <ul className="sidebar-nav">
                    <li>
                        <NavLink to="/" onClick={closeSidebar} end>
                            <MdHome size={22} />
                            <span>Home</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/trending" onClick={closeSidebar}>
                            <MdWhatshot size={22} />
                            <span>Trending</span>
                        </NavLink>
                    </li>
                    {user && (
                        <li>
                            <NavLink to="/subscriptions" onClick={closeSidebar}>
                                <MdSubscriptions size={22} />
                                <span>Subscriptions</span>
                            </NavLink>
                        </li>
                    )}
                    <li>
                        <NavLink to="/upload" onClick={closeSidebar}>
                            <MdOutlineVideoCall size={22} />
                            <span>Upload</span>
                        </NavLink>
                    </li>
                    {user && (
                        <li>
                            <NavLink to="/milestones" onClick={closeSidebar}>
                                <FaTrophy size={20} />
                                <span>Milestones</span>
                            </NavLink>
                        </li>
                    )}
                    {user && (
                        <li>
                            <NavLink to="/history" onClick={closeSidebar}>
                                <MdHistory size={22} />
                                <span>History</span>
                            </NavLink>
                        </li>
                    )}
                    {user && (
                        <li>
                            <NavLink to="/liked" onClick={closeSidebar}>
                                <MdThumbUp size={22} />
                                <span>Liked Videos</span>
                            </NavLink>
                        </li>
                    )}
                </ul>

                <div className="sidebar-footer">
                    {user ? (
                        <button className="sidebar-logout" onClick={handleLogout}>
                            <MdLogout size={22} />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <button
                            className="sidebar-login"
                            onClick={() => {
                                setShowLoginModal(true);
                                closeSidebar();
                            }}
                        >
                            <MdLogin size={22} />
                            <span>Login</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* ===== AUTH MODALS ===== */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSwitchToSignup={() => { setShowLoginModal(false); setShowSignupModal(true); }}
            />
            <SignupModal
                isOpen={showSignupModal}
                onClose={() => setShowSignupModal(false)}
                onSwitchToLogin={() => { setShowSignupModal(false); setShowLoginModal(true); }}
            />
        </>
    );
}

export default Navbar;