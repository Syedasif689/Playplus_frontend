import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/VideoPlayer.css';

function VideoPlayer({ 
    src, 
    title, 
    onPrevious, 
    onNext, 
    hasPrevious = false, 
    hasNext = false 
}) {
    const videoRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const progressRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverProgress, setHoverProgress] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    // Track if controls were manually hidden by the user
    const isManuallyHidden = useRef(false);

    // ----- Show controls and start auto-hide timer -----
    const showControls = useCallback(() => {
        isManuallyHidden.current = false; // override manual hide
        setControlsVisible(true);
        clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        }
    }, [isPlaying]);

    // ----- Toggle controls on video click -----
    const toggleControls = useCallback(() => {
        const newVal = !controlsVisible;
        setControlsVisible(newVal);
        clearTimeout(controlsTimeoutRef.current);
        if (newVal) {
            // Showing: clear manual flag and start timer if playing
            isManuallyHidden.current = false;
            if (isPlaying) {
                controlsTimeoutRef.current = setTimeout(() => {
                    setControlsVisible(false);
                }, 3000);
            }
        } else {
            // Hiding: set manual flag
            isManuallyHidden.current = true;
        }
    }, [controlsVisible, isPlaying]);

    // ----- Handle mouse interaction (move/enter) -----
    const handleMouseInteraction = useCallback(() => {
        // Only show controls if not manually hidden
        if (!isManuallyHidden.current) {
            showControls();
        }
    }, [showControls]);

    // ----- Play/Pause (only via buttons) -----
    const togglePlay = useCallback((e) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(err => console.warn('Play error:', err));
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
        showControls(); // show controls and reset timer, clears manual hide
    }, [showControls]);

    // ----- Fullscreen -----
    const toggleFullscreen = useCallback(() => {
        const container = videoRef.current?.closest('.video-player-container');
        if (!document.fullscreenElement) {
            container?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        showControls();
    }, [showControls]);

    // ----- Effect to auto-hide when playing state changes -----
    useEffect(() => {
        clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            setControlsVisible(true);
            isManuallyHidden.current = false; // new play session resets manual hide
            controlsTimeoutRef.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        } else {
            setControlsVisible(true);
            isManuallyHidden.current = false;
        }
        return () => clearTimeout(controlsTimeoutRef.current);
    }, [isPlaying]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimeout(controlsTimeoutRef.current);
    }, []);

    // Update progress
    const handleTimeUpdate = () => {
        if (videoRef.current && !isDragging) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            if (total) {
                setProgress((current / total) * 100);
                setDuration(total);
                setCurrentTime(current);
            }
        }
    };

    // ----- GET POSITION FROM EVENT (Mouse or Touch) -----
    const getPosition = (e) => {
        if (!progressRef.current) return 0;
        const rect = progressRef.current.getBoundingClientRect();
        let clientX;
        if (e.touches) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    };

    // ----- SEEK (Click on progress bar) -----
    const handleSeek = (e) => {
        if (!videoRef.current || !progressRef.current) return;
        const x = getPosition(e);
        const seekTime = x * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
        setProgress(x * 100);
        setCurrentTime(seekTime);
        showControls();
    };

    // ----- DRAG START -----
    const handleDragStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        const x = getPosition(e);
        const seekTime = x * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
        setProgress(x * 100);
        setCurrentTime(seekTime);
        showControls();
    };

    // ----- DRAG MOVE -----
    const handleDragMove = useCallback((e) => {
        if (isDragging && videoRef.current && progressRef.current) {
            e.preventDefault();
            const x = getPosition(e);
            const seekTime = x * videoRef.current.duration;
            videoRef.current.currentTime = seekTime;
            setProgress(x * 100);
            setCurrentTime(seekTime);
        }
    }, [isDragging]);

    // ----- DRAG END -----
    const handleDragEnd = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            showControls();
        }
    }, [isDragging, showControls]);

    // ----- MOUSE MOVE ON PROGRESS (Hover preview) -----
    const handleProgressHover = (e) => {
        if (!progressRef.current || isDragging) return;
        const x = getPosition(e);
        const hoverTime = x * duration;
        setHoverProgress(hoverTime);
    };

    const handleProgressLeave = () => {
        if (!isDragging) {
            setHoverProgress(null);
        }
    };

    // ----- Volume -----
    const handleVolumeChange = useCallback((e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
        }
        setIsMuted(val === 0);
        showControls();
    }, [showControls]);

    // ----- Toggle Mute -----
    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            if (isMuted) {
                videoRef.current.volume = volume || 1;
                setIsMuted(false);
            } else {
                videoRef.current.volume = 0;
                setIsMuted(true);
            }
        }
        showControls();
    }, [isMuted, volume, showControls]);

    // ----- Drag event listeners (Mouse + Touch) -----
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);
            document.addEventListener('touchcancel', handleDragEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.removeEventListener('touchcancel', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Format time
    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay(e);
            }
            if (e.code === 'KeyF') {
                e.preventDefault();
                toggleFullscreen();
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                if (videoRef.current) {
                    videoRef.current.currentTime += 5;
                    showControls();
                }
            }
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                if (videoRef.current) {
                    videoRef.current.currentTime -= 5;
                    showControls();
                }
            }
            if (e.code === 'KeyM') {
                e.preventDefault();
                toggleMute();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, toggleFullscreen, showControls, toggleMute]);

    // Sync playing state with video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    // ----- RENDER SECTION -----
    const hasValidSrc = typeof src === 'string' && src.trim() !== '';

    if (!hasValidSrc) {
        return (
            <div className="video-player-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', aspectRatio: '16/9' }}>
                <p style={{ color: '#888', fontSize: '18px' }}>🎬 No video source available</p>
            </div>
        );
    }

    // Hover time preview position
    const hoverTimeDisplay = hoverProgress !== null ? formatTime(hoverProgress) : '';
    const hoverPosition = hoverProgress !== null ? (hoverProgress / duration) * 100 : 0;

    return (
        <div 
            className="video-player-container"
            onMouseMove={handleMouseInteraction}
            onMouseEnter={handleMouseInteraction}
            onMouseLeave={() => {
                // When mouse leaves, clear the manual hide flag so re-enter shows controls
                isManuallyHidden.current = false;
                clearTimeout(controlsTimeoutRef.current);
                if (isPlaying && !isDragging) {
                    controlsTimeoutRef.current = setTimeout(() => {
                        setControlsVisible(false);
                    }, 3000);
                }
            }}
        >
            {/* Click handler toggles all controls */}
            <div className="video-wrapper" onClick={toggleControls}>
                <video
                    ref={videoRef}
                    className="video-element"
                    src={src}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    playsInline
                    preload="metadata"
                />
                
                {/* Center Controls Overlay - visibility controlled by inline styles only */}
                <div 
                    className="center-controls-overlay"
                    style={{
                        transition: 'opacity 0.2s ease',
                        opacity: controlsVisible ? 1 : 0,
                        pointerEvents: controlsVisible ? 'auto' : 'none',
                        willChange: 'opacity'
                    }}
                >
                    <div className="center-controls">
                        {/* Previous Button */}
                        {onPrevious && (
                            <button 
                                className={`center-btn prev-btn ${!hasPrevious ? 'disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasPrevious && onPrevious) onPrevious();
                                    showControls();
                                }}
                                disabled={!hasPrevious}
                                aria-label="Previous video"
                            >
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                </svg>
                            </button>
                        )}

                        {/* Play/Pause Center Button */}
                        <button className="center-btn play-center-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? (
                                <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            )}
                        </button>

                        {/* Next Button */}
                        {onNext && (
                            <button 
                                className={`center-btn next-btn ${!hasNext ? 'disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasNext && onNext) onNext();
                                    showControls();
                                }}
                                disabled={!hasNext}
                                aria-label="Next video"
                            >
                                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Controls - also use inline styles for visibility */}
            <div 
                className="video-controls"
                style={{
                    transition: 'opacity 0.2s ease',
                    opacity: controlsVisible ? 1 : 0,
                    pointerEvents: controlsVisible ? 'auto' : 'none',
                    willChange: 'opacity'
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={handleMouseInteraction}
                onMouseMove={handleMouseInteraction}
            >
                {/* Progress Bar */}
                <div className="progress-section">
                    <div 
                        className={`progress-container ${isDragging ? 'dragging' : ''}`}
                        ref={progressRef}
                        onClick={handleSeek}
                        onMouseMove={handleProgressHover}
                        onMouseLeave={handleProgressLeave}
                    >
                        <div className="progress-track">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>

                        <div 
                            className="progress-thumb" 
                            style={{ left: `${progress}%` }}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                        />

                        {hoverProgress !== null && !isDragging && (
                            <div 
                                className="progress-hover-tooltip" 
                                style={{ left: `${hoverPosition}%` }}
                            >
                                {hoverTimeDisplay}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls Row */}
                <div className="controls-row">
                    <div className="controls-left">
                        <button className="control-btn play-pause-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? (
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            )}
                        </button>

                        <span className="time-display">
                            <span className="current-time">{formatTime(currentTime)}</span>
                            <span className="separator">/</span>
                            <span className="total-time">{formatTime(duration)}</span>
                        </span>
                    </div>

                    <div className="controls-right">
                        <div className="volume-control">
                            <button className="control-btn" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                                {isMuted ? (
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                    </svg>
                                ) : volume > 0.5 ? (
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                    </svg>
                                )}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                                aria-label="Volume"
                            />
                        </div>

                        <button className="control-btn fullscreen-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;