import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  DREAM_TERRITORIES, 
  DreamTerritory, 
  TerritoryStats 
} from '../types/community';
import { getTerritoryStats } from '../utils/communityService';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Sparkles, Flame, Loader2, TrendingUp, Activity, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

// Predefined positions for territories on a 1000x600 coordinate system
const TERRITORY_LAYOUT: Record<string, { x: number, y: number, scale: number }> = {
  water: { x: 200, y: 450, scale: 1.2 },
  flying: { x: 500, y: 150, scale: 1.1 },
  nature: { x: 800, y: 450, scale: 1.3 },
  chase: { x: 850, y: 300, scale: 0.9 },
  familiar: { x: 150, y: 300, scale: 1.0 },
  death: { x: 500, y: 500, scale: 0.8 },
  transformation: { x: 500, y: 300, scale: 1.5 },
  mystical: { x: 800, y: 150, scale: 1.0 },
  relationships: { x: 200, y: 150, scale: 1.1 },
  work: { x: 350, y: 300, scale: 0.9 },
  general: { x: 500, y: 550, scale: 0.7 }
};

// Organic blob paths
const BLOB_PATHS = [
  "M45.7,-76.3C58.9,-69.3,69.1,-55.5,75.8,-41.2C82.5,-26.9,85.6,-12.1,82.7,1.7C79.8,15.5,70.9,28.3,61.4,40.1C51.9,51.9,41.8,62.7,29.3,69.5C16.8,76.3,1.9,79.1,-11.9,77.8C-25.7,76.5,-38.4,71.1,-50.3,62.8C-62.2,54.5,-73.3,43.3,-79.6,29.9C-85.9,16.5,-87.4,0.9,-83.1,-13.4C-78.8,-27.7,-68.7,-40.7,-56.3,-48.1C-43.9,-55.5,-29.2,-57.3,-15.5,-59.1C-1.8,-60.9,11,-62.7,24.8,-65.4",
  "M42.7,-72.2C54.6,-66.1,63.1,-53.4,70.3,-40.8C77.5,-28.2,83.4,-15.7,81.3,-4.2C79.2,7.3,69.1,17.9,60.2,28.5C51.3,39.1,43.6,49.8,33.5,58.3C23.4,66.8,10.9,73.1,-2.4,77.3C-15.7,81.5,-29.8,83.6,-41.6,76.8C-53.4,70,-62.9,54.3,-69.8,39.2C-76.7,24.1,-81,9.6,-79.1,-4.1C-77.2,-17.8,-69.1,-30.7,-59.1,-41.9C-49.1,-53.1,-37.2,-62.6,-24.5,-67.8C-11.8,-73,1.7,-73.9,14.6,-72.6",
  "M38.6,-64.6C51.2,-59.6,63.4,-52.3,71.7,-41.8C80,-31.3,84.4,-17.6,82.7,-4.6C81,8.4,73.2,20.7,64.2,31.5C55.2,42.3,45,51.6,33.8,59.3C22.6,67,10.4,73.1,-2.7,77.8C-15.8,82.5,-29.8,85.8,-42.6,80.1C-55.4,74.4,-67,59.7,-74.3,44.1C-81.6,28.5,-84.6,12,-82.1,-3.2C-79.6,-18.4,-71.6,-32.3,-61.2,-43.3C-50.8,-54.3,-38,-62.4,-25.2,-67.2C-12.4,-72,-0.4,-73.5,12.5,-73.7"
];

// Color mapping for SVG gradients
const TERRITORY_GRADIENTS: Record<string, [string, string]> = {
  water: ['#3b82f6', '#06b6d4'], // blue-500 to cyan-500
  flying: ['#38bdf8', '#6366f1'], // sky-400 to indigo-500
  chase: ['#ef4444', '#f97316'], // red-500 to orange-500
  familiar: ['#fbbf24', '#eab308'], // amber-400 to yellow-500
  death: ['#a855f7', '#7c3aed'], // purple-500 to violet-600
  nature: ['#10b981', '#10b981'], // green-500 to emerald-500
  relationships: ['#ec4899', '#f43f5e'], // pink-500 to rose-500
  work: ['#64748b', '#4b5563'], // slate-500 to gray-600
  transformation: ['#facc15', '#f97316'], // yellow-400 to orange-500
  mystical: ['#8b5cf6', '#9333ea'], // violet-500 to purple-600
  general: ['#94a3b8', '#64748b'] // gray-400 to slate-500
};

// Mock data for emotions since API currently returns empty array
const TERRITORY_EMOTIONS: Record<string, string[]> = {
  water: ['Calm', 'Overwhelmed'],
  flying: ['Freedom', 'Fear'],
  chase: ['Anxiety', 'Panic'],
  familiar: ['Nostalgia', 'Comfort'],
  death: ['Grief', 'Acceptance'],
  nature: ['Peace', 'Awe'],
  relationships: ['Love', 'Conflict'],
  work: ['Stress', 'Ambition'],
  transformation: ['Confusion', 'Hope'],
  mystical: ['Wonder', 'Mystery'],
  general: ['Mixed', 'Unsure']
};

interface DreamMapProps {
  onSelectTerritory?: (territory: DreamTerritory) => void;
  className?: string;
}

export const DreamMap: React.FC<DreamMapProps> = ({ onSelectTerritory, className = '' }) => {
  const [stats, setStats] = useState<TerritoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const navigate = useNavigate();

  // Ensure className is always a string to prevent "className.split is not a function" errors
  const safeClassName = typeof className === 'string' ? className : '';

  const handleShareDream = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/dashboard'); // Navigate to Dream Library (Dashboard)
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getTerritoryStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load map stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Merge static territory info with dynamic stats
  const mapData = useMemo(() => {
    // If stats are empty, use default data for all territories
    // MODIFIED: Default count to 0 to test empty state
    const baseStats = stats.length > 0 ? stats : Object.keys(DREAM_TERRITORIES).map(key => ({
      territory: key as DreamTerritory,
      dreamCount: 0, // Default to 0 to show share button initially or if empty
      trending: false,
      topEmotions: []
    }));

    // Ensure we cover all territories even if stats doesn't have them all
    const allTerritories = Object.keys(DREAM_TERRITORIES) as DreamTerritory[];
    const completeStats = allTerritories.map(t => {
      const existing = baseStats.find(s => s.territory === t);
      return existing || { territory: t, dreamCount: 5, trending: false, topEmotions: [] };
    });

    return completeStats.map(stat => {
      const territoryInfo = DREAM_TERRITORIES[stat.territory];
      const layout = TERRITORY_LAYOUT[stat.territory] || TERRITORY_LAYOUT.general;
      const pathIndex = Object.keys(DREAM_TERRITORIES).indexOf(stat.territory) % BLOB_PATHS.length;
      
      // Calculate scale based on dream count (logarithmic scale)
      // If count is 0, keep it visible but maybe smaller or standard
      const scaleFactor = Math.log(Math.max(1, stat.dreamCount) + 1) * 0.2;
      const visualScale = layout.scale + Math.min(scaleFactor, 1.5);

      return {
        ...stat,
        ...territoryInfo,
        x: layout.x,
        y: layout.y,
        scale: visualScale,
        path: BLOB_PATHS[pathIndex]
      };
    });
  }, [stats]);

  const handleSelect = (territory: DreamTerritory) => {
    if (onSelectTerritory) {
      onSelectTerritory(territory);
    } else {
      console.log(`Selected territory: ${territory}`);
      navigate(`/community?territory=${territory}`);
    }
  };

  const getRandomTrending = (id: string) => {
    // Deterministic random based on ID char code sum
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 60 + (sum % 35); // Returns 60-95%
  };

  return (
    <div className={cn("relative w-full h-[400px] md:h-[600px] bg-slate-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group", safeClassName)}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0)_0%,rgba(2,6,23,1)_100%)] z-0" />
      
      {/* Fog of War / Particles Layer */}
      <div className="absolute inset-0 z-10 opacity-30 pointer-events-none overflow-hidden">
         {/* Simple SVG noise overlay for fog effect */}
         <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay">
           <filter id="noiseFilter">
             <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
           </filter>
           <rect width="100%" height="100%" filter="url(#noiseFilter)" />
         </svg>
         
         {/* Floating particles */}
         {[...Array(20)].map((_, i) => (
           <motion.div
             key={i}
             className="absolute w-1 h-1 bg-white/40 rounded-full blur-[1px]"
             initial={{ 
               x: Math.random() * 1000, 
               y: Math.random() * 600,
               scale: Math.random() * 0.5 + 0.5
             }}
             animate={{
               y: [null, Math.random() * -100],
               x: [null, (Math.random() - 0.5) * 50],
               opacity: [0, 0.8, 0]
             }}
             transition={{
               duration: 5 + Math.random() * 10,
               repeat: Infinity,
               delay: Math.random() * 5,
               ease: "linear"
             }}
           />
         ))}
      </div>

      {/* SVG Map Layer */}
      <div className="absolute inset-0 z-20 w-full h-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <svg viewBox="0 0 1000 600" className="w-full h-full">
            <defs>
              {/* Define gradients for each territory */}
              {mapData.map((data) => {
                const colors = TERRITORY_GRADIENTS[data.id] || ['#94a3b8', '#64748b'];
                return (
                  <linearGradient key={`grad-${data.id}`} id={`grad-${data.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors[0]} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={colors[1]} stopOpacity="0.6" />
                  </linearGradient>
                );
              })}
              
              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="10" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connection Lines */}
            <g className="opacity-10 stroke-white/20 stroke-1">
               <motion.path 
                 d="M200,450 Q500,300 800,450" 
                 fill="none" 
                 initial={{ pathLength: 0 }}
                 animate={{ pathLength: 1 }}
                 transition={{ duration: 2, ease: "easeInOut" }}
               />
               <motion.path 
                 d="M200,150 Q500,300 800,150" 
                 fill="none"
                 initial={{ pathLength: 0 }}
                 animate={{ pathLength: 1 }}
                 transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
               />
               <motion.path 
                 d="M500,150 L500,500" 
                 fill="none"
                 initial={{ pathLength: 0 }}
                 animate={{ pathLength: 1 }}
                 transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
               />
            </g>

            {/* Territories */}
            <AnimatePresence>
              {mapData.map((territory) => (
                <motion.g
                  key={territory.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onMouseEnter={() => setHoveredRegion(territory.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="cursor-pointer"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  {/* Trending Glow */}
                  {territory.trending && (
                     <motion.circle
                       cx={territory.x}
                       cy={territory.y}
                       r={60}
                       fill="url(#glow)"
                       className="text-amber-500/30"
                       style={{ fill: 'rgba(245, 158, 11, 0.3)', filter: 'url(#glow)' }}
                       animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                       transition={{ duration: 3, repeat: Infinity }}
                     />
                  )}

                  {/* Territory Group Wrapper for positioning */}
                  <g transform={`translate(${territory.x}, ${territory.y}) scale(${territory.scale})`}>
                    
                    {/* The Blob Shape */}
                    <HoverCard openDelay={0} closeDelay={200}>
                      <HoverCardTrigger asChild>
                        <g>
                          <motion.path
                            d={territory.path}
                            fill={`url(#grad-${territory.id})`}
                            stroke="white"
                            strokeWidth="0.5"
                            strokeOpacity="0.2"
                            className="transition-all duration-300"
                            animate={{
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                              duration: 10 + Math.random() * 5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            whileHover={{ scale: 1.1, strokeOpacity: 0.8 }}
                            whileTap={{ scale: 0.95 }}
                          />
                          {/* Visual indicator for empty territory */}
                          {territory.dreamCount === 0 && (
                            <foreignObject x="-60" y="-20" width="120" height="40" className="pointer-events-none">
                              <div className="flex items-center justify-center w-full h-full">
                                <div className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 border border-white/20">
                                  <span className="text-[8px] text-white flex items-center gap-1">
                                    <Sparkles className="w-2 h-2" />
                                    Be the first
                                  </span>
                                </div>
                              </div>
                            </foreignObject>
                          )}
                        </g>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 bg-slate-900/95 border-slate-700 text-white backdrop-blur-xl p-0 overflow-hidden shadow-2xl z-50">
                        {/* Header with Icon and Title */}
                        <div className="relative p-4 pb-2 border-b border-slate-700/50">
                          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${territory.gradient}`} />
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-2xl border border-slate-700 shadow-inner">
                                {territory.icon}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-900 flex items-center justify-center`}>
                                <div className={`w-2 h-2 rounded-full ${territory.trending ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif font-bold text-lg leading-tight text-white truncate">
                                {territory.name} Realm
                              </h3>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                {territory.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-px bg-slate-700/30">
                          <div className="bg-slate-900/40 p-3 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                              <Flame className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{territory.trending ? getRandomTrending(territory.id) : 45}%</span>
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Trending</span>
                          </div>
                          
                          <div className="bg-slate-900/40 p-3 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-1.5 text-purple-400 mb-0.5">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{territory.dreamCount > 0 ? territory.dreamCount.toLocaleString() : 0}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Dreams This Week</span>
                          </div>
                        </div>

                        {/* Emotional Tone & Action */}
                        <div className="p-4 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-medium">
                              <Activity className="w-3 h-3" />
                              Emotional Tone
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(TERRITORY_EMOTIONS[territory.id] || ['Mystery', 'Wonder']).map((emotion, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300"
                                >
                                  {emotion}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <Button 
                            className={`w-full bg-gradient-to-r ${territory.gradient} hover:opacity-90 border-0 text-white font-medium shadow-lg shadow-purple-900/20`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(territory.territory);
                            }}
                          >
                            Explore This Realm
                          </Button>
                        </div>
                      </HoverCardContent>
                    </HoverCard>

                    {/* Label */}
                    <motion.text
                      y="5"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[10px] font-bold fill-white pointer-events-none drop-shadow-md uppercase tracking-wider"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      animate={{ 
                        opacity: hoveredRegion === territory.id ? 1 : 0.6,
                        scale: hoveredRegion === territory.id ? 1.1 : 1
                      }}
                    >
                      {String(territory.name || '').split(' ')[0]}
                    </motion.text>
                  </g>
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>
        )}
      </div>

      {/* Interactive Legend / HUD */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
         <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 pointer-events-auto">
           <div className="text-xs font-medium text-slate-300 mb-2">Dreamscape Legend</div>
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
               <span className="text-[10px] text-slate-400">Trending Region</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-purple-500" />
               <span className="text-[10px] text-slate-400">Size = Dream Volume</span>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
};