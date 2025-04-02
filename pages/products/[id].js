import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../components/Layout";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios
        .get(`http://localhost:5000/products/${id}`)
        .then((res) => {
          setProduct(res.data);
          setError(null);
        })
        .catch((err) => {
          console.error("Error fetching product:", err);
          setError("Failed to load product details");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const addToCart = async () => {
    setAddingToCart(true);
    try {
      await axios.post(
        "http://localhost:5000/cart",
        { product_id: id, quantity },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Product added to cart successfully!");
    } catch (error) {
      console.error("Add to cart failed:", error);
      alert(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading product details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <h3 style={styles.errorTitle}>Product Not Found</h3>
          <p style={styles.errorText}>{error || "The product you're looking for doesn't exist."}</p>
          <button 
            onClick={() => router.push("/products")} 
            style={styles.backButton}
          >
            Browse Products
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <button 
          onClick={() => router.push("/products")} 
          style={styles.backButton}
        >
          ← Back to Products
        </button>

        <div style={styles.productContainer}>
          {/* Product Image Gallery */}
          <div style={styles.imageContainer}>
            <div style={styles.imageWrapper}>
              <img 
                src={product.image_url || '/placeholder-product.jpg'} 
                alt={product.name} 
                style={styles.productImage}
                onError={(e) => {
                  e.target.src = '/placeholder-product.jpg'
                }}
              />
            </div>
          </div>

          {/* Product Details */}
          <div style={styles.detailsContainer}>
            <div style={styles.detailsContent}>
              <h1 style={styles.productName}>{product.name}</h1>
              
              <div style={styles.priceContainer}>
                <span style={styles.currentPrice}>₹{product.price}</span>
                {product.original_price && (
                  <span style={styles.originalPrice}>₹{product.original_price}</span>
                )}
              </div>

              {product.rating && (
                <div style={styles.ratingContainer}>
                  <div style={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={i < product.rating ? styles.starFilled : styles.starEmpty}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span style={styles.ratingText}>{product.rating}/5</span>
                </div>
              )}

              <p style={styles.productDescription}>{product.description}</p>

              {product.specifications && (
                <div style={styles.specsContainer}>
                  <h3 style={styles.specsTitle}>Specifications</h3>
                  <ul style={styles.specsList}>
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <li key={key} style={styles.specItem}>
                        <span style={styles.specKey}>{key}:</span>
                        <span style={styles.specValue}>{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity Selector */}
              <div style={styles.quantityContainer}>
                <span style={styles.quantityLabel}>Quantity:</span>
                <div style={styles.quantityControls}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    style={styles.quantityButton}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span style={styles.quantityValue}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    style={styles.quantityButton}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCart}
                disabled={addingToCart}
                style={addingToCart ? styles.addToCartButtonDisabled : styles.addToCartButton}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>

              {/* Additional Info */}
              <div style={styles.infoContainer}>
                <div style={styles.infoItem}>
                  
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoIcon}>↩️</span>
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#f8fafc',
    color: '#4a5568',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    marginBottom: '30px',
    ':hover': {
      backgroundColor: '#edf2f7',
    },
  },
  productContainer: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    gap: '40px',
  },
  imageContainer: {
    flex: '1',
    position: 'relative',
  },
  imageWrapper: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    backgroundColor: '#f8fafc',
    paddingTop: '75%',
    position: 'relative',
  },
  productImage: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  detailsContainer: {
    flex: '1',
    maxWidth: ['100%', '500px'],
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  productName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2d3748',
    margin: '0',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  currentPrice: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#2f855a',
  },
  originalPrice: {
    fontSize: '18px',
    color: '#a0aec0',
    textDecoration: 'line-through',
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stars: {
    display: 'flex',
  },
  starFilled: {
    color: '#f6ad55',
    fontSize: '18px',
  },
  starEmpty: {
    color: '#e2e8f0',
    fontSize: '18px',
  },
  ratingText: {
    fontSize: '14px',
    color: '#718096',
  },
  productDescription: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#4a5568',
    margin: '0',
  },
  specsContainer: {
    marginTop: '10px',
  },
  specsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '12px',
  },
  specsList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  specItem: {
    display: 'flex',
    gap: '8px',
  },
  specKey: {
    fontWeight: '500',
    color: '#4a5568',
    minWidth: '120px',
  },
  specValue: {
    color: '#718096',
  },
  quantityContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginTop: '20px',
  },
  quantityLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#4a5568',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  quantityButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#edf2f7',
    },
    ':disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  quantityValue: {
    minWidth: '30px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '500',
  },
  addToCartButton: {
    padding: '14px',
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '20px',
    ':hover': {
      backgroundColor: '#38a169',
    },
  },
  addToCartButtonDisabled: {
    padding: '14px',
    backgroundColor: '#a0aec0',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed',
    marginTop: '20px',
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #edf2f7',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4a5568',
  },
  infoIcon: {
    fontSize: '18px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gap: '20px',
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    borderLeftColor: '#48bb78',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: '#4a5568',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '300px',
    gap: '16px',
    padding: '40px',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2d3748',
    margin: '0',
  },
  errorText: {
    fontSize: '16px',
    color: '#718096',
    margin: '0',
  },
};