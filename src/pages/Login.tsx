import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Failed to sign in with Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Sign in cancelled.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/otp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/otp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
      
      toast.success('OTP verified successfully!');
      
      // After successful OTP verification, log the user into Firebase Auth
      // We use a deterministic strong password for OTP users since Firebase requires a password
      const otpUserPassword = `OTP_VERIFIED_${email}_SECURE_PASS_2026!`;
      try {
        await signInWithEmailAndPassword(auth, email, otpUserPassword);
      } catch (signInErr: any) {
        // If user doesn't exist, create them
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          await createUserWithEmailAndPassword(auth, email, otpUserPassword);
        } else {
          throw signInErr;
        }
      }
      
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-[#000000] py-12 px-4 sm:px-6 lg:px-8 text-white selection:bg-[#CCFF00] selection:text-black"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="max-w-md w-full space-y-8 bg-[#111] p-10 rounded-[2rem] border-2 border-white/10 shadow-[8px_8px_0px_rgba(204,255,0,0.2)]"
      >
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-center text-4xl font-black font-display text-white tracking-tighter uppercase text-3d"
          >
            {step === 'email' ? 'Welcome Back' : 'Enter OTP'}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-center text-sm font-mono text-gray-400"
          >
            {step === 'email' ? (
              <>
                Or{' '}
                <Link to="/register" className="font-bold text-[#CCFF00] hover:text-white transition-colors underline decoration-2 underline-offset-4">
                  create a new account
                </Link>
              </>
            ) : (
              `We sent a 6-digit code to ${email}`
            )}
          </motion.p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm text-center border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form 
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp} 
                className="space-y-4"
              >
                <div>
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border-2 border-white/10 bg-white/5 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent focus:z-10 sm:text-sm font-mono transition-all"
                    placeholder="Email address"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-black rounded-xl text-black bg-[#CCFF00] hover:bg-white transition-colors uppercase tracking-wider glow-button disabled:opacity-50"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send OTP'}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form 
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-4"
              >
                <div>
                  <label htmlFor="otp" className="sr-only">OTP Code</label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border-2 border-white/10 bg-white/5 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent focus:z-10 sm:text-sm font-mono text-center tracking-[0.5em] text-2xl transition-all"
                    placeholder="000000"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-black rounded-xl text-black bg-[#CCFF00] hover:bg-white transition-colors uppercase tracking-wider glow-button disabled:opacity-50"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & Login'}
                </motion.button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-center text-sm font-mono text-gray-400 hover:text-white transition-colors mt-4"
                >
                  Change Email
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {step === 'email' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#111] text-gray-500 font-mono">Or continue with</span>
                </div>
              </div>

              <motion.button
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-white/20 rounded-xl text-white bg-white/5 hover:bg-white/10 transition-all font-mono text-sm font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Sign in with Google
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
