import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Youtube, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-[#00FFFF] tracking-tighter uppercase font-display">
                ADIXT
              </span>
            </Link>
            <p className="text-gray-400 font-mono text-sm mb-6">
              The ultimate destination for the latest heat. Curated streetwear, sneakers, and accessories for the culture.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#CCFF00] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00FFFF] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF00FF] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-display font-black uppercase tracking-wider mb-6 text-3d">Shop</h3>
            <ul className="space-y-4">
              <li><Link to="/?category=all" className="text-gray-400 hover:text-[#CCFF00] font-mono text-sm transition-colors">All Products</Link></li>
              <li><Link to="/?category=clothing" className="text-gray-400 hover:text-[#CCFF00] font-mono text-sm transition-colors">Clothing</Link></li>
              <li><Link to="/?category=shoes" className="text-gray-400 hover:text-[#CCFF00] font-mono text-sm transition-colors">Shoes</Link></li>
              <li><Link to="/?category=accessories" className="text-gray-400 hover:text-[#CCFF00] font-mono text-sm transition-colors">Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-display font-black uppercase tracking-wider mb-6 text-3d">Support</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-400 hover:text-[#00FFFF] font-mono text-sm transition-colors">FAQ</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-[#00FFFF] font-mono text-sm transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-[#00FFFF] font-mono text-sm transition-colors">Size Guide</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-[#00FFFF] font-mono text-sm transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-display font-black uppercase tracking-wider mb-6 text-3d">Stay Updated</h3>
            <p className="text-gray-400 font-mono text-sm mb-4">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}>
              <input 
                type="email" 
                required
                placeholder="Enter your email" 
                className="bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#CCFF00] w-full"
              />
              <button type="submit" className="bg-[#CCFF00] text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors">
                <Zap className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 font-mono text-xs">
            &copy; {new Date().getFullYear()} ADIXT. All rights reserved. No cap.
          </p>
          <div className="flex gap-6">
            <Link to="/" className="text-gray-500 hover:text-white font-mono text-xs transition-colors">Privacy Policy</Link>
            <Link to="/" className="text-gray-500 hover:text-white font-mono text-xs transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
