
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Heart, Eye, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/integrations/supabase/types';

type ItemCategory = Database['public']['Enums']['item_category'];
type ItemSize = Database['public']['Enums']['item_size'];
type ItemCondition = Database['public']['Enums']['item_condition'];

const Items = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | ''>('');
  const [sizeFilter, setSizeFilter] = useState<ItemSize | ''>('');
  const [conditionFilter, setConditionFilter] = useState<ItemCondition | ''>('');

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', searchTerm, categoryFilter, sizeFilter, conditionFilter],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select(`
          *,
          profiles!items_user_id_fkey(full_name, username)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
      }

      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      if (sizeFilter) {
        query = query.eq('size', sizeFilter);
      }

      if (conditionFilter) {
        query = query.eq('condition', conditionFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const categories: ItemCategory[] = [
    'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 
    'accessories', 'activewear', 'formal'
  ];

  const sizes: ItemSize[] = ['2xs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'];
  const conditions: ItemCondition[] = ['new', 'like_new', 'good', 'fair', 'worn'];

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSizeFilter('');
    setConditionFilter('');
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );

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
            <h1 className="text-4xl font-bold text-navy mb-2">Browse Items</h1>
            <p className="text-lg text-navy/70">
              Discover amazing clothing items available for exchange
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy/50" size={20} />
                      <Input
                        placeholder="Search items, brands, or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ItemCategory | '')}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sizeFilter} onValueChange={(value) => setSizeFilter(value as ItemSize | '')}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex space-x-2">
                    <Select value={conditionFilter} onValueChange={(value) => setConditionFilter(value as ItemCondition | '')}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition.replace('_', ' ').charAt(0).toUpperCase() + 
                             condition.replace('_', ' ').slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="whitespace-nowrap h-11 px-4"
                    >
                      <Filter size={16} className="mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results count */}
          {!isLoading && items && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <p className="text-navy/70">
                Found {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            </motion.div>
          )}

          {/* Items Grid */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items?.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group"
                >
                  <Link to={`/item/${item.id}`}>
                    <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                      <div className="aspect-square overflow-hidden relative">
                        {item.image_urls && item.image_urls.length > 0 ? (
                          <img
                            src={item.image_urls[0]}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-lg">No Image</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-navy shadow-lg">
                          {item.points_value} pts
                        </div>
                        {item.is_featured && (
                          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 rounded-full px-2 py-1 text-xs font-bold shadow-lg">
                            <Star size={12} className="inline mr-1" />
                            Featured
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-navy mb-2 truncate text-lg group-hover:text-pink transition-colors">
                          {item.title}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-navy/70">
                              {item.category} • {item.size?.toUpperCase()}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {item.condition?.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {item.brand && (
                            <p className="text-sm font-medium text-navy/80">
                              {item.brand}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-navy/60">
                            <span>by {item.profiles?.full_name}</span>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center">
                                <Eye size={12} className="mr-1" />
                                {item.views_count}
                              </div>
                              <div className="flex items-center">
                                <Heart size={12} className="mr-1" />
                                {item.likes_count}
                              </div>
                            </div>
                          </div>
                          
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-pink/20 text-navy text-xs rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {item.tags.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-navy/60 text-xs rounded-full">
                                  +{item.tags.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {items && items.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={48} className="text-navy/30" />
                </div>
                <h3 className="text-2xl font-bold text-navy mb-4">No items found</h3>
                <p className="text-navy/70 mb-6">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button onClick={clearFilters} variant="outline" className="mx-auto">
                  Clear all filters
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Items;
