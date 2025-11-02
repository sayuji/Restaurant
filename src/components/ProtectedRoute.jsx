import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { getCurrentUser, hasRole } from '../services/api';

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredAnyRole, 
  fallbackPath = "/login" 
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setIsLoading(true);
        
        // Cek token di localStorage
        const token = localStorage.getItem('token');
        const userData = getCurrentUser();
        
        console.log('🔐 Auth check - Token:', !!token, 'User:', userData);
        
        if (!token || !userData) {
          console.log('❌ No token or user data');
          setIsAuthenticated(false);
          return;
        }

        setUser(userData);
        
        // Check role requirements
        if (requiredRole && !hasRole(requiredRole)) {
          console.log('❌ Role requirement not met');
          setIsAuthenticated(false);
          return;
        }

        if (requiredAnyRole && !requiredAnyRole.some(role => hasRole(role))) {
          console.log('❌ Any role requirement not met');
          setIsAuthenticated(false);
          return;
        }
        
        console.log('✅ Auth successful');
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error('❌ Auth verification failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [requiredRole, requiredAnyRole]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Checking authentication...
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('🔐 Redirecting to login, authenticated:', isAuthenticated);
    
    // Clear invalid data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return <Navigate to={fallbackPath} replace />;
  }

  // Authenticated and authorized - render children
  return children;
}

// Helper components tetap sama...
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}

export function ManagerRoute({ children }) {
  return (
    <ProtectedRoute requiredAnyRole={['admin', 'manager']}>
      {children}
    </ProtectedRoute>
  );
}

export function KitchenRoute({ children }) {
  return (
    <ProtectedRoute requiredAnyRole={['admin', 'manager', 'kitchen']}>
      {children}
    </ProtectedRoute>
  );
}

export function CashierRoute({ children }) {
  return (
    <ProtectedRoute requiredAnyRole={['admin', 'manager', 'cashier']}>
      {children}
    </ProtectedRoute>
  );
}