import React from 'react';
import '../styles/Logo.css';

function Logo({ size = 'medium', showText = true, className = '' }) {
  const sizes = {
    small: { img: 24, text: 16 },
    medium: { img: 32, text: 20 },
    large: { img: 48, text: 28 },
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div className={`logo-container ${className}`}>
      <img 
        src="/play+-logo.png" 
        alt="Play+" 
        className="logo-img"
        style={{ width: currentSize.img, height: currentSize.img }}
      />
      {showText && (
        <span 
          className="logo-text"
          style={{ fontSize: currentSize.text }}
        >
          Play+
        </span>
      )}
    </div>
  );
}

export default Logo;