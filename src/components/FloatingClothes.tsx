
import React from 'react';
import { motion } from 'framer-motion';
import { Shirt, Crown, Watch, Glasses } from 'lucide-react';

const FloatingClothes = () => {
  const icons = [
    { Icon: Shirt, delay: 0 },
    { Icon: Crown, delay: 0.5 },
    { Icon: Watch, delay: 1 },
    { Icon: Glasses, delay: 1.5 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {icons.map(({ Icon, delay }, index) => (
        <motion.div
          key={index}
          className="absolute text-pink/20"
          initial={{ 
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100,
            rotate: 0,
            scale: 0.5
          }}
          animate={{
            y: -100,
            rotate: 360,
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 15,
            delay: delay,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            left: `${20 + (index * 20)}%`,
          }}
        >
          <Icon size={32} />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingClothes;
