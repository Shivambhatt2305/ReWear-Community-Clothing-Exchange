
import React from 'react';
import { motion } from 'framer-motion';
import { Shirt, ShoppingBag, Heart, Sparkles, Recycle, Users } from 'lucide-react';

const FloatingElements = () => {
  const elements = [
    { Icon: Shirt, delay: 0, x: 100, y: 100 },
    { Icon: ShoppingBag, delay: 1, x: 200, y: 300 },
    { Icon: Heart, delay: 2, x: 300, y: 150 },
    { Icon: Sparkles, delay: 0.5, x: 80, y: 400 },
    { Icon: Recycle, delay: 1.5, x: 400, y: 250 },
    { Icon: Users, delay: 2.5, x: 150, y: 450 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((element, index) => {
        const { Icon, delay, x, y } = element;
        return (
          <motion.div
            key={index}
            className="absolute text-blush/30"
            style={{ left: `${x}px`, top: `${y}px` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              delay: delay,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Icon size={32} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingElements;
