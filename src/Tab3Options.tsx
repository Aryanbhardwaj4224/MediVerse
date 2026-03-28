import React from "react";
import { Link } from "react-router-dom";
import GlassLayout from "./components/GlassLayout";

const HISTORY_IMAGE =
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80";
/** Hospital corridor / care setting — stable Unsplash asset (ambulance photo ID was unreliable). */
const TRANSFER_IMAGE =
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80";
const TRANSFER_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80";

const cardClass =
  "flex h-[26rem] w-full max-w-[20rem] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 sm:max-w-none sm:w-80";

const primaryBtnClass =
  "inline-flex w-full items-center justify-center rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/35 to-sky-500/30 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-sm transition hover:border-cyan-200/50 hover:shadow-[0_0_28px_rgba(34,211,238,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

function CardImage({
  src,
  alt,
  fallbackSrc,
}: {
  src: string;
  alt: string;
  fallbackSrc?: string;
}) {
  const [resolved, setResolved] = React.useState(src);

  React.useEffect(() => {
    setResolved(src);
  }, [src]);

  return (
    <div className="relative h-40 w-full shrink-0 overflow-hidden">
      <img
        src={resolved}
        alt={alt}
        className="h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          if (fallbackSrc && resolved !== fallbackSrc) {
            setResolved(fallbackSrc);
          }
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-cyan-950/20"
        aria-hidden
      />
    </div>
  );
}

export default function Tab3Options() {
  return (
    <GlassLayout>
      <div className="flex min-h-[100dvh] flex-col px-4 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex shrink-0 items-center justify-between gap-4">
          <Link
            to="/"
            className="text-sm font-medium text-cyan-200/90 transition hover:text-white"
          >
            ← Home
          </Link>
          <span className="text-xs font-medium uppercase tracking-widest text-cyan-100/60">
            Tab 3
          </span>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 md:flex-row md:items-center md:justify-center md:gap-12">
          {/* Patient History */}
          <div className={cardClass}>
            <CardImage
              src={HISTORY_IMAGE}
              alt="Clinician reviewing medical information and patient records"
            />
            <div className="flex flex-1 flex-col justify-between px-6 pb-6 pt-5">
              <h2 className="text-center text-xl font-semibold tracking-tight text-white">
                Patient History
              </h2>
              <Link to="/auth/patient-history" className={primaryBtnClass}>
                Click Here
              </Link>
            </div>
          </div>

          {/* Patient Transfer */}
          <div className={cardClass}>
            <CardImage
              src={TRANSFER_IMAGE}
              fallbackSrc={TRANSFER_IMAGE_FALLBACK}
              alt="Hospital corridor and patient care setting representing transfer"
            />
            <div className="flex flex-1 flex-col justify-between px-6 pb-6 pt-5">
              <h2 className="text-center text-xl font-semibold tracking-tight text-white">
                Patient Transfer
              </h2>
              <Link to="/auth/patient-transfer" className={primaryBtnClass}>
                Click Here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </GlassLayout>
  );
}
