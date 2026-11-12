-- Migration: 0001_subscription_billing (Rollback / Down)
DROP INDEX IF EXISTS idx_coupons_code;
DROP INDEX IF EXISTS idx_audit_org;
DROP INDEX IF EXISTS idx_payments_gateway_id;
DROP INDEX IF EXISTS idx_payments_order;
DROP INDEX IF EXISTS idx_payments_org;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_biz;
DROP INDEX IF EXISTS idx_subscriptions_org;
DROP INDEX IF EXISTS idx_plan_features_plan;

DROP TABLE IF EXISTS platform_settings;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS subscription_audit_logs;
DROP TABLE IF EXISTS payment_webhook_events;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plan_features;
DROP TABLE IF EXISTS plans;

