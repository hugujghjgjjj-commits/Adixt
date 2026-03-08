import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center py-12 px-4 text-white selection:bg-[#CCFF00] selection:text-black">
        <Heart className="h-20 w-20 text-gray-600 mb-6" />
        <h2 className="text-3xl font-black font-display mb-3 uppercase tracking-wider text-center">Login to view your wishlist</h2>
        <Link to="/login" className="text-[#CCFF00] hover:text-white font-bold text-lg underline decoration-2 underline-offset-4 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#000000] py-12 text-white selection:bg-[#CCFF00] selection:text-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 mb-10">
          <Heart className="h-10 w-10 text-[#FF00FF] fill-[#FF00FF] drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]" />
          <h1 className="text-5xl md:text-6xl font-black font-display tracking-tighter uppercase">Your Wishlist</h1>
        </div>

        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] rounded-[2rem] p-16 text-center border-2 border-white/10 shadow-[8px_8px_0px_rgba(255,0,255,0.2)]"
          >
            <Heart className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-3xl font-black font-display mb-4 uppercase">Your wishlist is empty AF</h2>
            <p className="text-gray-400 mb-10 font-mono text-lg">Save items you love to your wishlist to buy them later.</p>
            <Link 
              to="/" 
              className="inline-flex items-center px-8 py-4 border-2 border-[#FF00FF] text-lg font-black font-display rounded-full text-black bg-[#FF00FF] hover:bg-transparent hover:text-[#FF00FF] transition-all duration-300 uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,255,0.3)]"
            >
              Explore Products
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {wishlist.map((item, index) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="[perspective:1000px] h-full"
                >
                  <motion.div
                    whileHover={{ y: -10, scale: 1.02, rotateX: 5, rotateY: -5, z: 30 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-[#111] rounded-[2rem] p-5 border-2 border-white/10 group relative shadow-[8px_8px_0px_rgba(255,255,255,0.05)] hover:shadow-[8px_8px_0px_rgba(255,0,255,0.2)] hover:border-[#FF00FF]/50 transition-all duration-300 flex flex-col h-full [transform-style:preserve-3d]"
                  >
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-8 right-8 z-10 p-3 bg-black/60 backdrop-blur-md rounded-xl text-white hover:text-[#FF00FF] hover:bg-white transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/20 hover:border-[#FF00FF] [transform:translateZ(30px)]"
                    >
                      <Trash2 className="h-5 w-5" />
                    </motion.button>
                    
                    <Link to={`/product/${item.productId}`} className="block relative overflow-hidden rounded-2xl mb-5 bg-[#0a0a0a] aspect-[4/5] border border-white/5">
                      <motion.img 
                        whileHover={{ scale: 1.15, rotateX: 10, rotateY: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    
                    <div className="flex flex-col flex-1 justify-between [transform:translateZ(20px)]">
                      <Link to={`/product/${item.productId}`}>
                        <h3 className="text-xl font-display font-bold text-white mb-3 line-clamp-2 group-hover:text-[#FF00FF] transition-colors leading-tight">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="mt-4 flex items-end justify-between">
                        <span className="text-2xl font-black font-display text-white">₹{item.price}</span>
                        <motion.button 
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            addToCart(item.productId);
                            removeFromWishlist(item.id);
                          }}
                          className="flex items-center justify-center bg-[#CCFF00] text-black hover:bg-white p-3 rounded-xl transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                          aria-label="Move to cart"
                        >
                          <ShoppingCart className="h-6 w-6" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
