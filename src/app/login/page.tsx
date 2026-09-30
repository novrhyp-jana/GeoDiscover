"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  LoaderCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="authPage">
      <section className="authBrandPanel">
        <div className="authLogo">
          <Leaf size={27} />
        </div>

        <h1>GeoDiscover</h1>

        <h2>
          The real world is
          <br />
          <span>your feed.</span>
        </h2>

        <p>
          Discover meaningful activity around you
          and contribute to a trusted location-based
          community.
        </p>
      </section>

      <section className="authFormSide">
        <div className="authFormContainer">
          <p className="eyebrow">
            WELCOME BACK
          </p>

          <h1>Sign in to GeoDiscover</h1>

          <p className="authSubtitle">
            Continue exploring your community.
          </p>

          <form
            className="authForm"
            onSubmit={handleLogin}
          >
            <label>
              Email address

              <input
                required
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password

              <div className="passwordInput">
                <input
                  required
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Your password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="authError">
                {error}
              </div>
            )}

            <button
              className="authSubmit"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="spinner"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="authSwitch">
            New to GeoDiscover?{" "}
            <Link href="/register">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}