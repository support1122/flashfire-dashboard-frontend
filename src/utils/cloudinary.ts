// Local file upload configuration
export const FILE_UPLOAD_CONFIG = {
  apiUrl: import.meta.env.VITE_API_BASE_URL,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
};

export async function uploadFileLocally(file: File, fileType: 'resume' | 'coverLetter' | 'transcript'): Promise<string> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userAuth = JSON.parse(localStorage.getItem('userAuth') || '{}');
  const token = userAuth.token;
  const email = userAuth.userDetails?.email;
  
  if (!token || !email) {
    throw new Error("Authentication required");
  }

  // Create FormData for file upload (use Cloudinary endpoint)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('email', email);
  formData.append('token', token);
  formData.append('userDetails', JSON.stringify(userAuth.userDetails));

  const response = await fetch(`${API_BASE_URL}/upload-profile-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
