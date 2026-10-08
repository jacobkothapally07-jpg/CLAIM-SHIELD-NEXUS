export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSignalName(signal: string): string {
  return signal
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getRiskBadgeClasses(level: string): string {
  switch (level.toUpperCase()) {
    case "CRITICAL":
      return "bg-[#fee2e2] text-[#b91c1c] border-[#b91c1c]/30";
    case "HIGH":
      return "bg-[#fee2e2] text-[#c53030] border-[#c53030]/25";
    case "MEDIUM":
      return "bg-[#fef3c7] text-[#b45309] border-[#d97706]/30";
    default:
      return "bg-[#acf2e5] text-[#209b47] border-[#209b47]/25";
  }
}

export function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "Under Review":
      return "bg-[#f2fcff] text-[#005f68] border-[#005f68]/30";
    case "Escalated":
      return "bg-[#fee2e2] text-[#b91c1c] border-[#b91c1c]/30";
    case "Resolved":
      return "bg-[#acf2e5] text-[#209b47] border-[#209b47]/30";
    case "Dismissed":
      return "bg-[#f2fcff] text-[#042126]/70 border-[#042126]/15";
    default:
      return "bg-[#acf2e5] text-[#042126] border-[#042126]/15";
  }
}
