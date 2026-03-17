"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addProduct, updateProduct } from "@/lib/actions/week-actions";
import { useState } from "react";
import type { Product } from "@/lib/types/database";
import { Plus, Pencil } from "lucide-react";

interface ProductFormProps {
  weekId: string;
  product?: Product;
  productCount?: number;
}

export function ProductFormDialog({
  weekId,
  product,
  productCount = 0,
}: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!product;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    let result;
    if (isEditing && product) {
      result = await updateProduct(product.id, weekId, formData);
    } else {
      formData.set("display_order", String(productCount));
      result = await addProduct(weekId, formData);
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOpen(false);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEditing ? (
            <Button variant="ghost" size="sm" />
          ) : (
            <Button
              variant="outline"
              className="border-dashed border-brown-600/30 text-brown-700"
            />
          )
        }
      >
        {isEditing ? (
          <Pencil className="h-3.5 w-3.5" />
        ) : (
          <>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-brown-800">
            {isEditing ? "Edit Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the product details below."
              : "Fill in the details for the new product."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name}
              placeholder="e.g. Sourdough Loaf"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description || ""}
              placeholder="e.g. Large, naturally leavened"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (SGD)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.price}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_label">Unit Label</Label>
              <Input
                id="unit_label"
                name="unit_label"
                defaultValue={product?.unit_label || "per loaf"}
                placeholder="e.g. per loaf"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_qty">Max Quantity (optional)</Label>
            <Input
              id="max_qty"
              name="max_qty"
              type="number"
              min="1"
              defaultValue={product?.max_qty || ""}
              placeholder="Leave empty for unlimited"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              className="bg-brown-700 hover:bg-brown-800 text-cream-50"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
