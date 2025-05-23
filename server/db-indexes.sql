-- Индексы для оптимизации производительности базы данных

-- Индексы для таблицы users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Индексы для таблицы services
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_custom ON services(is_custom);
CREATE INDEX IF NOT EXISTS idx_services_owner ON services(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_title ON services(title);

-- Индексы для таблицы subscriptions (самые важные для производительности)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_service ON subscriptions(service_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paid_until ON subscriptions(paid_until);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_service ON subscriptions(user_id, service_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry_check ON subscriptions(paid_until, status) WHERE status = 'active';

-- Индексы для таблицы cashback_transactions
CREATE INDEX IF NOT EXISTS idx_cashback_user ON cashback_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_created_at ON cashback_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cashback_user_date ON cashback_transactions(user_id, created_at);

-- Индексы для таблицы notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_subscription ON notification_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Индексы для таблицы notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_trigger ON notification_templates(trigger_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

-- Индексы для таблицы custom_fields
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_fields(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_name ON custom_fields(field_name);

-- Индексы для таблицы service_leads
CREATE INDEX IF NOT EXISTS idx_service_leads_service ON service_leads(service_id);
CREATE INDEX IF NOT EXISTS idx_service_leads_status ON service_leads(status);
CREATE INDEX IF NOT EXISTS idx_service_leads_created_at ON service_leads(created_at);

-- Составные индексы для сложных запросов
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status_expiry ON subscriptions(user_id, status, paid_until);
CREATE INDEX IF NOT EXISTS idx_services_custom_owner ON services(is_custom, owner_id, is_active);