import { useEffect } from "react";
import { useMap } from "react-leaflet";
// component for first render leaflet map when w and h are undefined
export const InvalidateMapSize = () => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  return null;
};
