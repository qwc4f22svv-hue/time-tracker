"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [activeLog, setActiveLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🔐 Load session + listen for changes
  useEffect(() => {
    const load = async (session: any) => {
      if (!session) {
        setUser(null);
        setActiveLog(null);
        setLoading(false);
        return;
      }

      setUser(session.user);

      const { data } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", session.user.id)
        .is("clock_out", null)
        .maybeSingle();

      setActiveLog(data || null);
      setLoading(false);
    };

    // Initial check
    supabase.auth.getSession().then(({ data }) => {
      load(data.session);
    });

    // Listen for login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔑 LOGIN
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  };

  // 🚪 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ⏱ CLOCK IN
  const handleClockIn = async () => {
    if (!user) return;

    await supabase.from("time_logs").insert({
      user_id: user.id,
      clock_in: new Date().toISOString(),
    });
  };

  // ⏱ CLOCK OUT
  const handleClockOut = async () => {
    if (!activeLog) return;

    await supabase
      .from("time_logs")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", activeLog.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-600">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 px-4 py-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">
          ⏱ Time Tracker
        </h1>

        {user && (
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-500"
          >
            Logout
          </button>
        )}
      </div>

      {/* 🔐 LOGIN VIEW */}
      {!user && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Login
          </h2>

          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 p-3 border border-neutral-300 rounded-lg text-neutral-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 p-3 border border-neutral-300 rounded-lg text-neutral-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            Login
          </button>
        </div>
      )}

      {/* 📱 DASHBOARD */}
      {user && (
        <>
          {/* CLOCK CARD */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center border border-neutral-200">
            {activeLog ? (
              <>
                <p className="text-sm text-neutral-600 mb-3">
                  Clocked in since{" "}
                  <span className="text-neutral-900 font-semibold">
                    {new Date(activeLog.clock_in).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>

                <button
                  onClick={handleClockOut}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-lg font-semibold"
                >
                  Clock Out
                </button>
              </>
            ) : (
              <>
                <p className="text-base text-neutral-700 mb-4 font-medium">
                  Not currently tracking
                </p>

                <button
                  onClick={handleClockIn}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl text-lg font-semibold"
                >
                  Clock In
                </button>
              </>
            )}
          </div>

          {/* TODAY */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-neutral-200">
            <p className="text-sm text-neutral-600 font-medium mb-1">
              Today
            </p>
            <p className="text-2xl font-semibold text-neutral-900">--</p>
          </div>

          {/* WEEK */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-neutral-200">
            <p className="text-sm text-neutral-600 font-medium mb-4">
              This Week
            </p>

            <div className="space-y-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-neutral-800 font-medium">
                    {day}
                  </span>
                  <span className="text-neutral-900 font-semibold">
                    0h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}