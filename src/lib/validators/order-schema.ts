import { z } from "zod";

export const orderFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  whatsappNumber: z
    .string()
    .regex(/^\d{8}$/, "Please enter a valid 8-digit Singapore number"),
  collectionDay: z.string().min(1, "Please select a collection day"),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Please add at least one item to your order"),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;
