import slugify from "slugify";
import categorymodel from "../../DB/models/category.model.js";
import cloudinary from "../../utils/cloudinary/index.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";
import { moveEntireCategoryFolder } from "../../utils/cloudinary/moveFolder.js";
import { pagination } from "../../utils/feature/pagination.js";
import { userRole } from "../../middleware/ENum.js";



export const addCategory = asynchandler(async (req, res) => {
    const { name, description } = req.body;


    const existingCategory = await categorymodel.findOne({ name });
    if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
    }



    let image = null;


    if (req.file) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `ecommerce_express/category/${name}`,
        });


        image = { secure_url, public_id };
    }


    const category = await categorymodel.create({
        name,
        description,
        createdBy: req.user._id,
        slug: slugify(name, { lower: true, strict: true }),
        image,
    });

    res.status(201).json({
        status: "success",
        data: {
            category,
        },
    });
});

export const updateCategory = asynchandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name, description } = req.body;
  
    const category = await categorymodel.findOne({_id:categoryId},{isDeleted:false});
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
  
    if (name) {
      const existingCategory = await categorymodel.findOne({ name });
      if (existingCategory && existingCategory._id.toString() !== categoryId) {
        return res.status(400).json({ message: "Category name already exists" });
      }
    }
  
    let image = category.image;
    if (req.file) {
      if (category.image?.public_id) {
        await cloudinary.uploader.destroy(category.image.public_id);
      }
      const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `ecommerce_express/category/${name || category.name}`,
      });
      image = { secure_url, public_id };
    }
  
    if (name && name !== category.name) {
        const oldFolder = `ecommerce_express/category/${category.name}`;
        const newFolder = `ecommerce_express/category/${name}`;
        
        // نقل الفولدرات
        try {
          await moveEntireCategoryFolder(oldFolder, newFolder);
          console.log(`Successfully moved category folder from ${oldFolder} to ${newFolder}`);
        } catch (error) {
          console.error(`Error moving category folder from ${oldFolder} to ${newFolder}:`, error);
          return res.status(500).json({ message: "Error moving category folder" });
        }
      }
    
    const updatedCategory = await categorymodel.findByIdAndUpdate(
      categoryId,
      {
        name,
        description,
        image,
        slug: name ? slugify(name, { lower: true, strict: true }) : category.slug,
        updatedBy: req.user._id,
      },
      { new: true }
    );
  
    res.status(200).json({
      status: "success",
      data: {
        category: updatedCategory,
      },
    });
});

export const getAllCategories = asynchandler(async (req, res) => {
    const { page, limit } = req.query;
    const Role = req.user.role;

    const populate = [
        { path: "subCategory", select: "name description image" },
    ];

    if (Role === userRole.admin) {
        
        populate.push(
            { path: "createdBy", select: "firstName lastName email" },
            { path: "updatedBy", select: "firstName lastName email" }
        );

        
        const result = await pagination({
            page,
            limit,
            model: categorymodel,
            populate,
            sort: { createdAt: 1 },
            filter: { isDeleted: false },
           
        });

        return res.status(200).json({
            status: "success",
            data: {
                categories: result.data,
                page: result.page,
                limit: result.limit,
                totalCount: result.totalCount,
                totalPages: result.totalPages,
            },
        });
    } else {
      
        const selectFields = "name description subCategory image ";

        const result = await pagination({
            page,
            limit,
            model: categorymodel,
            populate,
            sort: { createdAt: 1 },
            filter: { isDeleted: false },
            select: selectFields,
        });

        return res.status(200).json({
            status: "success",
            data: {
                categories: result.data,
                page: result.page,
                limit: result.limit,
                totalCount: result.totalCount,
                totalPages: result.totalPages,
            },
        });
    }
});


export const getCategoryById = asynchandler(async (req, res) => {
    const { id } = req.params;
    const Role = req.user.role;

    const populate = [
        { path: "subCategory", select: "name" },
    ];

    let query = categorymodel.findOne({ _id: id, isDeleted: false }).populate(populate);

    if (Role === userRole.admin) {
     
        query = query.populate([
            { path: "createdBy", select: "firstName lastName email" },
            { path: "updatedBy", select: "firstName lastName email" }
        ]);
    } else {
       
        query = query.select("name description subCategory");
    }

    const category = await query;

    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
        status: "success",
        data: {
            category,
        },
    });
});


export const searchCategory = asynchandler(async (req, res) => {
    const { name, page, limit } = req.query;
    const Role = req.user.role;

    const populate = [
        { path: "subCategory", select: "name" },
    ];

    let selectFields = "name description subCategory";

    // إذا كان المستخدم Admin، أضف معلومات إضافية
    if (Role === userRole.admin) {
        selectFields += " createdBy updatedBy";
        populate.push(
            { path: "createdBy", select: "firstName lastName email" },
            { path: "updatedBy", select: "firstName lastName email" }
        );
    }

    // الفلترة باسم الفئة
    const regex = new RegExp(name, "i");
    const filter = {
        name: { $regex: regex },
        isDeleted: false,
    };

    // استخدام pagination
    const { data, _page, totalCount } = await pagination({
        model: categorymodel,
        page,
        limit,
        filter,
        populate,
        select: selectFields,
        sort: { createdAt: -1 },
    });

    // الرد على العميل
    res.status(200).json({
        status: "success",
        page: _page,
        total: totalCount,
        results: data.length,
        data: {
            categories: data,
        },
    });
});


export const softDeleteCategory = asynchandler(async (req, res) => {
    const { id } = req.params;
    const category = await categorymodel.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
   
    category.isDeleted = true;
    category.deletedBy = req.user._id;
    category.deletedAt = new Date();
    await category.save();
    res.status(200).json({
        status: "success",
        message: "Category softdeleted successfully",
    });
})

export const restoreCategory = asynchandler(async (req, res) => {
    const { id } = req.params;
    const category = await categorymodel.findOne({_id:id},{isDeleted:true});
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    if (!category.isDeleted) {
        return res.status(400).json({ message: "Category is not deleted" });
    }
    category.isDeleted = false;
    category.deletedBy = null;
    category.deletedAt = null;
    await category.save();
    res.status(200).json({
        status: "success",
        message: "Category restored successfully",
    });
})

export const deleteCategory = asynchandler(async (req, res) => {
    const { id } = req.params;
    const category = await categorymodel.findOne({_id:id},{isDeleted:false});
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    if (category.image?.public_id) {
        await cloudinary.uploader.destroy(category.image.public_id);
    }
    await categorymodel.findByIdAndDelete(id);
    res.status(200).json({
        status: "success",
        message: "Category deleted successfully",
    });
});

export const deleteCategoryImage = asynchandler(async (req, res) => {
    const { id } = req.params;
    const category = await categorymodel.findById(id);
    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }
    if (category.image?.public_id) {
        await cloudinary.uploader.destroy(category.image.public_id);
        category.image = null;
        await category.save();
    }
    res.status(200).json({
        status: "success",
        message: "Category image deleted successfully",
    });
});

export const deleteAllCategories = asynchandler(async (req, res) => {
    const categories = await categorymodel.find({});
    if (categories.length === 0) {
        return res.status(404).json({ message: "No categories found" });
    }
    for (const category of categories) {
        if (category.image?.public_id) {
            await cloudinary.uploader.destroy(category.image.public_id);
        }
    }
    await categorymodel.deleteMany({});
    res.status(200).json({
        status: "success",
        message: "All categories deleted successfully",
    });
});

export const getCategoryCount = asynchandler(async (req, res) => {
    try {
        
        const count = await categorymodel.countDocuments();

        res.status(200).json({
            status: "success",
            data: {
                count,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Unable to get category count",
        });
    }
});

export const getAllDeletedCategories=asynchandler(async (req, res) => {

    const { page, limit, search } = req.query;

    const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:true } : {isDeleted:true};


    const result = await pagination({
        model: categorymodel,
        page,
        limit,
        filter,
        sort: { createdAt: 1 },
      });

      if(result && result.data.length <= 0){
        return res.status(200).json({
            message: "No deleted categories found",
          
          });

      }

     

      return res.status(200).json({
        message:  "All deleted categories fetched successfully" ,
        data: result
    });
    
})




