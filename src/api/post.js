import { createAxiosInstance } from './apiConfig';

const postsApi = createAxiosInstance('posts');

// GET ALL POSTS (Search + Filter + Pagination)
export const getAllPosts = async ({
  search = '',
  fromDate = '',
  toDate = '',
  sortBy = 'latest',
  isPagination = true,
  page = 1,
  limit = 10,
} = {}) => {
  try {
    const response = await postsApi.get('', {
      params: {
        ...(search && { search }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        sortBy,
        isPagination,
        page,
        limit,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get Posts Error:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// GET POST BY ID
export const getPostById = async id => {
  try {
    const response = await postsApi.get(`/${id}`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get Post By ID Error:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// CREATE POST
export const createPost = async postData => {
  try {
    const response = await postsApi.post('', postData);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Create Post Error:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// UPDATE POST
export const updatePost = async (id, postData) => {
  try {
    const response = await postsApi.put(`/${id}`, postData);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Update Post Error:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// DELETE POST
export const deletePost = async id => {
  try {
    const response = await postsApi.delete(`/${id}`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Delete Post Error:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// LIKE / UNLIKE POST
export const likePost = async id => {
  try {
    const response = await postsApi.post(`/${id}/like`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Like Post Error:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// SHARE POST
export const sharePost = async id => {
  try {
    const response = await postsApi.post(`/${id}/share`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Share Post Error:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};
