/*
  # Обновление политик безопасности для авторизованных пользователей

  1. Изменения в политиках
    - Обновить политики для работы с авторизованными пользователями
    - Добавить проверки владельца для операций с двойниками
    - Сохранить совместимость с анонимными пользователями для демо

  2. Безопасность
    - Пользователи могут видеть только свои двойники
    - Анонимные пользователи могут работать с демо-данными
    - Защита от несанкционированного доступа
*/

-- Обновляем политику для digital_twins
DROP POLICY IF EXISTS "Allow all operations on digital_twins" ON digital_twins;

CREATE POLICY "Users can manage their own twins"
  ON digital_twins
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Anonymous users can manage demo twins"
  ON digital_twins
  FOR ALL
  TO anon
  USING (user_id LIKE 'anonymous_%')
  WITH CHECK (user_id LIKE 'anonymous_%');

-- Обновляем политику для telegram_messages
DROP POLICY IF EXISTS "Allow all operations on telegram_messages" ON telegram_messages;

CREATE POLICY "Users can manage messages for their twins"
  ON telegram_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = telegram_messages.twin_id 
      AND digital_twins.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = telegram_messages.twin_id 
      AND digital_twins.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Anonymous users can manage demo messages"
  ON telegram_messages
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = telegram_messages.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = telegram_messages.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
  );

-- Обновляем политику для chat_sessions
DROP POLICY IF EXISTS "Allow all operations on chat_sessions" ON chat_sessions;

CREATE POLICY "Users can manage sessions for their twins"
  ON chat_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = chat_sessions.twin_id 
      AND digital_twins.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = chat_sessions.twin_id 
      AND digital_twins.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Anonymous users can manage demo sessions"
  ON chat_sessions
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = chat_sessions.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_twins 
      WHERE digital_twins.id = chat_sessions.twin_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
  );

-- Обновляем политику для chat_messages
DROP POLICY IF EXISTS "Allow all operations on chat_messages" ON chat_messages;

CREATE POLICY "Users can manage messages for their sessions"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      JOIN digital_twins ON digital_twins.id = chat_sessions.twin_id
      WHERE chat_sessions.id = chat_messages.session_id 
      AND digital_twins.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      JOIN digital_twins ON digital_twins.id = chat_sessions.twin_id
      WHERE chat_sessions.id = chat_messages.session_id 
      AND digital_twins.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Anonymous users can manage demo chat messages"
  ON chat_messages
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      JOIN digital_twins ON digital_twins.id = chat_sessions.twin_id
      WHERE chat_sessions.id = chat_messages.session_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      JOIN digital_twins ON digital_twins.id = chat_sessions.twin_id
      WHERE chat_sessions.id = chat_messages.session_id 
      AND digital_twins.user_id LIKE 'anonymous_%'
    )
  );