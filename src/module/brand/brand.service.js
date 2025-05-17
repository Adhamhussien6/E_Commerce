import slugify from "slugify";
import brandmodel from "../../DB/models/barand.model.js";
import categorymodel from "../../DB/models/category.model.js";
import subcategorymodel from "../../DB/models/subcategory.model.js";
import cloudinary from "../../utils/cloudinary/index.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";
import { pagination } from "../../utils/feature/pagination.js";
import { Parser } from "json2csv";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";


export const addBrand=asynchandler(async(req,res,next)=>{
    const {name,category,subcategory}=req.body;
    const brandExist=await brandmodel.findOne({name:name.toLowerCase()});

    if(brandExist){
        return res.status(400).json({ message: "brand already exists" });
    }

    const categoryExist=await categorymodel.findOne({ _id: category, isDeleted: false });
    if(!categoryExist){
        return res.status(400).json({ message: "category not found" })
    }
    const subcategoryExist=await subcategorymodel.findOne({_id:subcategory,isDeleted:false})
    if(!subcategoryExist){
        return res.status(400).json({ message: "subCategory not found" })
    }

    if (subcategoryExist.category.toString() !== categoryExist._id.toString()) {
        return res.status(400).json({ message: "Subcategory does not belong to the selected category" });
    }

    let logo=null
    if(req.file){
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder:`ecommerce_express/category/${categoryExist.name}/subcategory/${subcategoryExist.name}/brand/${name.toLowerCase()}`

        })
        logo={secure_url,public_id}
    }

    const brand=await brandmodel.create({
        name:name.toLowerCase(),
        category:category,
        subcategory:subcategory,
        logo:logo,
        createdBy:req.user._id,
        slug:slugify(name, { lower: true, strict: true })

    })

     await subcategorymodel.findByIdAndUpdate(
        subcategory, 
            { $push: { brand: brand._id } },
            { new: true } 
          );
    
    

    return res.status(200).json({ message: "brand added successfully",brand });

})

export const getBrandById=asynchandler(async(req,res)=>{
    const {brandId}=req.params
    const brand=await brandmodel.findOne({_id:brandId,isDeleted:false}).populate([
        {path:"category",select:"name"},
        {path:"subcategory",select:"name"}

    ])

    if(!brand){
        return res.status(400).json({ message: "brand not found" })
    }


    return res.status(200).json({ message: "brand found", brand })
})

export const updateBrand = asynchandler(async (req, res) => {
    const { brandId } = req.params;
    const { name, categoryId, subcategoryId } = req.body;

    const brandExist = await brandmodel.findOne({ _id: brandId });
    if (!brandExist || brandExist.isDeleted) {
        return res.status(400).json({ message: "brand not found" });
    }

    if (name) {
        if (brandExist.name.toString() === name.toLowerCase()) {
            return res.status(400).json({ message: "brand name is same" });
        }

        const brandNameExist = await brandmodel.findOne({ name: name.toLowerCase(), isDeleted: false });
        if (brandNameExist) {
            return res.status(400).json({ message: "brand name already exists" });
        }

        brandExist.name = name.toLowerCase();
        brandExist.slug = slugify(name, { lower: true, strict: true });
    }

    // لو هيغير ال category
    if (categoryId) {
        if (brandExist.category.toString() === categoryId) {
            return res.status(400).json({ message: "category is same" });
        }

        const categoryExist = await categorymodel.findById(categoryId);
        if (!categoryExist) {
            return res.status(400).json({ message: "Category not found" });
        }

        // لازم يغير subcategory برضو
        if (!subcategoryId) {
            return res.status(400).json({ message: "You must provide a subcategory for the new category" });
        }

        const subcategoryExist = await subcategorymodel.findOne({ _id: subcategoryId, category: categoryId });
        if (!subcategoryExist) {
            return res.status(400).json({ message: "Subcategory does not belong to the new category" });
        }

        brandExist.category = categoryId;
        brandExist.subcategory = subcategoryId;
    }
    // لو هيغير subcategory بس (بدون category)
    else if (subcategoryId) {
        if (brandExist.subcategory.toString() === subcategoryId) {
            return res.status(400).json({ message: "subcategory is same" });
        }

        const subcategoryExist = await subcategorymodel.findOne({
            _id: subcategoryId,
            category: brandExist.category,
        });
        if (!subcategoryExist) {
            return res.status(400).json({ message: "Subcategory does not belong to the current category" });
        }

        brandExist.subcategory = subcategoryId;
    }

    // رفع صورة جديدة لو فيه
    let logo = brandExist.logo;
    if (req.file) {
        if (brandExist.logo?.public_id) {
            await cloudinary.uploader.destroy(brandExist.logo.public_id);
        }

        const categoryData = await categorymodel.findById(brandExist.category);
        const subcategoryData = await subcategorymodel.findById(brandExist.subcategory);

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `ecommerce_express/category/${categoryData.name}/subcategory/${subcategoryData.name}/brand/${brandExist.name}`
        });

        logo = { secure_url, public_id };
    }

    const updatedBrand = await brandmodel.findOneAndUpdate(
        { _id: brandId },
        {
            name: brandExist.name,
            slug: brandExist.slug,
            category: brandExist.category,
            subcategory: brandExist.subcategory,
            logo,
            updatedAt: Date.now(),
            updatedBy: req.user._id,
        },
        { new: true }
    );

    return res.status(200).json({ message: "brand updated", updatedBrand });
});

export const softDeleteBrand=asynchandler(async(req,res,next)=>{
    const {brandId}=req.params;
    const brand=await brandmodel.findOne({_id:brandId,isDeleted:false});
    if(!brand){
        return res.status(400).json({message:"brand not found"});
    }
    await brandmodel.updateOne({_id:brandId},{
        isDeleted:true,
        deletedAt:Date.now(),
        deletedBy:req.user._id

    });
    return res.status(200).json({message:"brand soft deleted successfully"});
});

export const restoreBrand=asynchandler(async(req,res,next)=>{
    const {brandId}=req.params;
    const brand=await brandmodel.findOne({_id:brandId,isDeleted:true});
    if(!brand){
        return res.status(400).json({message:"brand not found"})
    }
    await brandmodel.updateOne({_id:brandId},{
        isDeleted:false,
        deletedAt:null,
        deletedBy:null
    })
    return res.status(200).json({message:"brand restored successfully"})
})

export const deleteBrandLogo=asynchandler(async(req,res,next)=>{
    const {brandId}=req.params;
    const brand=await brandmodel.findOne({_id:brandId,isDeleted:false})
    if(!brand){
        return res.status(400).json({message:"brand not found"})
    }
    if(brand.logo?.public_id){
        await cloudinary.uploader.destroy(brand.logo.public_id);
        brand.logo=null;
        brand.logoDeletedAt=Date.now()
        brand.logoDeletedBy=req.user._id
        await brand.save()
    }else{
        return res.status(400).json({message:"there is no logo to delete"})
    }
    return res.status(200).json({message:"brand logo deleted successfully"})
})

export const addBrandLogo=asynchandler(async(req,res,next)=>{
    const {brandId}=req.params;
    const brand=await brandmodel.findOne({_id:brandId,isDeleted:false})
    if(!brand){
        return res.status(400).json({message:"brand not found"})
    }
    if(brand.logo?.public_id){
       
        return res.status(400).json({message:"brand already has a logo"})
    }
    if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
          folder:`ecommerce_express/category/${brand.category.name}/subcategory/${brand.subcategory.name}/brand/${brand.name}`
    });

    brand.logo = { secure_url, public_id };
    brand.logoDeletedAt=null
    brand.logoDeletedBy=null
    await brand.save();


    return res.status(200).json({message:"brand logo uploaded successfully"})

   
})

export const deleteBrand=asynchandler(async(req,res,next)=>{
    const {brandId}=req.params;
    const brand=await brandmodel.findOne({_id:brandId})
    if(!brand){
        return res.status(400).json({message:"brand not found"})
    }
    if(brand.logo?.public_id){
        await cloudinary.uploader.destroy(brand.logo.public_id);
       
    }
    const deletedBrand=await brandmodel.findOneAndDelete({_id:brandId})

    
    await subcategorymodel.findByIdAndUpdate(
        brand.subcategory,
        { $pull: { brand: brandId } },
        { new: true }
      );

      return res.status(200).json({message:"brand deleted successfully",deletedBrand})
   
})

export const getAllBrand=asynchandler(async(req,res,next)=>{
    const { page, limit, search } = req.query;

    const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:false } : {isDeleted:false};

    const result = await pagination({
        model: brandmodel,
        page,
        limit,
        filter,
        select:"name logo",
        populate: [{ path: "category", select: "name -_id" },
           { path: "subcategory", select: "name -_id" },
        ],
        sort: { createdAt: 1 },
      });


    return res.status(200).json({
        message: "All brands fetched successfully",
        data: result
    });
})

export const getAllDeletedBrands=asynchandler(async(req,res,next)=>{
    const { page, limit, search } = req.query;

    const filter = search ? { name: { $regex: search, $options: "i" },isDeleted:true } : {isDeleted:true};

    const result = await pagination({
        model: brandmodel,
        page,
        limit,
        filter,
        select:"name logo",
        populate: [{ path: "category", select: "name -_id" },
           { path: "subcategory", select: "name -_id" },
        ],
        sort: { createdAt: 1 },
    })
    return res.status(200).json({
        message: "All deleted brands fetched successfully",
        data: result})
})

export const getbrandCount = asynchandler(async (req, res) => {
    try {
        const count = await brandmodel.countDocuments({ isDeleted: false });
        res.status(200).json({
            status: "success",
            message: "brands count fetched successfully",
            data: { count },
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
})

 export const softDeleteManybrand = asynchandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || ids.length === 0) {
        return res.status(400).json({ message: "No brands selected" });
    }

    const nonExistentIds = [];
    const alreadyDeletedIds = [];
    const validIds = [];

    for (let id of ids) {
        const brand = await brandmodel.findById(id);
        if (!brand) {
            nonExistentIds.push(id);
        } else if (brand.isDeleted) {
            alreadyDeletedIds.push(id);
        } else {
            validIds.push(id);
        }
    }

    let result = { modifiedCount: 0 };
    
    if (validIds.length > 0) {
        result = await brandmodel.updateMany(
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

export const restoreManybrand = asynchandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || ids.length === 0) {
        return res.status(400).json({ message: "No subcategories selected" });
    }

    const nonExistentIds = [];
    const notDeletedIds = [];
    const validIds = [];

    for (let id of ids) {
        const brand = await brandmodel.findById(id);
        if (!brand) {
            nonExistentIds.push(id);
        } else if (!brand.isDeleted) {
            notDeletedIds.push(id); 
        } else {
            validIds.push(id);
        }
    }

    let result = { modifiedCount: 0 };
    
    if (validIds.length > 0) {
        result = await brandmodel.updateMany(
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

export const exportBrands = asynchandler(async (req, res, next) => {
    const brands = await brandmodel.find({ isDeleted: false })
      .populate("category", "name")
      .populate("subcategory", "name");
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Brands");
  
    // العناوين (Header Row)
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Slug", key: "slug", width: 20 },
      { header: "Category", key: "category", width: 20 },
      { header: "Subcategory", key: "subcategory", width: 20 },
      { header: "CreatedAt", key: "createdAt", width: 30 },
      { header: "Logo", key: "logo", width: 50 },
    ];
  
    // البيانات
    brands.forEach((brand) => {
      worksheet.addRow({
        name: brand.name,
        slug: brand.slug,
        category: brand.category?.name || "",
        subcategory: brand.subcategory?.name || "",
        createdAt: brand.createdAt,
        logo: brand.logo?.secure_url || "",
      });
    });
  
    // إعدادات الاستجابة
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="brands.xlsx"'
    );
  
    await workbook.xlsx.write(res);
    res.end();
  });

  export const exportBrandsPDF = async (req, res, next) => {
    try {
      const brands = await brandmodel.find().populate([
        { path: "category", select: "name" },
        { path: "subcategory", select: "name" },
      ]);
  
      const doc = new PDFDocument({ margin: 30, size: "A4" });
  
      // إعدادات الهيدر
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=brands.pdf");
  
      doc.pipe(res); // ربط الملف بالاستجابة
  
      doc.fontSize(18).text("Brands Report", { align: "center" });
      doc.moveDown();
  
      brands.forEach((brand, index) => {
        doc
          .fontSize(12)
          .text(`Name: ${brand.name}`)
          .text(`Slug: ${brand.slug}`)
          .text(`Category: ${brand.category?.name}`)
          .text(`Subcategory: ${brand.subcategory?.name}`)
          .text(`Created At: ${new Date(brand.createdAt).toLocaleString()}`)
          .moveDown();
      });
  
      doc.end();
    } catch (error) {
      next(error);
    }
  };
  