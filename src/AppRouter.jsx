import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import App from './App';

function ProtectedRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('usuario');
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
