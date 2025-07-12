
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ArrowLeft, Truck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const DeliveryAddress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { swapData, buyData } = location.state || {};
  
  const [addressData, setAddressData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!addressData.fullName || !addressData.phone || !addressData.addressLine1 || !addressData.city || !addressData.state || !addressData.zipCode) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const fullAddress = `${addressData.fullName}\n${addressData.phone}\n${addressData.addressLine1}${addressData.addressLine2 ? '\n' + addressData.addressLine2 : ''}\n${addressData.city}, ${addressData.state} - ${addressData.zipCode}${addressData.landmark ? '\nLandmark: ' + addressData.landmark : ''}`;

    if (swapData) {
      // Navigate to payment page for swap with points difference
      navigate('/payment', {
        state: {
          type: 'swap',
          swapData: { ...swapData, deliveryAddress: fullAddress },
          amount: Math.abs(swapData.pointsDifference)
        }
      });
    } else if (buyData) {
      // Navigate to payment page for buy
      navigate('/payment', {
        state: {
          type: 'buy',
          buyData: { ...buyData, deliveryAddress: fullAddress },
          amount: buyData.price
        }
      });
    }
  };

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
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="mb-6 text-navy hover:text-pink"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Button>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-navy text-center flex items-center justify-center">
                  <MapPin className="mr-2 text-pink" size={32} />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={addressData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="border-navy/20 focus:border-pink"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={addressData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="border-navy/20 focus:border-pink"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      name="addressLine1"
                      value={addressData.addressLine1}
                      onChange={handleInputChange}
                      placeholder="House number, street name"
                      className="border-navy/20 focus:border-pink"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      name="addressLine2"
                      value={addressData.addressLine2}
                      onChange={handleInputChange}
                      placeholder="Apartment, suite, etc."
                      className="border-navy/20 focus:border-pink"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={addressData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="border-navy/20 focus:border-pink"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={addressData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className="border-navy/20 focus:border-pink"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={addressData.zipCode}
                        onChange={handleInputChange}
                        placeholder="ZIP Code"
                        className="border-navy/20 focus:border-pink"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="landmark">Landmark (Optional)</Label>
                    <Textarea
                      id="landmark"
                      name="landmark"
                      value={addressData.landmark}
                      onChange={handleInputChange}
                      placeholder="Any nearby landmark for easy delivery"
                      className="border-navy/20 focus:border-pink"
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="bg-navy/5 p-4 rounded-lg border border-navy/10">
                    <h3 className="font-semibold text-navy mb-2 flex items-center">
                      <Truck className="mr-2" size={16} />
                      Order Summary
                    </h3>
                    {swapData && (
                      <div className="space-y-1 text-sm">
                        <p><strong>Type:</strong> Swap Request</p>
                        <p><strong>Your Item:</strong> {swapData.offeredItem}</p>
                        <p><strong>Requested Item:</strong> {swapData.requestedItem}</p>
                        {swapData.pointsDifference !== 0 && (
                          <p><strong>Payment:</strong> ₹{Math.abs(swapData.pointsDifference)} {swapData.pointsDifference > 0 ? '(You pay)' : '(You receive)'}</p>
                        )}
                      </div>
                    )}
                    {buyData && (
                      <div className="space-y-1 text-sm">
                        <p><strong>Type:</strong> Direct Purchase</p>
                        <p><strong>Item:</strong> {buyData.itemTitle}</p>
                        <p><strong>Price:</strong> ₹{buyData.price}</p>
                      </div>
                    )}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-pink hover:bg-pink/90 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continue to Payment
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

export default DeliveryAddress;
