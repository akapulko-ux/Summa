-- Добавляем новые поля в таблицу services для хранения данных иконок
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon_data TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon_mime_type TEXT;

-- Создаем индекс для более быстрого поиска сервисов без иконок в базе данных
CREATE INDEX IF NOT EXISTS idx_services_icon_url ON services(icon_url) WHERE icon_url IS NOT NULL;