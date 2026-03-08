import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.isAdmin) {
      fetchProducts();
    }
  }, [authLoading, user]);

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('An error occurred while deleting product');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#CCFF00]" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-black font-display text-white mb-4 uppercase tracking-wider text-3d">Access Denied</h1>
        <p className="text-gray-400 font-mono mb-8">You need host privileges to access this page.</p>
        <Link to="/" className="bg-[#CCFF00] text-black font-black font-display uppercase tracking-wider px-8 py-3 rounded-full hover:bg-white transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black font-display text-white uppercase tracking-wider mb-2 text-3d">Admin Dashboard</h1>
          <p className="text-gray-400 font-mono">Manage your store's inventory and users.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/users" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-display font-bold transition-colors border border-white/20 flex items-center gap-2 uppercase tracking-wider">
            <Users className="w-5 h-5" />
            Manage Users
          </Link>
          <Link to="/admin/product/new" className="bg-[#CCFF00] hover:bg-white text-black px-6 py-3 rounded-xl font-display font-black transition-colors flex items-center gap-2 uppercase tracking-wider shadow-[0_0_15px_rgba(204,255,0,0.3)]">
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-[#CCFF00]" />
        </div>
      ) : (
        <div className="bg-[#111] rounded-[2rem] border-2 border-white/10 overflow-hidden shadow-[8px_8px_0px_rgba(255,255,255,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-white/10 bg-black/50">
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm">Product</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm">Category</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm">Price</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-white/10">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400 font-mono">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      No products found. Add some heat to your store!
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-white font-display font-bold text-lg leading-tight group-hover:text-[#CCFF00] transition-colors">{product.name}</p>
                            <p className="text-gray-500 font-mono text-xs mt-1">{product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-white/10 text-white text-xs font-mono uppercase tracking-widest rounded-full border border-white/20">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-6 text-white font-display font-black text-xl">
                        ₹{product.price}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link 
                            to={`/admin/product/${product.id}`}
                            className="p-2 bg-white/10 hover:bg-[#CCFF00] text-white hover:text-black rounded-lg transition-colors border border-white/20 hover:border-[#CCFF00]"
                            title="Edit Product"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button 
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-lg transition-colors border border-white/20 hover:border-red-500"
                            title="Delete Product"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
