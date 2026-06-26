import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/VideoPlayer.css';

function VideoPlayer({ src, title }) {
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

    // ----- Control visibility -----
    const showControls = useCallback(() => {
        setControlsVisible(true);
        clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        }
    }, [isPlaying]);

    // ----- Play/Pause toggle -----
    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(err => console.warn('Play error:', err));
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
        showControls();
    }, [showControls]);

    // ----- Fullscreen -----
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            videoRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        showControls();
    }, [showControls]);

    // ----- Start/restart the hide timer when playing state changes -----
    useEffect(() => {
        if (isPlaying) {
            setControlsVisible(true);
            clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);
        } else {
            setControlsVisible(true);
            clearTimeout(controlsTimeoutRef.current);
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
            }
        }
    };

    // ----- GET POSITION FROM EVENT (Mouse or Touch) -----
    const getPosition = (e) => {
        if (!progressRef.current) return 0;
        const rect = progressRef.current.getBoundingClientRect();
        let clientX;
        if (e.touches) {
            // Touch event
            clientX = e.touches[0].clientX;
        } else {
            // Mouse event
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
    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        videoRef.current.volume = val;
        setIsMuted(val === 0);
        showControls();
    };

    const toggleMute = () => {
        if (isMuted) {
            videoRef.current.volume = volume || 1;
            setIsMuted(false);
        } else {
            videoRef.current.volume = 0;
            setIsMuted(true);
        }
        showControls();
    };

    // ----- Drag event listeners (Mouse + Touch) -----
    useEffect(() => {
        if (isDragging) {
            // Mouse events
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            // Touch events
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
                togglePlay();
            }
            if (e.code === 'KeyF') {
                e.preventDefault();
                toggleFullscreen();
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                if (videoRef.current) videoRef.current.currentTime += 5;
                showControls();
            }
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                if (videoRef.current) videoRef.current.currentTime -= 5;
                showControls();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, toggleFullscreen, showControls]);

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
            onMouseMove={showControls}
            onMouseEnter={showControls}
            onMouseLeave={() => {
                if (isPlaying && !isDragging) {
                    clearTimeout(controlsTimeoutRef.current);
                    controlsTimeoutRef.current = setTimeout(() => {
                        setControlsVisible(false);
                    }, 3000);
                }
            }}
        >
            <div className="video-wrapper" onClick={togglePlay}>
                <video
                    ref={videoRef}
                    className="video-element"
                    src={src}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    playsInline
                />
                {!isPlaying && (
                    <div className="play-overlay">
                        <div className="play-button">▶</div>
                    </div>
                )}
            </div>

            {/* ----- CUSTOM CONTROLS ----- */}
            <div 
                className={`video-controls ${controlsVisible ? 'visible' : 'hidden'}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={showControls}
                onMouseMove={showControls}
            >
                {/* Progress Bar with Hover Preview */}
                <div className="progress-section">
                    <div 
                        className={`progress-container ${isDragging ? 'dragging' : ''}`}
                        ref={progressRef}
                        onClick={handleSeek}
                        onMouseMove={handleProgressHover}
                        onMouseLeave={handleProgressLeave}
                    >
                        {/* Progress track */}
                        <div className="progress-track">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>

                        {/* Progress thumb - draggable with mouse & touch */}
                        <div 
                            className="progress-thumb" 
                            style={{ left: `${progress}%` }}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                        />

                        {/* Hover preview tooltip */}
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
                        <button className="control-btn" onClick={togglePlay}>
                            {isPlaying ? '⏸' : '▶'}
                        </button>

                        <span className="time-display">
                            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="controls-right">
                        <div className="volume-control">
                            <button className="control-btn" onClick={toggleMute}>
                                {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                            />
                        </div>

                        <button className="control-btn" onClick={toggleFullscreen}>
                            ⛶
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;