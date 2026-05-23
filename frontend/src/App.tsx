import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import { SocketProvider } from './context/SocketContext';
import BoardsPage from './pages/BoardsPage';
import BoardPage from './pages/BoardPage'
import { ProtectedRoute } from './components/Common/ProtectedRoute';

function AppContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-gray-900">
            TaskBoard
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">Hi, {user.email}</span>
                <Link
                  to="/boards"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                >
                  Boards
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm">Login</Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/boards" element={<ProtectedRoute><BoardsPage /></ProtectedRoute>} />
        <Route path="/boards/:boardId" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

const HomePage = () => (
  <div className="max-w-4xl mx-auto px-6 py-20 text-center">
    <h1 className="text-5xl font-bold text-gray-900 mb-6">Realtime Task Board</h1>
    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Collaborative task boards with secure accounts, live updates, and simple task management.    </p>
    <div className="space-x-4">
      <Link
        to="/boards"
        className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 inline-block"
      >
        Get Started
      </Link>
      <Link
        to="/register"
        className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 inline-block"
      >
        Sign Up
      </Link>
    </div>
  </div>
);

const LoginPage = () => (
  <div className="max-w-md mx-auto px-6 py-20">
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h1>
      <LoginForm />
    </div>
  </div>
);

const RegisterPage = () => (
  <div className="max-w-md mx-auto px-6 py-20">
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h1>
      <RegisterForm />
    </div>
  </div>
);



function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
