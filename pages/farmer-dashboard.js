import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "../components/Layout";
import { toast } from "react-hot-toast";
import { resolveImageSrc } from "../utils/image";

export default function FarmerDashboard() {
  const router = useRouter();

  // Access guard
  const [authChecked, setAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState("add"); // add | list
  const [refreshKey, setRefreshKey] = useState(0);

  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_desc");

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [description, setDescription] = useState("");

  // Image upload state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageKey, setImageKey] = useState(null);

  const dropRef = useRef(null);

  // Route guard
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("Please log in as a farmer");
      router.replace("/login");
      return;
    }
    axios
      .get("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const role = res?.data?.user?.role;
        setUserRole(role);
        if (role !== "farmer" && role !== "admin") {
          toast.error("You need a farmer account to access this dashboard");
          router.replace("/");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        toast.error("Session expired. Please log in again.");
        router.replace("/login");
      });
  }, [router]);

  // Fetch products
  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    setLoadingProducts(true);
    try {
      const res = await axios.get("/api/farmer/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, refreshKey]);

  // Drag & drop
  useEffect(() => {
    const node = dropRef.current;
    if (!node) return;
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e) => {
      prevent(e);
      const f = e.dataTransfer.files?.[0];
      if (f) onFileChosen(f);
    };
    ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) => node.addEventListener(ev, prevent));
    node.addEventListener("drop", onDrop);
    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) => node.removeEventListener(ev, prevent));
      node.removeEventListener("drop", onDrop);
    };
  }, []);

  const onFileChosen = (f) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setImageKey(null);
    setUploadProgress(0);
  };

  const handleSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (f) onFileChosen(f);
  };

  // Upload to S3 via presigned URL with progress
  const uploadToS3 = async () => {
    if (!file) return toast.error("Pick an image first");
    const token = localStorage.getItem("token");
    try {
      setUploading(true);
      setUploadProgress(5);

      const name = file.name || "upload";
      const parts = name.split(".");
      const ext = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";

      const presign = await axios.post(
        "/api/uploads/presign",
        { contentType: file.type, ext },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUploadProgress(20);

      const { url, headers, key } = presign.data || {};
      if (!url || !key) throw new Error("Invalid presign response");

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        Object.entries(headers || {}).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress(Math.max(20, Math.min(95, pct)));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) return resolve();
          reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setUploadProgress(100);
      setImageKey(key);
      toast.success("Image uploaded to S3");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || err?.message || "Image upload failed");
      setImageKey(null);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 800);
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setQuantity("");
    setCategory("Vegetables");
    setDescription("");
    setFile(null);
    setPreview(null);
    setImageKey(null);
    setUploadProgress(0);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!imageKey) return toast.error("Please upload the image to S3 first");
    if (!name || !price) return toast.error("Name and price are required");

    try {
      const payload = {
        name,
        price: Number(price),
        quantity: quantity ? Number(quantity) : 0,
        category,
        description,
        image_key: imageKey,
      };
      const { data } = await axios.post("/api/products", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product added successfully!");
      setProducts((prev) => [{ ...(data || payload), id: data?.id, image: data?.image_url || imageKey }, ...prev]);
      resetForm();
      setActiveTab("list");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add product");
    }
  };

  // Quick actions
  const incStock = async (p, delta) => {
    const token = localStorage.getItem("token");
    const newStock = Math.max(0, Number(p.quantity || 0) + delta);
    try {
      await axios.patch(`/api/products/${p.id}`, { quantity: newStock }, { headers: { Authorization: `Bearer ${token}` } });
      setProducts((prev) => prev.map((it) => (it.id === p.id ? { ...it, quantity: newStock } : it)));
      toast.success("Stock updated");
    } catch {
      toast.error("Stock update failed");
    }
  };

  const toggleActive = async (p) => {
    const token = localStorage.getItem("token");
    const next = !p.active;
    try {
      await axios.patch(`/api/products/${p.id}`, { active: next }, { headers: { Authorization: `Bearer ${token}` } });
      setProducts((prev) => prev.map((it) => (it.id === p.id ? { ...it, active: next } : it)));
      toast.success(next ? "Product activated" : "Product paused");
    } catch {
      toast.error("Status update failed");
    }
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/products/${p.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts((prev) => prev.filter((it) => it.id !== p.id));
      toast.success("Product deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  // Filters
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = [...products];
    if (q) {
      arr = arr.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          String(p.price).includes(q)
      );
    }
    switch (sortBy) {
      case "price_asc":
        arr.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        arr.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "stock_desc":
        arr.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
        break;
      default:
        arr.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    return arr;
  }, [products, search, sortBy]);

  // Stats
  const totalStock = useMemo(() => products.reduce((a, p) => a + (p.quantity || 0), 0), [products]);
  const totalRevenue = useMemo(() => {
    return products.reduce((acc, p) => acc + ((p.price || 0) * (p.quantity || 0)), 0);
  }, [products]);

  if (!authChecked) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Checking session…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Farmer Dashboard</h1>
            <p className="text-gray-600">Manage your products, uploads, and inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition flex items-center gap-2"
              onClick={() => setRefreshKey((k) => k + 1)}
              title="Refresh products"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2"
              onClick={() => setActiveTab("add")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700 font-medium">Total Products</div>
                <div className="text-3xl font-bold text-green-900 mt-1">{products.length}</div>
              </div>
              <div className="bg-green-600 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl shadow-sm border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-amber-700 font-medium">Total Stock</div>
                <div className="text-3xl font-bold text-amber-900 mt-1">{totalStock}</div>
              </div>
              <div className="bg-amber-600 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl shadow-sm border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-teal-700 font-medium">Inventory Value</div>
                <div className="text-3xl font-bold text-teal-900 mt-1">₹{totalRevenue.toFixed(2)}</div>
              </div>
              <div className="bg-teal-600 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          <button
            className={`px-5 py-3 font-medium transition-all ${
              activeTab === "add"
                ? "border-b-2 border-green-600 text-green-700"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("add")}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </div>
          </button>
          <button
            className={`px-5 py-3 font-medium transition-all ${
              activeTab === "list"
                ? "border-b-2 border-green-600 text-green-700"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("list")}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              My Products ({products.length})
            </div>
          </button>
        </div>

        {activeTab === "add" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <form onSubmit={handleCreateProduct} className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Product
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Organic Tomatoes"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Vegetables</option>
                    <option>Fruits</option>
                    <option>Leafy Greens</option>
                    <option>Cereals</option>
                    <option>Dairy</option>
                    <option>Herbs</option>
                    <option>Spices</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your product..."
                  />
                </div>

                {/* Upload area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image *</label>
                  <div
                    ref={dropRef}
                    className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition cursor-pointer"
                  >
                    <input type="file" accept="image/*" onChange={handleSelectFile} className="hidden" id="filePick" />
                    
                    {preview ? (
                      <div className="space-y-3">
                        <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-green-200" />
                        <p className="text-sm text-gray-600">{file?.name} ({Math.round((file?.size || 0) / 1024)} KB)</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          Drag & drop an image here, or{" "}
                          <button
                            type="button"
                            className="text-green-700 font-semibold hover:text-green-800 underline"
                            onClick={() => document.getElementById("filePick").click()}
                          >
                            browse
                          </button>
                        </p>
                      </div>
                    )}

                    {/* Progress bar */}
                    {uploading && uploadProgress > 0 && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{uploadProgress}% uploaded</p>
                      </div>
                    )}

                    {/* Upload button */}
                    <div className="mt-4 flex items-center gap-3 justify-center">
                      <button
                        type="button"
                        onClick={uploadToS3}
                        disabled={!file || uploading}
                        className={`px-5 py-2 rounded-lg text-white font-medium transition ${
                          !file || uploading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {uploading ? "Uploading…" : imageKey ? "✓ Uploaded - Re-upload?" : "Upload to S3"}
                      </button>
                      {imageKey && !uploading && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!imageKey || uploading}
                    className={`flex-1 py-3 rounded-lg text-white font-semibold transition ${
                      imageKey && !uploading
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {uploading ? "Processing..." : !imageKey ? "Upload image first" : "Add Product"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </form>

            {/* Live preview */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live Preview
              </h2>
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={
                      preview
                        ? preview
                        : imageKey
                        ? resolveImageSrc(imageKey)
                        : "https://images.unsplash.com/photo-1602524814900-1f05e9b2a9f8?q=80&w=800&auto=format&fit=crop"
                    }
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1602524814900-1f05e9b2a9f8?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-800">{name || "Product name"}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-700">
                      {price ? `₹${price}` : "₹0.00"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Stock: {quantity || 0}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mt-3">
                    {description || "Product description will appear here. Add details to help buyers understand what makes your product special."}
                  </p>
                  <div className="pt-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        imageKey ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {imageKey ? "✓ Image ready" : "⚠ Image not uploaded"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "list" && (
          <div>
            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="created_desc">Newest First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="stock_desc">Stock: High → Low</option>
                </select>
              </div>
            </div>

            {/* List */}
            {loadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-9 bg-gray-200 rounded" />
                      <div className="h-9 bg-gray-200 rounded" />
                      <div className="h-9 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="mt-4 text-gray-600 text-lg">No products found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new product</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="relative">
                      <img
                        src={
                          p.image_url
                            ? resolveImageSrc(p.image_url)
                            : p.image
                            ? resolveImageSrc(p.image)
                            : "https://images.unsplash.com/photo-1602524814900-1f05e9b2a9f8?q=80&w=800&auto=format&fit=crop"
                        }
                        alt={p.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1602524814900-1f05e9b2a9f8?q=80&w=800&auto=format&fit=crop";
                        }}
                      />
                      <span
                        className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                          p.active === false
                            ? "bg-gray-900 text-white"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        {p.active === false ? "Paused" : "Active"}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">{p.name}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-green-700">₹{p.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {p.category}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          Stock: {p.quantity || 0}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-sm font-medium"
                            onClick={() => incStock(p, -1)}
                            title="Decrease stock"
                          >
                            −1
                          </button>
                          <button
                            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-sm font-medium"
                            onClick={() => incStock(p, +1)}
                            title="Increase stock"
                          >
                            +1
                          </button>
                          <button
                            className={`px-3 py-2 rounded-lg text-white text-sm font-medium transition ${
                              p.active === false
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-gray-600 hover:bg-gray-700"
                            }`}
                            onClick={() => toggleActive(p)}
                            title={p.active === false ? "Activate product" : "Pause product"}
                          >
                            {p.active === false ? "Activate" : "Pause"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <button
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                            onClick={() => deleteProduct(p)}
                          >
                            Delete
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                            onClick={() => {
                              navigator.clipboard?.writeText(resolveImageSrc(p.image_url || p.image || ""));
                              toast.success("Image URL copied!");
                            }}
                          >
                            Copy URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}