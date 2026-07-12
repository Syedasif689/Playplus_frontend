const CLOUDINARY_CLOUD_NAME = "duvjw7dti";
const CLOUDINARY_UPLOAD_PRESET = "playplus_uploads";

export const uploadToCloudinary = async (
    file,
    resourceType = "image",
    folder = "playplus"
) => {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error("Cloudinary upload failed");
    }

    const data = await response.json();

    return data.secure_url;
};