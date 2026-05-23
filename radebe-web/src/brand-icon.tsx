import {
  radebeIconPreview,
  radebeIconPreviewHeight,
  radebeIconPreviewWidth
} from "./content/brand-icon.js";
import { markPerfPoint } from "./perf.js";

export function BrandIcon() {
  return (
    <img
      alt=""
      aria-hidden="true"
      className="brand-icon-image"
      height={radebeIconPreviewHeight}
      onLoad={() => {
        markPerfPoint("brand-icon-image-loaded");
        window.requestAnimationFrame(() => {
          markPerfPoint("brand-icon-frame-ready");
        });
      }}
      src={radebeIconPreview}
      width={radebeIconPreviewWidth}
    />
  );
}
