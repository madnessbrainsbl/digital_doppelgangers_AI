/*
  # Data Tables Integration for Digital Twins

  1. New Tables
    - `data_tables` - таблицы с данными для двойников
      - `id` (uuid, primary key)
      - `user_id` (text) - ID пользователя
      - `name` (text) - название таблицы
      - `description` (text) - описание таблицы
      - `table_schema` (jsonb) - схема таблицы (колонки и типы)
      - `sample_data` (jsonb) - пример данных для понимания структуры
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `twin_data_table_connections` - связи между двойниками и таблицами
      - `id` (uuid, primary key)
      - `twin_id` (uuid) - ID двойника
      - `table_id` (uuid) - ID таблицы данных
      - `access_level` (text) - уровень доступа (read, write, full)
      - `description` (text) - описание связи
      - `is_active` (boolean) - активна ли связь
      - `created_at` (timestamptz)

    - `data_table_queries` - история запросов к таблицам
      - `id` (uuid, primary key)
      - `twin_id` (uuid) - ID двойника
      - `table_id` (uuid) - ID таблицы
      - `query_type` (text) - тип запроса (select, insert, update, delete)
      - `query_text` (text) - текст запроса
      - `result_count` (integer) - количество результатов
      - `execution_time` (numeric) - время выполнения в секундах
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control

  3. Functions
    - Function to execute safe queries on data tables
    - Function to validate table schema
*/

-- Data Tables Table
CREATE TABLE IF NOT EXISTS data_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text,
  table_schema jsonb NOT NULL DEFAULT '[]',
  sample_data jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE data_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own data tables"
  ON data_tables
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Anonymous users can manage demo data tables"
  ON data_tables
  FOR ALL
  TO anon
  USING (user_id LIKE 'anonymous_%')
  WITH CHECK (user_id LIKE 'anonymous_%');

-- Twin Data Table Connections Table
CREATE TABLE IF NOT EXISTS twin_data_table_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id uuid NOT NULL REFERENCES digital_twins(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'full')),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(twin_id, table_id)
);

ALTER TABLE twin_data_table_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage connections for their twins and tables"
  ON twin_data_table_connections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = twin_data_table_connections.twin_id 
      AND digital_twins.user_id = auth.uid()::text
    )
    AND
    EXISTS (
      SELECT 1 FROM data_tables 
      WHERE data_tables.id = twin_data_table_connections.table_id 
      AND data_tables.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = twin_data_table_connections.twin_id 
      AND digital_twins.user_id = auth.uid()::text
    )
    AND
    EXISTS (
      SELECT 1 FROM data_tables 
      WHERE data_tables.id = twin_data_table_connections.table_id 
      AND data_tables.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Anonymous users can manage demo connections"
  ON twin_data_table_connections
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = twin_data_table_connections.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
    AND
    EXISTS (
      SELECT 1 FROM data_tables 
      WHERE data_tables.id = twin_data_table_connections.table_id 
      AND data_tables.user_id LIKE 'anonymous_%'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = twin_data_table_connections.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
    AND
    EXISTS (
      SELECT 1 FROM data_tables 
      WHERE data_tables.id = twin_data_table_connections.table_id 
      AND data_tables.user_id LIKE 'anonymous_%'
    )
  );

-- Data Table Queries Table
CREATE TABLE IF NOT EXISTS data_table_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id uuid NOT NULL REFERENCES digital_twins(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
  query_type text NOT NULL CHECK (query_type IN ('select', 'insert', 'update', 'delete')),
  query_text text NOT NULL,
  result_count integer,
  execution_time numeric(10,4),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE data_table_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view queries for their twins and tables"
  ON data_table_queries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = data_table_queries.twin_id 
      AND digital_twins.user_id = auth.uid()::text
    )
    AND
    EXISTS (
      SELECT 1 FROM data_tables 
      WHERE data_tables.id = data_table_queries.table_id 
      AND data_tables.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = data_table_queries.twin_id 
      AND digital_twins.user_id = auth.uid()::text
    )
    AND
    EXISTS (
      SELECT 1 FROM data_tables 
      WHERE data_tables.id = data_table_queries.table_id 
      AND data_tables.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Anonymous users can view demo queries"
  ON data_table_queries
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = data_table_queries.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
    AND
    EXISTS (
      SELECT 1 FROM data_tables 
      WHERE data_tables.id = data_table_queries.table_id 
      AND data_tables.user_id LIKE 'anonymous_%'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = data_table_queries.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
    AND
    EXISTS (
      SELECT 1 FROM data_tables 
      WHERE data_tables.id = data_table_queries.table_id 
      AND data_tables.user_id LIKE 'anonymous_%'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_tables_user_id ON data_tables(user_id);
CREATE INDEX IF NOT EXISTS idx_twin_data_table_connections_twin_id ON twin_data_table_connections(twin_id);
CREATE INDEX IF NOT EXISTS idx_twin_data_table_connections_table_id ON twin_data_table_connections(table_id);
CREATE INDEX IF NOT EXISTS idx_twin_data_table_connections_active ON twin_data_table_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_data_table_queries_twin_id ON data_table_queries(twin_id);
CREATE INDEX IF NOT EXISTS idx_data_table_queries_table_id ON data_table_queries(table_id);
CREATE INDEX IF NOT EXISTS idx_data_table_queries_created_at ON data_table_queries(created_at);

-- Update trigger for data_tables
CREATE TRIGGER update_data_tables_updated_at 
  BEFORE UPDATE ON data_tables 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate table schema
CREATE OR REPLACE FUNCTION validate_table_schema(schema_data jsonb)
RETURNS boolean AS $$
DECLARE
  column_record record;
BEGIN
  -- Check if schema is an array
  IF jsonb_typeof(schema_data) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Validate each column
  FOR column_record IN SELECT * FROM jsonb_array_elements(schema_data)
  LOOP
    -- Check required fields
    IF NOT (column_record.value ? 'name' AND column_record.value ? 'type') THEN
      RETURN false;
    END IF;
    
    -- Check if type is valid
    IF NOT (column_record.value->>'type' IN ('text', 'integer', 'numeric', 'boolean', 'date', 'timestamp')) THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute safe queries on data tables
CREATE OR REPLACE FUNCTION execute_data_table_query(
  p_table_id uuid,
  p_query_type text,
  p_query_data jsonb
)
RETURNS jsonb AS $$
DECLARE
  table_record record;
  result_data jsonb;
  start_time timestamptz;
  end_time timestamptz;
BEGIN
  -- Get table information
  SELECT * INTO table_record FROM data_tables WHERE id = p_table_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table not found';
  END IF;
  
  -- Check user access
  IF table_record.user_id != auth.uid()::text AND table_record.user_id NOT LIKE 'anonymous_%' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  start_time := clock_timestamp();
  
  -- Execute query based on type
  CASE p_query_type
    WHEN 'select' THEN
      -- For select, we'll return sample data or filtered data
      IF p_query_data ? 'filters' THEN
        -- Apply filters to sample data (simplified implementation)
        result_data := jsonb_path_query_array(
          table_record.sample_data, 
          '$[*] ? (@.name like_regex $pattern)', 
          p_query_data->'filters'
        );
      ELSE
        result_data := table_record.sample_data;
      END IF;
      
    WHEN 'insert' THEN
      -- For insert, validate data against schema and add to sample data
      -- This is a simplified implementation - in real scenario you'd have actual tables
      result_data := jsonb_build_object(
        'success', true,
        'inserted_count', 1,
        'message', 'Data would be inserted (demo mode)'
      );
      
    WHEN 'update' THEN
      -- For update, validate and return success
      result_data := jsonb_build_object(
        'success', true,
        'updated_count', 1,
        'message', 'Data would be updated (demo mode)'
      );
      
    WHEN 'delete' THEN
      -- For delete, return success
      result_data := jsonb_build_object(
        'success', true,
        'deleted_count', 1,
        'message', 'Data would be deleted (demo mode)'
      );
      
    ELSE
      RAISE EXCEPTION 'Invalid query type: %', p_query_type;
  END CASE;
  
  end_time := clock_timestamp();
  
  -- Log the query
  INSERT INTO data_table_queries (
    twin_id,
    table_id,
    query_type,
    query_text,
    result_count,
    execution_time
  ) VALUES (
    (SELECT twin_id FROM twin_data_table_connections WHERE table_id = p_table_id AND is_active = true LIMIT 1),
    p_table_id,
    p_query_type,
    p_query_data::text,
    CASE 
      WHEN p_query_type = 'select' THEN jsonb_array_length(result_data)
      ELSE 1
    END,
    EXTRACT(EPOCH FROM (end_time - start_time))
  );
  
  RETURN result_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add data_tables column to digital_twins for quick access
ALTER TABLE digital_twins ADD COLUMN IF NOT EXISTS connected_data_tables jsonb DEFAULT '[]';

-- Function to get connected tables for a twin
CREATE OR REPLACE FUNCTION get_twin_connected_tables(p_twin_id uuid)
RETURNS jsonb AS $$
DECLARE
  connected_tables jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_id', dtc.table_id,
      'table_name', dt.name,
      'table_description', dt.description,
      'access_level', dtc.access_level,
      'is_active', dtc.is_active
    )
  ) INTO connected_tables
  FROM twin_data_table_connections dtc
  JOIN data_tables dt ON dt.id = dtc.table_id
  WHERE dtc.twin_id = p_twin_id AND dtc.is_active = true;
  
  RETURN COALESCE(connected_tables, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 