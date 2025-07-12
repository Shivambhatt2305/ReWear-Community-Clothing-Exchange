
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Users, Package, ArrowUpDown, Search, Calendar, Mail, AlertTriangle, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type ItemStatus = Database['public']['Enums']['item_status'];
const Admin = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch admin stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [usersResult, itemsResult, exchangesResult, approvedTodayResult, rejectedTodayResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('items').select('id', { count: 'exact', head: true }),
        supabase.from('exchanges').select('id', { count: 'exact', head: true }),
        supabase.from('items').select('id', { count: 'exact', head: true })
          .eq('status', 'available')
          .gte('updated_at', today),
        supabase.from('items').select('id', { count: 'exact', head: true })
          .eq('status', 'unavailable')
          .gte('updated_at', today)
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalItems: itemsResult.count || 0,
        totalExchanges: exchangesResult.count || 0,
        approvedToday: approvedTodayResult.count || 0,
        rejectedToday: rejectedTodayResult.count || 0,
      };
    },
    enabled: isAdmin,
  });

  // Fetch pending items
  const { data: pendingItems } = useQuery({
    queryKey: ['admin-pending-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles!items_user_id_fkey(full_name, username, email)
        `)
        .eq('status', 'unavailable')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch all items for management
  const { data: allItems } = useQuery({
    queryKey: ['admin-all-items', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select(`
          *,
          profiles!items_user_id_fkey(full_name, username, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,profiles.email.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && activeTab === 'all-items',
  });

  // Fetch users for user management
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin && activeTab === 'users',
  });

  // Update item status mutation
  const updateItemStatus = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: ItemStatus }) => {
      const { error } = await supabase
        .from('items')
        .update({ status })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Item updated",
        description: `Item has been ${status === 'available' ? 'approved' : 'rejected'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-items'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-items'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    },
  });

  // Toggle user role mutation
  const toggleUserRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'user' | 'admin' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { newRole }) => {
      toast({
        title: "User role updated",
        description: `User has been ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'exchanged': return 'bg-gray-100 text-gray-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const detectSpamWords = (text: string) => {
    const spamWords = ['xxx', 'free', 'scam', 'urgent', 'click here', 'limited time'];
    return spamWords.some(word => text.toLowerCase().includes(word));
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="text-navy" size={32} />
              <h1 className="text-4xl font-bold text-navy">Admin Dashboard</h1>
            </div>
            <p className="text-lg text-navy/70">
              Manage items, users, and platform operations
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-navy/70 flex items-center">
                    <Users className="mr-2" size={16} />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-navy">{stats?.totalUsers || 0}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-navy/70 flex items-center">
                    <Package className="mr-2" size={16} />
                    Total Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-navy">{stats?.totalItems || 0}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-navy/70 flex items-center">
                    <ArrowUpDown className="mr-2" size={16} />
                    Total Exchanges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-navy">{stats?.totalExchanges || 0}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-green-50 border-green-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                    <Check className="mr-2" size={16} />
                    Approved Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">{stats?.approvedToday || 0}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-red-50 border-red-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 flex items-center">
                    <X className="mr-2" size={16} />
                    Rejected Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-800">{stats?.rejectedToday || 0}</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'pending', label: 'Pending Items', count: pendingItems?.length || 0 },
                  { id: 'all-items', label: 'All Items', count: null },
                  { id: 'users', label: 'User Management', count: null },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-pink text-pink'
                        : 'border-transparent text-navy/70 hover:text-navy hover:border-gray-300'
                    }`}
                  >
                    {tab.label} {tab.count !== null && `(${tab.count})`}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'pending' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-navy flex items-center">
                    <AlertTriangle className="mr-2 text-yellow-500" size={20} />
                    Pending Items Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingItems?.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-200 ${
                          detectSpamWords(`${item.title} ${item.description || ''}`)
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                      >
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image_urls && item.image_urls.length > 0 && (
                            <img 
                              src={item.image_urls[0]} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-navy text-lg">{item.title}</h4>
                            {detectSpamWords(`${item.title} ${item.description || ''}`) && (
                              <Badge variant="destructive" className="ml-2">
                                <AlertTriangle size={12} className="mr-1" />
                                Potential Spam
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-navy/70">Category:</span>
                              <p className="font-medium text-navy capitalize">{item.category}</p>
                            </div>
                            <div>
                              <span className="text-navy/70">Size:</span>
                              <p className="font-medium text-navy uppercase">{item.size}</p>
                            </div>
                            <div>
                              <span className="text-navy/70">Condition:</span>
                              <p className="font-medium text-navy capitalize">{item.condition?.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <span className="text-navy/70">Points:</span>
                              <p className="font-medium text-navy">{item.points_value}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-navy/70">
                            <div className="flex items-center">
                              <Mail size={12} className="mr-1" />
                              {item.profiles?.email}
                            </div>
                            <div className="flex items-center">
                              <Calendar size={12} className="mr-1" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-navy/70 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => updateItemStatus.mutate({ itemId: item.id, status: 'available' })}
                            disabled={updateItemStatus.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateItemStatus.mutate({ itemId: item.id, status: 'unavailable' })}
                            disabled={updateItemStatus.isPending}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    {(!pendingItems || pendingItems.length === 0) && (
                      <div className="text-center text-navy/70 py-12">
                        <Check size={64} className="mx-auto mb-4 text-green-500" />
                        <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                        <p>No pending items to review</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'all-items' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Search */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy/50" size={20} />
                    <Input
                      placeholder="Search by title, uploader email, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-navy">All Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allItems?.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                          <p className="text-sm text-navy/70">
                            {item.category} • {item.size} • {item.condition?.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-navy/70">
                            by {item.profiles?.full_name} ({item.profiles?.email})
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            <div className="flex items-center text-xs text-navy/70">
                              <Eye size={12} className="mr-1" />
                              {item.views_count}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-navy">{item.points_value} pts</div>
                          <div className="text-xs text-navy/60">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!allItems || allItems.length === 0) && (
                      <p className="text-center text-navy/70 py-8">No items found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-navy flex items-center">
                    <Users className="mr-2" size={20} />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {users?.map((userProfile) => (
                      <div key={userProfile.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-colors">
                        <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                          {userProfile.avatar_url ? (
                            <img 
                              src={userProfile.avatar_url} 
                              alt={userProfile.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="text-white" size={20} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-navy">{userProfile.full_name}</h4>
                          <p className="text-sm text-navy/70">
                            {userProfile.email} • @{userProfile.username}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-navy/60">
                            <span>{userProfile.points} points</span>
                            <span>Joined {new Date(userProfile.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Badge className={userProfile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                            {userProfile.role}
                          </Badge>
                          {userProfile.id !== user?.id && (
                            <Button
                              size="sm"
                              variant={userProfile.role === 'admin' ? 'destructive' : 'default'}
                              onClick={() => toggleUserRole.mutate({ 
                                userId: userProfile.id, 
                                newRole: userProfile.role === 'admin' ? 'user' : 'admin' 
                              })}
                              disabled={toggleUserRole.isPending}
                            >
                              {userProfile.role === 'admin' ? 'Demote' : 'Promote'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
