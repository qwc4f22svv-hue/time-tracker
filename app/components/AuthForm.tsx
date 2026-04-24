type Props = {
  email: string
  password: string
  setEmail: (v: string) => void
  setPassword: (v: string) => void
  onLogin: () => void
  onSignUp: () => void
}

export default function AuthForm({
  email,
  password,
  setEmail,
  setPassword,
  onLogin,
  onSignUp,
}: Props) {
  return (
    <div className="mt-20">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Time Tracker
      </h1>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-3 mb-3 rounded-lg bg-neutral-900 border border-neutral-700"
      />

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        className="w-full p-3 mb-4 rounded-lg bg-neutral-900 border border-neutral-700"
      />

      <button
        onClick={onLogin}
        className="w-full bg-blue-600 py-3 rounded-lg font-semibold mb-2"
      >
        Login
      </button>

      <button
        onClick={onSignUp}
        className="w-full bg-neutral-800 py-3 rounded-lg"
      >
        Sign Up
      </button>
    </div>
  )
}