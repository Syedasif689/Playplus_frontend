import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Upload from "./pages/Upload";
import Channel from "./pages/Channel";
import Profile from "./pages/Profile";
import Subscriptions from "./pages/Subscriptions";
import Trending from "./pages/Trending";
import Milestones from './pages/Milestones';
import EditVideo from './pages/EditVideo'; 
import History from './pages/History';
import LikedVideos from './pages/LikedVideos';
import SearchResults from './pages/SearchResults';
import Notifications from "./pages/Notifications";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/channel/:creator" element={<Channel />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/edit/:videoId" element={<EditVideo />} />
          <Route path="/history" element={<History />} />
          <Route path="/liked" element={<LikedVideos />} />
          <Route path="/search" element={<SearchResults />} />
            <Route path="/notifications" element={<Notifications />}/>
          {/* ? 404 Not Found � catch any unknown routes */}
          <Route path="*" element={<div style={{ color: '#f1f1f1', textAlign: 'center', padding: '60px 20px' }}><h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p></div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;