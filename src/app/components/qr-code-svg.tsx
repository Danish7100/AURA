import { cn } from "@/lib/utils";
import type { SVGProps } from "react";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QrCodeSvg(props: SVGProps<SVGSVGElement> & { 'data-value': string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && props['data-value']) {
      QRCode.toString(props['data-value'], {
        type: 'svg',
        width: 256,
        margin: 1,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
      }, (err, url) => {
        if (err) {
            console.error(err);
            return;
        }
        if (svgRef.current) {
            // A bit of a hack to get the SVG content into the ref
            const template = document.createElement('template');
            template.innerHTML = url;
            const svgElement = template.content.firstChild as SVGSVGElement;
            
            if (svgElement) {
                while(svgRef.current.firstChild){
                    svgRef.current.removeChild(svgRef.current.firstChild);
                }
                while(svgElement.firstChild) {
                    svgRef.current.appendChild(svgElement.firstChild);
                }
                // Copy attributes
                for (const attr of Array.from(svgElement.attributes)) {
                    svgRef.current.setAttribute(attr.name, attr.value);
                }
            }
        }
      });
    }
  }, [props['data-value']]);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={cn("fill-current text-foreground", props.className)}
      {...props}
    >
        {/* QR Code will be rendered here by the useEffect hook */}
    </svg>
  );
}
