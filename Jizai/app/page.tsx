"use client";
// Hybrid運用: 既存SPAを Client Component として内包
import SpaApp from "./spa/SpaApp";

export default function Page() {
  return <SpaApp />;
}
