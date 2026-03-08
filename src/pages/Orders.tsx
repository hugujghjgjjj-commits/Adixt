import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, Repeat, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(ordersData);
        } catch (error) {
          console.error("Error fetching orders:", error);
          setOrders([]);
        } finally {
          setLoading(false);
        }
      };

      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Processing': return <Clock className="w-4 h-4 mr-2" />;
      case 'Shipped': return <Package className="w-4 h-4 mr-2" />;
      case 'Delivered': return <CheckCircle className="w-4 h-4 mr-2" />;
      default: return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center py-12 px-4 text-white selection:bg-[#CCFF00] selection:text-black">
        <Package className="h-20 w-20 text-gray-600 mb-6" />
        <h2 className="text-3xl font-black font-display mb-3 uppercase tracking-wider text-center">Login to view your hauls</h2>
        <Link to="/login" className="text-[#CCFF00] hover:text-white font-bold text-lg underline decoration-2 underline-offset-4 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#CCFF00] animate-spin" />
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl md:text-6xl font-black font-display mb-10 tracking-tighter uppercase text-3d">Your Hauls 📦</h1>

        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] rounded-[2rem] p-16 text-center border-2 border-white/10 shadow-[8px_8px_0px_rgba(204,255,0,0.2)]"
          >
            <Package className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-3xl font-black font-display mb-4 uppercase text-3d">No hauls yet</h2>
            <p className="text-gray-400 mb-10 font-mono text-lg">You haven't copped anything yet. Start shopping to build your stash.</p>
            <Link 
              to="/" 
              className="inline-flex items-center px-8 py-4 border-2 border-[#CCFF00] text-lg font-black font-display rounded-full text-black bg-[#CCFF00] hover:bg-transparent hover:text-[#CCFF00] transition-all duration-300 uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.3)]"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {orders.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="bg-[#111] rounded-[2rem] border-2 border-white/10 overflow-hidden shadow-[8px_8px_0px_rgba(255,255,255,0.05)] hover:shadow-[8px_8px_0px_rgba(204,255,0,0.2)] hover:border-[#CCFF00]/50 transition-all duration-300"
              >
                <div className="bg-[#000000] px-8 py-6 border-b-2 border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-xs font-mono font-bold text-gray-500 mb-2 uppercase tracking-widest">Order ID</p>
                    <p className="font-mono text-base font-bold text-[#CCFF00]">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-gray-500 mb-2 uppercase tracking-widest">Date</p>
                    <p className="font-mono text-base font-bold text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-gray-500 mb-2 uppercase tracking-widest">Total</p>
                    <p className="font-display font-black text-2xl text-white">₹{order.totalAmount}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-black font-display uppercase tracking-wider border-2 ${
                        order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 
                        order.status === 'Shipped' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 
                        order.status === 'Delivered' ? 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]/50' : 
                        'bg-gray-500/20 text-gray-400 border-gray-500/50'
                      }`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                  </div>
                  <button
                    onClick={() => {
                      order.items.forEach((item: any) => {
                        addToCart(item.productId, item.quantity, item);
                      });
                      navigate('/cart');
                    }}
                    className="p-2 bg-white/10 hover:bg-[#CCFF00] hover:text-black rounded-full transition-colors"
                    title="Buy Again"
                  >
                    <Repeat className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-8">
                  <ul className="divide-y-2 divide-white/10">
                    {order.items.map((item: any) => (
                      <li key={item.id} className="py-6 flex items-center gap-6 group">
                        <Link to={`/product/${item.productId}`} className="flex-shrink-0 w-24 h-24 bg-[#0a0a0a] rounded-xl border border-white/10 [perspective:800px]">
                          <motion.img 
                            whileHover={{ scale: 1.15, rotateX: 15, rotateY: -15, z: 30 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover rounded-xl shadow-xl"
                            referrerPolicy="no-referrer"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link to={`/product/${item.productId}`}>
                            <h4 className="text-lg font-display font-bold text-white group-hover:text-[#CCFF00] transition-colors leading-tight">
                              {item.name}
                            </h4>
                          </Link>
                          <p className="text-sm font-mono text-gray-400 mt-2">Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                        <div className="text-right font-display font-black text-xl text-white">
                          ₹{item.quantity * item.price}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
