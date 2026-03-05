"use client";

interface ImageCardProps {
  imageUrl: string;
  alt?: string;
  isInMoodboard?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  onIgnore?: () => void;
  comment?: string;
  onCommentChange?: (comment: string) => void;
  showComment?: boolean;
}

export default function ImageCard({
  imageUrl,
  alt,
  isInMoodboard,
  onAdd,
  onRemove,
  onIgnore,
  comment,
  onCommentChange,
  showComment,
}: ImageCardProps) {
  return (
    <div className="group relative rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
      <div className="relative aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt || "Interior design"}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {isInMoodboard ? (
          <>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove?.()}
            >
              <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Remove
              </span>
            </div>
            <div className="absolute top-2 left-2">
              <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                In Moodboard
              </span>
            </div>
          </>
        ) : onIgnore ? (
          <div className="absolute inset-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="w-1/2 flex items-center justify-center cursor-pointer bg-black/0 hover:bg-black/40 transition-colors"
              onClick={() => onIgnore()}
            >
              <span className="bg-neutral-700 text-neutral-200 px-4 py-2 rounded-full text-sm font-medium">
                Ignore
              </span>
            </div>
            <div
              className="w-1/2 flex items-center justify-center cursor-pointer bg-black/0 hover:bg-black/40 transition-colors"
              onClick={() => onAdd?.()}
            >
              <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium">
                + Add
              </span>
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/0 group-hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100"
            onClick={() => onAdd?.()}
          >
            <span className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium">
              + Add
            </span>
          </div>
        )}
      </div>
      {alt && (
        <div className="px-3 pt-2 pb-1">
          <p className="text-xs text-neutral-400 line-clamp-2">{alt}</p>
        </div>
      )}
      {showComment && (
        <div className="p-3">
          <textarea
            value={comment || ""}
            onChange={(e) => onCommentChange?.(e.target.value)}
            placeholder="What do you like about this?"
            className="w-full bg-neutral-800 text-neutral-200 text-sm rounded-md p-2 border border-neutral-700 focus:border-neutral-500 focus:outline-none resize-none placeholder:text-neutral-500"
            rows={2}
          />
        </div>
      )}
    </div>
  );
}
