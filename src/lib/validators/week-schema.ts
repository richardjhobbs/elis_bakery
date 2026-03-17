import { z } from "zod";

export const weekFormSchema = z.object({
  label: z.string().min(1, "Week label is required"),
  opens_at: z.string().min(1, "Opening date is required"),
  closes_at: z.string().min(1, "Closing date is required"),
  collection_days: z
    .array(z.enum(["friday", "saturday"]))
    .min(1, "Select at least one collection day"),
});

export type WeekFormValues = z.infer<typeof weekFormSchema>;

export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  unit_label: z.string().min(1, "Unit label is required"),
  max_qty: z.coerce.number().int().positive().optional().or(z.literal("")),
  display_order: z.coerce.number().int().default(0),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
