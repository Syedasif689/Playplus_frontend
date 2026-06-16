import { Link } from "react-router-dom";

function VideoCard({ id, title, creator, thumbnail, likes, views, uploadedAt }) {
  return (
    <Link
      to={`/watch/${id}`}
      className="video-link"
    >
      <div className="video-card">
        <div className="video-thumbnail">
          <img
            src={thumbnail || 'https://picsum.photos/300/180'}
            alt={title}
          />
          {views !== undefined && (
            <div className="video-duration">{views} views</div>
          )}
        </div>
        
        <div className="video-info">
          <h3>{title}</h3>
          <p className="video-creator">{creator || 'Unknown'}</p>
          <div className="video-meta">
            {likes !== undefined && <span>👍 {likes}</span>}
            {uploadedAt && (
              <span>📅 {new Date(uploadedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default VideoCard;