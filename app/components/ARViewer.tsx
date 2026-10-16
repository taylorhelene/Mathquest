"use client";

import { useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        "ios-src"?: string;
        alt?: string;
        ar?: boolean | string;
        "ar-modes"?: string;
        "camera-controls"?: boolean | string;
        "auto-rotate"?: boolean | string;
        "shadow-intensity"?: string;
        "ar-scale"?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

type ARViewerProps = {
  title: string;
  modelSrc: string;
  iosModelSrc?: string;
  /** Author / license line shown under the viewer */
  modelCredit?: string;
};

export default function ARViewer({
  title,
  modelSrc,
  iosModelSrc,
  modelCredit,
}: ARViewerProps) {
  useEffect(() => {
    if (!customElements.get("model-viewer")) {
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="ar-viewer-wrap">
      <model-viewer
        src={modelSrc}
        ios-src={iosModelSrc}
        alt={title}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        ar-scale="auto"
        style={{
          width: "100%",
          height: "280px",
          /* Always dark — not tied to site light/dark toggle */
          background: "#0f1419",
          borderRadius: "12px",
        }}
      >
        <button slot="ar-button" className="button ar-button">
          View in your space
        </button>
      </model-viewer>
      <p className="scene-note">
        Rotate the model here, or use “View in your space” on a supported phone.
        On other devices the interactive 3D view still works.
      </p>
      {modelCredit ? (
        <p className="model-credit" role="contentinfo">
          3D model: {modelCredit}
        </p>
      ) : null}
    </div>
  );
}
