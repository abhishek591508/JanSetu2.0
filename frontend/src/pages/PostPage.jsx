import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getPost } from "../api";

export default function PostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    getPost(postId)
      .then((data) => {
        if (!ignore) {
          setPost(data.post);
          setMessage("");
        }
      })
      .catch((error) => {
        if (!ignore) {
          setPost(null);
          setMessage(error.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [postId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/report" className="text-sm text-sky-400">
          Back to report
        </Link>

        {message && <p className="mt-4 text-red-400">{message}</p>}

        {post && (
          <article className="mt-4">
            <h1 className="text-2xl font-semibold">{post.description}</h1>
            <p className="mt-2 text-sm text-slate-400">
              {post.category} · {post.department} · {post.status} · {post.upvoteCount} upvotes
            </p>
            {post.createdBy?.name && (
              <p className="mt-1 text-sm text-slate-400">Reported by {post.createdBy.name}</p>
            )}
            {post.imageUrl && (
              <img src={post.imageUrl} alt="Reported issue" className="mt-4 max-h-96 rounded" />
            )}
          </article>
        )}
      </main>
    </div>
  );
}
