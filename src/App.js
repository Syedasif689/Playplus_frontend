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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;