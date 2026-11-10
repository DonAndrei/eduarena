// Venue details — replace placeholders with the client's real info.
export const venue = {
  name: "EduArena",
  phone: "+40 700 000 000",
  phoneHref: "tel:+40700000000",
  email: "contact@eduarena.ro",
  address: "Strada Exemplu 10, București",
  mapsQuery: "București",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
};

export type GalleryImage = { src: string; width: number; height: number; alt: { ro: string; en: string } };

// Drop real photos into /public/gallery and list them here.
export const gallery: GalleryImage[] = [
  { src: "/gallery/01.svg", width: 1600, height: 1000, alt: { ro: "Terenul văzut din tribună", en: "The pitch from the stands" } },
  { src: "/gallery/02.svg", width: 1000, height: 1250, alt: { ro: "Poarta și plasa", en: "Goal and net" } },
  { src: "/gallery/03.svg", width: 1600, height: 1000, alt: { ro: "Iluminat LED seara", en: "LED lighting at night" } },
  { src: "/gallery/04.svg", width: 1000, height: 1000, alt: { ro: "Vestiare", en: "Changing rooms" } },
  { src: "/gallery/05.svg", width: 1600, height: 1000, alt: { ro: "Gazon sintetic de ultimă generație", en: "Latest-gen artificial turf" } },
  { src: "/gallery/06.svg", width: 1000, height: 1250, alt: { ro: "Zona de așteptare", en: "Lounge area" } },
];
