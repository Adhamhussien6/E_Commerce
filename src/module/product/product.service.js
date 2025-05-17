import slugify from "slugify";
import brandmodel from "../../DB/models/barand.model.js";
import categorymodel from "../../DB/models/category.model.js";
import productmodel from "../../DB/models/product.model.js";
import subcategorymodel from "../../DB/models/subcategory.model.js";
import { productStatus, userRole } from "../../middleware/ENum.js";
import cloudinary from "../../utils/cloudinary/index.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";
import { pagination } from "../../utils/feature/pagination.js";
import usermodel from "../../DB/models/user.model.js";


export const addProduct=asynchandler(async(req,res,next)=>{
    const {name,description,price,discount,quantity,stock,category,subcategory,brand}=req.body

    const categoryExist=await categorymodel.findById(category)
    if(!categoryExist){
        return res.status(400).json({message:"category not found"})
    }
    const subcategoryExist=await subcategorymodel.findById(subcategory)
    if(!subcategoryExist){
        return res.status(400).json({message:"subcategory not found"})
    }
    if (subcategoryExist.category.toString() !== categoryExist._id.toString()) {
      return res.status(400).json({ message: "Subcategory does not belong to the selected category" });
    }
   
    const brandExist=await brandmodel.findById(brand)
    if(!brandExist){
        return res.status(400).json({message:"brand not found"})
    }
    if (brandExist.subcategory.toString() !== subcategoryExist._id.toString()) {
      return res.status(400).json({ message: "Brand does not belong to the selected subcategory" });
    }

    const storeName = req.user.role === userRole.vendor ? req.user.storeName : null; 
    const status= req.user.role === userRole.vendor ? productStatus.pending : productStatus.approved; 
    
 

  

   
      let image = null; 
      

      if (req.files && req.files['image']) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.files['image'][0].path, {
          folder: `ecommerce_express/category/${categoryExist.name}/subcategory/${subcategoryExist.name}/brand/${brandExist.name}/products/${name}`,
        });
    
        image = { secure_url, public_id };  
      }

      let images = [];
      if (req.files && req.files['images']) {
       
        for (let i = 0; i < req.files['images'].length; i++) {
          const file = req.files['images'][i];
          
         
          const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
            folder:  `ecommerce_express/category/${categoryExist.name}/subcategory/${subcategoryExist.name}/brand/${brandExist.name}/products/${name}/subImages`,
          });
    
         
          images.push({ secure_url, public_id });
        }
      }
   
    
  
     


    const subPrice = price - (price * discount / 100)

   

    const newproduct = await productmodel.create({
        name,
        description,
        price,
        subPrice,
        category,
        subcategory,
        brand,
        image,
        images,
        quantity,
        discount,
        stock,
        storeName,
        status,
        addedBy:req.user._id,
        slug:slugify(name, { lower: true, strict: true })
    });

if(req.user.role===userRole.admin){
    await brandmodel.findByIdAndUpdate(
            brand, 
            { $push: { product: newproduct._id } },
            { new: true } 
          );
        }      

const responseMessage = req.user.role === userRole.admin
? { message: "Product created successfully.", newproduct }
: { message: "Product is pending approval.", newproduct };

return res.status(201).json(responseMessage);


})

export const approveProduct=asynchandler(async(req,res,next)=>{
    const {id}=req.params
    const product=await productmodel.findOne({_id:id ,status:productStatus.pending})
    if(!product){
        return res.status(400).json({message:"product not found"})
      }
      await productmodel.findByIdAndUpdate(
        id, 
        { $set: { status: productStatus.approved } ,isApprovedBy:req.user._id },
        { new: true }
      );
      await brandmodel.findByIdAndUpdate(
        product.brand, 
        { $push: { product: product._id } },
        { new: true }
      );
      return res.status(200).json({message:"product is approved"})
})

export const rejectProduct=asynchandler(async(req,res,next)=>{
    const {id}=req.params
    const product=await productmodel.findOne({_id:id ,status:productStatus.pending})
    if(!product){
        return res.status(400).json({message:"product not found"})
      }
      await productmodel.findByIdAndUpdate(
        id, 
        { $set: { status: productStatus.reject } },
        { new: true }
      );
      return res.status(200).json({message:"product is rejected"})
})

export const softdeleteProduct=asynchandler(async(req,res)=>{
    const {id}=req.params
    const product=await productmodel.findOne({_id:id,status:productStatus.approved,isDeleted:false})
    if(!product){
        return res.status(400).json({message:"product not found"})
      }
      if(req.user.role === userRole.admin || (req.user.role === userRole.vendor && req.user._id.equals(product.addedBy))){
        await productmodel.findByIdAndUpdate(
          id, 
          {isDeleted:true,deletedBy:req.user._id,deletedAt:Date.now()},
          { new: true }
        );
        return res.status(200).json({message:"product is soft deleted"})
      }else{
        return res.status(400).json({message:"you are not authorized to delete this product"})
      }



})

export const restoreProduct = asynchandler(async (req, res) => {
  const { id } = req.params;

  const product = await productmodel.findOne({ _id: id,Status: productStatus.approved, isDeleted: true });

  if (!product) {
    return res.status(404).json({ message: "Product not found or not deleted" });
  }

  if (req.user.role === userRole.vendor) {
  
    if (!req.user._id.equals(product.addedBy) || !req.user._id.equals(product.deletedBy)) {
      return res.status(403).json({ message: "You are not authorized to restore this product" });
    }
  }


  await productmodel.findByIdAndUpdate(
    id,
    {
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
    },
    { new: true }
  );

  return res.status(200).json({ message: "Product has been restored successfully" });
});

export const deleteProduct = asynchandler(async (req, res) => {
  const { id } = req.params;
  const product = await productmodel.findOne({_id:id,status:productStatus.approved,isDeleted:false})
  if(!product){
      return res.status(400).json({message:"product not found"})
    }
    if (req.user.role === userRole.vendor && !req.user._id.equals(product.addedBy)) {
      return res.status(403).json({ message: "You are not authorized to delete this product" });
    }
    await brandmodel.findByIdAndUpdate(
      product.brand,
      { $pull: { product: product._id } } 
    );
    await productmodel.findByIdAndDelete(id)
    return res.status(200).json({message:"product has been deleted"})

})

export const updateProduct = asynchandler(async (req, res) => {
  const { id } = req.params;
  const {
    name, description, price, discount, stock, quantity
  } = req.body;

  const product = await productmodel.findOne({
    _id: id,
    status: productStatus.approved,
    isDeleted: false,
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const updates = {};

  // Vendor logic
 

    if (name && name !== product.name) {
      updates.name = name;
      updates.slug = slugify(name, { lower: true, strict: true });
    } else if (name === product.name) {
      return res.status(400).json({ message: "Name already the same" });
    }

    if (description && description !== product.description) {
      updates.description = description;
    } else if (description === product.description) {
      return res.status(400).json({ message: "Description already the same" });
    }

    if (quantity && parseInt(quantity) !== product.quantity) {
      updates.quantity = parseInt(quantity);
    } else if (quantity == product.quantity) {
      return res.status(400).json({ message: "Quantity already the same" });
    }


    if (stock && parseInt(stock) !== product.stock) {
      if (parseInt(stock) > (updates.quantity || product.quantity)) {
        return res.status(400).json({ message: "Stock cannot be greater than quantity" });
      }
      updates.stock = parseInt(stock);
    } else if (stock == product.stock) {
      return res.status(400).json({ message: "Stock already the same" });
    }


    if (price && discount) {
      updates.subPrice = price - (price * ((discount || 0) / 100));
      updates.discount = discount;
      updates.price = price;
    } else if (price) {
      updates.subPrice = price - (price * ((product.discount || 0) / 100));
      updates.price = price;
    } else if (discount) {
      updates.subPrice = product.price - (product.price * ((discount || 0) / 100));
      updates.discount = discount;
    }
  
    if (req.user.role === userRole.vendor) {
      if (!req.user._id.equals(product.addedBy)) {
        return res.status(403).json({ message: "You are not authorized to update this product" });
      }

      const existingPending = product.pendingUpdate || {};
      const mergedPending = { ...existingPending, ...updates };



    await productmodel.findByIdAndUpdate(id, {
      pendingUpdate: mergedPending,
      hasPendingUpdate: true,
    });

    return res.status(200).json({ message: "Update request is pending admin approval" });
    }

  // Admin logic
  if (req.user.role === userRole.admin) {
    if (!req.user._id.equals(product.addedBy)) {
      return res.status(403).json({ message: "You can't update this product" });
    }
    const updatedProduct = await productmodel.findByIdAndUpdate(id, {
      $set: updates,
      updatedBy: req.user._id,
      
    }, { new: true });

    return res.status(200).json({ message: "Product updated by admin", updatedProduct });
  }

  return res.status(403).json({ message: "Unauthorized" });
});

export const approveProductUpdate = asynchandler(async (req, res) => {
  const { id } = req.params;

  const product = await productmodel.findById(id);
  if (!product || !product.hasPendingUpdate) {
    return res.status(400).json({ message: "No pending update to approve" });
  }

  await productmodel.findByIdAndUpdate(id, {
    ...product.pendingUpdate,
    pendingUpdate: null,
    hasPendingUpdate: false,
    updatedBy: product.addedBy
  });

  return res.status(200).json({ message: "Pending update has been approved" });
});

export const rejectProductUpdate = asynchandler(async (req, res) => {
  const { id } = req.params;

  const product = await productmodel.findById(id);
  if (!product || !product.hasPendingUpdate) {
    return res.status(400).json({ message: "No pending update to reject" });
  }

  await productmodel.findByIdAndUpdate(id, {
    pendingUpdate: null,
    hasPendingUpdate: false,
  });

  return res.status(200).json({ message: "Pending update has been rejected" });
});

export const getAllPendingUpdates = asynchandler(async (req, res) => {
  const { page, limit, search } = req.query;

  const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:false,status:productStatus.approved,hasPendingUpdate:true } : {isDeleted:false,status:productStatus.approved,hasPendingUpdate:true };

  const result = await pagination({
      model: productmodel,
      page,
      limit,
      filter,
      select:"name pendingUpdate storeName category subcategory brand ",
      populate: [{ path: "addedBy", select: "firstName lastName" },
         { path: "updatedBy", select: "name" },
      ],
      sort: { createdAt: 1 },
  })
  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching pending updates found for your search"
        : "There are no products with pending updates",
    });
  }

  return res.status(200).json({
    message: "All pending updates fetched successfully",
    result,
  });
  
});

export const getAllProductsRequests = asynchandler(async (req, res) => {
  const { page, limit, search } = req.query;

  const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:false,status:productStatus.pending } : {isDeleted:false,status:productStatus.pending };

  const result = await pagination({
      model: productmodel,
      page,
      limit,
      filter,
      select:"name storeName category subcategory brand ",
      populate: [{ path: "addedBy", select: "firstName lastName" },
       
      ],
      sort: { createdAt: 1 },
  })
  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching product requests found for your search"
        : "There are no requests for products",
    });
  }

  return res.status(200).json({
    message: "All product requests fetched successfully",
    result,
  });
  
});

export const getAllRejectedProducts = asynchandler(async (req, res) => {
  const { page, limit, search } = req.query;

  const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:false,status:productStatus.reject } : {isDeleted:false,status:productStatus.reject };

  const result = await pagination({
      model: productmodel,
      page,
      limit,
      filter,
      select:"name storeName category subcategory brand ",
      populate: [{ path: "addedBy", select: "firstName lastName" },
       
      ],
      sort: { createdAt: 1 },
  })
  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching rejected product found for your search"
        : "There are no requests for products",
    });
  }

  return res.status(200).json({
    message: "All rejected product fetched successfully",
    result,
  });
  
});

export const getAllProducts = asynchandler(async (req, res) => {
  const { page, limit, search } = req.query;

  const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:false,status:productStatus.approved } : {isDeleted:false,status:productStatus.approved };

  const result = await pagination({
      model: productmodel,
      page,
      limit,
      filter,
      populate: [{ path: "addedBy", select: "firstName lastName" },
       
         { path: "brand", select: "name" }
       
      ],
      sort: { createdAt: 1 },
  })
  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching product found for your search"
        : "There are no products",
    });
  }

  return res.status(200).json({
    message: "All product fetched successfully",
    result,
  });
  
});

export const getAllDeletedProducts = asynchandler(async (req, res) => {
  const { page, limit, search } = req.query;

  const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:true,status:productStatus.approved } : {isDeleted:true,status:productStatus.approved };

  const result = await pagination({
      model: productmodel,
      page,
      limit,
      filter,
      populate: [{ path: "addedBy", select: "firstName lastName" },
       
      ],
      sort: { createdAt: 1 },
  })
  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching deleted product found for your search"
        : "There are no deletd products",
    });
  }

  return res.status(200).json({
    message: "All deleted product fetched successfully",
    result,
  });
  
});

export const getAllProductForVendor = asynchandler(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const { vendorId } = req.params;

 
  const vendor = await usermodel.findOne({
    _id: vendorId,
    role: userRole.vendor,
    isdeleted: false,
    isApprovedAsVendor: true,
    isConfirmed: true,
    isbanned: false,
  });

  if (!vendor) {
    return res.status(400).json({ message: "Vendor not found" });
  }


  const filter = {
    isDeleted: false,
    addedBy: vendorId,
  };

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  if (status) {
    const validStatuses = ["pending", "approved", "reject"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    filter.status = status;
  }

  const approvedCount = await productmodel.countDocuments({
    isDeleted: false,
    addedBy: vendorId,
    status: "approved",
  });

  const pendingCount = await productmodel.countDocuments({
    isDeleted: false,
    addedBy: vendorId,
    status: "pending",
  });

  const rejectedCount = await productmodel.countDocuments({
    isDeleted: false,
    addedBy: vendorId,
    status: "reject",
  });

  const result = await pagination({
    model: productmodel,
    page,
    limit,
    filter,
    sort: { createdAt: -1 },
  });

  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching product found for your search"
        : "There are no products",
        counts: {
          approved: approvedCount,
          pending: pendingCount,
          rejected: rejectedCount,
        },
    });
  }

  return res.status(200).json({
    message: "Vendor products fetched successfully",
    result,
    counts: {
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedCount,
    },
  });
});

export const getMyProducts = asynchandler(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const vendorId = req.user._id;

 
  const vendor = await usermodel.findOne({
    _id: vendorId,
    role: userRole.vendor,
    isdeleted: false,
    isApprovedAsVendor: true,
    isConfirmed: true,
    isbanned: false,
  });

  if (!vendor) {
    return res.status(403).json({ message: "Access denied. Not a valid vendor." });
  }

  
  const filter = {
    isDeleted: false,
    addedBy: vendorId,
  };

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  if (status) {
    const validStatuses = ["pending", "approved", "reject"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    filter.status = status;
  }
  const approvedCount = await productmodel.countDocuments({
    isDeleted: false,
    addedBy: vendorId,
    status: productStatus.approved,
  });

  const pendingCount = await productmodel.countDocuments({
    isDeleted: false,
    addedBy: vendorId,
    status: productStatus.pending,
  });

  const rejectedCount = await productmodel.countDocuments({
    isDeleted: false,
    addedBy: vendorId,
    status: productStatus.reject,
  });

  const result = await pagination({
    model: productmodel,
    page,
    limit,
    filter,
    populate:[{ path: "review", select: "rating comment" }],
    sort: { createdAt: -1 },
  });

  if (!result.data || result.data.length === 0) {
    return res.status(404).json({
      message: search
        ? "No matching product found for your search"
        : "You have no products yet",
        counts: {
          approved: approvedCount,
          pending: pendingCount,
          rejected: rejectedCount,
        },
    });
  }

  return res.status(200).json({
    message: "Your products fetched successfully",
    result,
    counts: {
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedCount,
    },
  });
});

export const getProductById=asynchandler(async(req,res,next)=>{
    const {productId}=req.params
    const product = await productmodel.findOne({
      _id: productId,
      isDeleted: false,
      status: productStatus.approved
    }).populate([
      { path: "category", select: "name" },
      { path: "subcategory", select: "name" },
      { path: "brand", select: "name" },
      
    ]);
  
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }
  
    return res.status(200).json({
      message: "Product fetched successfully",
      product
    });
})


