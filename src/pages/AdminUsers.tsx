import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Shield, Loader2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  is_admin: number;
  created_at: string;
}

export default function AdminUsers() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: number) => {
    if (userId === user?.id) {
      toast.error('You cannot change your own admin status');
      return;
    }

    setProcessingId(userId);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const res = await fetch(`/api/users/${userId}/admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: currentStatus === 1 ? false : true }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        toast.success('User admin status updated');
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        toast.error('Request timed out');
      } else {
        console.error('Error updating user:', error);
        toast.error('An error occurred while updating user');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const transferAdmin = async (userId: string) => {
    console.log('Initiating admin transfer to user:', userId);
    
    if (!user) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    if (userId === user.id) {
      toast.error('You are already an admin');
      return;
    }

    if (!window.confirm('CRITICAL WARNING: You are about to transfer your OWNER rights to this user. You will become a normal user and lose access to the admin panel immediately. This action cannot be undone. Are you sure?')) {
      return;
    }

    setProcessingId(`transfer-${userId}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const res = await fetch(`/api/users/${userId}/transfer-admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        toast.success('Admin rights transferred successfully. Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        const data = await res.json();
        console.error('Transfer failed:', data);
        toast.error(data.error || 'Failed to transfer admin rights');
        setProcessingId(null);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        toast.error('Request timed out');
      } else {
        console.error('Error transferring admin rights:', error);
        toast.error('An error occurred while transferring admin rights.');
      }
      setProcessingId(null);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-black font-display text-white mb-4 uppercase tracking-wider">Access Denied</h1>
        <p className="text-gray-400 font-mono mb-8">You need host privileges to access this page.</p>
        <Link to="/" className="bg-[#CCFF00] text-black font-black font-display uppercase tracking-wider px-8 py-3 rounded-full hover:bg-white transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black font-display text-white uppercase tracking-wider">User Management</h1>
        <Link to="/admin" className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-mono text-sm transition-colors border border-white/20">
          Back to Products
        </Link>
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
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm">User</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm">Email</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm text-center">Role</th>
                  <th className="p-6 text-white font-display font-black uppercase tracking-wider text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <motion.tr 
                    key={u.id}
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
                        {u.id === user.id && (
                          <span className="text-xs bg-[#CCFF00]/20 text-[#CCFF00] px-2 py-1 rounded-full font-mono ml-2">You</span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-gray-400 font-mono text-sm">{u.email}</td>
                    <td className="p-6 text-center">
                      {u.is_admin === 1 ? (
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
                          onClick={() => toggleAdminStatus(u.id, u.is_admin)}
                          disabled={u.id === user.id || !!processingId}
                          className={`px-5 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                            u.id === user.id 
                              ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                              : u.is_admin === 1
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                : 'bg-[#CCFF00]/10 text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black border border-[#CCFF00]/20 hover:border-[#CCFF00] hover:shadow-[0_0_20px_rgba(204,255,0,0.3)]'
                          } ${processingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {processingId === u.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : null}
                          {u.is_admin === 1 ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        
                        {u.id !== user.id && (
                          <button
                            onClick={() => transferAdmin(u.id)}
                            disabled={!!processingId}
                            className={`px-5 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white border border-purple-500/20 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] ${processingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {processingId === `transfer-${u.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            Make Owner
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
