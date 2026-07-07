import Image from "next/image";
import { AuthForm } from "./auth-form";

/** Split auth layout — design/04 §8: arch-masked seasonal image + quote, form right. */
export function AuthPanel({ mode }: { mode: "signin" | "join" }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-12">
      <div className="relative hidden lg:col-span-6 lg:block xl:col-span-7">
        <Image
          src="/photos/hero-dusk.webp"
          alt=""
          fill
          priority
          sizes="60vw"
          className="object-cover"
        />
        <div className="overlay-hero absolute inset-0" aria-hidden />
        <figure className="absolute right-12 bottom-12 left-12 max-w-lg text-ivory-100">
          <blockquote className="font-display text-2xl leading-snug">
            “The river does something to your sense of time.”
          </blockquote>
          <figcaption className="mt-3 text-sm text-ivory-100/70">Charlotte M. · May 2026</figcaption>
        </figure>
      </div>
      <div className="flex items-center justify-center px-6 py-16 lg:col-span-6 xl:col-span-5">
        <AuthForm mode={mode} />
      </div>
    </div>
  );
}
