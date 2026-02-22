"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSwipe } from "@/hooks/useSwipe";

type Tab = "home" | "discover" | "workout" | "coach" | "profile";

interface Props {
  active: Tab;
}

const tabs: { id: Tab; label: string; href: string; icon: React.ReactNode }[] = [
  {
    id: "home",
    label: "Home",
    href: "/home",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "discover",
    label: "Discover",
    href: "/discover",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: "workout",
    label: "Workout",
    href: "/workout",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 6h2m0 0V4m0 2v2M3 6h18m-2 0V4m0 2v2m0-2h2M5 8h14m-7 4v4m0-4H9m3 0h3" />
      </svg>
    ),
  },
  {
    id: "coach",
    label: "Coach",
    href: "/coach",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const TAB_ORDER: Tab[] = ["home", "discover", "workout", "coach", "profile"];

export default function BottomNav({ active }: Props) {
  const router = useRouter();
  const currentIndex = TAB_ORDER.indexOf(active);

  useSwipe({
    onSwipeLeft: () => {
      if (currentIndex < TAB_ORDER.length - 1) {
        router.push(tabs.find(t => t.id === TAB_ORDER[currentIndex + 1])!.href);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        router.push(tabs.find(t => t.id === TAB_ORDER[currentIndex - 1])!.href);
      }
    },
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#1a1a1a] px-2 py-2 safe-area-inset-bottom z-40">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-colors ${
              active === tab.id
                ? "text-[#0066FF]"
                : "text-[#666666] hover:text-neutral-300"
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
