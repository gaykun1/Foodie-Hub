// func for uploading image into the cloud ,then returning url of image

export const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Images");

  const res = await fetch("https://api.cloudinary.com/v1_1/dv3j72lqn/image/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Cloudinary error:", data);
    return null;
  }

  return data.secure_url || null;
};