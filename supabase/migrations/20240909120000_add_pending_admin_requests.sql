-- Create pending_admin_requests table
CREATE TABLE IF NOT EXISTS pending_admin_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  request_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) NULL,
  approved_at TIMESTAMPTZ NULL
);

-- Add index on user_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_pending_admin_requests_user_id ON pending_admin_requests(user_id);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_pending_admin_requests_status ON pending_admin_requests(status);

-- Enable RLS
ALTER TABLE pending_admin_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view pending requests
CREATE POLICY "Admins can view pending admin requests" ON pending_admin_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Policy: Only admins can update (approve/reject) requests
CREATE POLICY "Admins can update pending admin requests" ON pending_admin_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Policy: Users can insert their own requests
CREATE POLICY "Users can insert their own admin requests" ON pending_admin_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own admin requests" ON pending_admin_requests
  FOR SELECT USING (auth.uid() = user_id);
