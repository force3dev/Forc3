"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function WorkoutRedirect() {
  const router = useRouter();
  const params = useParams();
  useEffect(() => {
    router.replace(`/workout/${params.id}`);
  }, [params.id, router]);
  return null;
}
