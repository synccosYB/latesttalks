import { SiVisa, SiAmericanexpress, SiApplepay, SiGooglepay } from "react-icons/si";

function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 152 100" className={className} aria-label="Mastercard">
      <circle cx="50" cy="50" r="45" fill="#EB001B" />
      <circle cx="102" cy="50" r="45" fill="#F79E1B" />
      <path
        d="M76 18.5c-11.5 9.2-18.9 23.3-18.9 39s7.4 29.8 18.9 39c11.5-9.2 18.9-23.3 18.9-39s-7.4-29.8-18.9-39z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function StripeLinkLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 28" className={className} aria-label="Link by Stripe">
      <rect width="72" height="28" rx="14" fill="#00D66F" />
      <circle cx="16" cy="14" r="8" fill="#1A1F36" />
      <path d="M14 11l5 3-5 3V11z" fill="#00D66F" />
      <text x="30" y="18.5" fill="#fff" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="600">link</text>
    </svg>
  );
}

interface PaymentLogosProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PaymentLogos({ size = "md", className = "" }: PaymentLogosProps) {
  const sizeClasses = {
    sm: { icon: "h-6", mastercard: "h-5 w-8", link: "h-5 w-14" },
    md: { icon: "h-8", mastercard: "h-6 w-10", link: "h-6 w-16" },
    lg: { icon: "h-10", mastercard: "h-8 w-12", link: "h-7 w-20" },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <SiVisa className={`${sizes.icon} w-auto text-[#1A1F71]`} />
      <MastercardLogo className={sizes.mastercard} />
      <SiAmericanexpress className={`${sizes.icon} w-auto text-[#006FCF]`} />
      <SiApplepay className={`${sizes.icon} w-auto`} />
      <SiGooglepay className={`${sizes.icon} w-auto`} />
      <StripeLinkLogo className={sizes.link} />
    </div>
  );
}

export { MastercardLogo, StripeLinkLogo };
