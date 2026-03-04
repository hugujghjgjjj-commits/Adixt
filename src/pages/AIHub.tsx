import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';
import { Loader2, Zap, Brain, Video, MapPin, Search, Sparkles, Send, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';

export default function AIHub() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);

  const runTask = async (task: 'complex' | 'simple' | 'video' | 'search' | 'maps') => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }
    setLoading(true);
    setResult('');
    setActiveTask(task);
    try {
      if (task === 'complex') {
        const res = await aiService.askComplexQuestion(prompt);
        setResult(res || '');
      } else if (task === 'simple') {
        const res = await aiService.askSimpleQuestion(prompt);
        setResult(res || '');
      } else if (task === 'video') {
        const op = await aiService.generateVideo(prompt);
        setResult(`Video generation started. Please wait while we cook up your visual... This might take a minute.`);
        
        // Start polling
        const videoUri = await aiService.pollVideoOperation(op);
        if (videoUri) {
          setResult(`Video generated successfully! \n\n[Download Video](${videoUri})`);
          // We can also embed it if we want, but Markdown link is safe
        } else {
          setResult('Video generation failed or timed out.');
        }
      } else if (task === 'search') {
        const res = await aiService.getSearchData(prompt);
        setResult(res.text || '');
      } else if (task === 'maps') {
        const res = await aiService.getMapsData(prompt, 37.78193, -122.40476);
        setResult(res.text || '');
      }
    } catch (e) {
      toast.error('AI task failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What are the trending streetwear styles for 2026?",
    "Help me find a gift for a sneakerhead under ₹5000.",
    "Explain the history of the Air Jordan 1.",
    "Generate a video of a futuristic sneaker store in Tokyo.",
    "Find the best rated accessories in the store right now."
  ];

  return (
    <div className="min-h-screen bg-[#000000] py-12 px-4 text-white selection:bg-[#CCFF00] selection:text-black">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#CCFF00]/10 text-[#CCFF00] rounded-full border border-[#CCFF00]/20 mb-4 font-mono text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            Powered by Gemini 3.1
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-display mb-4 uppercase tracking-tighter leading-none">
            ADIXT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-[#00FFFF]">AI HUB</span>
          </h1>
          <p className="text-gray-400 font-mono text-lg max-w-2xl mx-auto">
            Your personal style assistant. Ask questions, generate visuals, or find the perfect heat with the power of AI.
          </p>
        </motion.div>

        <div className="bg-[#111] border-2 border-white/10 rounded-[2.5rem] p-8 mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Bot className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-black/50 border-2 border-white/10 rounded-2xl p-6 mb-6 text-white font-mono text-lg focus:outline-none focus:border-[#CCFF00] transition-all placeholder-gray-600 min-h-[150px]"
              placeholder="Ask anything about style, sneakers, or the store..."
            />
            
            <div className="flex flex-wrap gap-3 mb-8">
              {suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-gray-400 hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <button 
                onClick={() => runTask('complex')} 
                disabled={loading}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border-2 ${activeTask === 'complex' ? 'bg-[#CCFF00] text-black border-[#CCFF00]' : 'bg-white/5 text-white border-white/10 hover:border-white/30'}`}
              >
                <Brain className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Deep Think</span>
              </button>
              <button 
                onClick={() => runTask('simple')} 
                disabled={loading}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border-2 ${activeTask === 'simple' ? 'bg-[#CCFF00] text-black border-[#CCFF00]' : 'bg-white/5 text-white border-white/10 hover:border-white/30'}`}
              >
                <Zap className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Fast Chat</span>
              </button>
              <button 
                onClick={() => runTask('video')} 
                disabled={loading}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border-2 ${activeTask === 'video' ? 'bg-[#CCFF00] text-black border-[#CCFF00]' : 'bg-white/5 text-white border-white/10 hover:border-white/30'}`}
              >
                <Video className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Gen Video</span>
              </button>
              <button 
                onClick={() => runTask('search')} 
                disabled={loading}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border-2 ${activeTask === 'search' ? 'bg-[#CCFF00] text-black border-[#CCFF00]' : 'bg-white/5 text-white border-white/10 hover:border-white/30'}`}
              >
                <Search className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Web Search</span>
              </button>
              <button 
                onClick={() => runTask('maps')} 
                disabled={loading}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all border-2 ${activeTask === 'maps' ? 'bg-[#CCFF00] text-black border-[#CCFF00]' : 'bg-white/5 text-white border-white/10 hover:border-white/30'}`}
              >
                <MapPin className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Find Near</span>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="w-12 h-12 animate-spin text-[#CCFF00] mb-4" />
              <p className="text-gray-400 font-mono animate-pulse">
                {activeTask === 'video' ? 'Cooking up your video... This might take a minute.' : 'AI is cooking something special...'}
              </p>
            </motion.div>
          ) : result ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111] p-8 rounded-[2.5rem] border-2 border-[#CCFF00]/20 shadow-[0_0_40px_rgba(204,255,0,0.1)]"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <div className="bg-[#CCFF00] p-2 rounded-lg">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <span className="font-display font-black uppercase tracking-widest text-sm">Response</span>
              </div>
              <div className="prose prose-invert max-w-none font-mono text-gray-300 leading-relaxed">
                <Markdown>{result}</Markdown>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
