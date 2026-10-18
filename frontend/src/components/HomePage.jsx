import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  UserPlus, 
  LogIn, 
  LogOut,
  Sparkles, 
  Truck, 
  ShieldCheck, 
  Percent, 
  ArrowRight, 
  Star,
  User,
  CheckCircle2,
  ShoppingCart,
  Scale,
  Tag,
  Filter,
  RefreshCw,
  Boxes
} from 'lucide-react';
import ProduceWeightModal from './ProduceWeightModal';
import WarehouseInventoryModal from './WarehouseInventoryModal';

export default function HomePage({ 
  currentUser, 
  cartCount = 0, 
  cartFeedback,
  onNavigateRegister, 
  onNavigateLogin, 
  onLogout,
  onAddToCart,
  onCheckout,
  onNavigateAdmin
}) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [weightModalProduct, setWeightModalProduct] = useState(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  // Fetch real categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data) {
            setCategories(res.data);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch real products from database view v_active_product_catalog
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/api/products?';
      if (selectedCategory && selectedCategory !== 'All') {
        url += `category=${encodeURIComponent(selectedCategory)}&`;
      }
      if (searchQuery.trim()) {
        url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          setProducts(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Weight Calculation Modal for Member 2 Produce */}
      {weightModalProduct && (
        <ProduceWeightModal
          product={weightModalProduct}
          onClose={() => setWeightModalProduct(null)}
          onAddToCart={onAddToCart}
        />
      )}

      {/* Warehouse & Inventory Management Modal for Member 3 */}
      {showWarehouseModal && (
        <WarehouseInventoryModal
          onClose={() => setShowWarehouseModal(false)}
          onStockUpdated={fetchProducts}
        />
      )}

      {/* Feedback Toast */}
      {cartFeedback && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{cartFeedback}</span>
        </div>
      )}

      {/* Top Notification Bar */}
      <div className="bg-emerald-800 px-4 py-2 text-center text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="w-4 h-4 text-emerald-200" />
        <span>Members 1, 2 & 3 Active: Product Catalog, Gram Produce Rates & Warehouse Inventory Control (Stock Tracking & Atomic Decrement)</span>
        {!currentUser && (
          <button 
            onClick={onNavigateRegister}
            className="underline font-bold hover:text-emerald-200 transition-colors cursor-pointer ml-1"
          >
            Register Now &rarr;
          </button>
        )}
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white">
              <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                SuperMart
              </span>
              <span className="text-xs block text-emerald-600 font-bold tracking-wider uppercase -mt-1">
                Online Groceries
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fresh strawberries, broccoli, milk, basmati..."
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Nav Actions / Login State */}
          <div className="flex items-center gap-3">
            {/* Executive Admin & Warehouse Portal - Visible only to SUPER_ADMIN & OPERATIONAL_MANAGER */}
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OPERATIONAL_MANAGER') && (
              <button
                id="nav-admin-portal-btn"
                onClick={onNavigateAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition-colors cursor-pointer shadow-sm"
                title="Executive Admin & Warehouse Portal"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="hidden md:inline">Admin Portal</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-extrabold">
                  {currentUser.role === 'SUPER_ADMIN' ? 'ADMIN' : 'STAFF'}
                </span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onCheckout}
              className="relative p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
              title="Cart items"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {currentUser ? (
              /* Authenticated User View */
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                    {currentUser.role || 'Customer'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Sign out of your account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </div>
            ) : (
              /* Guest Actions */
              <div className="flex items-center gap-2.5">
                <button
                  id="nav-login-btn"
                  onClick={onNavigateLogin}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  id="nav-register-btn"
                  onClick={onNavigateRegister}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-14 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Member 2 Catalog: Dual Pricing (KG & Item) • 100g Produce Comparison
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-none">
              Daily Farm Fresh Harvest <br />
              <span className="text-emerald-700 font-extrabold">Priced by Weight & Unit</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Browse certified organic fruits, highland vegetables, pasteurized dairy, and pantry staples. 
              Fresh produce is sold per kilogram with dynamic 100g price breakdowns and automated gram calculations.
            </p>

            {/* Quick Department Filter Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Departments ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.categoryId}
                  onClick={() => setSelectedCategory(c.categoryName)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === c.categoryName
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.categoryName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Department Cards */}
      <section id="featured-categories" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Shop by Department</h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">Sourced daily from certified local farmers and trusted suppliers.</p>
          </div>
          <span className="text-xs font-bold text-emerald-700">6 Core Categories</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.categoryName;
            return (
              <div 
                key={cat.categoryId}
                onClick={() => setSelectedCategory(cat.categoryName)}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer text-center group shadow-sm hover:shadow-md ${
                  isSelected 
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20' 
                    : 'border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                  {cat.categoryName}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Product Catalog Showcase (Member 2 Highlight) */}
      <section id="catalog-section" className="py-12 bg-emerald-50/40 border-y border-slate-200 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {selectedCategory === 'All' ? 'All Active Products' : selectedCategory}
                </span>
                <span className="text-xs text-slate-500 font-medium">({products.length} Items Found)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1.5">
                Fresh Groceries & Pantry Catalog
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchProducts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors shadow-xs cursor-pointer"
                title="Refresh catalog from database"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Catalog</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-500 mt-3">Loading fresh grocery items from database...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting the category filter or clearing your search query.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((prod) => {
                const isKg = prod.sellingUnit === 'KG';
                const hasOffer = prod.discountPercent && prod.discountPercent > 0;

                return (
                  <div 
                    key={prod.productId}
                    className="rounded-3xl bg-white border border-slate-200 p-5 hover:border-emerald-400 hover:shadow-xl transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1.5 mb-3">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          isKg 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {isKg ? '⚖️ Sold by KG' : '📦 Sold per Item'}
                        </span>

                        {hasOffer && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                            {prod.discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Product Image */}
                      <div className="relative w-full h-44 rounded-2xl bg-slate-100 overflow-hidden mb-4">
                        <img 
                          src={prod.imageUrl} 
                          alt={prod.productName} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {prod.isFeatured && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-sm">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      {/* Category & Brand */}
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                        <span>{prod.categoryName}</span>
                        {prod.brandName && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">{prod.brandName}</span>
                          </>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-extrabold text-slate-950 text-base mt-1 line-clamp-1" title={prod.productName}>
                        {prod.productName}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>

                      {/* Member 2 Special: 100g Price Comparison for Produce */}
                      {isKg && prod.pricePer100g && (
                        <div className="mt-3 py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-emerald-900">Produce 100g Rate:</span>
                          <span className="font-black text-emerald-800">
                            LKR {Number(prod.pricePer100g).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Offer Tag */}
                      {prod.offerName && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <Tag className="w-3 h-3" />
                          <span className="truncate">{prod.offerName}</span>
                        </div>
                      )}
                    </div>

                    {/* Price and Cart Actions */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-emerald-700">
                              LKR {Number(prod.discountedPrice || prod.effectivePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            {hasOffer && (
                              <span className="text-xs text-slate-400 line-through">
                                LKR {Number(prod.effectivePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {isKg ? 'Price per 1.0 kg' : 'Price per unit'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {prod.stockStatus === 'IN_STOCK' ? '✓ In Stock' : 'Low Stock'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {isKg ? (
                          <>
                            {/* Open Weight Calculator Modal (Member 2 Highlight) */}
                            <button
                              id={`weight-calc-btn-${prod.productId}`}
                              onClick={() => setWeightModalProduct(prod)}
                              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                              title="Calculate price for specific grams (100g, 250g, 500g, custom)"
                            >
                              <Scale className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Calculate Weight</span>
                            </button>

                            {/* Quick Add 1kg */}
                            <button
                              id={`add-to-cart-btn-${prod.productId}`}
                              onClick={() => onAddToCart({
                                productId: prod.productId,
                                productName: `${prod.productName} (1.0kg)`,
                                quantity: 1,
                              })}
                              className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                              title="Add standard 1kg portion to cart"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>1kg</span>
                            </button>
                          </>
                        ) : (
                          /* Standard Add for EACH items */
                          <button
                            id={`add-to-cart-btn-${prod.productId}`}
                            onClick={() => onAddToCart({
                              productId: prod.productId,
                              productName: prod.productName,
                              quantity: 1,
                            })}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 flex items-start gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-base">Weight Accuracy Engine</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Fresh produce is priced strictly per 100g and kg using database functions with certified scales.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 flex items-start gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-base">Express Local Delivery</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Guaranteed fast 30-minute doorstep delivery with refrigerated packing for dairy and greens.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 flex items-start gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950 text-base">BCrypt Secured Accounts</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Member 1 session isolation and password hashing protect your identity and shopping cart.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="text-slate-900 font-bold">SuperMart Online</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Member 1: Identity & Sessions</span>
            <span>•</span>
            <span className="font-bold text-emerald-800">Member 2: Product Catalog & Pricing Engine</span>
            <span>•</span>
            <button onClick={onNavigateRegister} className="text-emerald-700 font-semibold hover:underline cursor-pointer">
              Register
            </button>
            <span>•</span>
            <button onClick={onNavigateLogin} className="text-emerald-700 font-semibold hover:underline cursor-pointer">
              Sign In
            </button>
            <span>•</span>
            <button 
              onClick={onNavigateAdmin} 
              className="text-slate-800 font-bold hover:text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Staff & Admin Portal</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
