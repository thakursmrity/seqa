"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthScreen from "../components/AuthScreen";
import DbSetup from "../components/DbSetup";
import { useWs } from "../lib/workspace";

export default function Home() {
  const { session, ready, loaded, profile, dbError } = useWs();
  const router = useRouter();

  useEffect(() => {
    if (session && loaded && !dbError) router.replace(profile?.onboarded ? "/w" : "/start");
  }, [session, loaded, profile, dbError, router]);

  if (!ready) return null;
  if (!session) return <AuthScreen />;
  if (dbError) return <DbSetup message={dbError} />;
  return null;
}
