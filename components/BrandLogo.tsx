import Image from "next/image";

export default function BrandLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden="true"
      width={40}
      height={40}
      unoptimized
      priority
      className={className}
    />
  );
}
