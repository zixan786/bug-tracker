-- Multi-Tenant SaaS Database Schema
-- Run this after your existing schema

-- Organizations (Tenants) table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- for subdomain/URL
    domain VARCHAR(255), -- custom domain support
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}', -- {"max_users": 10, "max_projects": 5, "max_bugs": 100}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization members (replaces simple user roles)
CREATE TABLE IF NOT EXISTS organization_members (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_by INTEGER REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    UNIQUE(organization_id, user_id)
);

-- Usage tracking for billing
CREATE TABLE IF NOT EXISTS usage_tracking (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL, -- 'active_users', 'bugs_created', 'storage_used'
    metric_value INTEGER DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing events
CREATE TABLE IF NOT EXISTS billing_events (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'subscription_created', 'payment_succeeded', 'payment_failed'
    stripe_event_id VARCHAR(255),
    data JSONB,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add organization_id to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE bug_history ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_bugs_organization_id ON bugs(organization_id);
CREATE INDEX IF NOT EXISTS idx_comments_organization_id ON comments(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_id ON usage_tracking(organization_id);

-- Insert default plans
INSERT INTO plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
('Starter', 'starter', 'Perfect for small teams', 29.00, 290.00, 
 '{"basic_support": true, "email_notifications": true}',
 '{"max_users": 5, "max_projects": 3, "max_bugs": 100, "storage_mb": 1000}'),
('Professional', 'professional', 'For growing teams', 99.00, 990.00,
 '{"priority_support": true, "email_notifications": true, "slack_integration": true, "custom_fields": true}',
 '{"max_users": 25, "max_projects": 10, "max_bugs": 1000, "storage_mb": 10000}'),
('Enterprise', 'enterprise', 'For large organizations', 299.00, 2990.00,
 '{"dedicated_support": true, "email_notifications": true, "slack_integration": true, "custom_fields": true, "api_access": true, "sso": true}',
 '{"max_users": -1, "max_projects": -1, "max_bugs": -1, "storage_mb": -1}');

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - customize based on your auth system)
-- Users can only see organizations they're members of
CREATE POLICY "Users can see their organizations" ON organizations FOR SELECT 
USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = current_user_id()));

-- Users can only see data from their organizations
CREATE POLICY "Users can see organization projects" ON projects FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = current_user_id()));

CREATE POLICY "Users can see organization bugs" ON bugs FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = current_user_id()));

-- Note: You'll need to implement current_user_id() function based on your auth system
-- For now, you can disable RLS during development:
-- ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE bugs DISABLE ROW LEVEL SECURITY;

-- Create function to get current user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_id INTEGER)
RETURNS TABLE(organization_id INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = $1 AND om.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user belongs to organization
CREATE OR REPLACE FUNCTION user_belongs_to_organization(user_id INTEGER, org_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM organization_members 
        WHERE user_id = $1 AND organization_id = $2 AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
