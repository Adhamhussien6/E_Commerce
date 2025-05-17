import slugify from "slugify";
import categorymodel from "../../DB/models/category.model.js";
import subcategorymodel from "../../DB/models/subcategory.model.js";
import cloudinary from "../../utils/cloudinary/index.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";
import { pagination } from "../../utils/feature/pagination.js";
import { openai } from "../../utils/openAI/openaiClient.js";


export const addSubCategory = asynchandler(async (req, res) => {
    const { name, category } = req.body;
    const existingSubCategory = await subcategorymodel.findOne({ name },{isDeleted:false});
    if (existingSubCategory) {
        return res.status(400).json({ message: "Subcategory already exists" });
    }
    const existingCategory = await categorymodel.findOne({ _id: category },{isDeleted:false});
    if (!existingCategory) {
        
        return res.status(400).json({ message: "Category not found" });
    }
    let image = null;
    if (req.file) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `ecommerce_express/category/${existingCategory.name}/subcategory/${name}`,
        });
        image = { secure_url, public_id };
    }
    const subcategory = await subcategorymodel.create({
        name,
        createdBy: req.user._id,
        slug: slugify(name, { lower: true, strict: true }),
        image,
        category: category,
    });
    await categorymodel.findByIdAndUpdate(
        category, 
        { $push: { subCategory: subcategory._id } },
        { new: true } 
      );
      

   

    res.status(201).json({
        status: "success",
        message: "Subcategory created successfully",
        data: subcategory,
    });
})

export const updateSubCategory = asynchandler(async (req, res) => {
    const { id } = req.params;
    const { name, category } = req.body;

    const subcategory = await subcategorymodel.findOne({ _id: id, isDeleted: false });
    if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
    }
   
    if (name) {
        const existingSubCategory = await subcategorymodel.findOne({ name, isDeleted: false });
        if (existingSubCategory && existingSubCategory._id.toString() !== id) {
            return res.status(400).json({ message: "Subcategory already exists" });
        }
    }

    let updatedCategory = subcategory.category;
    
    if ( category) {
        const existingCategory = await categorymodel.findOne({ _id: category},{ isDeleted: false });
        if (!existingCategory) {
            return res.status(400).json({ message: "Category not found" });
        }
        updatedCategory = category;
    }

    let image = subcategory.image;
    if (req.file) {
        if (subcategory.image?.public_id) {
            await cloudinary.uploader.destroy(subcategory.image.public_id);
        }

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `ecommerce_express/category/${subcategory.category.name}/subcategory/${name || subcategory.name}`,
        });
        image = { secure_url, public_id };
    }

    const updatedSubcategory = await subcategorymodel.findByIdAndUpdate(
        id,
        {
            name: name || subcategory.name,
            updatedBy: req.user._id,
            slug: slugify(name || subcategory.name, { lower: true, strict: true }),
            image,
            category: updatedCategory,
        },
        { new: true }
    );

    res.status(200).json({
        status: "success",
        message: "Subcategory updated successfully",
        data: updatedSubcategory,
    });
});

export const getAllSubCategories = asynchandler(async (req, res) => {
    const { page, limit, search } = req.query;
  
    const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:false } : {isDeleted:false};
  
    const result = await pagination({
      model: subcategorymodel,
      page,
      limit,
      filter,
      populate: [{ path: "category", select: "name" },
         { path: "createdBy", select: "firstName lastName" },
         { path: "brand", select: "name" },

      ],
      sort: { createdAt: -1 },
    });
  
    res.status(200).json({ status: "success", data: result });
});

export const softDeleteSubCategory=asynchandler(async (req,res)=>{
    const {id}=req.params
    const subcategoryExist=await subcategorymodel.findOne({_id:id,isDeleted:false})

    if(!subcategoryExist){
        return res.status(404).json({message:"subcategory not found"})
    }
   
    const deletedSubcategory=await subcategorymodel.findByIdAndUpdate(id,{
        isDeleted:true,
        deletedBy:req.user._id,
        deletedAt:new Date()},
        {new:true})
    res.status(200).json({status:"success",message:"subcategory deleted successfully",data:deletedSubcategory})

})

export const restoreSubCategory=asynchandler(async (req,res)=>{
    const {id}=req.params
    const subcategoryExist=await subcategorymodel.findOne({_id:id,isDeleted:true})

    if(!subcategoryExist){
        return res.status(404).json({message:"subcategory not found"})
    }
   
    const deletedSubcategory=await subcategorymodel.findByIdAndUpdate(id,{
        isDeleted:false,
        deletedBy:null,
        deletedAt:null},
        {new:true})
    res.status(200).json({status:"success",message:"subcategory restored successfully",data:deletedSubcategory})

})

export const deleteSubCategory=asynchandler(async (req,res)=>{
    const {id}=req.params
    const subcategoryExist=await subcategorymodel.findOne({_id:id,isDeleted:false})

    if(!subcategoryExist){
        return res.status(404).json({message:"subcategory not found"})
    }
   
    const deletedSubcategory=await subcategorymodel.findByIdAndDelete(id)
    if (subcategoryExist.image?.public_id) {
            await cloudinary.uploader.destroy(subcategoryExist.image.public_id);
        }


    await categorymodel.findByIdAndUpdate(
        subcategoryExist.category,
        { $pull: { subCategory: id } },
        { new: true }
      );
    res.status(200).json({status:"success",message:"subcategory deleted successfully",data:deletedSubcategory})

})

export const getSubCategoryById=asynchandler(async (req,res)=>{
    const {id}=req.params
    const subcategoryExist=await subcategorymodel.findOne({_id:id,isDeleted:false}).populate({path:"brand",select:"name"})

    if(!subcategoryExist){
        return res.status(404).json({message:"subcategory not found"})
    }
   
    res.status(200).json({status:"success",message:"subcategory fetched successfully",data:subcategoryExist})

})

export const deleteSubCategoryImage = asynchandler(async (req, res) => {
    const { id } = req.params;
    const subcategory = await subcategorymodel.findById(id);
    if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
    }
    if (subcategory.image?.public_id) {
        await cloudinary.uploader.destroy(subcategory.image.public_id);
        subcategory.image = null;
        await subcategory.save();
    }
    res.status(200).json({
        status: "success",
        message: "Subcategory image deleted successfully",
    });
})

export const addSubCategoryImage=asynchandler(async (req, res) => {
    const { id } = req.params;
    const subcategory = await subcategorymodel.findById(id);
    if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
    }
  if(req.file){
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `ecommerce_express/category/${subcategory.category.name}/subcategory/${subcategory.name}`,
    });
    subcategory.image = { secure_url, public_id };
  }
    await subcategory.save();
    res.status(200).json({
        status: "success",
        message: "Subcategory image added successfully",})
})

export const deleteAllSubCategories = asynchandler(async (req, res) => {
    const subcategories = await subcategorymodel.find({ isDeleted: false });

    if (subcategories.length === 0) {
        return res.status(404).json({ message: "No subcategories found" });
    }

    
    const subCategoryIds = subcategories.map(sub => sub._id);

    const deleteImagePromises = subcategories.map(async (sub) => {
        if (sub.image?.public_id) {
          await cloudinary.uploader.destroy(sub.image.public_id);
        }
      });
      await Promise.all(deleteImagePromises);

   
    await subcategorymodel.deleteMany({ _id: { $in: subCategoryIds } });

   
    await categorymodel.updateMany(
        { subCategory: { $in: subCategoryIds } },
        { $pull: { subCategory: { $in: subCategoryIds } } }
    );

    res.status(200).json({
        status: "success",
        message: "All subcategories deleted successfully",
    });
});

export const getSubCategoryCount = asynchandler(async (req, res) => {
  
    const data = await subcategorymodel.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: "$category",
          subCategoryCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "categories", 
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $unwind: "$categoryInfo"
      },
      {
        $project: {
          _id: 0,
          categoryId: "$categoryInfo._id",
          categoryName: "$categoryInfo.name",
          subCategoryCount: 1
        }
      }
    ]);

    res.status(200).json({
      status: "success",
      message: "Subcategory counts fetched successfully",
      data,
    });
 
  
});


export const searchSubCategory = asynchandler(async (req, res) => {
    const { name } = req.query;
    const subcategories = await subcategorymodel.find({
        name: { $regex: name, $options: "i" },
        isDeleted: false,
    });
    if (subcategories.length === 0) {
        return res.status(404).json({ message: "No subcategories found" });
    }
    res.status(200).json({
        status: "success",
        message: "Subcategories fetched successfully",
        data: subcategories,
    });
})

 export const softDeleteManySubCategory = asynchandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || ids.length === 0) {
        return res.status(400).json({ message: "No subcategories selected" });
    }

    const nonExistentIds = [];
    const alreadyDeletedIds = [];
    const validIds = [];

    for (let id of ids) {
        const subcategory = await subcategorymodel.findById(id);
        if (!subcategory) {
            nonExistentIds.push(id);
        } else if (subcategory.isDeleted) {
            alreadyDeletedIds.push(id);
        } else {
            validIds.push(id);
        }
    }

    let result = { modifiedCount: 0 };
    
    if (validIds.length > 0) {
        result = await subcategorymodel.updateMany(
            { _id: { $in: validIds } },
            { $set: { isDeleted: true, deletedBy: req.user._id, deletedAt: new Date() } }
        );
    }

    let modifiedCount = result.modifiedCount || result.nModified || 0;
    let responseMessage = `${modifiedCount} subcategories deleted successfully.`;

    if (nonExistentIds.length > 0) {
        responseMessage += ` The following subcategories were not found: ${nonExistentIds.join(', ')}.`;
    }

    if (alreadyDeletedIds.length > 0) {
        responseMessage += ` The following subcategories were already deleted: ${alreadyDeletedIds.join(', ')}.`;
    }

    res.status(200).json({
        status: "success",
        message: responseMessage,
        data: result,
    });
});

export const restoreManySubCategory = asynchandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || ids.length === 0) {
        return res.status(400).json({ message: "No subcategories selected" });
    }

    const nonExistentIds = [];
    const notDeletedIds = [];
    const validIds = [];

    for (let id of ids) {
        const subcategory = await subcategorymodel.findById(id);
        if (!subcategory) {
            nonExistentIds.push(id);
        } else if (!subcategory.isDeleted) {
            notDeletedIds.push(id); 
        } else {
            validIds.push(id);
        }
    }

    let result = { modifiedCount: 0 };
    
    if (validIds.length > 0) {
        result = await subcategorymodel.updateMany(
            { _id: { $in: validIds } },
            { $set: { isDeleted: false, deletedBy: null, deletedAt: null } }
        );
    }

    let modifiedCount = result.modifiedCount || result.nModified || 0;
    let responseMessage = `${modifiedCount} subcategories restored successfully ${validIds}.`; 

    if (nonExistentIds.length > 0) {
        responseMessage += ` The following subcategories were not found: ${nonExistentIds.join(', ')}.`;
    }

    if (notDeletedIds.length > 0) {
        responseMessage += ` The following subcategories were not deleted, so they could not be restored: ${notDeletedIds.join(', ')}.`;
    }

    res.status(200).json({
        status: "success",
        message: responseMessage,
        data: result,
    });
});

export const getAllSoftDeletedSubCategory=asynchandler(async (req, res) => {
    const softDeletedSubCategory=await subcategorymodel.find({isDeleted:true})
    if (softDeletedSubCategory.length===0){
        return res.status(400).json({message:"No Subcategory found"})
    }
    return res.status(200).json({message:"Subcategory found",softDeletedSubCategory})


})
   
export const duplicateSubCategory = asynchandler(async (req, res) => {
    const { id } = req.params;
    
    const subcategory = await subcategorymodel.findById(id);

    if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
    }

   
    const subcategoryData = subcategory.toObject();
    delete subcategoryData._id;

  
    const duplicatedSubCategory = new subcategorymodel({
        ...subcategoryData,
        name: `${subcategory.name} - Copy`, 
    });

    await duplicatedSubCategory.save();

    res.status(201).json({
        status: "success",
        message: "Subcategory duplicated successfully",
        data: duplicatedSubCategory,
    });
});

export const suggestSubCategoryNames = asynchandler(async (req, res) => {
    const { categoryname = "General" } = req.query;
  
    const prompt = `
    Generate 5 creative and relevant subcategory names for the category "${categoryname}".
    Make them short, modern, and suitable for an e-commerce platform.
    Return the names as a list only.
    `;
  
    const response =  await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });
  
    const suggestions = response.data.choices[0]?.message?.content
      ?.split("\n")
      ?.filter((item) => item.trim() !== "")
      ?.map((s) => s.replace(/^\d+\.\s*/, "").trim());
  
    res.status(200).json({
      status: "success",
      category: categoryname,
      suggestions,
    });
  });

export const getAllDeletedItems = asynchandler(async (req, res) => {
    const { page, limit, search } = req.query;

    const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:true } : {isDeleted:true};


    const result = await pagination({
        model: subcategorymodel,
        page,
        limit,
        filter,
        sort: { createdAt: 1 },
      });

      if(result && result.data.length <= 0){
        return res.status(200).json({
            message: "No deleted subcategories found",
          
          });

      }

     

      return res.status(200).json({
        message:  "All deleted subcategories fetched successfully" ,
        data: result
    });
    
  });