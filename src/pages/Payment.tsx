
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle, Coins, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { type, swapData, buyData, amount } = location.state || {};
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: ''
  });
  const [processing, setProcessing] = useState(false);

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    } else if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  // Process swap request mutation
  const processSwapMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !swapData) throw new Error('Missing data');

      // Create swap request with payment processed
      const { error: swapError } = await supabase
        .from('swap_requests')
        .insert({
          item_requested_id: swapData.requestedItemId,
          item_offered_id: swapData.offeredItemId,
          from_user_id: user.id,
          to_user_id: swapData.toUserId,
          points_difference: swapData.pointsDifference,
          status: 'accepted' // Direct acceptance since payment is processed
        });

      if (swapError) throw swapError;

      // Update item statuses
      const { error: itemError1 } = await supabase
        .from('items')
        .update({ status: 'exchanged' })
        .eq('id', swapData.requestedItemId);

      if (itemError1) throw itemError1;

      const { error: itemError2 } = await supabase
        .from('items')
        .update({ status: 'exchanged' })
        .eq('id', swapData.offeredItemId);

      if (itemError2) throw itemError2;

      // Adjust user points if there's a difference
      if (swapData.pointsDifference !== 0) {
        const pointsAdjustment = swapData.pointsDifference > 0 
          ? -Math.abs(swapData.pointsDifference)
          : Math.abs(swapData.pointsDifference);

        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .single();

        if (currentProfile) {
          const newPoints = currentProfile.points + pointsAdjustment;
          const { error: pointsError } = await supabase
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', user.id);

          if (pointsError) throw pointsError;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Swap completed successfully! 🎉",
        description: "Items have been exchanged and delivery will be arranged.",
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Swap processing error:', error);
      toast({
        title: "Payment failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Process buy order mutation
  const processBuyMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !buyData) throw new Error('Missing data');

      // Create buy order
      const { error: buyError } = await supabase
        .from('buy_orders')
        .insert({
          item_id: buyData.itemId,
          buyer_id: user.id,
          seller_id: buyData.sellerId,
          price: buyData.price,
          delivery_address: buyData.deliveryAddress,
          status: 'confirmed'
        });

      if (buyError) throw buyError;

      // Update item status
      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'exchanged' })
        .eq('id', buyData.itemId);

      if (itemError) throw itemError;
    },
    onSuccess: () => {
      toast({
        title: "Purchase completed successfully! 🎉",
        description: "Your order has been confirmed and delivery will be arranged.",
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Buy processing error:', error);
      toast({
        title: "Payment failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      if (type === 'swap') {
        await processSwapMutation.mutateAsync();
      } else if (type === 'buy') {
        await processBuyMutation.mutateAsync();
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!type || (!swapData && !buyData)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-navy">Invalid payment session. Please try again.</p>
            <Button onClick={() => navigate('/items')} className="mt-4 bg-pink hover:bg-pink/90">
              Browse Items
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="mb-6 text-navy hover:text-pink"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Form */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-navy flex items-center">
                    <CreditCard className="mr-2 text-pink" size={28} />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-6">
                    {/* Payment Method Selection */}
                    <div>
                      <Label className="text-lg font-semibold mb-4 block">Payment Method</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-navy/20 hover:bg-pink/5">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center cursor-pointer">
                            <CreditCard className="mr-2" size={16} />
                            Credit/Debit Card
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-navy/20 hover:bg-blue-50">
                          <RadioGroupItem value="upi" id="upi" />
                          <Label htmlFor="upi" className="flex items-center cursor-pointer">
                            <Coins className="mr-2" size={16} />
                            UPI
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Card Details */}
                    {paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="holderName">Cardholder Name *</Label>
                          <Input
                            id="holderName"
                            name="holderName"
                            value={cardData.holderName}
                            onChange={handleCardInputChange}
                            placeholder="Enter cardholder name"
                            className="border-navy/20 focus:border-pink"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardNumber">Card Number *</Label>
                          <Input
                            id="cardNumber"
                            name="cardNumber"
                            value={cardData.cardNumber}
                            onChange={handleCardInputChange}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="border-navy/20 focus:border-pink"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate">Expiry Date *</Label>
                            <Input
                              id="expiryDate"
                              name="expiryDate"
                              value={cardData.expiryDate}
                              onChange={handleCardInputChange}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="border-navy/20 focus:border-pink"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV *</Label>
                            <Input
                              id="cvv"
                              name="cvv"
                              value={cardData.cvv}
                              onChange={handleCardInputChange}
                              placeholder="123"
                              maxLength={3}
                              className="border-navy/20 focus:border-pink"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI Details */}
                    {paymentMethod === 'upi' && (
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <p className="text-navy/80 mb-4">Scan the QR code or use UPI ID:</p>
                        <div className="w-32 h-32 bg-white mx-auto mb-4 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-gray-500">QR Code</p>
                        </div>
                        <p className="font-mono text-sm">rewear@paytm</p>
                      </div>
                    )}

                    {/* Security Notice */}
                    <div className="flex items-center text-sm text-navy/70 bg-green-50 p-3 rounded-lg">
                      <ShieldCheck className="mr-2 text-green-600" size={16} />
                      Your payment information is secure and encrypted
                    </div>

                    {/* Submit Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-pink hover:bg-pink/90 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {processing ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing Payment...
                          </div>
                        ) : (
                          `Pay ₹${amount}`
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-navy flex items-center">
                    <CheckCircle className="mr-2 text-green-600" size={28} />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {type === 'swap' && swapData && (
                      <>
                        <div className="p-4 bg-pink/5 rounded-lg border border-pink/20">
                          <h3 className="font-semibold text-navy mb-2">Swap Details</h3>
                          <div className="space-y-2 text-sm">
                            <p><strong>Your Item:</strong> {swapData.offeredItem}</p>
                            <p><strong>Requested Item:</strong> {swapData.requestedItem}</p>
                            <p><strong>Points Difference:</strong> {swapData.pointsDifference === 0 ? 'Perfect Match!' : `${Math.abs(swapData.pointsDifference)} points`}</p>
                          </div>
                        </div>
                        
                        {swapData.pointsDifference !== 0 && (
                          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <h3 className="font-semibold text-orange-800 mb-2">
                              {swapData.pointsDifference > 0 ? 'Payment Required' : 'You Will Receive'}
                            </h3>
                            <p className="text-orange-700">
                              ₹{Math.abs(swapData.pointsDifference)} 
                              {swapData.pointsDifference > 0 ? ' (due to points difference)' : ' (refund due to points difference)'}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {type === 'buy' && buyData && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800 mb-2">Purchase Details</h3>
                        <div className="space-y-2 text-sm">
                          <p><strong>Item:</strong> {buyData.itemTitle}</p>
                          <p><strong>Price:</strong> ₹{buyData.price}</p>
                          <p><strong>Seller:</strong> {buyData.sellerName}</p>
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold text-navy">
                        <span>Total Amount:</span>
                        <span className="text-pink">₹{amount}</span>
                      </div>
                    </div>

                    <div className="text-xs text-navy/60 bg-navy/5 p-3 rounded">
                      <p>• Items will be shipped within 2-3 business days</p>
                      <p>• Free delivery for orders above ₹500</p>
                      <p>• 7-day return policy applicable</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
