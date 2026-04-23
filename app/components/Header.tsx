"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();
  }, []);

  return (
    <header className="border-b bg-white">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-semibold text-lg">
          ⏱ Time Tracker
        </Link>

        {/* Only show nav if logged in */}
        {user && (
          <nav className="flex gap-4 text-sm items-center">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/history" className="hover:underline">
              History
            </Link>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="text-red-500"
            >
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}