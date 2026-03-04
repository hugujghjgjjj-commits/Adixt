import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, CreditCard, Lock, X, Loader2, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'upi' | 'netbanking'>('card');
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const validateLuhn = (number: string) => {
    const sanitized = number.replace(/\s+/g, '');
    if (!/^\d+$/.test(sanitized)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Intelligent AI Validation for Address & Phone
      const aiValidation = await aiService.validateCheckoutInfo(
        `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.postalCode}`,
        shippingDetails.phone
      );

      if (!aiValidation.isValid) {
        toast.error(`Invalid Info: ${aiValidation.reason}`);
        setIsProcessing(false);
        setCheckoutStep('shipping');
        return;
      }

      // 2. Structural Validation for Credit Card
      if (paymentMethod === 'card') {
        if (!validateLuhn(cardDetails.number)) {
          toast.error('Invalid Credit Card Number. Please check and try again.');
          setIsProcessing(false);
          return;
        }
        if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
          toast.error('Invalid Expiry Date format (MM/YY)');
          setIsProcessing(false);
          return;
        }
        if (!/^\d{3,4}$/.test(cardDetails.cvc)) {
          toast.error('Invalid CVC');
          setIsProcessing(false);
          return;
        }
      }
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentMethod, 
          shippingDetails 
        }),
      });
      if (res.ok) {
        setShowPaymentModal(false);
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/orders');
      } else {
        toast.error('Failed to place order');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred during checkout');
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#000000] py-12 text-white selection:bg-[#CCFF00] selection:text-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl md:text-6xl font-black font-display mb-10 tracking-tighter uppercase">Your Stash 🛒</h1>

        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] rounded-[2rem] p-16 text-center border-2 border-white/10 shadow-[8px_8px_0px_rgba(204,255,0,0.2)]"
          >
            <ShoppingBag className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-3xl font-black font-display mb-4 uppercase">Your cart is empty AF</h2>
            <p className="text-gray-400 mb-10 font-mono text-lg">Looks like you haven't added any heat to your cart yet.</p>
            <Link 
              to="/" 
              className="inline-flex items-center px-8 py-4 border-2 border-[#CCFF00] text-lg font-black font-display rounded-full text-black bg-[#CCFF00] hover:bg-transparent hover:text-[#CCFF00] transition-all duration-300 uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.3)]"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              <div className="bg-[#111] rounded-[2rem] border-2 border-white/10 overflow-hidden shadow-[8px_8px_0px_rgba(255,255,255,0.05)]">
                <ul className="divide-y divide-white/10">
                  <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                      <motion.li 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 group hover:bg-white/5 transition-colors"
                      >
                        <Link to={`/product/${item.product_id}`} className="flex-shrink-0 w-32 h-32 bg-[#0a0a0a] rounded-2xl border border-white/10 [perspective:800px]">
                          <motion.img 
                            whileHover={{ scale: 1.15, rotateX: 15, rotateY: -15, z: 30 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover rounded-2xl shadow-xl"
                            referrerPolicy="no-referrer"
                          />
                        </Link>
                        
                        <div className="flex-1 flex flex-col justify-between w-full h-full py-2">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <Link to={`/product/${item.product_id}`}>
                                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#CCFF00] transition-colors leading-tight">
                                  {item.name}
                                </h3>
                              </Link>
                              <p className="mt-2 text-sm font-mono text-gray-400">Unit Price: ₹{item.price}</p>
                            </div>
                            <p className="text-2xl font-black font-display text-white">₹{item.price * item.quantity}</p>
                          </div>
                          
                          <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center border-2 border-white/20 rounded-xl bg-black">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-4 py-2 text-white hover:text-[#CCFF00] hover:bg-white/10 rounded-l-xl transition-colors font-bold text-lg"
                              >
                                -
                              </button>
                              <span className="px-4 py-2 font-mono font-bold text-white border-x-2 border-white/20 min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-4 py-2 text-white hover:text-[#CCFF00] hover:bg-white/10 rounded-r-xl transition-colors font-bold text-lg"
                              >
                                +
                              </button>
                            </div>
                            
                            <motion.button 
                              whileHover={{ scale: 1.1, rotate: 10 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-500 hover:text-[#FF00FF] p-3 rounded-xl hover:bg-[#FF00FF]/10 transition-all duration-300 border border-transparent hover:border-[#FF00FF]/30"
                            >
                              <Trash2 className="h-6 w-6" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </div>

            {/* Order Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-96 flex-shrink-0"
            >
              <div className="bg-[#111] rounded-[2rem] p-8 border-2 border-white/10 sticky top-24 shadow-[8px_8px_0px_rgba(204,255,0,0.15)]">
                <h2 className="text-2xl font-black font-display text-white mb-8 uppercase tracking-wider">Order Summary</h2>
                
                <div className="space-y-5 mb-8">
                  <div className="flex justify-between text-gray-400 font-mono text-sm">
                    <span>Subtotal</span>
                    <span className="text-white">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-mono text-sm">
                    <span>Shipping</span>
                    <span className="text-[#CCFF00] font-bold">FREE AF</span>
                  </div>
                  <div className="border-t-2 border-white/10 pt-6 flex justify-between items-end">
                    <span className="text-xl font-black font-display text-white uppercase">Total</span>
                    <motion.span 
                      key={total}
                      initial={{ scale: 1.2, color: '#CCFF00' }}
                      animate={{ scale: 1, color: '#ffffff' }}
                      className="text-4xl font-black font-display text-white"
                    >
                      ₹{total}
                    </motion.span>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full bg-[#CCFF00] text-black px-6 py-4 rounded-full font-display font-black text-lg hover:bg-white transition-colors flex items-center justify-center space-x-2 uppercase tracking-wide shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                >
                  <span>Checkout</span>
                  <ArrowRight className="h-6 w-6" />
                </motion.button>
                
                <div className="mt-6 flex items-center justify-center text-sm font-mono text-[#CCFF00] space-x-2 bg-[#CCFF00]/5 py-2 rounded-xl border border-[#CCFF00]/10">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">AI Verified Secure Checkout</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[#111] border-2 border-white/10 rounded-[2rem] p-6 sm:p-10 w-full max-w-md relative shadow-[8px_8px_0px_rgba(204,255,0,0.2)] max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  if (!isProcessing) {
                    setShowPaymentModal(false);
                    setCheckoutStep('shipping');
                  }
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-[#FF00FF] transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10 z-10"
                disabled={isProcessing}
              >
                <X className="h-6 w-6" />
              </button>

              {checkoutStep === 'shipping' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black font-display text-white uppercase tracking-wider">Shipping Details</h2>
                    <p className="text-gray-400 mt-2 font-mono text-sm">Where should we send your heat?</p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); setCheckoutStep('payment'); }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={shippingDetails.fullName}
                        onChange={e => setShippingDetails({...shippingDetails, fullName: e.target.value})}
                        placeholder="John Doe" 
                        className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Street Address</label>
                      <input 
                        type="text" 
                        required
                        value={shippingDetails.address}
                        onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})}
                        placeholder="123 Sneaker St, Apt 4" 
                        className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">City</label>
                        <input 
                          type="text" 
                          required
                          value={shippingDetails.city}
                          onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})}
                          placeholder="New York" 
                          className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Postal Code</label>
                        <input 
                          type="text" 
                          required
                          value={shippingDetails.postalCode}
                          onChange={e => setShippingDetails({...shippingDetails, postalCode: e.target.value})}
                          placeholder="10001" 
                          className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Phone Number</label>
                      <input 
                        type="tel" 
                        required
                        value={shippingDetails.phone}
                        onChange={e => setShippingDetails({...shippingDetails, phone: e.target.value})}
                        placeholder="+1 (555) 000-0000" 
                        className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono"
                      />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-[#CCFF00] text-black px-6 py-4 rounded-full font-display font-black text-lg hover:bg-white transition-colors flex items-center justify-center space-x-2 mt-6 uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                    >
                      <span>Continue to Payment</span>
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </form>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center mb-10">
                    <button 
                      onClick={() => setCheckoutStep('shipping')}
                      className="absolute top-6 left-6 text-gray-400 hover:text-[#CCFF00] transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10 z-10"
                      disabled={isProcessing}
                    >
                      <ArrowRight className="h-6 w-6 rotate-180" />
                    </button>
                    <div className="bg-[#CCFF00] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                      <CreditCard className="h-10 w-10 text-black" />
                    </div>
                    <h2 className="text-3xl font-black font-display text-white uppercase tracking-wider">Secure Checkout</h2>
                    <p className="text-gray-400 mt-3 font-mono">Total to pay: <span className="text-[#CCFF00] font-bold text-lg">₹{total}</span></p>
                  </div>

                  <form onSubmit={processPayment} className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Payment Method</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`${paymentMethod === 'card' ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white'} font-bold py-3 rounded-xl`}
                        >
                          Card
                        </button>
                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('cod')}
                          className={`${paymentMethod === 'cod' ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white'} font-bold py-3 rounded-xl hover:bg-white/20`}
                        >
                          COD
                        </button>
                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('upi')}
                          className={`${paymentMethod === 'upi' ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white'} font-bold py-3 rounded-xl hover:bg-white/20`}
                        >
                          UPI
                        </button>
                        <button 
                          type="button"
                          onClick={() => setPaymentMethod('netbanking')}
                          className={`${paymentMethod === 'netbanking' ? 'bg-[#CCFF00] text-black' : 'bg-white/10 text-white'} font-bold py-3 rounded-xl hover:bg-white/20`}
                        >
                          Net Banking
                        </button>
                      </div>
                    </div>
                    {paymentMethod === 'card' && (
                      <>
                        <div>
                          <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Card Number</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              required
                              value={cardDetails.number}
                              onChange={e => setCardDetails({...cardDetails, number: e.target.value})}
                              placeholder="0000 0000 0000 0000" 
                              className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors pl-12 font-mono text-lg"
                              disabled={isProcessing}
                            />
                            <CreditCard className="absolute left-4 top-4 h-6 w-6 text-gray-500" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Expiry Date</label>
                            <input 
                              type="text" 
                              required
                              value={cardDetails.expiry}
                              onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                              placeholder="MM/YY" 
                              className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono text-lg text-center"
                              disabled={isProcessing}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">CVC</label>
                            <input 
                              type="text" 
                              required
                              value={cardDetails.cvc}
                              onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})}
                              placeholder="123" 
                              className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono text-lg text-center"
                              disabled={isProcessing}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Name on Card</label>
                          <input 
                            type="text" 
                            required
                            value={cardDetails.name}
                            onChange={e => setCardDetails({...cardDetails, name: e.target.value})}
                            placeholder="John Doe" 
                            className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono text-lg uppercase"
                            disabled={isProcessing}
                          />
                        </div>
                      </>
                    )}

                    {paymentMethod === 'upi' && (
                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">UPI ID</label>
                        <input 
                          type="text" 
                          required
                          placeholder="username@upi" 
                          className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono text-lg"
                          disabled={isProcessing}
                        />
                      </div>
                    )}

                    {paymentMethod === 'cod' && (
                      <div className="bg-white/5 p-4 rounded-xl text-center text-gray-300 font-mono text-sm">
                        Pay ₹{total} upon delivery.
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Select Bank</label>
                        <select 
                          className="w-full bg-[#000000] border-2 border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] transition-colors font-mono text-lg"
                          disabled={isProcessing}
                        >
                          <option>HDFC Bank</option>
                          <option>ICICI Bank</option>
                          <option>State Bank of India</option>
                          <option>Axis Bank</option>
                        </select>
                      </div>
                    )}

                    <motion.button 
                      whileHover={!isProcessing ? { scale: 1.02 } : {}}
                      whileTap={!isProcessing ? { scale: 0.98 } : {}}
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-[#CCFF00] text-black px-6 py-5 rounded-full font-display font-black text-xl hover:bg-white transition-colors flex items-center justify-center space-x-3 mt-8 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-6 w-6" />
                          <span>Pay ₹{total}</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
