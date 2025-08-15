import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const assistantExamples = pgTable("assistant_examples", {
  id: serial("id").primaryKey(),
  assistantId: integer("assistant_id").notNull(),
  userQuery: text("user_query").notNull(),
  originalResponse: text("original_response"),
  correctedResponse: text("corrected_response").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
