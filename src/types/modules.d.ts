declare module '@mapbox/geojson-normalize' {
  export default function normalize(geojson: any): any;
}

declare module '@mapbox/geojson-area' {
  const area: {
    geometry(geojson: any): number;
    ring(coords: any): number;
  };
  export default area;
}

declare module '@mapbox/point-geometry' {
  export default class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
  }
}

declare module 'numeral' {
  export default function numeral(value: any): {
    format(format: string): string;
  };
}
