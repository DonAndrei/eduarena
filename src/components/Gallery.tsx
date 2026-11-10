"use client";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import type { GalleryImage } from "@/content/venue";

export function Gallery({
  images,
  locale,
  variant = "full",
}: {
  images: GalleryImage[];
  locale: "ro" | "en";
  variant?: "full" | "preview";
}) {
  const [index, setIndex] = useState(-1);
  const shown = variant === "preview" ? images.slice(0, 5) : images;

  return (
    <>
      {variant === "preview" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:grid-rows-2 sm:h-[460px]">
          {shown.map((img, i) => (
            <Tile
              key={img.src}
              img={img}
              locale={locale}
              onClick={() => setIndex(i)}
              className={i === 0 ? "col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto" : "aspect-square sm:aspect-auto"}
            />
          ))}
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {shown.map((img, i) => (
            <Tile
              key={img.src}
              img={img}
              locale={locale}
              onClick={() => setIndex(i)}
              style={{ aspectRatio: `${img.width} / ${img.height}` }}
              className="w-full break-inside-avoid"
            />
          ))}
        </div>
      )}
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={images.map((img) => ({ src: img.src, alt: img.alt[locale], width: img.width, height: img.height }))}
      />
    </>
  );
}

function Tile({
  img,
  locale,
  onClick,
  className = "",
  style,
}: {
  img: GalleryImage;
  locale: "ro" | "en";
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={`group relative block overflow-hidden rounded-2xl border border-line bg-panel ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.src}
        alt={img.alt[locale]}
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-left text-sm font-semibold opacity-0 transition group-hover:opacity-100">
        {img.alt[locale]}
      </span>
    </button>
  );
}
