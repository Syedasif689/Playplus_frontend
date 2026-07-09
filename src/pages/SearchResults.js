import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { videoApi } from '../services/api';
import defaultVideos from '../data/videos';
import '../styles/SearchResults.css';
import {
    MdSearch,
    MdOndemandVideo,
    MdVisibility,
    MdThumbUp
} from "react-icons/md";

function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Format view count
    const formatViews = (count) => {
        if (!count) return '0';
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return `${Math.floor(days / 365)} years ago`;
    };

    // Search function
    const performSearch = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Fetch from backend
            const response = await videoApi.getAll();
            const allVideos = response.data || [];
            
            // Also get local videos
            const localVideos = JSON.parse(localStorage.getItem('videos') || '[]');
            const combinedVideos = [...allVideos, ...localVideos, ...defaultVideos];

            // Remove duplicates by id
            const uniqueVideos = [];
            const seenIds = new Set();
            combinedVideos.forEach(v => {
                if (v.id && !seenIds.has(v.id)) {
                    seenIds.add(v.id);
                    uniqueVideos.push(v);
                }
            });

            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const filtered = uniqueVideos.filter(video => {
                const title = video.title?.toLowerCase() || '';
                const creator = video.creator?.toLowerCase() || '';
                const description = video.description?.toLowerCase() || '';
                return title.includes(searchLower) || 
                       creator.includes(searchLower) || 
                       description.includes(searchLower);
            });

            // Sort by relevance (title matches first, then creator, then views)
            const sorted = filtered.sort((a, b) => {
                const aTitle = a.title?.toLowerCase() || '';
                const bTitle = b.title?.toLowerCase() || '';
                const aMatch = aTitle.includes(searchLower) ? 3 : 0;
                const bMatch = bTitle.includes(searchLower) ? 3 : 0;
                const aCreator = a.creator?.toLowerCase() || '';
                const bCreator = b.creator?.toLowerCase() || '';
                const aCreatorMatch = aCreator.includes(searchLower) ? 2 : 0;
                const bCreatorMatch = bCreator.includes(searchLower) ? 2 : 0;
                
                const aScore = aMatch + aCreatorMatch + (a.views || 0) / 1000;
                const bScore = bMatch + bCreatorMatch + (b.views || 0) / 1000;
                return bScore - aScore;
            });

            setResults(sorted);

        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search videos. Please try again.');
            // Fallback: search in default videos
            const fallbackResults = defaultVideos.filter(v => {
                const searchLower = searchQuery.toLowerCase();
                return v.title?.toLowerCase().includes(searchLower) ||
                       v.creator?.toLowerCase().includes(searchLower);
            });
            setResults(fallbackResults);
        }

        setLoading(false);
    };

    useEffect(() => {
        performSearch(query);
    }, [query]);

    // Loading state
    if (loading) {
        return (
            <div className="search-results-page">
                <div className="search-loading">
                    <div className="search-loading-spinner"></div>
                    <p>Searching for "{query}"...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="search-results-page">
            {/* Header */}
            <div className="search-header">
                <h1>Search Results</h1>
                <p className="search-query">
                    {query ? (
                        <>Showing results for <strong>"{query}"</strong></>
                    ) : (
                        <>Enter a search term to find videos</>
                    )}
                </p>
                {!loading && query && (
                    <span className="search-count">{results.length} {results.length === 1 ? 'result' : 'results'}</span>
                )}
            </div>

            {error && (
                <div className="search-error">{error}</div>
            )}

            {/* Results */}
            {query && results.length === 0 && !error && (
                <div className="search-empty">
                   <div className="search-empty-icon">
                    <MdSearch />
                   </div>
                    <h2>No results found</h2>
                    <p>We couldn't find any videos matching "<strong>{query}</strong>"</p>
                    <p className="search-empty-hint">Try different keywords or check your spelling</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="search-results-grid">
                    {results.map((video) => (
                        <Link 
                            key={video.id || video._id} 
                            to={`/watch/${video.id}`} 
                            className="search-result-card"
                        >
                            <div className="search-result-thumbnail">
                                <img 
                                    src={video.thumbnail || 'https://picsum.photos/seed/' + (video.id || Math.random()) + '/400/225'} 
                                    alt={video.title || 'Video thumbnail'} 
                                    loading="lazy"
                                />
                                <span className="search-result-duration">
                                    {formatViews(video.views || 0)} views
                                </span>
                            </div>
                            <div className="search-result-details">
                                <h3 className="search-result-title">{video.title || 'Untitled'}</h3>
                                <p className="search-result-creator">{video.creator || 'Unknown Creator'}</p>
                                <div className="search-result-meta">
                                 <span className="meta-item">
                                 <MdVisibility />
                                  {formatViews(video.views || 0)} views
                              </span>                                   
                               {video.uploadedAt && (
                                        <span>• {formatDate(video.uploadedAt)}</span>
                                    )}
                                    {video.likes !== undefined && (
                                        <span>• <MdThumbUp /> {video.likes}</span>
                                    )}
                                </div>
                                {video.description && (
                                    <p className="search-result-description">
                                        {video.description.slice(0, 120)}...
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* No query state */}
            {!query && !loading && (
                <div className="search-empty search-empty-welcome">
                    <div className="search-empty-icon">
                      <MdOndemandVideo />
                    </div>
                    <h2>Search for videos</h2>
                    <p>Enter a keyword above to find videos on Play+</p>
                    <div className="search-suggestions">
                        <span>Try: </span>
                        <Link to="/search?q=react">React</Link>
                        <Link to="/search?q=java">Java</Link>
                        <Link to="/search?q=spring">Spring Boot</Link>
                        <Link to="/search?q=tutorial">Tutorial</Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchResults;