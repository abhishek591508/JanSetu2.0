
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import { getNearbyPosts, upvotePost } from "../api";

export default function HomePage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [votingIds, setVotingIds] = useState(new Set());//This state tracks which post is currently being voted on, so one pending request doesn't disable every Upvote button.

  const loadNearby = useCallback(() => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const data = await getNearbyPosts(latitude, longitude);
          setPosts(data.posts ?? []);
        } catch (err) {
          setError(err.message || "Could not load nearby issues.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        if (err.code === 1) {
          setError(
            "Location permission was denied. Allow location access and try again."
          );
        } else if (err.code === 3) {
          setError("Location request timed out. Please try again.");
        } else {
          setError("Could not determine your location. Please try again.");
        }

        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      }
    );


  }, []);

  useEffect(() => {
    loadNearby();
  }, [loadNearby]);


  
//upvote handler in homepage
  async function handleUpvote(postId) {
    try {
      // Prevent accidental repeated clicks while this request is running.
      setVotingIds((prev) => new Set([...prev, postId]));

      const result = await upvotePost(postId);

      // Update only the post that was successfully upvoted.
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                upvoteCount: result.upvoteCount,
                hasUpvoted: result.hasUpvoted,
              }
            : post
        )
      );
    } catch (err) {
      setError(err.message || "Could not upvote this issue.");
    } finally {
      setVotingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  }


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Page heading */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Nearby Issues</h1>
            <p className="mt-2 text-sm text-slate-400">
              Civic problems reported within 5 km of your location.
            </p>
          </div>

          <button
            type="button"
            onClick={loadNearby}
            disabled={loading}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh feed"}
          </button>
        </div>

        {/* User information */}
        {user && (
          <p className="mt-4 text-sm text-slate-400">
            Logged in as {user.name} · Civic score: {user.civicScore}
          </p>
        )}

        {/* Report issue button */}
        <Link
          to="/report"
          className="mt-6 inline-block rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
        >
          + Report a problem
        </Link>

        {/* Loading state */}
        {loading && (
          <p className="mt-8 text-slate-400">
            Finding civic issues near you...
          </p>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-900 bg-red-950/40 p-4"
          >
            <p className="text-red-300">{error}</p>

            <button
              type="button"
              onClick={loadNearby}
              className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-800 p-6">
            <h2 className="font-semibold">No issues nearby yet</h2>
            <p className="mt-2 text-sm text-slate-400">
              No reported issues were found within 5 km. You can be the first
              to report a local problem.
            </p>
          </div>
        )}

        {/* Nearby issue cards */}
        {!loading && !error && posts.length > 0 && (
          <div className="mt-8 space-y-5">
            <p className="text-sm text-slate-400">
              Found {posts.length} nearby issue
              {posts.length !== 1 ? "s" : ""}.
              {posts.length === 100 ? " Showing up to 100." : ""}
            </p>

            {posts.map((post) => (
              <article
                key={post._id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
              >
                {/* Issue photo */}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={`Photo of ${post.category} issue`}
                    className="max-h-80 w-full object-cover"
                    loading="lazy"
                  />
                )}

                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-sky-950 px-3 py-1 text-xs font-medium capitalize text-sky-300">
                      {post.category}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs capitalize ${
                        post.status === "resolved"
                          ? "bg-green-950 text-green-300"
                          : post.status === "in_progress"
                            ? "bg-amber-950 text-amber-300"
                            : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {post.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-100">
                    {post.description}
                  </p>
                  
                  {/*postDistance, postUpvoteCount */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-sm text-slate-400">
                      📍 {(post.distanceMeters / 1000).toFixed(2)} km away
                    </span>

                    <button
                      type="button"
                      onClick={() => handleUpvote(post._id)}
                      disabled={
                        post.hasUpvoted ||
                        post.status === "resolved" ||
                        votingIds.has(post._id)
                      }
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        post.hasUpvoted
                          ? "bg-sky-950 text-sky-300 cursor-not-allowed"
                          : "bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-50"
                      }`}
                    >
                      {votingIds.has(post._id)
                        ? "Submitting..."
                        : post.hasUpvoted
                          ? `✓ Upvoted (${post.upvoteCount})`
                          : `👍 Upvote (${post.upvoteCount ?? 0})`}
                    </button>
                  </div>                  

                  <div className="mt-4 border-t border-slate-800 pt-4 text-xs text-slate-500">
                    <p>
                      Reported by {post.createdBy?.name || "Unknown user"}
                    </p>

                    <p className="mt-1">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}


      </main>
    </div>
  );
}
