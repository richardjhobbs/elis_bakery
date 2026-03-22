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
import {
  addProduct,
  updateProduct,
  uploadProductImage,
} from "@/lib/actions/week-actions";
import { useState, useRef } from "react";
import {
  PRODUCT_CATEGORIES,
  CATEGORY_LABELS,
  type Product,
} from "@/lib/types/database";
import { Plus, Pencil, ImageIcon, X } from "lucide-react";

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
  const [imageUrl, setImageUrl] = useState<string | null>(
    product?.image_url || null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!product;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadProductImage(fd);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      setImageUrl(result.url);
    }
    setUploading(false);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    if (imageUrl) {
      formData.set("image_url", imageUrl);
    }

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

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setImageUrl(product?.image_url || null);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {/* Image upload */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative h-16 w-16 rounded-lg overflow-hidden border">
                  <img
                    src={imageUrl}
                    alt="Product"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading..." : imageUrl ? "Change" : "Upload"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </div>

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
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue={product?.category || "other"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
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
              disabled={loading || uploading}
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
