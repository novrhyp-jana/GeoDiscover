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

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,

        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
          },
        },
      });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(
      "Account created. Check your email to confirm your account, then sign in."
    );

    setLoading(false);
  }

  return (
    <main className="authPage">
      <section className="authBrandPanel">
        <div className="authLogo">
          <Leaf size={27} />
        </div>

        <h1>GeoDiscover</h1>

        <h2>
          Discover the world
          <br />
          <span>around you.</span>
        </h2>

        <p>
          Share meaningful discoveries, explore
          nearby places and help build a trusted
          community map.
        </p>

        <div className="authFeature">
          <strong>Discover.</strong>
          <span>
            Explore what is happening nearby.
          </span>
        </div>

        <div className="authFeature">
          <strong>Verify.</strong>
          <span>
            Confirm useful real-world reports.
          </span>
        </div>

        <div className="authFeature">
          <strong>Contribute.</strong>
          <span>
            Build your community reputation.
          </span>
        </div>
      </section>

      <section className="authFormSide">
        <div className="authFormContainer">
          <p className="eyebrow">
            JOIN THE COMMUNITY
          </p>

          <h1>Create your account</h1>

          <p className="authSubtitle">
            Start exploring and sharing discoveries.
          </p>

          <form
            className="authForm"
            onSubmit={handleRegister}
          >
            <label>
              Full name

              <input
                required
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Your full name"
              />
            </label>

            <label>
              Username

              <input
                required
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Choose a username"
                minLength={3}
              />
            </label>

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
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label="Show password"
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

            {message && (
              <div className="authSuccess">
                {message}
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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className="authSwitch">
            Already have an account?{" "}
            <Link href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}