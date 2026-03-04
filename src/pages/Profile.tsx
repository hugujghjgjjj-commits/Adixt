import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Package, Shield, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setLoading(false);
      });
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-[80vh] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black font-display text-white uppercase tracking-wider mb-2">
          Your Profile
        </h1>
        <p className="text-gray-400 font-mono">Manage your account details and view history.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-[#111] rounded-[2rem] border-2 border-white/10 p-8 shadow-[8px_8px_0px_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-center mb-8">
              <div className="h-24 w-24 bg-[#CCFF00]/20 rounded-full flex items-center justify-center border-2 border-[#CCFF00]/50">
                <User className="h-12 w-12 text-[#CCFF00]" />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">Name</p>
                <div className="flex items-center text-white font-display font-bold text-lg">
                  <User className="h-5 w-5 mr-3 text-gray-400" />
                  {user.name}
                </div>
              </div>

              <div>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">Email</p>
                <div className="flex items-center text-white font-mono text-sm">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  {user.email}
                </div>
              </div>

              <div>
                <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">Role</p>
                <div className="flex items-center">
                  {user.isAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20 text-xs font-mono uppercase tracking-widest">
                      <Shield className="h-4 w-4" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10 text-xs font-mono uppercase tracking-widest">
                      <User className="h-4 w-4" /> User
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 py-3 rounded-xl font-display font-bold uppercase tracking-wider transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>

        {/* Order History Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-[#111] rounded-[2rem] border-2 border-white/10 p-8 shadow-[8px_8px_0px_rgba(255,255,255,0.05)] h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black font-display text-white uppercase tracking-wider flex items-center gap-3">
                <Package className="h-6 w-6 text-[#CCFF00]" />
                Recent Hauls
              </h2>
              <Link to="/orders" className="text-sm font-mono text-[#CCFF00] hover:text-white transition-colors underline underline-offset-4">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="rounded-full h-8 w-8 border-b-2 border-[#CCFF00]"
                />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-mono mb-6">No orders found.</p>
                <Link 
                  to="/" 
                  className="inline-flex items-center px-6 py-3 border border-[#CCFF00] text-sm font-bold font-display rounded-full text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black transition-all uppercase tracking-wider"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <Link 
                    key={order.id} 
                    to="/orders"
                    className="block bg-black/50 border border-white/5 rounded-xl p-4 hover:border-[#CCFF00]/30 transition-colors group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-mono text-gray-500 mb-1">Order #{order.id.substring(0, 8)}</p>
                        <p className="text-white font-bold font-display">₹{order.total_amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-gray-500 mb-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'completed' ? 'bg-[#CCFF00]/20 text-[#CCFF00]' : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
