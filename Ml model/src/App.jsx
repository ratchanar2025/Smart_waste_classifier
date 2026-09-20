import React, { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Camera, Zap, BarChart3, ShieldCheck, RefreshCcw } from 'lucide-react';
import Spline from '@splinetool/react-spline';

// PASTE YOUR TEACHABLE MACHINE LINK HERE (Keep the trailing slash)
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/CGEAicH_n/";

export default function App() {
  const [prediction, setPrediction] = useState("Initializing...");
  const [confidence, setConfidence] = useState(0);
  const [data, setData] = useState([]);
  const webcamContainerRef = useRef(null);
  const modelRef = useRef(null);
  const webcamRef = useRef(null);

  const init = async () => {
    try {
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";
      modelRef.current = await tmImage.load(modelURL, metadataURL);
      
      const flip = true; 
      webcamRef.current = new tmImage.Webcam(400, 400, flip); 
      await webcamRef.current.setup(); 
      await webcamRef.current.play();
      
      if (webcamContainerRef.current) {
        webcamContainerRef.current.appendChild(webcamRef.current.canvas);
      }
      window.requestAnimationFrame(loop);
    } catch (err) {
      setPrediction("Error Loading Model");
      console.error(err);
    }
  };

  const loop = async () => {
    webcamRef.current.update(); 
    await predict();
    window.requestAnimationFrame(loop);
  };

  const predict = async () => {
    const prediction = await modelRef.current.predict(webcamRef.current.canvas);
    const sorted = prediction.sort((a, b) => b.probability - a.probability);
    const top = sorted[0];

    if (top.className === "Others" || top.probability < 0.65) {
      setPrediction("Scanning...");
      setConfidence(0);
    } else {
      setPrediction(top.className);
      setConfidence(Math.round(top.probability * 100));
      setData(prev => [...prev.slice(-20), { time: Date.now(), acc: top.probability * 100 }]);
    }
  };

  // Inside App.jsx
  useEffect(() => {
    let isMounted = true;

    const startApp = async () => {
      if (isMounted) await init();
    };

    startApp();

    // Cleanup function to stop webcam when window/tab closes or component unmounts
    return () => {
      isMounted = false;
      if (webcamRef.current) {
        webcamRef.current.stop();
      }
    };
  }, []);

  const getAccentColor = () => {
    if (prediction === "paper") return "text-green-400 border-green-500/50 shadow-green-500/20";
    if (prediction === "plastic") return "text-blue-400 border-blue-500/50 shadow-blue-500/20";
    if (prediction === "metal") return "text-yellow-400 border-yellow-500/50 shadow-yellow-500/20";
    return "text-cyan-400 border-slate-700 shadow-transparent";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 overflow-hidden">
      {/* 3D Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="h-40 w-full mb-8 rounded-3xl overflow-hidden relative border border-slate-700 shadow-2xl"
      >
        <Spline scene="https://prod.spline.design/6Wq1Q7YGeWfnaW6G/scene.splinecode" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-6 left-8">
          <h1 className="text-4xl font-black italic tracking-tighter text-white">ECO-SORT <span className="text-cyan-500">AI</span></h1>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Real-Time Waste Classifier</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Viewfinder Card */}
        <motion.div initial={{ x: -30 }} animate={{ x: 0 }} className={`glass-card p-6 rounded-[2rem] border-2 transition-all duration-500 ${getAccentColor()}`}>
          <div className="flex justify-between items-center mb-4">
             <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70"><Camera size={16}/> Vision Feed</h2>
             <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-md">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-[10px] font-bold text-red-500">LIVE</span>
             </div>
          </div>
          
          <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-700 bg-black relative shadow-inner">
             <div ref={webcamContainerRef} className="w-full h-full" />
          </div>

          <div className="mt-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inference Result</p>
             <div className="flex justify-between items-end">
                <h3 className={`text-4xl font-black italic uppercase ${getAccentColor()}`}>{prediction}</h3>
                <span className="text-xl font-mono opacity-50">{confidence}%</span>
             </div>
          </div>
        </motion.div>

        {/* Stats and Info Card */}
        <motion.div initial={{ x: 30 }} animate={{ x: 0 }} className="flex flex-col gap-6">
          <div className="glass-card p-8 rounded-[2rem] flex-1">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-70 mb-8"><BarChart3 size={16}/> Reliability Plot</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} tick={{fill: '#475569'}} axisLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px'}} />
                  <Scatter name="Confidence" data={data} fill="#22d3ee" line={{stroke: '#0891b2', strokeWidth: 2}} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="glass-card p-6 rounded-3xl border border-slate-700">
                <ShieldCheck className="text-emerald-500 mb-2" />
                <p className="text-[10px] font-bold text-slate-500 uppercase">Privacy Mode</p>
                <p className="text-sm font-bold text-white">Local Edge-AI</p>
             </div>
             <div className="glass-card p-6 rounded-3xl border border-slate-700">
                <RefreshCcw className="text-cyan-500 mb-2 animate-spin-slow" />
                <p className="text-[10px] font-bold text-slate-500 uppercase">Latency</p>
                <p className="text-sm font-bold text-white">~24ms Delay</p>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}