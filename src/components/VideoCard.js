import { Link } from "react-router-dom";
import "../styles/VideoCard.css";
import {
  FaRegThumbsUp,
  FaRegEye,
  FaUserCircle,
  FaCalendarAlt,
} from "react-icons/fa";

function VideoCard({
  id,
  title,
  creator,
  thumbnail,
  likes,
  views,
  uploadedAt,
  actions,        // NEW PROP
}) {
  return (
    <Link to={`/watch/${id}`} className="video-link">
      <div className="video-card">

        <div className="video-thumbnail">
          <img
            src={thumbnail || "https://picsum.photos/300/180"}
            alt={title}
            draggable="false"
          />

          <div className="video-duration">
            <FaRegEye />
            <span>{views || 0} views</span>
          </div>
        </div>

        <div className="video-info">

          {/* Title + Actions */}
          <div className="video-title-row">

            <h3 className="video-title">
              {title}
            </h3>

            {actions && (
              <div
                className="video-actions"
                onClick={(e) => e.preventDefault()}
              >
                {actions}
              </div>
            )}

          </div>

          <div className="video-creator">
            <FaUserCircle className="creator-icon" />
            <span>{creator || "Unknown"}</span>
          </div>

          <div className="video-meta">

            <span>
              <FaRegThumbsUp />
              {likes || 0}
            </span>

            {uploadedAt && (
              <span>
                <FaCalendarAlt />
                {new Date(uploadedAt).toLocaleDateString()}
              </span>
            )}

          </div>

        </div>

      </div>
    </Link>
  );
}

export default VideoCard;