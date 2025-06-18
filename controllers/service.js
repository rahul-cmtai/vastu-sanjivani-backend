const mongoose = require("mongoose");
const ServiceCategory = require("../model/Service");
const { s3Client, upload, deleteFromS3 } = require("../config/s3Config"); // Updated to use S3 config
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/**
 * Helper function to upload a file buffer to S3.
 * @param {Buffer} fileBuffer The file buffer from multer's memoryStorage.
 * @param {string} folderName The folder name in S3.
 * @param {string} originalName The original file name.
 * @returns {Promise<object>} The upload result.
 */
const uploadToS3 = async (fileBuffer, folderName, originalName) => {
  try {
    const key = `${folderName}/${Date.now()}-${originalName}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: 'image/jpeg', // You may want to detect this dynamically
    };
    
    await s3Client.send(new PutObjectCommand(params));
    
    // Construct the URL (this is the S3 URL format)
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    return { 
      url: url,
      key: key
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
};

// @desc    Create a new Service Category
exports.createServiceCategory = async (req, res) => {
  try {
    const { name, slug, description, isActive, subServicesData } = req.body;

    if (!name || !slug || !description) return res.status(400).json({ error: "Missing required fields." });
    const existingService = await ServiceCategory.findOne({ $or: [{ name }, { slug }] });
    if (existingService) return res.status(400).json({ error: "A service with this name or slug already exists." });

    let parsedSubServices = subServicesData ? JSON.parse(subServicesData) : [];

    let mainImageUploadResult = null;
    const subServiceImageUploadResults = new Array(parsedSubServices.length).fill(null);

    const uploadPromises = (req.files || []).map(async file => {
      const folderName = file.fieldname === 'mainImage' ? "services/main" : "services/sub";
      try {
        const result = await uploadToS3(file.buffer, folderName, file.originalname);
        if (file.fieldname === 'mainImage') {
          mainImageUploadResult = result;
        } else if (file.fieldname.startsWith('subServiceImage_')) {
          const index = parseInt(file.fieldname.split("_")[1]);
          if(index < subServiceImageUploadResults.length) subServiceImageUploadResults[index] = result;
        }
      } catch (error) {
        console.error(`Error uploading ${file.fieldname}:`, error);
      }
    });
    await Promise.all(uploadPromises);

    if (!mainImageUploadResult) return res.status(400).json({ error: "Main image is required." });

    const finalSubServices = parsedSubServices.map((sub, index) => {
      const uploadResult = subServiceImageUploadResults[index];
      return {
        ...sub,
        imageUrl: uploadResult ? uploadResult.url : null,
        imageKey: uploadResult ? uploadResult.key : null,
      };
    });

    const newServiceCategory = new ServiceCategory({
      name, slug, description,
      mainImage: mainImageUploadResult.url,
      mainImageKey: mainImageUploadResult.key,
      subServices: finalSubServices,
      isActive: isActive === "true",
    });

    const savedServiceCategory = await newServiceCategory.save();
    res.status(201).json({ message: "Service created successfully", data: savedServiceCategory });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in createServiceCategory:", error);
    res.status(500).json({ error: "Server error while creating service.", errorMessage: error.message });
  }
};

// @desc    Update an existing Service Category
exports.updateServiceCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid Service ID." });

    const { name, slug, description, isActive, subServicesData } = req.body;
    
    const serviceToUpdate = await ServiceCategory.findById(id);
    if (!serviceToUpdate) return res.status(404).json({ error: "Service not found." });
    
    let parsedSubServices = subServicesData ? JSON.parse(subServicesData) : [];

    const mainImageFile = (req.files || []).find(f => f.fieldname === 'mainImage');
    if (mainImageFile) {
        await deleteFromS3(serviceToUpdate.mainImageKey);
        const result = await uploadToS3(mainImageFile.buffer, "services/main", mainImageFile.originalname);
        serviceToUpdate.mainImage = result.url;
        serviceToUpdate.mainImageKey = result.key;
    }

    const finalSubServices = [];
    const incomingSubServiceIds = new Set(parsedSubServices.map(sub => sub._id).filter(Boolean));

    for (const oldSub of serviceToUpdate.subServices) {
        if (!incomingSubServiceIds.has(oldSub._id.toString())) {
            await deleteFromS3(oldSub.imageKey);
        }
    }
    
    for (const [index, subData] of parsedSubServices.entries()) {
        const newImageFile = (req.files || []).find(f => f.fieldname === `subServiceImage_${index}`);
        const oldSub = subData._id ? serviceToUpdate.subServices.find(s => s._id.toString() === subData._id) : null;
        
        let imageUrl = subData.imageUrl;
        let imageKey = oldSub ? oldSub.imageKey : null;

        if (newImageFile) {
            if (oldSub && oldSub.imageKey) await deleteFromS3(oldSub.imageKey);
            const result = await uploadToS3(newImageFile.buffer, "services/sub", newImageFile.originalname);
            imageUrl = result.url;
            imageKey = result.key;
        } else if (oldSub && !subData.imageUrl) {
            await deleteFromS3(oldSub.imageKey);
            imageUrl = null;
            imageKey = null;
        }
        
        finalSubServices.push({
            _id: subData._id || new mongoose.Types.ObjectId(),
            name: subData.name, slug: subData.slug, description: subData.description,
            imageUrl, imageKey,
        });
    }

    serviceToUpdate.name = name;
    serviceToUpdate.slug = slug;
    serviceToUpdate.description = description;
    serviceToUpdate.isActive = isActive === "true";
    serviceToUpdate.subServices = finalSubServices;
    
    const updatedService = await serviceToUpdate.save();
    res.status(200).json({ message: "Service updated successfully", data: updatedService });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in updateServiceCategory:", error);
    res.status(500).json({ error: "Server error while updating service.", errorMessage: error.message });
  }
};

// @desc    Delete a Service Category
exports.deleteServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID." });
        
        const service = await ServiceCategory.findById(id);
        if (!service) return res.status(404).json({ error: "Service not found." });

        await deleteFromS3(service.mainImageKey);
        for (const sub of service.subServices) {
            if (sub.imageKey) {
                await deleteFromS3(sub.imageKey);
            }
        }

        await service.deleteOne();
        res.status(200).json({ message: "Service deleted successfully." });

    } catch (error) {
        console.error("!!! CRITICAL ERROR in deleteServiceCategory:", error);
        res.status(500).json({ error: "Server error." });
    }
};

// @desc    Find all Service Categories (for admin)
exports.findAllServiceCategories = async (req, res) => {
  try {
    const services = await ServiceCategory.find({}).sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    console.error("!!! CRITICAL ERROR in findAllServiceCategories:", error);
    res.status(500).json({ error: "Server error while fetching services." });
  }
};

// @desc    Get all ACTIVE Service Categories (for public website)
exports.getAllPublicServiceCategories = async (req, res) => {
    try {
        const services = await ServiceCategory.find({ isActive: true }).sort({ name: 1 });
        res.status(200).json(services);
    } catch (error) {
        console.error("!!! CRITICAL ERROR in getAllPublicServiceCategories:", error);
        res.status(500).json({ error: "Server error while fetching public services." });
    }
};

// @desc    Get a single active Service Category by slug
exports.getServiceCategoryBySlugOrId = async (req, res) => {
  try {
    const { slugOrId } = req.params;
    
    // Primarily find by slug, as that's the main use case for public detail pages.
    // Also, ensure the service is active.
    const service = await ServiceCategory.findOne({ 
        slug: slugOrId,
        isActive: true 
    });
    
    // If found, return it.
    if (service) {
      return res.status(200).json(service);
    }
    
    // If not found by slug, maybe it was an ID? (Less likely but good to support)
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
        const serviceById = await ServiceCategory.findOne({ 
            _id: slugOrId, 
            isActive: true 
        });
        if (serviceById) {
            return res.status(200).json(serviceById);
        }
    }

    // If no active service is found by either slug or ID, return 404.
    return res.status(404).json({ error: "Service not found or is not currently active." });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in getServiceCategoryBySlugOrId:", error);
    res.status(500).json({ error: "Server error while fetching the service details." });
  }
};
