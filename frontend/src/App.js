import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import TrainerRegister from './pages/TrainerRegister';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import WorkoutForm from './pages/WorkoutForm';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import BlogEditor from './pages/BlogEditor';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';
import RecipeEditor from './pages/RecipeEditor';
import BookTrainer from './pages/BookTrainer';
// Removed TrainerRecipes list page; dashboard handles management
import './App.css';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, trainerOnly = false }) => {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (trainerOnly && user?.role !== 'trainer') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === 'trainer') {
      return <Navigate to="/trainer-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function AppContent() {
  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register-trainer" 
            element={
              <PublicRoute>
                <TrainerRegister />
              </PublicRoute>
            } 
          />
          <Route 
            path="/blog" 
            element={<BlogList />} 
          />
          <Route 
            path="/blog/:slug" 
            element={<BlogDetail />} 
          />
          <Route 
            path="/recipes" 
            element={<RecipeList />} 
          />
          <Route 
            path="/recipes/:slug" 
            element={<RecipeDetail />} 
          />
          <Route 
            path="/events" 
            element={<EventsList />} 
          />
          <Route 
            path="/events/:id" 
            element={<EventDetail />} 
          />
          <Route
            path="/book-trainer"
            element={<BookTrainer />}
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MemberDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trainer-dashboard" 
            element={
              <ProtectedRoute trainerOnly={true}>
                <TrainerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trainer/recipes/new" 
            element={
              <ProtectedRoute trainerOnly={true}>
                <RecipeEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trainer/recipes/:id/edit" 
            element={
              <ProtectedRoute trainerOnly={true}>
                <RecipeEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trainer/blogs/new" 
            element={
              <ProtectedRoute trainerOnly={true}>
                <BlogEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/trainer/blogs/:id/edit" 
            element={
              <ProtectedRoute trainerOnly={true}>
                <BlogEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/blogs/new" 
            element={
              <ProtectedRoute adminOnly={true}>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/blogs/:id/edit" 
            element={
              <ProtectedRoute adminOnly={true}>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/recipes/new" 
            element={
              <ProtectedRoute adminOnly={true}>
                <RecipeEditor />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/recipes/:id/edit" 
            element={
              <ProtectedRoute adminOnly={true}>
                <RecipeEditor />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/workout/new" 
            element={
              <ProtectedRoute>
                <WorkoutForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workout/edit/:id" 
            element={
              <ProtectedRoute>
                <WorkoutForm />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
