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

          <h3>{title}</h3>

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