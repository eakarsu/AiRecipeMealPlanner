const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const offset = (page - 1) * limit;
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = (query.sortOrder || 'DESC').toUpperCase();
  const search = query.search || '';
  const filter = query.filter || '';

  return { page, limit, offset, sortBy, sortOrder, search, filter };
};

const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

module.exports = { getPaginationParams, buildPaginatedResponse };
