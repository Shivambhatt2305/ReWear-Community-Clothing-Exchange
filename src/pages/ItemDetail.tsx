import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Eye, Star, MapPin, Calendar, User, ArrowUpDown, Coins, Loader2, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import SwapRequestModal from '@/components/SwapRequestModal';
import BuyModal from '@/components/BuyModal';

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Fetch item details
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      if (!id) throw new Error('Item ID is required');
      
      // Increment view count
      await supabase.rpc('increment_views', { item_id: id });
      
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles!items_user_id_fkey(
            full_name,
            username,
            avatar_url,
            location
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Check if user already has pending exchange for this item
  const { data: existingExchange } = useQuery({
    queryKey: ['existing-exchange', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return null;
      const { data, error } = await supabase
        .from('exchanges')
        .select('*')
        .eq('requested_item_id', id)
        .eq('requester_id', user.id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!id,
  });

  // Check existing swap requests
  const { data: existingSwapRequest } = useQuery({
    queryKey: ['existing-swap-request', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return null;
      const { data, error } = await supabase
        .from('swap_requests')
        .select('*')
        .eq('item_requested_id', id)
        .eq('from_user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-navy mb-4">Item not found</h1>
            <Link to="/items">
              <Button>Browse Items</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.user_id;
  const canSwap = user && !isOwner && item.status === 'available' && !existingExchange && !existingSwapRequest && (item.delivery_type === 'swap' || item.delivery_type === 'both');
  const canBuy = user && !isOwner && item.status === 'available' && (item.delivery_type === 'buy' || item.delivery_type === 'both');

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Link to="/items">
              <Button variant="ghost" className="text-navy hover:text-pink hover:bg-pink/10">
                <ArrowLeft size={20} className="mr-2" />
                Back to Items
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="aspect-square overflow-hidden rounded-lg shadow-lg">
                {item.image_urls && item.image_urls.length > 0 ? (
                  <img
                    src={item.image_urls[selectedImageIndex]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-xl">No Image Available</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnail gallery */}
              {item.image_urls && item.image_urls.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {item.image_urls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImageIndex === index 
                          ? 'border-pink shadow-md' 
                          : 'border-transparent hover:border-navy/30'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`${item.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Item Details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-navy">{item.title}</h1>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-navy/60">
                      <Eye size={16} className="mr-1" />
                      {item.views_count}
                    </div>
                    <div className="flex items-center text-navy/60">
                      <Heart size={16} className="mr-1" />
                      {item.likes_count}
                    </div>
                  </div>
                </div>

                {/* Status, Points, and Price */}
                <div className="flex items-center space-x-4 mb-4">
                  <Badge className={`${
                    item.status === 'available' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {item.status}
                  </Badge>
                  <div className="flex items-center text-2xl font-bold text-navy">
                    <Star className="text-yellow-500 mr-1" size={24} />
                    {item.points_value} points
                  </div>
                  {(item.delivery_type === 'buy' || item.delivery_type === 'both') && (
                    <div className="flex items-center text-2xl font-bold text-pink">
                      <Coins className="mr-1" size={24} />
                      ₹{item.price}
                    </div>
                  )}
                </div>

                {/* Delivery Type */}
                <div className="mb-4">
                  <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
                    {item.delivery_type === 'swap' && 'Swap Only'}
                    {item.delivery_type === 'buy' && 'Buy Only'}
                    {item.delivery_type === 'both' && 'Swap or Buy'}
                  </Badge>
                </div>

                {/* Item Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-navy/70 text-sm">Category</span>
                    <p className="font-medium text-navy capitalize">{item.category}</p>
                  </div>
                  <div>
                    <span className="text-navy/70 text-sm">Size</span>
                    <p className="font-medium text-navy uppercase">{item.size}</p>
                  </div>
                  <div>
                    <span className="text-navy/70 text-sm">Condition</span>
                    <p className="font-medium text-navy capitalize">{item.condition?.replace('_', ' ')}</p>
                  </div>
                  {item.brand && (
                    <div>
                      <span className="text-navy/70 text-sm">Brand</span>
                      <p className="font-medium text-navy">{item.brand}</p>
                    </div>
                  )}
                  {item.color && (
                    <div>
                      <span className="text-navy/70 text-sm">Color</span>
                      <p className="font-medium text-navy capitalize">{item.color}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-navy mb-2">Description</h3>
                    <p className="text-navy/80 leading-relaxed">{item.description}</p>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-navy mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-pink/20 text-navy rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Owner Information */}
              <Card className="bg-white/50 backdrop-blur-sm border-white/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center">
                      {item.profiles?.avatar_url ? (
                        <img 
                          src={item.profiles.avatar_url} 
                          alt={item.profiles.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="text-white" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-navy">{item.profiles?.full_name}</p>
                      <div className="flex items-center text-sm text-navy/70">
                        <Calendar size={12} className="mr-1" />
                        Posted {new Date(item.created_at).toLocaleDateString()}
                        {item.profiles?.location && (
                          <>
                            <span className="mx-2">•</span>
                            <MapPin size={12} className="mr-1" />
                            {item.profiles.location}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {user && !isOwner && item.status === 'available' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Swap Button */}
                    {canSwap && (
                      <Button
                        onClick={() => setShowSwapModal(true)}
                        className="bg-navy hover:bg-navy/90 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <ArrowUpDown className="mr-2" size={16} />
                        Request Swap
                      </Button>
                    )}

                    {/* Buy Button */}
                    {canBuy && (
                      <Button
                        onClick={() => setShowBuyModal(true)}
                        className="bg-pink hover:bg-pink/90 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <ShoppingBag className="mr-2" size={16} />
                        Buy for ₹{item.price}
                      </Button>
                    )}
                  </div>

                  {/* Existing Request Notice */}
                  {(existingExchange || existingSwapRequest) && (
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center text-yellow-800">
                          <ArrowUpDown className="mr-2" size={16} />
                          <span className="font-medium">
                            Request {(existingExchange || existingSwapRequest)?.status}
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          You have already sent a request for this item.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Owner View */}
              {isOwner && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center text-blue-800">
                      <User className="mr-2" size={16} />
                      <span className="font-medium">This is your item</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Not Available */}
              {item.status !== 'available' && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-center text-gray-600">
                      <h3 className="font-medium mb-2">Item Not Available</h3>
                      <p className="text-sm">
                        This item is currently {item.status} and cannot be exchanged.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SwapRequestModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        targetItem={item}
      />
      
      <BuyModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        item={item}
      />
    </div>
  );
};

export default ItemDetail;
