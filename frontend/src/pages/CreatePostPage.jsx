import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CATEGORIES } from "../constants/posts";
import { createPost, getSimilarPosts  } from "../api";

export default function CreatePostPage() {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("roads");
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [similarPosts, setSimilarPosts] = useState([]);
  const [similarMessage, setSimilarMessage] = useState("");

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (latitude === "" || longitude === "" || !category) {
      setSimilarPosts([]);
      return;
    }

    let ignore = false;

    getSimilarPosts(latitude, longitude, category)
      .then((data) => {
        if (!ignore) {
          setSimilarPosts(data.posts || []);
          setSimilarMessage("");
        }
      })
      .catch((error) => {
        if (!ignore) {
          setSimilarPosts([]);
          setSimilarMessage(error.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [latitude, longitude, category]);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationError("This browser cannot read your location. Type it below.");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationError("Location was blocked. Allow it, or type the coordinates.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function onImageChange(event) {
    const files = Array.from(event.target.files || []).slice(0, 5);
    setImages(files);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setMessage("");
    setCreated(null);

    if (images.length === 0) {
      setMessage("Choose at least one photo. You can attach up to 5.");
      return;
    }

    if (latitude === "" || longitude === "") {
      setMessage("Location is required.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await createPost({
        description,
        category,
        latitude,
        longitude,
        images,
      });
      setCreated(data.post);
      setDescription("");
      setImages([]);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Report a problem</h1>
        <p className="mt-2 text-slate-400">
          The photo and this location are stored with the report. Nearby people will see it in the next step.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            What is wrong?
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={10}
              maxLength={500}
              rows={4}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
              placeholder="The road is broken near the school gate"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <section className="rounded border border-slate-800 p-3 text-sm">
            <p className="font-medium">Same category within 100 m</p>
            {similarMessage && <p className="mt-2 text-red-400">{similarMessage}</p>}
            {similarPosts.length === 0 && !similarMessage && (
              <p className="mt-2 text-slate-400">No similar issues nearby.</p>
            )}
            <ul className="mt-2 flex flex-col gap-2">
              {similarPosts.map((post) => (
                <li key={post._id} className="rounded border border-slate-800 p-2">
                  <Link to={`/posts/${post._id}`} className="block">
                    <p>{post.description}</p>
                    <p className="text-slate-400">
                      {Math.round(post.distanceMeters)} m away · {post.status}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <label className="flex flex-col gap-1 text-sm">
            Photos, up to 5
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImageChange} />
          </label>

          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewUrls.map((url) => (
                <img key={url} src={url} alt="Selected report" className="h-24 rounded object-cover" />
              ))}
            </div>
          )}

          <div className="rounded border border-slate-800 p-3 text-sm">
            <p>Latitude: {latitude || "not set"}</p>
            <p>Longitude: {longitude || "not set"}</p>
            {locating && <p className="text-slate-400">Reading your location...</p>}
            {locationError && <p className="text-amber-400">{locationError}</p>}
            <button type="button" onClick={detectLocation} className="mt-2 text-sky-400">
              Detect location again
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Latitude
            <input
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Longitude
            <input
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>

          <button
            disabled={submitting}
            className="rounded bg-sky-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit report"}
          </button>
        </form>

        {message && <p className="mt-4 text-red-400">{message}</p>}

        {created && (
          <section className="mt-6 rounded border border-slate-800 p-4">
            <h2 className="font-medium">Report saved</h2>
            <p className="mt-2 text-sm text-slate-300">{created.description}</p>
            <p className="text-sm text-slate-400">
              {created.category} · {created.department} · {created.radiusKm} km · {created.status}
            </p>
            {(created.imageUrls?.length ? created.imageUrls : created.imageUrl ? [created.imageUrl] : []).map((url) => (
              <img key={url} src={url} alt="Uploaded report" className="mt-3 max-h-64 rounded" />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
