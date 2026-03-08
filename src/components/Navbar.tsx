import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const handleFly = () => {
      setTimeout(() => {
        setBump(true);
        setTimeout(() => setBump(false), 300);
      }, 700); // match fly animation duration
    };
    window.addEventListener('fly-to-cart', handleFly);
    return () => window.removeEventListener('fly-to-cart', handleFly);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetch(`/api/products/suggestions?q=${searchQuery}`)
        .then((res) => res.json())
        .then((data) => setSuggestions(data));
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-[#050505] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          <div className="flex items-center gap-4">
            {/* Hamburger */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:text-[#CCFF00] transition-colors">
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-[#00FFFF] tracking-tighter uppercase font-display"
              >
                ADIXT
              </motion.span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <motion.form 
              animate={{ scale: isSearchFocused ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onSubmit={handleSearch} 
              className="w-full relative"
            >
              <input
                type="text"
                placeholder="Search for the latest heat..."
                className="w-full pl-4 pr-10 py-2.5 rounded-full bg-white/5 border-2 border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#CCFF00] focus:bg-white/10 transition-all font-mono text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setShowSuggestions(true);
                  setIsSearchFocused(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                  setIsSearchFocused(false);
                }}
              />
              <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </motion.form>

            {/* Smart Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-[#111] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50"
                >
                  {suggestions.map((item, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={item.id}
                    >
                      <Link
                        to={`/product/${item.id}`}
                        className="block px-4 py-3 hover:bg-white/5 text-sm text-gray-300 transition-colors"
                        onClick={() => setShowSuggestions(false)}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Icons & Auth */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {user?.isAdmin && (
              <Link to="/admin" className="hidden sm:block text-sm font-display font-bold text-gray-400 hover:text-[#CCFF00] transition-colors uppercase tracking-wider">
                Admin
              </Link>
            )}
            {user ? (
              <div className="hidden sm:block">
                <Link to="/profile" className="text-sm font-mono font-bold text-[#CCFF00] hover:text-white transition-colors mr-4 uppercase tracking-wider">
                  Sup, {user.name.split(' ')[0]}
                </Link>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-display font-bold text-white hover:text-[#CCFF00] transition-colors uppercase tracking-wider">
                Log in
              </Link>
            )}

            <Link to="/cart" className="text-white hover:text-[#CCFF00] transition-colors relative group" id="cart-icon">
              <motion.div 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
                animate={bump ? { scale: [1, 1.3, 1], rotate: [0, -15, 15, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <ShoppingCart className="h-6 w-6" />
              </motion.div>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    key={cartCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-2 -right-2 bg-[#FF00FF] text-white text-[10px] font-black font-mono rounded-full h-5 w-5 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,255,0.5)] border border-black"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </div>

      {/* Sub-nav tabs (like Wish) */}
      <div className="border-t border-white/10 bg-[#000000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => navigate('/')}
              className={`py-3 text-sm font-display font-black whitespace-nowrap uppercase tracking-wider transition-colors ${
                !location.search.includes('recently_viewed') ? 'text-[#CCFF00] border-b-2 border-[#CCFF00]' : 'text-gray-500 hover:text-white'
              }`}
            >
              Trending 🔥
            </button>
            <button 
              onClick={() => navigate('/?recently_viewed=true')}
              className={`py-3 text-sm font-display font-bold whitespace-nowrap transition-colors uppercase tracking-wider ${
                location.search.includes('recently_viewed') ? 'text-[#CCFF00] border-b-2 border-[#CCFF00]' : 'text-gray-500 hover:text-white'
              }`}
            >
              Recently Viewed
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-80 bg-[#111] z-50 overflow-y-auto border-r border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <span className="text-2xl font-black text-[#CCFF00] tracking-tighter uppercase font-display text-3d">ADIXT</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-4">
                {!user ? (
                  <div className="mb-6">
                    <h3 className="text-xl font-display font-black text-white mb-2 uppercase leading-tight text-3d">Unlock the full experience</h3>
                    <p className="text-sm font-mono text-gray-400 mb-6">Sign in to track orders, get support, and earn rewards. No cap.</p>
                    <Link to="/login" className="block w-full text-center bg-[#CCFF00] hover:bg-white text-black font-display font-black py-3 rounded-full transition-colors uppercase tracking-wider" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign in
                    </Link>
                    <p className="text-sm font-mono text-gray-400 mt-4 text-center">
                      New here? <Link to="/register" className="text-[#CCFF00] hover:underline font-bold" onClick={() => setIsMobileMenuOpen(false)}>Sign up</Link>
                    </p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <Link to="/profile" className="block text-[#CCFF00] hover:text-white transition-colors font-mono font-bold mb-4 uppercase" onClick={() => setIsMobileMenuOpen(false)}>
                      Sup, {user.name}
                    </Link>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full text-left font-display font-bold text-red-500 py-2 hover:bg-white/5 px-2 rounded-lg transition-colors uppercase tracking-wider">
                      Sign out
                    </button>
                  </div>
                )}

                <div className="space-y-1 border-t border-white/10 pt-4">
                  <Link to="/orders" className="block py-3 px-2 font-display font-bold text-gray-300 hover:text-[#CCFF00] hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wider" onClick={() => setIsMobileMenuOpen(false)}>Order status</Link>
                  <Link to="/wishlist" className="block py-3 px-2 font-display font-bold text-gray-300 hover:text-[#CCFF00] hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wider" onClick={() => setIsMobileMenuOpen(false)}>Wishlist</Link>
                  {user?.isAdmin && (
                    <Link to="/admin" className="block py-3 px-2 font-display font-bold text-gray-300 hover:text-[#CCFF00] hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wider" onClick={() => setIsMobileMenuOpen(false)}>Admin Panel</Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
