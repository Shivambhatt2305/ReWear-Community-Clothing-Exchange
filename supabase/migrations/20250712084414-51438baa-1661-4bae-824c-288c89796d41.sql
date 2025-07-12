
-- Add the increment_views function to the database
CREATE OR REPLACE FUNCTION public.increment_views(item_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.items 
  SET views_count = views_count + 1 
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
