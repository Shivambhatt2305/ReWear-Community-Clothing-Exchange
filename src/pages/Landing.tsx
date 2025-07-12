
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Recycle, Heart, Users, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import FloatingElements from '@/components/FloatingElements';
import FloatingClothes from '@/components/FloatingClothes';
import { Button } from '@/components/ui/button';

const Landing = () => {
  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      <FloatingElements />
      <FloatingClothes />
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-navy mb-6 leading-tight"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              ReWear
              <span className="block text-pink text-4xl md:text-5xl mt-2">
                Community Clothing Exchange
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-navy/80 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              Transform your wardrobe sustainably. Swap, buy, and discover pre-loved fashion 
              while building a community that values style and sustainability.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <Link to="/items">
                <Button className="bg-pink hover:bg-pink/90 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Start Exploring
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              
              <Link to="/signup">
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white px-8 py-4 text-lg rounded-full transition-all duration-300">
                  Join Community
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            {[
              {
                icon: <Recycle className="text-green-600" size={32} />,
                title: "Sustainable Fashion",
                description: "Give clothes a second life and reduce fashion waste"
              },
              {
                icon: <Heart className="text-pink" size={32} />,
                title: "Smart Swapping",
                description: "Advanced matching system based on points and preferences"
              },
              {
                icon: <Users className="text-purple-600" size={32} />,
                title: "Community Driven",
                description: "Connect with like-minded fashion enthusiasts"
              },
              {
                icon: <Star className="text-yellow-500" size={32} />,
                title: "Earn & Spend Points",
                description: "Build points through swaps and use them to buy items"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-navy mb-2">{feature.title}</h3>
                <p className="text-navy/70">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <motion.div 
                  className="text-4xl font-bold text-pink mb-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                >
                  1000+
                </motion.div>
                <p className="text-navy/70">Items Exchanged</p>
              </div>
              <div>
                <motion.div 
                  className="text-4xl font-bold text-green-600 mb-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.4 }}
                >
                  500+
                </motion.div>
                <p className="text-navy/70">Happy Members</p>
              </div>
              <div>
                <motion.div 
                  className="text-4xl font-bold text-purple-600 mb-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 1.6 }}
                >
                  50kg
                </motion.div>
                <p className="text-navy/70">Textile Waste Saved</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
