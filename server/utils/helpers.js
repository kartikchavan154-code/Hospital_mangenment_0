const paginate = (query, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  return { ...query, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
};

const formatPaginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

module.exports = {
  paginate,
  formatPaginationResponse,
  generateInvoiceNumber,
  formatDate,
  successResponse,
  errorResponse,
};
