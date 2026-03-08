import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, updateDoc, collection, deleteField } from 'firebase/firestore';
import { storage, db, isFirebaseConfigured } from '../lib/firebase';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminProductForm() {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('clothing');
  const [images, setImages] = useState<{
    id: string;
    url: string;
    file?: File;
    isPrimary: boolean;
  }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing && !authLoading && user?.isAdmin) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, 'products', id!);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name);
            setDescription(data.description || '');
            setPrice(data.price.toString());
            setOriginalPrice(data.originalPrice ? data.originalPrice.toString() : '');
            setCategory(data.category);
            
            let imgs: string[] = data.images || [];
            if (imgs.length === 0 && data.imageUrl) {
              imgs = [data.imageUrl];
            }
            
            setImages(imgs.map((url, index) => ({
              id: `existing-${index}`,
              url,
              isPrimary: index === 0
            })));
          } else {
            toast.error('Product not found');
            setError('Product not found');
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to load product for editing');
          setError('Failed to load product for editing');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [id, isEditing, authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <Loader2 className="h-12 w-12 animate-spin text-[#CCFF00]" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-black font-display text-white mb-4 uppercase tracking-wider text-3d">Access Denied</h1>
        <p className="text-gray-400 font-mono mb-8">You need host privileges to access this page.</p>
        <Link to="/" className="bg-[#CCFF00] text-black font-black font-display uppercase tracking-wider px-8 py-3 rounded-full hover:bg-white transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleAddUrl = () => {
    if (imageUrlInput.trim()) {
      const newImage = {
        id: `url-${Date.now()}`,
        url: imageUrlInput.trim(),
        isPrimary: images.length === 0
      };
      setImages(prev => [...prev, newImage]);
      setImageUrlInput('');
      toast.success('Image URL added');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files as FileList);
      const newImages = selectedFiles.map(file => ({
        id: `new-${Date.now()}-${file.name}`,
        url: URL.createObjectURL(file as File),
        file,
        isPrimary: images.length === 0
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // If we removed the primary, set the first one as primary
      if (prev.find(img => img.id === id)?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimary = (id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === id
    })));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast.error('Product must have at least one image');
      setError('Product must have at least one image');
      return;
    }
    
    if (!name || !price || !category) {
      toast.error('Please fill in all required fields');
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // 1. Upload new images to Firebase Storage or convert to Base64
      const finalImages = await Promise.all(images.map(async (img) => {
        if (img.file) {
          // Helper to compress and convert to Base64
          const toBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  let width = img.width;
                  let height = img.height;
                  const maxDim = 800; // Resize to max 800px
                  
                  if (width > height) {
                    if (width > maxDim) {
                      height *= maxDim / width;
                      width = maxDim;
                    }
                  } else {
                    if (height > maxDim) {
                      width *= maxDim / height;
                      height = maxDim;
                    }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return reject('No canvas context');
                  ctx.drawImage(img, 0, 0, width, height);
                  
                  // Compress as JPEG with 0.7 quality
                  resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = () => reject('Failed to load image');
                img.src = e.target?.result as string;
              };
              reader.onerror = () => reject('Failed to read file');
              reader.readAsDataURL(file);
            });
          };

          if (isFirebaseConfigured) {
            try {
              const url = await new Promise<string>((resolve, reject) => {
                const storageRef = ref(storage, `products/${Date.now()}_${img.file!.name}`);
                const uploadTask = uploadBytesResumable(storageRef, img.file!);

                let isTimedOut = false;
                // Add a timeout to prevent infinite hanging
                const timeoutId = setTimeout(() => {
                  if (uploadTask.snapshot.state === 'running') {
                    isTimedOut = true;
                    uploadTask.cancel();
                  }
                  reject('Upload timed out');
                }, 15000); // Reduced to 15 seconds timeout

                uploadTask.on(
                  'state_changed',
                  (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                  },
                  (error) => {
                    clearTimeout(timeoutId);
                    // Ignore cancellation error if it was caused by our timeout
                    if (error.code === 'storage/canceled' && isTimedOut) {
                      console.warn('Upload canceled due to timeout');
                      return;
                    }
                    console.error('Upload error:', error);
                    reject('Failed to upload image to Firebase');
                  },
                  async () => {
                    try {
                      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                      clearTimeout(timeoutId);
                      resolve(downloadUrl);
                    } catch (err) {
                      clearTimeout(timeoutId);
                      console.error('Get download URL error:', err);
                      reject('Failed to get download URL');
                    }
                  }
                );
              });
              return { ...img, url };
            } catch (err) {
              console.warn('Firebase upload failed, falling back to Base64:', err);
              toast('Upload issue detected. Switching to offline mode for this image.', { icon: '⚠️' });
              const base64Url = await toBase64(img.file);
              return { ...img, url: base64Url };
            }
          } else {
            // Fallback: Convert to Base64
            const url = await toBase64(img.file);
            setUploadProgress(100); // Instant upload for base64
            return { ...img, url };
          }
        }
        return img;
      }));

      const mainImageUrl = finalImages.find(img => img.isPrimary)?.url || finalImages[0].url;
      const imageUrls = finalImages.map(img => img.url);

      // Calculate discount percentage if original price is provided
      let discountPercentage = 0;
      if (originalPrice && Number(originalPrice) > Number(price)) {
        discountPercentage = Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100);
      }

      // 3. Save or update product in database
      const productData: any = {
        name,
        description,
        price: Number(price),
        category,
        imageUrl: mainImageUrl,
        images: imageUrls,
        stock: 100, // Default stock
      };

      if (originalPrice && Number(originalPrice) > 0) {
        productData.originalPrice = Number(originalPrice);
      } else if (isEditing) {
        productData.originalPrice = deleteField();
      }
      if (discountPercentage > 0) {
        productData.discountPercentage = discountPercentage;
      } else if (isEditing) {
        productData.discountPercentage = deleteField();
      }

      if (isEditing) {
        const docRef = doc(db, 'products', id!);
        await updateDoc(docRef, productData);
        toast.success('Product updated successfully!');
        navigate(`/product/${id}`);
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, {
          ...productData,
          createdAt: new Date().toISOString()
        });
        toast.success('Product added successfully!');
        navigate(`/product/${newDocRef.id}`);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = typeof err === 'string' ? err : 'An unexpected error occurred';
      toast.error(errorMsg);
      setError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] rounded-[2rem] p-8 md:p-12 border-2 border-white/10 shadow-[8px_8px_0px_rgba(204,255,0,0.15)]"
      >
        <div className="mb-10">
          <h1 className="text-4xl font-black font-display text-white uppercase tracking-wider mb-2 text-3d">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-400 font-mono">
            {isEditing ? 'Update the details and change the images.' : 'Upload images and add heat to the store.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-8 text-sm font-mono text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-bold font-mono text-gray-300 uppercase tracking-wider">Product Images</label>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {images.map((img, index) => (
                  <div key={img.id} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${img.isPrimary ? 'border-[#CCFF00]' : 'border-white/20'} group`}>
                    <img src={img.url} alt={`Image ${index}`} className="w-full h-full object-cover" />
                    
                    {img.isPrimary && (
                      <div className="absolute top-2 left-2 bg-[#CCFF00] text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-lg z-10">
                        Primary
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <button type="button" onClick={() => removeImage(img.id)} className="text-white hover:text-red-500"><X className="w-5 h-5" /></button>
                        {!img.isPrimary && <button type="button" onClick={() => setPrimary(img.id)} className="text-white hover:text-[#CCFF00] text-xs font-bold">PRIMARY</button>}
                      </div>
                      <div className="flex justify-between">
                        <button type="button" onClick={() => moveImage(index, 'up')} disabled={index === 0} className="text-white disabled:opacity-30">←</button>
                        <button type="button" onClick={() => moveImage(index, 'down')} disabled={index === images.length - 1} className="text-white disabled:opacity-30">→</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste image URL here..."
                    className="flex-1 bg-black border-2 border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#CCFF00] transition-colors font-mono text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddUrl}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase transition-colors"
                  >
                    Add URL
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase">OR</span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>
              </div>

              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isSubmitting}
                />
                <div className="w-full py-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 overflow-hidden border-white/20 bg-white/5 group-hover:border-white/40 group-hover:bg-white/10">
                  <div className="text-center px-6">
                    <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-white font-bold mb-1 text-sm">Add more images</p>
                  </div>
                  
                  {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm z-20">
                      <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin mb-4" />
                      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                        <div className="bg-[#CCFF00] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <p className="text-[#CCFF00] font-mono text-sm">{Math.round(uploadProgress)}% Uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold font-mono text-gray-300 uppercase tracking-wider mb-2">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00] transition-colors font-mono"
                  placeholder="e.g. Neon Cyber Sneakers"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold font-mono text-gray-300 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-black border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00] transition-colors font-mono resize-none"
                  placeholder="Describe the heat..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold font-mono text-gray-300 uppercase tracking-wider mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-black border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00] transition-colors font-mono"
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold font-mono text-gray-300 uppercase tracking-wider mb-2">Original Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-black border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00] transition-colors font-mono"
                    placeholder="Optional"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold font-mono text-gray-300 uppercase tracking-wider mb-2">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00] transition-colors font-mono appearance-none"
                  disabled={isSubmitting}
                >
                  <option value="clothing">Clothing</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessories">Accessories</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="bags">Bags</option>
                  <option value="home">Home</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#CCFF00] text-black font-black font-display text-xl uppercase tracking-wider py-4 rounded-xl hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,255,0,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {isEditing ? 'Updating...' : 'Uploading & Saving...'}
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  {isEditing ? 'Save Changes' : 'Add Product to Store'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
