
-- Update items table to add points, price, and delivery_type columns
ALTER TABLE items
ADD COLUMN points INTEGER DEFAULT 10,
ADD COLUMN price INTEGER DEFAULT 0,
ADD COLUMN delivery_type TEXT DEFAULT 'swap' CHECK (delivery_type IN ('swap', 'buy', 'both'));

-- Create swap_requests table for advanced swap matching
CREATE TABLE swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_requested_id UUID REFERENCES items(id) ON DELETE CASCADE,
  item_offered_id UUID REFERENCES items(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  points_difference INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create buy_orders table for direct purchases
CREATE TABLE buy_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  delivery_address TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for swap_requests
CREATE POLICY "Users can view their swap requests" ON swap_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create swap requests" ON swap_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their swap requests" ON swap_requests
  FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- RLS policies for buy_orders
CREATE POLICY "Users can view their buy orders" ON buy_orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create buy orders" ON buy_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their buy orders" ON buy_orders
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Admin policies for both tables
CREATE POLICY "Admins can manage swap requests" ON swap_requests
  FOR ALL USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can manage buy orders" ON buy_orders
  FOR ALL USING (get_current_user_role() = 'admin'::user_role);

-- Add triggers for updated_at columns
CREATE TRIGGER update_swap_requests_updated_at
  BEFORE UPDATE ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buy_orders_updated_at
  BEFORE UPDATE ON buy_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
