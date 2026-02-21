import { ReactNode } from "react";
export default function Card({ children }: { children: ReactNode }) {
  return <div className="p-4 rounded-2xl bg-gray-900 border border-gray-700">{children}</div>;
}
