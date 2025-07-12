import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Package, ArrowUpDown, Star, Eye, Calendar, User, Check, X, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import FloatingClothes from '@/components/FloatingClothes';

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user's items
  const { data: userItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['user-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch incoming swap requests
  const { data: incomingSwapRequests, isLoading: swapRequestsLoading } = useQuery({
    queryKey: ['incoming-swap-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('swap_requests')
        .select(`
          *,
          item_requested:items!item_requested_id(title, image_urls, points_value),
          item_offered:items!item_offered_id(title, image_urls, points_value),
          from_user:profiles!from_user_id(full_name, username)
        `)
        .eq('to_user_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user's exchange history
  const { data: exchanges, isLoading: exchangesLoading } = useQuery({
    queryKey: ['user-exchanges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchanges')
        .select(`
          *,
          requested_item:items!requested_item_id(title, image_urls),
          offered_item:items!offered_item_id(title, image_urls)
        `)
        .or(`requester_id.eq.${user?.id},owner_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Handle swap request response
  const handleSwapRequestMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'accept' | 'reject' }) => {
      const { error } = await supabase
        .from('swap_requests')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      if (action === 'accept') {
        // Here you would also handle the actual swap logic
        // Update both items as swapped, handle points difference, etc.
      }
    },
    onSuccess: (_, { action }) => {
      toast({
        title: action === 'accept' ? "Swap request accepted! 🎉" : "Swap request rejected",
        description: action === 'accept' 
          ? "The swap has been initiated." 
          : "The user has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['incoming-swap-requests'] });
    },
    onError: (error) => {
      console.error('Swap request error:', error);
      toast({
        title: "Failed to update swap request",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'exchanged': return 'bg-gray-100 text-gray-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream relative">
      <FloatingClothes />
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-navy mb-1">
                  Welcome back, {profile?.full_name || 'User'}!
                </h1>
                <div className="flex items-center space-x-4 text-navy/70">
                  <span>Role: {profile?.role || 'user'}</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Star className="mr-1 text-yellow-500" size={16} />
                    {profile?.points || 0} points
                  </span>
                  <span>•</span>
                  <span>Member since {new Date(profile?.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-navy/70 flex items-center">
                    <Star className="mr-2" size={16} />
                    Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-navy">{profile?.points || 0}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-navy/70 flex items-center">
                    <Package className="mr-2" size={16} />
                    Your Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-navy">{userItems?.length || 0}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-navy/70 flex items-center">
                    <ArrowUpDown className="mr-2" size={16} />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-navy">
                    {incomingSwapRequests?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/add-item">
                <Button className="w-full h-20 bg-pink hover:bg-pink/90 text-white text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Plus className="mr-2" size={20} />
                  Add New Item
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Incoming Swap Requests */}
            {incomingSwapRequests && incomingSwapRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-navy">
                      <ArrowUpDown className="mr-2 text-pink" size={20} />
                      Incoming Swap Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {incomingSwapRequests.map((request, index) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="p-4 bg-white/50 rounded-lg border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-navy">
                              From: {request.from_user?.full_name}
                            </span>
                            <span className="text-xs text-navy/70">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-navy/70 mb-1">They want:</p>
                              <p className="font-medium text-navy">{request.item_requested?.title}</p>
                              <p className="text-xs text-navy/60">{request.item_requested?.points_value} points</p>
                            </div>
                            <div>
                              <p className="text-sm text-navy/70 mb-1">Offering:</p>
                              <p className="font-medium text-navy">{request.item_offered?.title}</p>
                              <p className="text-xs text-navy/60">{request.item_offered?.points_value} points</p>
                            </div>
                          </div>

                          {request.points_difference !== 0 && (
                            <div className="mb-4 p-2 bg-orange-50 rounded text-sm">
                              <span className="text-orange-700">
                                Points difference: {Math.abs(request.points_difference)} 
                                ({request.points_difference > 0 ? 'You receive' : 'You pay'} ₹{Math.abs(request.points_difference)})
                              </span>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleSwapRequestMutation.mutate({ requestId: request.id, action: 'accept' })}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={handleSwapRequestMutation.isPending}
                            >
                              <Check size={16} className="mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSwapRequestMutation.mutate({ requestId: request.id, action: 'reject' })}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              disabled={handleSwapRequestMutation.isPending}
                            >
                              <X size={16} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Your Items */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-navy">
                    <Package className="mr-2" size={20} />
                    Your Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {itemsLoading ? (
                      <LoadingSkeleton />
                    ) : userItems?.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-300"
                      >
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          {item.image_urls && item.image_urls.length > 0 && (
                            <img 
                              src={item.image_urls[0]} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-navy">{item.title}</h4>
                          <p className="text-sm text-navy/70">{item.category} • {item.size}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            <div className="flex items-center text-xs text-navy/70">
                              <Eye size={12} className="mr-1" />
                              {item.views_count}
                            </div>
                            {item.delivery_type && (
                              <Badge variant="outline" className="text-xs">
                                {item.delivery_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-navy flex items-center">
                            <Star className="mr-1 text-yellow-500" size={12} />
                            {item.points_value} pts
                          </div>
                          {(item.delivery_type === 'buy' || item.delivery_type === 'both') && (
                            <div className="text-sm font-medium text-pink flex items-center">
                              <ShoppingBag className="mr-1" size={12} />
                              ₹{item.price}
                            </div>
                          )}
                          <div className="text-xs text-navy/60">
                            <Calendar size={12} className="inline mr-1" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {(!userItems || userItems.length === 0) && !itemsLoading && (
                      <div className="text-center text-navy/70 py-8">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No items yet. Add your first item!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
