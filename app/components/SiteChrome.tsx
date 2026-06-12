import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

const REPO_URL = siteConfig.repoUrl;
const FUSIONSYNC_URL = siteConfig.fusionsyncUrl;
const BOOKING_URL = siteConfig.bookingUrl;

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <a
          href={FUSIONSYNC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5"
        >
          <Image
            src="/brand/fusion-icon.png"
            alt="FusionSync AI"
            width={32}
            height={32}
            priority
            className="h-8 w-8"
          />
          <span className="font-heading text-lg font-bold tracking-tight text-slate-900">
            FusionSync <span className="text-blue-600">AI</span>
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/blog"
            className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-900 sm:block"
          >
            Blog
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-white sm:flex"
            title={`GEO audit engine by ${siteConfig.repoAuthor}`}
          >
            <GitHubIcon className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-900" />
            <span>
              Engine by{" "}
              <span className="font-semibold text-slate-800">
                {siteConfig.repoAuthor}
              </span>
            </span>
          </a>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Book a call
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <a
          href={FUSIONSYNC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition hover:text-slate-800"
        >
          <Image
            src="/brand/fusion-icon.png"
            alt="FusionSync AI"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span>
            Built by{" "}
            <span className="font-semibold text-slate-700">FusionSync AI</span>
          </span>
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition hover:text-slate-800"
        >
          <GitHubIcon className="h-4 w-4" />
          <span>
            GEO engine: geo-seo-claude by Zubair Trabzada
          </span>
        </a>
      </div>
    </footer>
  );
}
