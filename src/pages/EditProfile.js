import "../styles/EditProfile.css";
import { useAuth } from "../contexts/AuthContext";
import React, { useEffect, useState } from "react";import {
    FaInstagram,
    FaFacebook,
    FaGithub,
    FaLinkedin
} from "react-icons/fa";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function EditProfile() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    
    const [instagram, setInstagram] = useState("");
    const [facebook, setFacebook] = useState("");
    const [github, setGithub] = useState("");
    const [linkedin, setLinkedin] = useState("");
    
    const saveProfile = async () => {
    try {

        const request = {
            username,
            bio,
            socialLinks: [
                { platform: "instagram", url: instagram },
                { platform: "facebook", url: facebook },
                { platform: "github", url: github },
                { platform: "linkedin", url: linkedin }
            ]
        };

       const response = await API.put("/user/profile", request);
        // Update AuthContext
        const updatedUser = {
          ...response.data
        };

         localStorage.setItem("user", JSON.stringify(updatedUser));
         localStorage.setItem("token", response.data.token);

         setUser(updatedUser);

         navigate("/profile");

    } catch (error) {
        console.error(error);
        alert("Failed to update profile");
    }
};
    useEffect(() => {
    if (!user) return;

    setUsername(user.username || "");
    setBio(user.bio || "");

    if (user.socialLinks) {
        user.socialLinks.forEach((link) => {

            switch (link.platform.toLowerCase()) {

                case "instagram":
                    setInstagram(link.url);
                    break;

                case "facebook":
                    setFacebook(link.url);
                    break;

                case "github":
                    setGithub(link.url);
                    break;

                case "linkedin":
                    setLinkedin(link.url);
                    break;

                default:
                    break;
            }
        });
    }

}, [user]);
    return (
        <div className="edit-profile-page">

            <div className="edit-profile-card">

                <h1>Edit Profile</h1>

                <div className="profile-photo-section">

                    <img
                        src="https://via.placeholder.com/120"
                        alt="Profile"
                        className="profile-preview"
                    />

                    <button className="change-photo-btn">
                        Change Photo
                    </button>

                </div>

                <div className="form-group">
                    <label>Username</label>
                    <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                   />
                </div>

                <div className="form-group">
                    <label>Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows="4"
                        placeholder="Tell viewers about yourself"
                    />
                </div>

                <h2>Social Links</h2>

                <div className="form-group">
                    <label>Instagram</label>
                    <div className="social-input">
                      <FaInstagram className="social-icon instagram" />
                    <input
                      value={instagram}
                      onChange={(e)=>setInstagram(e.target.value)}
                      placeholder="https://instagram.com/username"
                    />
                </div>
                </div>

                <div className="form-group">
                    <label>Facebook</label>
                  <div className="social-input">
                   <FaFacebook className="social-icon facebook" />

                    <input
                     value={facebook}
                     onChange={(e)=>setFacebook(e.target.value)}
                     placeholder="https://instagram.com/username"
                    />
                </div>
                </div>

                <div className="form-group">
                    <label>GitHub</label>
                     <div className="social-input">
                     <FaGithub className="social-icon github" />
                    <input
                     value={github}
                     onChange={(e)=>setGithub(e.target.value)}
                     placeholder="https://github.com/username"
                   />
                </div>
                </div>

                <div className="form-group">
                    <label>LinkedIn</label>
                    <div className="social-input">
                    <FaLinkedin className="social-icon linkedin" />
                    <input
                        value={linkedin}
                        onChange={(e)=>setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                    />
                </div>
                </div>

                <button
                  className="save-btn"
                  onClick={saveProfile}
                >
                  Save Changes
                </button>

            </div>

        </div>
    );
}


export default EditProfile;