const MOCK_COMMENTS = [
  {
    comment_id: 1,
    product_id: 1,
    product_name: 'MacBook Pro 14"',
    customer_id: 101,
    customer_name: 'Basak',
    comment_text: 'Very good laptop I like it.',
    rating: 5,
    status: 'pending',
    created_at: '2026-04-22T09:30:00Z',
  },
  {
    comment_id: 2,
    product_id: 2,
    product_name: 'iPhone 15 Pro',
    customer_id: 102,
    customer_name: 'atamanbasak',
    comment_text: 'nice product useful.',
    rating: 4,
    status: 'pending',
    created_at: '2026-04-22T10:15:00Z',
  },
  {
    comment_id: 3,
    product_id: 4,
    product_name: 'AirPods Pro',
    customer_id: 103,
    customer_name: 'abc',
    comment_text: 'berbat bir ürün.',
    rating: 5,
    status: 'pending',
    created_at: '2026-04-22T11:00:00Z',
  },
  {
    comment_id: 4,
    product_id: 6,
    product_name: 'Samsung Galaxy S24',
    customer_id: 104,
    customer_name: 'mock user',
    comment_text: 'a bit expensive.',
    rating: 4,
    status: 'pending',
    created_at: '2026-04-22T12:20:00Z',
  },
  {
    comment_id: 5,
    product_id: 8,
    product_name: 'Lenovo ThinkPad',
    customer_id: 105,
    customer_name: 'örnek',
    comment_text: 'very bad please do not buy this.',
    rating: 5,
    status: 'pending',
    created_at: '2026-04-22T13:10:00Z',
  },
];

let commentsDb = [...MOCK_COMMENTS];

const simulateDelay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getPendingComments = async () => {
  await simulateDelay();

  return {
    comments: commentsDb.filter((comment) => comment.status === 'pending'),
  };
};

export const approveComment = async (commentId) => {
  await simulateDelay();

  commentsDb = commentsDb.map((comment) =>
    comment.comment_id === commentId
      ? { ...comment, status: 'approved' }
      : comment
  );

  return {
    success: true,
    message: 'Comment approved successfully.',
    comment_id: commentId,
  };
};

export const rejectComment = async (commentId) => {
  await simulateDelay();

  commentsDb = commentsDb.map((comment) =>
    comment.comment_id === commentId
      ? { ...comment, status: 'rejected' }
      : comment
  );

  return {
    success: true,
    message: 'Comment rejected successfully.',
    comment_id: commentId,
  };
};