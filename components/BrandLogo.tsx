import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  variant?: "light" | "dark" | "adaptive";
}

export function BrandLogo({ className = "w-10 h-10", variant = "adaptive" }: BrandLogoProps) {
  // Parsing sizes from className for optimization if possible, but for now using standard sizes
  // The images are square, so we apply rounded-full or rounded-xl in the parent or here
  
  return (
    <div className={`relative ${className} overflow-hidden`}>
      {/* Light Mode Logo (Visible in light mode, hidden in dark mode if adaptive) */}
      {(variant === "adaptive" || variant === "light") && (
        <Image
          src="/brand/logo-light.jpg"
          alt="TeamUp Logo"
          fill
          className={`object-cover ${variant === "adaptive" ? "dark:hidden" : ""}`}
          priority
        />
      )}
      
      {/* Dark Mode Logo (Hidden in light mode, visible in dark mode if adaptive) */}
      {(variant === "adaptive" || variant === "dark") && (
         <Image
          src="/brand/logo-dark.jpg"
          alt="TeamUp Logo"
          fill
          className={`object-cover ${variant === "adaptive" ? "hidden dark:block" : ""}`}
          priority
        />
      )}
    </div>
  );
}
