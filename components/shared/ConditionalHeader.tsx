"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const HIDDEN_PATHS = ["/", "/login", "/case-study"];

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (HIDDEN_PATHS.includes(pathname)) return null;
  if (pathname.startsWith("/dashboard")) return null;
  if (pathname.startsWith("/branch-dashboard")) return null;
  return <Header />;
}
