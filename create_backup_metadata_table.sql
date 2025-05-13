-- Проверяем наличие таблицы backup_metadata
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'backup_metadata') THEN
    -- Создаем enum для типов резервных копий, если его нет
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_type') THEN
      CREATE TYPE backup_type AS ENUM ('manual', 'auto', 'pre-restore', 'imported', 'unknown');
    END IF;

    -- Создаем enum для форматов резервных копий, если его нет
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_format') THEN
      CREATE TYPE backup_format AS ENUM ('plain', 'custom', 'directory', 'tar', 'compressed', 'unknown');
    END IF;

    -- Создаем таблицу backup_metadata
    CREATE TABLE backup_metadata (
      id SERIAL PRIMARY KEY,
      file_name TEXT NOT NULL UNIQUE,
      size INTEGER NOT NULL,
      type backup_type DEFAULT 'unknown',
      format backup_format DEFAULT 'unknown',
      schemas JSONB DEFAULT '[]',
      tables JSONB DEFAULT '[]',
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      created_by INTEGER REFERENCES users(id)
    );
    
    RAISE NOTICE 'Таблица backup_metadata успешно создана';
  ELSE
    RAISE NOTICE 'Таблица backup_metadata уже существует';
  END IF;
END $$;