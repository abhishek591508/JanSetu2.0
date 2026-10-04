//This file is the only place that knows the backend address. 
//The screen asks this file to sign up, log in, or load the profile. 
//The screen does not build URLs itself.
const API = "http://localhost:5000";

async function send(path, options) {
  const response = await fetch(API + path, options);
  const data = await response.json();

  if (!response.ok) {//response.ok is false for 400, 401, and 500,
    const details = Array.isArray(data.errors) ? data.errors.join(", ") : "";
    throw new Error(details || data.message || "Request failed");
  }

  return data;
}

export function signup(name, email, password) {
  return send("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
    //stringify means sending {
    //                          name: name, 
    //                          email: email, 
    //                          password: password
    //                        }
  });
}

export async function login(email, password) {//make it async, we need to wait before save
  const data = await send("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem("token", data.token);
  return data;
}


export function getMe() {
  const token = localStorage.getItem("token");

  return send("/api/auth/me", {
    method: "GET",
    headers: { Authorization: "Bearer " + token },
  });
}

//create post
export function createPost({ description, category, latitude, longitude, image }) {
  const token = localStorage.getItem("token");
  const formData = new FormData();

  formData.append("description", description);
  formData.append("category", category);
  formData.append("latitude", String(latitude));
  formData.append("longitude", String(longitude));
  formData.append("image", image);

  return send("/api/posts", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
    },
    body: formData,
  });
}

export function logout() {
  localStorage.removeItem("token");
}