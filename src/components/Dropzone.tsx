"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, ImagePlus } from "lucide-react";
import { MAX_IMAGES } from "@/lib/image";

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  currentCount: number;
  disabled?: boolean;
}

/**
 * Zone de glisser-déposer + bouton d'import de photos.
 * Gère aussi bien le drag & drop que la sélection classique via <input type="file">.
 */
export default function Dropzone({ onFilesSelected, currentCount, disabled }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const remainingSlots = MAX_IMAGES - currentCount;
  const isFull = remainingSlots <= 0;

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled || isFull) return;
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      onFilesSelected(files.slice(0, remainingSlots));
    },
    [onFilesSelected, remainingSlots, disabled, isFull]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !isFull) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && !isFull && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled && !isFull) {
          inputRef.current?.click();
        }
      }}
      aria-disabled={disabled || isFull}
      className={`group relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300
        ${isDragging ? "border-accent bg-accent/10 scale-[1.01]" : "border-border-subtle bg-surface/60 hover:border-accent-soft/60 hover:bg-surface"}
        ${disabled || isFull ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || isFull}
      />

      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft transition-transform duration-300 group-hover:scale-110 ${
          isDragging ? "scale-110" : ""
        }`}
      >
        {isDragging ? (
          <ImagePlus className="h-8 w-8" strokeWidth={1.8} />
        ) : (
          <UploadCloud className="h-8 w-8" strokeWidth={1.8} />
        )}
      </div>

      <div>
        <p className="font-semibold text-foreground">
          {isFull ? "Limite atteinte" : "Glissez-déposez vos photos ici"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {isFull
            ? `Vous avez déjà importé ${MAX_IMAGES} photos.`
            : "ou cliquez pour parcourir vos fichiers (JPG, PNG, WEBP)"}
        </p>
        <p className="mt-2 text-xs text-muted/80">
          {currentCount} / {MAX_IMAGES} photos importées
        </p>
      </div>
    </div>
  );
}
