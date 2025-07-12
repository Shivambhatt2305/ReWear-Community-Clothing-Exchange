
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, MapPin, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    price: number;
    points_value: number;
    image_urls?: string[];
    user_id: string;
    profiles?: {
      full_name: string;
    };
  };
}

const BuyModal = ({ isOpen, onClose, item }: BuyModalProps) => {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    navigate('/delivery-address', {
      state: {
        buyData: {
          itemId: item.id,
          itemTitle: item.title,
          price: item.price,
          sellerId: item.user_id,
          sellerName: item.profiles?.full_name || 'Unknown'
        }
      }
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy flex items-center">
                  <ShoppingBag className="mr-2 text-pink" size={24} />
                  Buy Item
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
                  <X size={20} />
                </Button>
              </div>

              {/* Item Summary */}
              <Card className="bg-gradient-to-br from-pink/10 to-purple/10 border-pink/20 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {item.image_urls?.[0] ? (
                        <img 
                          src={item.image_urls[0]} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy">{item.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-bold text-pink flex items-center">
                          <Coins size={20} className="mr-1" />
                          ₹{item.price}
                        </span>
                        <span className="text-sm text-navy/70">
                          {item.points_value} points
                        </span>
                      </div>
                      <p className="text-sm text-navy/60 mt-1">
                        Seller: {item.profiles?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Information */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                <div className="flex items-center text-blue-800 mb-2">
                  <MapPin size={16} className="mr-2" />
                  <span className="font-medium">What happens next?</span>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• You'll provide your delivery address</li>
                  <li>• Complete secure payment</li>
                  <li>• Item will be shipped within 2-3 days</li>
                  <li>• Track your order status in dashboard</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-navy/20 text-navy hover:bg-navy/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className="bg-pink hover:bg-pink/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ShoppingBag className="mr-2" size={16} />
                  Buy for ₹{item.price}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuyModal;
