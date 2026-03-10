import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Star, Flame, Zap, Eye, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import TiltCard from '../components/TiltCard';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-[#CCFF00] text-black">{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const { addToCart } = useCart();
  const { addToWishlist, wishlist } = useWishlist();
  const { recentlyViewed } = useRecentlyViewed();

  const category = searchParams.get('category') || 'all';
  const maxPrice = searchParams.get('maxPrice') || '';
  const search = searchParams.get('search') || '';
  const showRecentlyViewed = searchParams.get('recently_viewed') === 'true';

  useEffect(() => {
    if (showRecentlyViewed) {
      setProducts(recentlyViewed);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const fetchProducts = async () => {
      try {
        let q: any = collection(db, 'products');
        let constraints: any[] = [];
        
        if (category !== 'all') {
          constraints.push(where('category', '==', category));
        }
        
        if (constraints.length > 0) {
          q = query(q, ...constraints);
        }

        const querySnapshot = await getDocs(q).catch(err => handleFirestoreError(err, OperationType.LIST, 'products'));
        if (!querySnapshot) return;
        let productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        })) as any[];

        if (maxPrice) {
          productsData = productsData.filter(p => p.price <= Number(maxPrice));
        }

        if (search) {
          const searchLower = search.toLowerCase();
          productsData = productsData.filter(p => 
            p.name.toLowerCase().includes(searchLower) || 
            (p.description && p.description.toLowerCase().includes(searchLower))
          );
        }

        setProducts(productsData);
      } catch (err) {
        console.error('Products fetch error:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, maxPrice, search, showRecentlyViewed, recentlyViewed]);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const totalPages = Math.ceil(products.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, maxPrice, search]);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'home', name: 'Home' },
    { id: 'jewelry', name: 'Jewelry' },
    { id: 'shoes', name: 'Shoes' },
    { id: 'bags', name: 'Bags' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'accessories', name: 'Accessories' },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#CCFF00] selection:text-black">
      {/* Marquee */}
      <div className="bg-[#CCFF00] text-black py-2 overflow-hidden border-b-4 border-black">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="whitespace-nowrap font-display font-bold text-sm uppercase tracking-widest flex gap-8"
        >
          <span>🔥 DROP 001 IS LIVE</span>
          <span>⚡️ FREE SHIPPING ON ORDERS OVER ₹999</span>
          <span>✨ USE CODE 'GENZ' FOR 20% OFF</span>
          <span>🔥 DROP 001 IS LIVE</span>
          <span>⚡️ FREE SHIPPING ON ORDERS OVER ₹999</span>
          <span>✨ USE CODE 'GENZ' FOR 20% OFF</span>
          <span>🔥 DROP 001 IS LIVE</span>
          <span>⚡️ FREE SHIPPING ON ORDERS OVER ₹999</span>
          <span>✨ USE CODE 'GENZ' FOR 20% OFF</span>
        </motion.div>
      </div>

      {/* Hero Section with Motion Background */}
      <div className="relative overflow-hidden bg-[#000000] py-20 border-b border-white/10">
        <motion.div 
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at center, #CCFF00 0%, transparent 50%)',
            backgroundSize: '100% 100%'
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-center gap-12"
          >
            <div className="flex-1 z-10">
              <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <span className="text-sm font-mono text-[#CCFF00] font-bold uppercase tracking-wider text-3d-primary">New Arrivals ✦</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter mb-6 leading-[0.85] uppercase text-white drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]">
                Cop The <br/>
                <span className="text-[#CCFF00] drop-shadow-[0_0_25px_rgba(204,255,0,0.8)]">
                  Latest Heat
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-8 font-medium max-w-md">
                No cap, these deals are insane. Upgrade your aesthetic without breaking the bank. 💸
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#CCFF00] text-black px-10 py-4 rounded-full font-display font-black text-xl glow-button transition-all duration-300 uppercase tracking-wide flex items-center gap-2 text-3d-primary"
              >
                Shop The Drop <Zap className="w-5 h-5 fill-black" />
              </motion.button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 relative [perspective:1000px]">
              <div className="absolute inset-0 bg-[#CCFF00] blur-[100px] opacity-20 rounded-full mix-blend-screen"></div>
              {products.slice(0, 4).map((p, i) => (
                <TiltCard key={p.id} tiltAmount={15} className="relative rounded-3xl overflow-hidden aspect-[4/5] group cursor-pointer border-2 border-white/10 hover:border-[#CCFF00] transition-colors shadow-2xl hover:shadow-[0_0_30px_rgba(204,255,0,0.3)]">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: i % 2 === 0 ? -5 : 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.6, type: "spring" }}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    className="w-full h-full [transform-style:preserve-3d]"
                  >
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5 [transform:translateZ(30px)]">
                      <span className="text-white font-display font-bold text-xl leading-tight mb-1 glow-text">{p.name}</span>
                      <span className="text-[#CCFF00] font-mono font-bold text-lg">₹{p.price}</span>
                    </div>
                  </motion.div>
                </TiltCard>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="border-b border-white/10 bg-[#000000]/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-3 overflow-x-auto py-4 no-scrollbar scroll-smooth items-center">
            <span className="text-gray-500 font-mono text-xs uppercase tracking-widest mr-4 hidden md:block">Filter:</span>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  searchParams.set('category', c.id);
                  setSearchParams(searchParams);
                }}
                className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold font-display uppercase tracking-wide transition-all duration-300 border-2 ${
                  category === c.id 
                    ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.4)]' 
                    : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black font-display text-white mb-6 uppercase tracking-wider text-3d">Recently Viewed</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recentlyViewed.map(product => (
                <Link to={`/product/${product.id}`} key={product.id} className="bg-[#111] p-3 rounded-xl border border-white/10 hover:border-[#CCFF00] transition-colors">
                  <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                  <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
                  <p className="text-xs text-gray-400">₹{product.price}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1" id="product-grid">
          {search && (
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white text-3d">
                Search results for "{search}"
              </h2>
              <button 
                onClick={() => {
                  searchParams.delete('search');
                  setSearchParams(searchParams);
                }}
                className="text-gray-400 hover:text-white text-sm font-medium"
              >
                Clear Search
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-[#111] rounded-2xl p-2 border border-white/5 animate-pulse">
                  <div className="w-full aspect-square bg-white/10 rounded-xl mb-3" />
                  <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2 mb-3" />
                  <div className="h-5 bg-white/10 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            >
              {currentProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
                  }}
                  className="[perspective:1000px] h-full"
                >
                  <TiltCard tiltAmount={10} className="h-full">
                    <motion.div
                      whileHover={{ y: -10, scale: 1.02, z: 30 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="group relative flex flex-col bg-[#0a0a0a] rounded-2xl overflow-hidden hover:shadow-[0_20px_40px_rgba(204,255,0,0.15)] transition-all duration-300 border border-transparent hover:border-[#CCFF00]/30 h-full [transform-style:preserve-3d]"
                    >
                      <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-[4/5] bg-[#111]">
                        <motion.img 
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                    
                    {/* Discount Badge */}
                    {product.discountPercentage > 0 && (
                      <div className="absolute top-3 left-3 bg-[#CCFF00] text-black font-display font-black text-xs px-2.5 py-1.5 rounded-sm shadow-[4px_4px_0px_rgba(0,0,0,1)] border-2 border-black transform -rotate-2">
                        -{product.discountPercentage}%
                      </div>
                    )}

                    {/* Almost Gone Badge */}
                    {product.boughtCount > 800 && (
                      <div className="absolute top-3 right-3 bg-[#FF00FF] text-white font-display font-black text-[10px] px-2.5 py-1.5 rounded-sm flex items-center gap-1 shadow-[4px_4px_0px_rgba(0,0,0,1)] border-2 border-black transform rotate-2">
                        <Flame className="w-3 h-3" />
                        HOT AF
                      </div>
                    )}

                    {/* ADIXT Pick Badge */}
                    {product.isWishPick === 1 && (
                      <div className="absolute bottom-3 left-3 bg-white text-black font-display font-black text-[10px] px-2.5 py-1.5 rounded-sm uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                        ADIXT PICK 🌟
                      </div>
                    )}
                  </Link>
                  
                  {/* Quick View Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setQuickViewProduct(product);
                    }}
                    className="absolute top-3 left-3 w-12 h-12 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#CCFF00] hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 border border-white/20 hover:border-black [transform:translateZ(40px)]"
                  >
                    <Eye className="h-6 w-6" />
                  </button>

                  {/* Wishlist Button */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      addToWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-[#CCFF00] hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 border border-white/20 hover:border-black [transform:translateZ(30px)]"
                  >
                    <Heart className={`h-5 w-5 ${wishlist.some(w => w.productId === product.id) ? 'fill-[#FF00FF] text-[#FF00FF]' : ''}`} />
                  </button>
                  
                  <div className="p-4 flex flex-col flex-1 bg-gradient-to-b from-transparent to-black/50 [transform:translateZ(20px)]">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-base font-display font-bold text-gray-100 mb-2 line-clamp-2 group-hover:text-[#CCFF00] transition-colors leading-tight text-3d">
                        <Highlight text={product.name} highlight={search} />
                      </h3>
                    </Link>

                    <div className="text-xs font-mono text-gray-400 mb-3 flex items-center gap-1.5 flex-wrap">
                      <Star className="h-3.5 w-3.5 text-[#CCFF00] fill-[#CCFF00]" />
                      <span className="text-white font-bold">{product.rating || 4.5}</span>
                      <span>({product.reviewsCount || Math.floor(Math.random() * 100) + 10})</span>
                      <span className="text-gray-600">|</span>
                      <span>{product.boughtCount > 999 ? `${(product.boughtCount / 1000).toFixed(1)}k` : (product.boughtCount || Math.floor(Math.random() * 500) + 50)}+ copped</span>
                    </div>
                    
                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex flex-col">
                        {product.originalPrice && (
                          <span className="text-xs font-mono text-gray-500 line-through mb-0.5">₹{product.originalPrice}</span>
                        )}
                        <span className="text-xl font-display font-black text-white leading-none">₹{product.price}</span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const event = new CustomEvent('fly-to-cart', {
                            detail: {
                              x: rect.left + rect.width / 2,
                              y: rect.top + rect.height / 2,
                              imageUrl: product.imageUrl
                            }
                          });
                          window.dispatchEvent(event);
                          addToCart(product.id, 1, product);
                        }}
                        className="flex items-center justify-center bg-white text-black hover:bg-[#CCFF00] p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(204,255,0,0.5)]"
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </TiltCard>
            </motion.div>
          ))}
            </motion.div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2 bg-[#111] border border-white/10 rounded-full text-white font-mono disabled:opacity-50 hover:border-[#CCFF00] transition-colors"
                >
                  Previous
                </button>
                <span className="text-white font-mono">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2 bg-[#111] border border-white/10 rounded-full text-white font-mono disabled:opacity-50 hover:border-[#CCFF00] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
              <p className="text-xl text-gray-400">No products found matching your criteria.</p>
              <button 
                onClick={() => setSearchParams(new URLSearchParams())}
                className="mt-6 text-white font-medium hover:underline bg-white/10 px-6 py-2 rounded-full"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-white/10 z-10 flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-[#CCFF00] text-white hover:text-black rounded-full backdrop-blur-md transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full md:w-1/2 bg-black relative aspect-square md:aspect-auto">
                <img 
                  src={quickViewProduct.imageUrl} 
                  alt={quickViewProduct.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-mono text-[#CCFF00] uppercase tracking-wider border border-[#CCFF00]/30 px-2 py-1 rounded-sm">
                    {quickViewProduct.category}
                  </span>
                  {quickViewProduct.discountPercentage > 0 && (
                    <span className="text-xs font-mono text-black bg-[#CCFF00] px-2 py-1 rounded-sm font-bold">
                      -{quickViewProduct.discountPercentage}%
                    </span>
                  )}
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white mb-4">
                  {quickViewProduct.name}
                </h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex flex-col">
                    {quickViewProduct.originalPrice && (
                      <span className="text-sm font-mono text-gray-500 line-through">₹{quickViewProduct.originalPrice}</span>
                    )}
                    <span className="text-3xl font-display font-black text-white">₹{quickViewProduct.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg">
                    <Star className="h-4 w-4 text-[#CCFF00] fill-[#CCFF00]" />
                    <span className="text-white font-bold">{quickViewProduct.rating || 4.5}</span>
                    <span>({quickViewProduct.reviewsCount || Math.floor(Math.random() * 100) + 10})</span>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-8 line-clamp-4">
                  <Highlight text={quickViewProduct.description} highlight={search} />
                </p>
                
                <div className="mt-auto flex gap-3">
                  <button
                    onClick={() => {
                      addToCart(quickViewProduct.id, 1, quickViewProduct);
                      setQuickViewProduct(null);
                      navigate('/cart');
                    }}
                    className="flex-1 bg-white text-black font-display font-black py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <Zap className="w-5 h-5 fill-black" />
                    BUY NOW
                  </button>
                  <button 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const event = new CustomEvent('fly-to-cart', {
                        detail: {
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2,
                          imageUrl: quickViewProduct.imageUrl
                        }
                      });
                      window.dispatchEvent(event);
                      addToCart(quickViewProduct.id, 1, quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 bg-[#CCFF00] text-black font-display font-black py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    ADD TO CART
                  </button>
                  <Link 
                    to={`/product/${quickViewProduct.id}`}
                    className="px-6 bg-white/10 text-white font-display font-bold py-4 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center"
                  >
                    DETAILS
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
