// export const pagination = async ({ page = 1, limit = 10, model, populate = [], filter = {}, sort = {} } = {}) => {
//     let _page = page * 1 || 1
//      if (_page < 1) {
//           page = 1
//      }
//     //const limit = 2
//     const totalCount = await model.countDocuments(filter);
//     const skip = (_page - 1) * limit
//     const data = await model.find(filter).limit(limit).skip(skip).populate(populate).sort(sort)
//     return{data,_page,totalCount}
     
// }



export const pagination = async ({
    page = 1,
    limit = 5,
    model,
    populate = [],
    filter = {},
    sort = {},
    select = null
  } = {}) => {
    const _page = Math.max(parseInt(page), 1);
    const _limit = Math.max(parseInt(limit), 1);
    const skip = (_page - 1) * _limit;
  
    const totalCount = await model.countDocuments(filter);
  
    let query = model.find(filter).limit(_limit).skip(skip).sort(sort);
    if (select) {
      query = query.select(select); // ✅ نطبق الـ select هنا
    }
  
    if (populate.length > 0) {
      populate.forEach(pop => {
        query = query.populate(pop);
      });
    }
  
    const data = await query;
  
    return {
      data,
      page: _page,
      limit: _limit,
      totalCount,
      totalPages: Math.ceil(totalCount / _limit)
    };
  };
  