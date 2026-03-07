import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, ArrowLeft, User, Flame, ZoomIn, Edit, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { motion, AnimatePresence } from 'motion/react';
import TiltCard from '../components/TiltCard';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { addToWishlist, wishlist } = useWishlist();
  const { addToRecentlyViewed } = useRecentlyViewed();

  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
        addToRecentlyViewed(data);
        
        // Fetch recommended products from same category
        fetch(`/api/products?category=${data.category}`)
          .then(res => res.json())
          .then(recData => {
            setRecommendedProducts(Array.isArray(recData) ? recData.filter((p: any) => p.id !== id).slice(0, 4) : []);
          });
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id, addToRecentlyViewed]);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsAdding(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const event = new CustomEvent('fly-to-cart', {
      detail: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        imageUrl: product.image_url
      }
    });
    window.dispatchEvent(event);

    addToCart(product.id, quantity, product);
    setTimeout(() => setIsAdding(false), 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="rounded-full h-12 w-12 border-b-2 border-white"
        />
      </div>
    );
  }

  if (!product || product.error) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </button>
      </div>
    );
  }

  const isWishlisted = wishlist.some(w => w.product_id === product.id);

  // Mock reviews data
  const mockReviews = [
    { id: 1, user: 'Alex M.', rating: 5, date: '2 days ago', comment: 'Absolutely love this product! The quality is amazing and it arrived faster than expected.' },
    { id: 2, user: 'Sarah J.', rating: 4, date: '1 week ago', comment: 'Good value for the price. Looks exactly like the pictures.' },
    { id: 3, user: 'Michael T.', rating: 5, date: '2 weeks ago', comment: 'Highly recommend! Will definitely be buying more from this store.' },
  ];

  // Parse images
  let images: string[] = [];
  if (product) {
    if (product.images) {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        images = [product.image_url];
      }
    } else if (product.image_url) {
      images = [product.image_url];
    }
  }

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#000000] py-12 text-white selection:bg-[#CCFF00] selection:text-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="mb-8 text-gray-400 hover:text-[#CCFF00] flex items-center transition-colors font-mono uppercase tracking-widest text-sm font-bold">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </button>

        <div className="bg-[#111] rounded-[2rem] border-2 border-white/10 overflow-hidden mb-12 shadow-[8px_8px_0px_rgba(255,255,255,0.05)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 lg:p-12">
            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              <TiltCard tiltAmount={5} className="relative rounded-[2rem] bg-[#0a0a0a] aspect-[4/5] group cursor-zoom-in border-2 border-white/5 [perspective:1500px]">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="w-full h-full [transform-style:preserve-3d]"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(event, info) => {
                    if (info.offset.x < -50) {
                      handleNextImage(event as any);
                    } else if (info.offset.x > 50) {
                      handlePrevImage(event as any);
                    }
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={currentImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      src={images[currentImageIndex]} 
                      alt={`${product.name} - Image ${currentImageIndex + 1}`} 
                      className="w-full h-full object-cover rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                  
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#CCFF00] text-white hover:text-black p-2 rounded-full backdrop-blur-md transition-all z-20 [transform:translateZ(60px)]"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#CCFF00] text-white hover:text-black p-2 rounded-full backdrop-blur-md transition-all z-20 [transform:translateZ(60px)]"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none rounded-[2rem] [transform:translateZ(40px)]">
                    <div className="bg-[#CCFF00] p-5 rounded-full text-black transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-[0_0_30px_rgba(204,255,0,0.5)]">
                      <ZoomIn className="w-8 h-8" />
                    </div>
                  </div>
                  
                  {product.discount_percentage > 0 && (
                    <div className="absolute top-6 left-6 bg-[#FF00FF] text-white text-sm font-black font-mono px-4 py-2 rounded-full shadow-[0_0_15px_rgba(255,0,255,0.5)] border border-black transform -rotate-6 z-10 [transform:translateZ(50px)]">
                      -{product.discount_percentage}%
                    </div>
                  )}

                  {product.bought_count > 800 && (
                    <div className="absolute top-6 right-20 bg-red-600 text-white text-xs font-black font-display uppercase tracking-wider px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-black transform rotate-3 z-10 [transform:translateZ(50px)]">
                      <Flame className="w-4 h-4" />
                      HOT AF
                    </div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addToWishlist(product.id)}
                    className="absolute top-6 right-6 p-3 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-white hover:text-[#FF00FF] transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/20 z-10 [transform:translateZ(50px)]"
                  >
                    <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-[#FF00FF] text-[#FF00FF]' : ''}`} />
                  </motion.button>
                </motion.div>
              </TiltCard>
              
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all snap-start ${currentImageIndex === idx ? 'border-[#CCFF00] opacity-100' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col justify-center"
            >
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="px-4 py-1.5 bg-white/10 text-white text-xs font-black font-mono uppercase tracking-widest rounded-full border border-white/20">
                  {product.category}
                </span>
                {product.is_wish_pick === 1 && (
                  <span className="px-4 py-1.5 bg-[#CCFF00] text-black text-xs font-black font-mono uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(204,255,0,0.5)]">
                    ADIXT Pick 🌟
                  </span>
                )}
                {user?.isAdmin && (
                  <Link 
                    to={`/admin/product/${product.id}`}
                    className="ml-auto px-4 py-1.5 bg-white/5 hover:bg-[#CCFF00] text-gray-400 hover:text-black text-xs font-black font-mono uppercase tracking-widest rounded-full border border-white/10 hover:border-[#CCFF00] transition-all flex items-center gap-2"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </Link>
                )}
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-display text-white mb-4 tracking-tighter leading-tight uppercase">
                {product.name}
              </h1>
              
              <div className="flex items-center mb-8 text-sm font-mono text-gray-400">
                <div className="flex items-center bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <Star className="h-4 w-4 text-[#CCFF00] fill-[#CCFF00]" />
                  <span className="ml-2 text-white font-bold">{product.rating}</span>
                </div>
                <span className="mx-3 text-white/20">|</span>
                <span className="uppercase tracking-wider">{product.reviews_count} reviews</span>
                <span className="mx-3 text-white/20">|</span>
                <span className="uppercase tracking-wider">{product.bought_count} copped</span>
              </div>

              <div className="flex items-end gap-4 mb-8">
                <div className="text-5xl font-black font-display text-[#CCFF00]">
                  ₹{product.price}
                </div>
                {product.original_price && (
                  <div className="text-2xl font-display font-bold text-gray-500 line-through mb-1 decoration-red-500 decoration-4">
                    ₹{product.original_price}
                  </div>
                )}
              </div>

              <div className="text-sm font-mono font-bold text-gray-400 mb-8 uppercase tracking-widest">
                {product.colors_count} colors · {product.sizes_count} sizes
              </div>

              <p className="text-gray-300 text-lg mb-10 leading-relaxed font-medium">
                {product.description}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
                <div className="flex items-center justify-between sm:justify-start border-2 border-white/20 rounded-2xl bg-black px-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-4 text-white hover:text-[#CCFF00] transition-colors font-bold text-xl"
                  >
                    -
                  </button>
                  <span className="px-6 py-4 font-mono font-bold text-xl text-white min-w-[4rem] text-center">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-4 text-white hover:text-[#CCFF00] transition-colors font-bold text-xl"
                  >
                    +
                  </button>
                </div>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      addToCart(product.id, quantity, product);
                      navigate('/cart');
                    }}
                    className="flex-1 bg-white text-black px-8 py-5 rounded-2xl font-black font-display text-xl hover:bg-gray-200 transition-all flex items-center justify-center space-x-3 relative overflow-hidden uppercase tracking-wider"
                  >
                    <Zap className="h-6 w-6 fill-black" />
                    <span>Buy Now</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#CCFF00] text-black px-8 py-5 rounded-2xl font-black font-display text-xl hover:bg-white transition-all flex items-center justify-center space-x-3 relative overflow-hidden uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                  >
                    <AnimatePresence mode="wait">
                      {isAdding ? (
                        <motion.div
                          key="adding"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          className="flex items-center space-x-2"
                        >
                          <span>Added! 🔥</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="add"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          className="flex items-center space-x-3"
                        >
                          <ShoppingCart className="h-6 w-6" />
                          <span>Add to Cart</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>

              {/* Features */}
              <div className="border-t-2 border-white/10 pt-8 mt-auto">
                <div className="grid grid-cols-2 gap-4 text-sm font-mono font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-[#CCFF00] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    In Stock
                  </div>
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-[#00FFFF] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Fast AF
                  </div>
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-[#FF00FF] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Secure
                  </div>
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Easy Returns
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#111] rounded-[2rem] border-2 border-white/10 p-8 lg:p-12 shadow-[8px_8px_0px_rgba(255,255,255,0.05)]"
        >
          <h2 className="text-4xl font-black font-display text-white mb-8 uppercase tracking-tighter">The Vibe Check</h2>
          
          <div className="flex items-center mb-10">
            <div className="text-6xl font-black font-display text-[#CCFF00] mr-6">{product.rating}</div>
            <div>
              <div className="flex items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-6 w-6 ${star <= Math.round(product.rating) ? 'text-[#CCFF00] fill-[#CCFF00]' : 'text-gray-700'}`} 
                  />
                ))}
              </div>
              <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Based on {product.reviews_count} reviews</p>
            </div>
          </div>

          <div className="space-y-8">
            {mockReviews.map((review, index) => (
              <motion.div 
                key={review.id} 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border-t-2 border-white/10 pt-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#CCFF00] p-3 rounded-xl shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                      <User className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <p className="text-white font-bold font-display text-lg tracking-wide">{review.user}</p>
                      <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= review.rating ? 'text-[#CCFF00] fill-[#CCFF00]' : 'text-gray-700'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 mt-4 text-lg font-medium leading-relaxed">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recommended Products */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-4xl font-black font-display text-white uppercase tracking-tighter">You Might Also Dig ⚡️</h2>
            <Link to="/" className="text-[#CCFF00] font-mono text-sm hover:underline underline-offset-4 uppercase tracking-widest font-bold">View All</Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendedProducts.length > 0 ? (
              recommendedProducts.map((p, i) => (
                <Link 
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="group bg-[#111] rounded-3xl p-4 border border-white/10 hover:border-[#CCFF00]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(204,255,0,0.1)]"
                >
                  <div className="w-full aspect-square bg-[#0a0a0a] rounded-2xl mb-4 overflow-hidden">
                    <img 
                      src={p.image_url} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-white font-display font-bold text-sm mb-2 line-clamp-1 group-hover:text-[#CCFF00] transition-colors">{p.name}</h3>
                  <p className="text-[#CCFF00] font-black font-display text-lg">₹{p.price}</p>
                </Link>
              ))
            ) : (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#111] rounded-3xl p-4 border border-white/10 animate-pulse">
                  <div className="w-full aspect-square bg-white/5 rounded-2xl mb-4" />
                  <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
