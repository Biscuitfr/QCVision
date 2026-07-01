"use client";

import { X } from "lucide-react";

export interface PreviewImage {
  id: string;
  dataUrl: string;
  name: string;
}

interface ImagePreviewGridProps {
  images: PreviewImage[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

/**
 * Grille de prévisualisation des photos importées avant analyse.
 */
export default function ImagePreviewGrid({ images, onRemove, disabled }: ImagePreviewGridProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images.map((img, index) => (
        <div
          key={img.id}
          className="animate-scale-in group relative aspect-square overflow-hidden rounded-2xl border border-border-subtle bg-surface"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.dataUrl}
            alt={img.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            disabled={disabled}
            aria-label={`Supprimer ${img.name}`}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity duration-200 hover:bg-rl group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[11px] text-white/90">
            {img.name}
          </div>
        </div>
      ))}
    </div>
  );
}
