import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Explore from './pages/Explore';
import CreateCommunity from './pages/CreateCommunity';
import CommunityPage from './pages/CommunityPage';
import PostPage from './pages/PostPage';
import Events from './pages/Events';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="communities/new" element={<CreateCommunity />} />
        <Route path="communities/:id" element={<CommunityPage />} />
        <Route path="posts/:id" element={<PostPage />} />
        <Route path="events" element={<Events />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<ProtectedRoute admin><Admin /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
