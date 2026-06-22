import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/VideoPlayer.css';

function VideoPlayer({ src, title }) {
    const videoRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);

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
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
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
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);
            setDuration(total);
        }
    };

    // Seek
    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const seekTime = x * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
        setProgress(x * 100);
        showControls();
    };

    // Volume
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

    // Format time
    const formatTime = (time) => {
        if (!time) return '0:00';
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

    return (
        <div 
            className="video-player-container"
            onMouseMove={showControls}
            onMouseEnter={showControls}
            onMouseLeave={() => {
                if (isPlaying) {
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
                />
                {/* Play overlay - only show when paused */}
                {!isPlaying && (
                    <div className="play-overlay">
                        <div className="play-button">▶</div>
                    </div>
                )}
            </div>

            {/* Custom Controls with fade */}
            <div 
                className={`video-controls ${controlsVisible ? 'visible' : 'hidden'}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={showControls}
                onMouseMove={showControls}
            >
                <button className="control-btn" onClick={togglePlay}>
                    {isPlaying ? '⏸' : '▶'}
                </button>

                <div className="progress-container" onClick={handleSeek}>
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                    
                </div>

                <span className="time-display">
                    {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                </span>

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
                    {isFullscreen ? '⛶' : '⛶'}
                </button>
            </div>
        </div>
    );
}

export default VideoPlayer;