
-- Insert the admin user profile (this will be created automatically when the user signs up)
-- But we need to update their role to admin after they exist
-- First, let's create a function to promote a user to admin by email
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE email = user_email;
  
  -- If no rows were updated, it means the user doesn't exist yet
  IF NOT FOUND THEN
    RAISE NOTICE 'User with email % not found. They need to sign up first.', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- We'll run this after the user signs up, but let's prepare it
-- The user anshraythatha123@gmail.com will need to sign up first, then we can promote them
