
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowRightLeft, Star, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: {
    id: string;
    title: string;
    points_value: number;
    image_urls?: string[];
    user_id: string;
  };
}

const SwapRequestModal = ({ isOpen, onClose, targetItem }: SwapRequestModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Fetch user's available items
  const { data: userItems } = useQuery({
    queryKey: ['user-items-for-swap', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'available')
        .neq('id', targetItem.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && isOpen,
  });

  const selectedItem = userItems?.find(item => item.id === selectedItemId);
  const pointsDifference = selectedItem ? targetItem.points_value - selectedItem.points_value : 0;
  const rupaeesDifference = Math.abs(pointsDifference);

  // Create swap request mutation
  const createSwapMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItemId || !user?.id) throw new Error('Missing required data');

      const { error } = await supabase
        .from('swap_requests')
        .insert({
          item_requested_id: targetItem.id,
          item_offered_id: selectedItemId,
          from_user_id: user.id,
          to_user_id: targetItem.user_id,
          points_difference: pointsDifference,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Swap request sent! 🎉",
        description: "The item owner will be notified of your request.",
      });
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      onClose();
      setSelectedItemId(null);
    },
    onError: (error) => {
      console.error('Swap request error:', error);
      toast({
        title: "Failed to send swap request",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

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
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy flex items-center">
                  <ArrowRightLeft className="mr-2 text-pink" size={24} />
                  Choose Item to Swap
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100">
                  <X size={20} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Item */}
                <Card className="bg-gradient-to-br from-pink/10 to-purple/10 border-pink/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-navy mb-2">You want:</h3>
                    <div className="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden">
                      {targetItem.image_urls?.[0] ? (
                        <img 
                          src={targetItem.image_urls[0]} 
                          alt={targetItem.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-navy">{targetItem.title}</h4>
                    <div className="flex items-center text-sm text-navy/70 mt-1">
                      <Star className="text-yellow-500 mr-1" size={12} />
                      {targetItem.points_value} points
                    </div>
                  </CardContent>
                </Card>

                {/* User's Items */}
                <div>
                  <h3 className="font-semibold text-navy mb-4">Your items:</h3>
                  {!userItems || userItems.length === 0 ? (
                    <div className="text-center py-8 text-navy/60">
                      <p>You don't have any available items to swap.</p>
                      <p className="text-sm mt-2">Add some items first!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {userItems.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedItemId === item.id
                              ? 'border-pink bg-pink/10 shadow-md'
                              : 'border-gray-200 hover:border-navy/20 hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedItemId(item.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                              {item.image_urls?.[0] ? (
                                <img 
                                  src={item.image_urls[0]} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-navy">{item.title}</h4>
                              <div className="flex items-center text-sm text-navy/70">
                                <Star className="text-yellow-500 mr-1" size={12} />
                                {item.points_value} points
                              </div>
                              <p className="text-xs text-navy/60 capitalize">{item.condition} • {item.category}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Points Calculation */}
              {selectedItem && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-navy/5 rounded-lg border border-navy/10"
                >
                  <h3 className="font-semibold text-navy mb-3">Swap Summary:</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-navy/80">Your item ({selectedItem.title}):</span>
                      <span className="font-medium">{selectedItem.points_value} points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy/80">Their item ({targetItem.title}):</span>
                      <span className="font-medium">{targetItem.points_value} points</span>
                    </div>
                    <hr className="border-navy/20" />
                    {pointsDifference === 0 ? (
                      <div className="flex justify-between font-semibold text-green-700 bg-green-50 p-2 rounded">
                        <span>Perfect match!</span>
                        <span>No extra payment needed ✅</span>
                      </div>
                    ) : pointsDifference > 0 ? (
                      <div className="flex justify-between font-semibold text-orange-700 bg-orange-50 p-2 rounded">
                        <span>You need to pay:</span>
                        <span className="flex items-center">
                          <Coins size={16} className="mr-1" />
                          ₹{rupaeesDifference}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between font-semibold text-blue-700 bg-blue-50 p-2 rounded">
                        <span>You will receive:</span>
                        <span className="flex items-center">
                          <Coins size={16} className="mr-1" />
                          ₹{rupaeesDifference}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-navy/20 text-navy hover:bg-navy/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createSwapMutation.mutate()}
                  disabled={!selectedItemId || createSwapMutation.isPending}
                  className="bg-pink hover:bg-pink/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createSwapMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Swap Request'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SwapRequestModal;
