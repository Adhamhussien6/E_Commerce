import productmodel from "../../DB/models/product.model.js";
import reviewmodel from "../../DB/models/review.model.js";
import { userRole } from "../../middleware/ENum.js";
import { pagination } from "../../utils/feature/pagination.js";
import { asynchandler } from "../../utils/globalErrorHandling/index.js";



export const addReview = asynchandler(async (req, res) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;


    if (rating && (rating < 0 || rating > 5)) {
        return res.status(400).json({ message: "Rating must be between 0 and 5" });
    }


    const product = await productmodel.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }


    if (product.addedBy.toString() === userId.toString()) {
        return res.status(400).json({ message: "You cannot review your own product" });
    }


    const existingRating = await reviewmodel.findOne({ user: userId, product: productId, rating: { $ne: null } });


    if (rating && existingRating) {
        return res.status(400).json({ message: "You cannot submit more than one rating for the same product" });
    }


    const reviewData = {
        user: userId,
        product: productId,
        rating: rating || null,
        comment
    };


    const review = await reviewmodel.create(reviewData);


    product.review.push(review._id);


    if (rating !== undefined) {
        const reviews = await reviewmodel.find({ product: productId });
        const totalRatings = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
        product.rateNum = reviews.filter(r => r.rating !== null).length;
        product.rateAvg = totalRatings / product.rateNum;
    }
    await product.save();

    return res.status(200).json({
        message: "Review added successfully",
        data: review,
    });
});

export const updateComment = asynchandler(async (req, res) => {
    const { productId, reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.user._id;


    const product = await productmodel.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }


    const review = await reviewmodel.findById(reviewId);
    if (!review || review.product.toString() !== productId) {
        return res.status(404).json({ message: "Review not found for this product" });
    }


    if (review.user.toString() !== userId.toString()) {
        return res.status(400).json({ message: "You can only update your own comment" });
    }

    if (comment === review.comment) {
        return res.status(400).json({ message: "You can't update the same comment" })
    }

    review.comment = comment || review.comment;
    await review.save();

    return res.status(200).json({
        message: "Comment updated successfully",
        data: review,
    });
});

export const updateRate = asynchandler(async (req, res) => {
    const { productId, reviewId } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;


    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 0 and 5" });
    }


    const product = await productmodel.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }


    const review = await reviewmodel.findById(reviewId);
    if (!review || review.product.toString() !== productId) {
        return res.status(404).json({ message: "Review not found for this product" });
    }


    if (review.user.toString() !== userId.toString()) {
        return res.status(400).json({ message: "You can only update your own rating" });
    }


    review.rating = rating;
    await review.save();


    const reviews = await reviewmodel.find({ product: productId });
    const totalRatings = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    product.rateNum = reviews.filter(r => r.rating !== null).length;
    product.rateAvg = totalRatings / product.rateNum;

    await product.save();

    return res.status(200).json({
        message: "Rating updated successfully",
        data: review,
    });
});

export const deleteComment = asynchandler(async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === userRole.admin;
  
    const review = await reviewmodel.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
  
   
    if (!isAdmin && review.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not allowed to delete this comment" });
    }
  
    
    review.comment = undefined;
    await review.save();
  
    return res.status(200).json({ message: "Comment removed successfully", data: review });
});

export const getReviewsForProduct = asynchandler(async (req, res) => {
    const { page, limit, search } = req.query;
    const {productId}=req.params

    const filter = search ? { comment: { $regex: search, $options: "i" },product: productId } : { product: productId };

  
    const result = await pagination({
        model: reviewmodel,
        page,
        limit,
        filter,
        populate: [{ path: "user" ,select:"email -_id"}],
        select:"rating comment date",
        sort: { createdAt: 1 },
    })
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({
        message: search
          ? "No matching comments found for your search"
          : "There are no comments",
      });
    }
  
    return res.status(200).json({
      message: "All product fetched successfully",
      result,
    });
    
})
