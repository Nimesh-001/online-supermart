import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import OperationalManagerDashboard from './components/OperationalManagerDashboard';
import CartDrawer from './components/CartDrawer';
import OrderHistoryModal from './components/OrderHistoryModal';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginNotice, setLoginNotice] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
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

  // Sync cart count when user is authenticated
  useEffect(() => {
    const syncCartCount = async () => {
      if (!currentUser) {
        setCartCount(0);
        return;
      }
      try {
        const res = await fetch('/api/cart', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setCartCount(data.data.totalItemCount || 0);
          }
        }
      } catch (e) {
        // Quiet fail
      }
    };

    syncCartCount();
  }, [currentUser]);

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
    if (currentUser.role === 'SUPER_ADMIN') {
      setCurrentPage('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentUser.role === 'OPERATIONAL_MANAGER') {
      setCurrentPage('manager');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast('Access Denied: Customer accounts do not have staff portal access.');
    }
  };

  const handleLoginSuccess = async (userData) => {
    setCurrentUser(userData);
    setLoginNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Role-based landing: Super Admin goes to Admin Dashboard; Operational Manager goes to Operations Dashboard
    if (userData.role === 'SUPER_ADMIN') {
      setCurrentPage('admin');
      showToast(`Welcome to Executive Portal, ${userData.firstName}!`);
      return;
    }
    if (userData.role === 'OPERATIONAL_MANAGER') {
      setCurrentPage('manager');
      showToast(`Welcome to Operations Portal, ${userData.firstName}!`);
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
      setCurrentPage('home');
      showToast('You have been safely signed out.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        const displayName = product.productName || product.name;
        showToast(`Added ${displayName} to your cart!`);
        // Sync true item count from DB
        try {
          const cartRes = await fetch('/api/cart', { credentials: 'include' });
          if (cartRes.ok) {
            const cartData = await cartRes.json();
            if (cartData.success && cartData.data) {
              setCartCount(cartData.data.totalItemCount || 0);
            }
          }
        } catch (e) {
          setCartCount((prev) => prev + 1);
        }
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

    setIsCartOpen(true);
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
          onOpenOrders={() => setIsOrdersOpen(true)}
          onNavigateAdmin={handleNavigateAdmin}
        />
      )}

      {currentPage === 'admin' && (
        <SuperAdminDashboard
          currentUser={currentUser}
          onNavigateHome={handleNavigateHome}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'manager' && (
        <OperationalManagerDashboard
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

      {/* Member 4 Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        currentUser={currentUser}
        onNavigateLogin={handleNavigateLogin}
        onCartUpdated={(count) => setCartCount(count)}
      />

      {/* Member 5 Customer Order Invoices History Modal */}
      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
