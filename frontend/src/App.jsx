import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginNotice, setLoginNotice] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartFeedback, setCartFeedback] = useState(null);
  const [intendedAction, setIntendedAction] = useState(null);

  // Check active session on initial load
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCurrentUser(data.data);
          }
        }
      } catch (err) {
        // Unauthenticated session - proceed as guest
      }
    };

    checkActiveSession();
  }, []);

  const handleNavigateHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateRegister = () => {
    setCurrentPage('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateLogin = (notice = null) => {
    setLoginNotice(notice);
    setCurrentPage('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegistrationSuccess = (successMsg) => {
    // Requirement 1: Redirect to login with short notification without showing user details
    setLoginNotice(successMsg || 'Account registered successfully! Please sign in with your credentials.');
    setCurrentPage('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAdmin = () => {
    if (!currentUser) {
      handleNavigateLogin('Please sign in with staff or administrative credentials to access the internal portal.');
      return;
    }
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'OPERATIONAL_MANAGER') {
      showToast('Access Denied: Customer accounts do not have staff portal access.');
      return;
    }
    setCurrentPage('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = async (userData) => {
    setCurrentUser(userData);
    setLoginNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Role-based landing: Staff goes to Admin Dashboard; Customers go to Storefront
    if (userData.role === 'SUPER_ADMIN' || userData.role === 'OPERATIONAL_MANAGER') {
      setCurrentPage('admin');
      showToast(`Welcome to Executive Portal, ${userData.firstName} (${userData.role})!`);
      return;
    }

    setCurrentPage('home');

    // Execute intended shopping action if user was redirected from a protected action
    if (intendedAction && intendedAction.type === 'add_to_cart') {
      const prod = intendedAction.product;
      setIntendedAction(null);
      await executeAddToCart(prod, userData);
    } else {
      showToast(`Welcome back, ${userData.firstName}!`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setCartCount(0);
      showToast('You have been safely signed out.');
    }
  };

  const executeAddToCart = async (product, user = currentUser) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: product.productId || product.id,
          productName: product.productName || product.name,
          quantity: product.quantity || 1,
        }),
      });

      if (response.ok) {
        setCartCount((prev) => prev + 1);
        const displayName = product.productName || product.name;
        showToast(`Added ${displayName} to your cart!`);
      } else if (response.status === 401) {
        setCurrentUser(null);
        handleNavigateLogin('Your session has expired. Please sign in to add items to your cart.');
      } else {
        showToast('Unable to add item to cart. Please try again.');
      }
    } catch (err) {
      showToast('Network error adding to cart.');
    }
  };

  const handleAddToCart = (product) => {
    // Requirement 4: Enforce that guests must not perform protected shopping actions
    if (!currentUser) {
      setIntendedAction({ type: 'add_to_cart', product });
      handleNavigateLogin('Please sign in to add items to your cart.');
      return;
    }

    executeAddToCart(product);
  };

  const handleCheckout = () => {
    if (!currentUser) {
      handleNavigateLogin('Please sign in to view your cart and proceed to checkout.');
      return;
    }

    showToast(`Shopping cart active with ${cartCount} items.`);
  };

  const showToast = (message) => {
    setCartFeedback(message);
    setTimeout(() => {
      setCartFeedback(null);
    }, 3200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {currentPage === 'home' && (
        <HomePage
          currentUser={currentUser}
          cartCount={cartCount}
          cartFeedback={cartFeedback}
          onNavigateRegister={handleNavigateRegister}
          onNavigateLogin={() => handleNavigateLogin()}
          onLogout={handleLogout}
          onAddToCart={handleAddToCart}
          onCheckout={handleCheckout}
          onNavigateAdmin={handleNavigateAdmin}
        />
      )}

      {currentPage === 'admin' && (
        <AdminDashboard
          currentUser={currentUser}
          onNavigateHome={handleNavigateHome}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage
          onNavigateHome={handleNavigateHome}
          onNavigateLogin={() => handleNavigateLogin()}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      )}

      {currentPage === 'login' && (
        <LoginPage
          noticeMessage={loginNotice}
          onNavigateHome={handleNavigateHome}
          onNavigateRegister={handleNavigateRegister}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
