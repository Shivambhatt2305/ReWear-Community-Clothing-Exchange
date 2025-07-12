
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Upload, Star, DollarSign, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const addItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'activewear', 'formal']),
  size: z.enum(['xs', 's', 'm', 'l', 'xl', 'xxl', '2xs', '3xl', '4xl']),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'worn']),
  brand: z.string().optional(),
  color: z.string().optional(),
  tags: z.string().optional(),
  points_value: z.number().min(1, 'Points must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative'),
  delivery_type: z.enum(['swap', 'buy', 'both']),
});

type AddItemForm = z.infer<typeof addItemSchema>;

const AddItem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddItemForm>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      points_value: 10,
      price: 0,
      delivery_type: 'swap',
    },
  });

  const watchDeliveryType = watch('delivery_type');
  const watchPointsValue = watch('points_value');

  // Auto-calculate price based on points (10 points = ₹1)
  React.useEffect(() => {
    if (watchDeliveryType === 'buy' || watchDeliveryType === 'both') {
      setValue('price', Math.round(watchPointsValue * 0.1));
    }
  }, [watchPointsValue, watchDeliveryType, setValue]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files.slice(0, 5)); // Max 5 images
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath);

      imageUrls.push(data.publicUrl);
    }

    return imageUrls;
  };

  const addItemMutation = useMutation({
    mutationFn: async (data: AddItemForm) => {
      if (!user?.id) throw new Error('User not authenticated');

      setUploading(true);
      let imageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages(selectedFiles);
      }

      const tags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from('items')
        .insert({
          title: data.title,
          description: data.description || '',
          category: data.category,
          size: data.size,
          condition: data.condition,
          brand: data.brand || '',
          color: data.color || '',
          tags,
          points_value: data.points_value,
          price: data.price,
          delivery_type: data.delivery_type,
          image_urls: imageUrls,
          user_id: user.id,
          status: 'available',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Item added successfully! 🎉",
        description: "Your item is now available for exchange.",
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Add item error:', error);
      toast({
        title: "Failed to add item",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-navy text-center">
                  Add New Item
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((data) => addItemMutation.mutate(data))} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        {...register('title')}
                        placeholder="e.g., Vintage Denim Jacket"
                        className="border-navy/20 focus:border-pink"
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Describe your item..."
                        className="min-h-[100px] border-navy/20 focus:border-pink"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <select {...register('category')} className="w-full p-2 border border-navy/20 rounded-md focus:border-pink focus:ring-1 focus:ring-pink">
                          <option value="">Select category</option>
                          <option value="tops">Tops</option>
                          <option value="bottoms">Bottoms</option>
                          <option value="dresses">Dresses</option>
                          <option value="outerwear">Outerwear</option>
                          <option value="shoes">Shoes</option>
                          <option value="accessories">Accessories</option>
                          <option value="activewear">Activewear</option>
                          <option value="formal">Formal</option>
                        </select>
                        {errors.category && (
                          <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="size">Size *</Label>
                        <select {...register('size')} className="w-full p-2 border border-navy/20 rounded-md focus:border-pink focus:ring-1 focus:ring-pink">
                          <option value="">Select size</option>
                          <option value="2xs">2XS</option>
                          <option value="xs">XS</option>
                          <option value="s">S</option>
                          <option value="m">M</option>
                          <option value="l">L</option>
                          <option value="xl">XL</option>
                          <option value="xxl">2XL</option>
                          <option value="3xl">3XL</option>
                          <option value="4xl">4XL</option>
                        </select>
                        {errors.size && (
                          <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="condition">Condition *</Label>
                        <select {...register('condition')} className="w-full p-2 border border-navy/20 rounded-md focus:border-pink focus:ring-1 focus:ring-pink">
                          <option value="">Select condition</option>
                          <option value="new">New</option>
                          <option value="like_new">Like New</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="worn">Worn</option>
                        </select>
                        {errors.condition && (
                          <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          {...register('brand')}
                          placeholder="e.g., Zara, H&M"
                          className="border-navy/20 focus:border-pink"
                        />
                      </div>

                      <div>
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          {...register('color')}
                          placeholder="e.g., Blue, Red"
                          className="border-navy/20 focus:border-pink"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        {...register('tags')}
                        placeholder="e.g., vintage, summer, casual"
                        className="border-navy/20 focus:border-pink"
                      />
                    </div>
                  </div>

                  {/* Delivery Type */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Delivery Type *</Label>
                    <RadioGroup
                      value={watchDeliveryType}
                      onValueChange={(value) => setValue('delivery_type', value as any)}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2 p-4 rounded-lg border border-navy/20 hover:bg-pink/5 hover:border-pink transition-colors">
                        <RadioGroupItem value="swap" id="swap" />
                        <Label htmlFor="swap" className="flex items-center cursor-pointer">
                          <ArrowRightLeft className="mr-2 text-pink" size={16} />
                          Swap Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 rounded-lg border border-navy/20 hover:bg-green-50 hover:border-green-500 transition-colors">
                        <RadioGroupItem value="buy" id="buy" />
                        <Label htmlFor="buy" className="flex items-center cursor-pointer">
                          <DollarSign className="mr-2 text-green-600" size={16} />
                          Buy Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 rounded-lg border border-navy/20 hover:bg-purple-50 hover:border-purple-500 transition-colors">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both" className="flex items-center cursor-pointer">
                          <Star className="mr-2 text-purple-600" size={16} />
                          Both Options
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Points and Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="points_value" className="flex items-center">
                        <Star className="mr-1 text-yellow-500" size={16} />
                        Points Value *
                      </Label>
                      <Input
                        id="points_value"
                        type="number"
                        {...register('points_value', { valueAsNumber: true })}
                        min="1"
                        placeholder="10"
                        className="border-navy/20 focus:border-pink"
                      />
                      {errors.points_value && (
                        <p className="text-red-500 text-sm mt-1">{errors.points_value.message}</p>
                      )}
                    </div>

                    {(watchDeliveryType === 'buy' || watchDeliveryType === 'both') && (
                      <div>
                        <Label htmlFor="price" className="flex items-center">
                          <DollarSign className="mr-1 text-green-600" size={16} />
                          Price (₹)
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          {...register('price', { valueAsNumber: true })}
                          min="0"
                          placeholder="Auto-calculated from points"
                          className="border-navy/20 focus:border-pink"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-calculated: {watchPointsValue} points = ₹{Math.round(watchPointsValue * 0.1)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="images">Images (up to 5)</Label>
                    <div className="mt-2">
                      <input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Label
                        htmlFor="images"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-navy/30 rounded-lg cursor-pointer hover:border-pink hover:bg-pink/5 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-navy/60 mb-2" />
                          <p className="text-sm text-navy/80">
                            Click to upload images
                          </p>
                          <p className="text-xs text-navy/60">
                            PNG, JPG up to 10MB each
                          </p>
                        </div>
                      </Label>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-pink hover:bg-pink/90 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={addItemMutation.isPending || uploading}
                    >
                      {addItemMutation.isPending || uploading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Adding Item...
                        </div>
                      ) : (
                        'Add Item'
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AddItem;
