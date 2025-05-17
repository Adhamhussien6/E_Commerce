import cloudinary from "cloudinary";

export const moveEntireCategoryFolder = async (oldFolder, newFolder) => {
  let nextCursor = null;
  do {
    const result = await cloudinary.v2.api.resources({
      type: "upload",
      prefix: oldFolder,
      max_results: 500,
      next_cursor: nextCursor,
    });

    for (const file of result.resources) {
      const oldPublicId = file.public_id;
      const newPublicId = oldPublicId.replace(oldFolder, newFolder);

      // نقل الملفات إلى الفولدر الجديد
      if (oldPublicId !== newPublicId) {
        try {
          await cloudinary.v2.uploader.rename(oldPublicId, newPublicId);
          console.log("Renaming:", oldPublicId, "=>", newPublicId);

        } catch (error) {
          console.error(`Error renaming ${oldPublicId}:`, error);
        }
      }
    }

    nextCursor = result.next_cursor;
  } while (nextCursor);

  // بعد نقل الملفات، امسح الملفات من الفولدر القديم
  try {
    await cloudinary.v2.api.delete_resources_by_prefix(oldFolder);
    console.log(`Successfully deleted all resources in old folder: ${oldFolder}`);

    // حذف الفولدر القديم بعد التأكد من أنه أصبح فارغًا
    await cloudinary.v2.api.delete_resources_by_prefix(oldFolder);
    console.log(`Successfully deleted old folder: ${oldFolder}`);
  } catch (error) {
    console.error(`Error deleting resources in or old folder ${oldFolder}:`, error);
  }
};
