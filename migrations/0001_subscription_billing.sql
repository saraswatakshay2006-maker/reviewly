-- Migration: 0001_subscription_billing (Up)
-- Normalized Cloudflare D1 / SQLite schema for Reviewly Subscription, Entitlement & Billing Engine.
-- Note: Safe & additive; leaves reviewly_store untouched for zero-downtime operation.

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  badge TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  monthly_price_inr INTEGER NOT NULL DEFAULT 0,
  annual_price_inr INTEGER,
  custom_price INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  billing_interval_options TEXT NOT NULL DEFAULT '["monthly","annual"]',
  max_locations INTEGER NOT NULL DEFAULT 1,
  max_team_members INTEGER NOT NULL DEFAULT 1,
  max_cards INTEGER NOT NULL DEFAULT 10,
  support_tier TEXT NOT NULL DEFAULT 'Basic support',
  trial_days INTEGER NOT NULL DEFAULT 14,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_popular INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  highlights_json TEXT NOT NULL DEFAULT '[]',
  razorpay_monthly_plan_id TEXT,
  razorpay_annual_plan_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_features (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'active',
  configuration_json TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  UNIQUE (plan_id, feature_key)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  business_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'NONE',
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  amount_inr INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  start_at TEXT NOT NULL,
  current_period_start TEXT NOT NULL,
  current_period_end TEXT,
  cancelled_at TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  trial_start TEXT,
  trial_end TEXT,
  gateway_subscription_id TEXT,
  custom_overrides_json TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  business_id TEXT,
  subscription_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  billing_interval TEXT NOT NULL,
  coupon_code TEXT,
  discount_amount_inr INTEGER NOT NULL DEFAULT 0,
  tax_amount_inr INTEGER NOT NULL DEFAULT 0,
  amount_inr INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  gateway TEXT NOT NULL,
  gateway_payment_id TEXT,
  gateway_order_id TEXT,
  status TEXT NOT NULL,
  payment_method TEXT,
  invoice_number TEXT,
  failure_reason TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL,
  payload_summary TEXT NOT NULL DEFAULT '',
  received_at TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  UNIQUE (provider, external_event_id)
);

CREATE TABLE IF NOT EXISTS subscription_audit_logs (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  business_id TEXT,
  admin_id TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  previous_values_json TEXT,
  new_values_json TEXT,
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  eligible_plans_json TEXT NOT NULL DEFAULT '[]',
  max_redemptions INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY,
  grace_period_days INTEGER NOT NULL DEFAULT 0,
  reminder_days_json TEXT NOT NULL DEFAULT '[7,3,1]',
  annual_billing_enabled INTEGER NOT NULL DEFAULT 1,
  tax_rate_percent REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions (organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_biz ON subscriptions (business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments (organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_id ON payments (gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON subscription_audit_logs (organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);

