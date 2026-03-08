import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Shield, Loader2, User as UserIcon, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.isAdmin) {
      fetchUsers();
    }
  }, [authLoading, user]);

  const toggleAdminStatus = async (userId: string, currentRole: string) => {
    if (userId === user?.uid && currentRole !== 'admin') {
      toast.error('You cannot promote yourself');
      return;
    }

    if (userId === user?.uid) {
      if (!window.confirm('Are you sure you want to demote yourself to a Normal User? You will lose access to the Admin Dashboard.')) {
        return;
      }
    }

    setProcessingId(userId);

    try {
      const userRef = doc(db, 'users', userId);
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      await updateDoc(userRef, {
        role: newRole
      });

      toast.success('User admin status updated');
      
      if (userId === user?.uid) {
        // If the user demoted themselves, redirect to home
        navigate('/');
      } else {
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('An error occurred while updating user');
    } finally {
      setProcessingId(null);
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
    return <Navigate to="/" replace />;
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black font-display text-white uppercase tracking-wider text-3d">User Management</h1>
        <Link to="/admin" className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-mono text-sm transition-colors border border-white/20">
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search users by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-[#111] border-2 border-white/10 rounded-2xl text-white focus:outline-none focus:border-[#CCFF00] font-mono transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-[#CCFF00]" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Users Table */}
          <div className="bg-[#111] rounded-[2rem] border-2 border-white/10 overflow-hidden shadow-[8px_8px_0px_rgba(255,255,255,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-white/10 bg-black/50">
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm">User</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm">Email</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm text-center">Role</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => (
                  <motion.tr 
                    key={u.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-full">
                          <UserIcon className="h-5 w-5 text-gray-300" />
                        </div>
                        <span className="text-white font-bold">{u.name}</span>
                        {u.uid === user?.uid && (
                          <span className="text-xs bg-[#CCFF00]/20 text-[#CCFF00] px-2 py-1 rounded-full font-mono ml-2">You</span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-gray-400 font-mono text-sm">{u.email}</td>
                    <td className="p-6 text-center">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20 text-xs font-mono uppercase tracking-widest">
                          <Shield className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10 text-xs font-mono uppercase tracking-widest">
                          User
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAdminStatus(u.uid, u.role)}
                          disabled={!!processingId}
                          className={`px-5 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                            u.role === 'admin'
                              ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                              : 'bg-[#CCFF00]/10 text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black border border-[#CCFF00]/20 hover:border-[#CCFF00] hover:shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                          } ${processingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {processingId === u.uid ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : null}
                          {u.uid === user?.uid ? 'Demote Self' : u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400 font-mono">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
