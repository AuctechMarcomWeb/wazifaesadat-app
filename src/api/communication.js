import { createAxiosInstance } from './apiConfig';

const communicationApi = createAxiosInstance('communication');

/**
 * Get Communications by Type with Send Filter
 * Fetches communications (inbound, outbound, draft) with optional send filter
 * @param {string} type - Type of communication ('inbound', 'outbound', 'draft')
 * @param {string} send - Send filter ('sent', 'received', or null for all)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns { success, communications, total, totalPages, currentPage, message }
 */
export const getCommunicationsByType = async (
  type = 'inbound',
  send = null,
  page = 1,
  limit = 10,
) => {
  try {
    if (!['inbound', 'outbound', 'draft'].includes(type)) {
      return {
        success: false,
        communications: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        message: 'Invalid communication type',
      };
    }

    // Build query string
    const params = new URLSearchParams({
      page,
      limit,
      type,
    });

    // Add send filter if provided
    if (send && ['sent', 'received'].includes(send)) {
      params.append('send', send);
    }

    const response = await communicationApi.get(
      `?${params.toString()}`,
    );

    if (response.data.success && response.data.data?.communications) {
      const communications = response.data.data.communications.map(comm => ({
        id: comm._id,
        type: comm.type,
        from: comm.from,
        to: comm.to,
        description: comm.description,
        document: comm.document,
        recipients: comm.tagTo?.map(tag => ({
          memberId: tag.memberId?._id,
          name: tag.memberId?.name,
          memberType: tag.memberType,
          phone: tag.memberId?.mobileNumber,
          city: tag.memberId?.city,
          acountNo: tag.memberId?.acountNo,
        })) || [],
        createdAt: comm.createdAt,
        updatedAt: comm.updatedAt,
      }));

      console.log('✅ Communications Fetched:');
      console.log('   - Type:', type);
      console.log('   - Send:', send || 'all');
      console.log('   - Count:', communications.length);
      console.log('   - Total:', response.data.data.total);

      return {
        success: true,
        communications,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
        currentPage: response.data.data.currentPage,
        message: response.data.message,
      };
    }

    return {
      success: false,
      communications: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      message: response.data.message || 'Failed to fetch communications',
    };
  } catch (error) {
    console.error('Communications fetch error:', error.message);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      communications: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get All Communications (all types combined)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns { success, communications, message }
 */
export const getAllCommunications = async (page = 1, limit = 30) => {
  try {
    // Fetch all three types
    const [inbound, outbound, draft] = await Promise.all([
      getCommunicationsByType('inbound', page, limit),
      getCommunicationsByType('outbound', page, limit),
      getCommunicationsByType('draft', page, limit),
    ]);

    // Combine all communications and sort by date
    const allCommunications = [
      ...inbound.communications,
      ...outbound.communications,
      ...draft.communications,
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Newest first
    });

    console.log('✅ All Communications:');
    console.log('   - Total:', allCommunications.length);
    console.log('   - Inbound:', inbound.communications.length);
    console.log('   - Outbound:', outbound.communications.length);
    console.log('   - Draft:', draft.communications.length);

    return {
      success: true,
      communications: allCommunications,
      message: 'All communications fetched successfully',
    };
  } catch (error) {
    console.error('All communications fetch error:', error.message);
    return {
      success: false,
      communications: [],
      message: error.message,
    };
  }
};

/**
 * Search Communications
 * @param {string} searchTerm - Search by title, description, or recipient name
 * @param {string} type - Filter by type ('inbound', 'outbound', 'draft', or 'all')
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns { success, communications, message }
 */
export const searchCommunications = async (
  searchTerm = '',
  type = 'all',
  page = 1,
  limit = 10,
) => {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return {
        success: false,
        communications: [],
        message: 'Search term required',
      };
    }

    const q = searchTerm.trim().toLowerCase();

    // Fetch communications based on type
    let response;
    if (type === 'all') {
      response = await getAllCommunications(page, limit);
    } else {
      response = await getCommunicationsByType(type, page, limit);
    }

    if (!response.success) {
      return response;
    }

    // Filter by search term
    const filtered = response.communications.filter(comm => {
      return (
        comm.from.toLowerCase().includes(q) ||
        comm.to.toLowerCase().includes(q) ||
        comm.description.toLowerCase().includes(q) ||
        comm.recipients.some(r => r.name?.toLowerCase().includes(q))
      );
    });

    console.log('✅ Communications Search:');
    console.log('   - Term:', searchTerm);
    console.log('   - Type:', type);
    console.log('   - Found:', filtered.length);

    return {
      success: true,
      communications: filtered,
      message: `Found ${filtered.length} communications`,
    };
  } catch (error) {
    console.error('Search error:', error.message);
    return {
      success: false,
      communications: [],
      message: error.message,
    };
  }
};

/**
 * Get Communication Detail
 * @param {string} communicationId - Communication ID
 * @returns { success, communication, message }
 */
export const getCommunicationDetail = async (communicationId) => {
  try {
    if (!communicationId) {
      return {
        success: false,
        communication: null,
        message: 'Communication ID required',
      };
    }

    // Since API doesn't have individual fetch, we'll return a placeholder
    // In production, this would fetch from /communication/:id endpoint

    console.log('✅ Communication Detail:');
    console.log('   - ID:', communicationId);

    return {
      success: true,
      communication: null,
      message: 'Communication detail endpoint not available',
    };
  } catch (error) {
    console.error('Detail fetch error:', error.message);
    return {
      success: false,
      communication: null,
      message: error.message,
    };
  }
};

/**
 * Get All Messaging (For Messagingscreen.jsx)
 * Fetches all messages with optional type filter (received/sent)
 * Uses /api/messaging/all endpoint
 * @param {string} messageType - Message type filter ('received', 'sent', or null for all)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 100)
 * @returns { success, messages, total, message }
 */
export const getMessagingAll = async (messageType = null, page = 1, limit = 100) => {
  try {
    // Create separate axios instance for messaging API
    const messagingApi = createAxiosInstance('messaging');

    // Build query string for /api/messaging/all endpoint
    const params = new URLSearchParams({
      page,
      limit,
      sortBy: 'recent',
    });

    // Add messageType filter if provided
    if (messageType && ['received', 'sent'].includes(messageType)) {
      params.append('messageType', messageType);
    }

    const response = await messagingApi.get(`/all?${params.toString()}`);

    if (response.data.statusCode === 200 && response.data.data?.data) {
      const messages = response.data.data.data.map(msg => ({
        id: msg._id,
        type: msg.type || 'inbound', // inbound/outbound
        title: msg.title,
        description: msg.description,
        preview: msg.description?.substring(0, 100) || '',
        date: formatMessageDate(new Date(msg.createdAt)),
        priority: msg.priority || 'normal',
        attachment: msg.attachment || '',
        recipients: msg.recipients || [],
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      }));

      console.log('✅ Messaging All Fetched:');
      console.log('   - Type:', messageType || 'all');
      console.log('   - Count:', messages.length);
      console.log('   - Total:', response.data.data.data.length);

      return {
        success: true,
        messages,
        total: response.data.data.data.length,
        message: 'Messages fetched successfully',
      };
    }

    return {
      success: false,
      messages: [],
      total: 0,
      message: response.data.message || 'Failed to fetch messages',
    };
  } catch (error) {
    console.error('Messaging fetch error:', error.message);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      messages: [],
      total: 0,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Messaging Detail (For Messagingscreen.jsx - Message Detail View)
 * Fetches individual message with full details
 * Uses /api/messaging/{messageId} endpoint
 * @param {string} messageId - Message ID
 * @returns { success, message, messageInfo }
 */
export const getMessagingDetail = async (messageId) => {
  try {
    if (!messageId) {
      return {
        success: false,
        message: null,
        messageInfo: 'Message ID required',
      };
    }

    // Create separate axios instance for messaging API
    const messagingApi = createAxiosInstance('messaging');

    const response = await messagingApi.get(`/${messageId}`);

    if (response.data.statusCode === 200 && response.data.data) {
      const msg = response.data.data;
      const messageDetail = {
        id: msg._id,
        type: msg.type || 'inbound',
        title: msg.title,
        description: msg.description,
        priority: msg.priority || 'normal',
        attachment: msg.attachment || '',
        recipientType: msg.recipientType,
        recipients: msg.recipients?.map(r => ({
          recipientId: r.recipientId?._id,
          name: r.recipientId?.name,
          designation: r.recipientId?.designation,
          city: r.recipientId?.city,
          mobileNumber: r.recipientId?.mobileNumber,
          accountNo: r.recipientId?.acountNo,
          model: r.recipientModel,
        })) || [],
        readBy: msg.readBy?.map(r => ({
          userId: r.userId?._id,
          userName: r.userId?.name,
          userRole: r.userId?.role,
          readAt: r.readAt,
        })) || [],
        taggedUsers: msg.taggedUsers || [],
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      };

      console.log('✅ Messaging Detail Fetched:');
      console.log('   - ID:', messageId);
      console.log('   - Title:', msg.title);
      console.log('   - Recipients:', msg.recipients?.length || 0);
      console.log('   - Read By:', msg.readBy?.length || 0);

      return {
        success: true,
        message: messageDetail,
        messageInfo: response.data.message,
      };
    }

    return {
      success: false,
      message: null,
      messageInfo: response.data.message || 'Failed to fetch message detail',
    };
  } catch (error) {
    console.error('Messaging detail fetch error:', error.message);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      message: null,
      messageInfo: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Upload Image (For MessageDetailsScreen.jsx - Attachment)
 * Uploads image file to Cloudinary
 * Uses POST /api/upload/uploadImage endpoint
 * @param {FormData} formData - Form data containing image file
 * @returns { success, imageUrl, message }
 */
export const uploadImage = async (formData) => {
  try {
    if (!formData) {
      return {
        success: false,
        imageUrl: null,
        message: 'Form data required',
      };
    }

    // Create separate axios instance for upload API
    const uploadApi = createAxiosInstance('upload');

    const response = await uploadApi.post('/uploadImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.statusCode === 200 && response.data.data?.imageUrl) {
      console.log('✅ Image Uploaded:');
      console.log('   - URL:', response.data.data.imageUrl);

      return {
        success: true,
        imageUrl: response.data.data.imageUrl,
        message: response.data.message || 'Image uploaded successfully',
      };
    }

    return {
      success: false,
      imageUrl: null,
      message: response.data.message || 'Failed to upload image',
    };
  } catch (error) {
    console.error('Image upload error:', error.message);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      imageUrl: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Send Message (For ComposeMessageScreen.jsx - Create New Message)
 * Sends a new message to selected recipients
 * Uses POST /api/messaging/create endpoint
 * @param {object} data - Message data
 * @returns { success, message, message_info }
 */
export const sendMessage = async (data) => {
  try {
    if (!data.title || !data.description) {
      return {
        success: false,
        message: null,
        message_info: 'Title and description are required',
      };
    }

    // Create separate axios instance for messaging API
    const messagingApi = createAxiosInstance('messaging');

    // Build message payload
    const payload = {
      title: data.title,
      description: data.description,
      attachment: data.attachment || '', // Cloudinary URL from uploadImage
      priority: data.priority || 'normal',
      type: data.type || 'outbound', // outbound/inbound
      recipientType: data.recipientType || 'selected',
      recipients: data.recipients || [], // Array of recipient objects with recipientId, recipientModel
      recipientRoles: data.recipientRoles || [],
      taggedUsers: data.taggedUsers || [], // Array of tagged user objects with taggedId, taggedModel
    };

    const response = await messagingApi.post('/create', payload);

    if (response.data.statusCode === 201 && response.data.data) {
      const msg = response.data.data;
      const messageDetail = {
        id: msg._id,
        title: msg.title,
        description: msg.description,
        attachment: msg.attachment,
        priority: msg.priority,
        type: msg.type,
        recipients: msg.recipients || [],
        taggedUsers: msg.taggedUsers || [],
        createdAt: msg.createdAt,
        createdBy: msg.createdBy,
      };

      console.log('✅ Message Sent:');
      console.log('   - Title:', msg.title);
      console.log('   - Recipients:', msg.recipients?.length || 0);
      console.log('   - Status Code:', response.data.statusCode);

      return {
        success: true,
        message: messageDetail,
        message_info: response.data.message || 'Message sent successfully',
      };
    }

    return {
      success: false,
      message: null,
      message_info: response.data.message || 'Failed to send message',
    };
  } catch (error) {
    console.error('Send message error:', error.message);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      message: null,
      message_info: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Send Message Reply (For MessageDetailsScreen.jsx - Reply Form)
 * Sends a reply to an existing message
 * Uses POST /api/messaging/{messageId}/reply endpoint
 * @param {string} messageId - Parent message ID
 * @param {object} data - Reply data
 * @returns { success, reply, message }
 */
export const sendMessageReply = async (messageId, data) => {
  try {
    if (!messageId || !data) {
      return {
        success: false,
        reply: null,
        message: 'Message ID and reply data required',
      };
    }

    if (!data.description || data.description.trim().length === 0) {
      return {
        success: false,
        reply: null,
        message: 'Reply message cannot be empty',
      };
    }

    // Create separate axios instance for messaging API
    const messagingApi = createAxiosInstance('messaging');

    // Build reply payload
    const payload = {
      title: data.title || `Re: ${data.parentTitle || 'Message'}`,
      description: data.description,
      attachment: data.attachment || '', // Cloudinary URL from uploadImage
      priority: data.priority || 'normal',
      recipientType: data.recipientType || 'selected',
      recipients: data.recipients || [], // Array of recipient objects with recipientId, recipientModel
      taggedUsers: data.taggedUsers || [], // Array of tagged user objects with taggedId, taggedModel
      replyVisibleTo: data.replyVisibleTo || [],
    };

    const response = await messagingApi.post(`/${messageId}/reply`, payload);

    if (response.data.statusCode === 201 && response.data.data) {
      const reply = response.data.data;
      const replyDetail = {
        id: reply._id,
        title: reply.title,
        description: reply.description,
        attachment: reply.attachment,
        priority: reply.priority,
        recipients: reply.recipients || [],
        taggedUsers: reply.taggedUsers || [],
        parentMessage: reply.parentMessage,
        threadId: reply.threadId,
        createdAt: reply.createdAt,
        createdBy: reply.createdBy,
      };

      console.log('✅ Reply Sent:');
      console.log('   - Title:', reply.title);
      console.log('   - Recipients:', reply.recipients?.length || 0);
      console.log('   - Status Code:', response.data.statusCode);

      return {
        success: true,
        reply: replyDetail,
        message: response.data.message || 'Reply sent successfully',
      };
    }

    return {
      success: false,
      reply: null,
      message: response.data.message || 'Failed to send reply',
    };
  } catch (error) {
    console.error('Send reply error:', error.message);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      reply: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Executive Members (For MessageDetailsScreen.jsx - Tag Users Dropdown)
 * Fetches all executive members for recipient selection
 * Uses GET /api/executive-member?isPagination=false endpoint
 * @returns { success, members, message }
 */
export const getExecutiveMembers = async () => {
  try {
    const membersApi = createAxiosInstance('executive-member');

    const response = await membersApi.get('?isPagination=false');

    if (response.data.statusCode === 200 && response.data.data?.members) {
      const members = response.data.data.members.map(member => ({
        id: member._id,
        name: member.name,
        memberType: 'ExecutiveMember',
        city: member.city,
        phone: member.mobileNumber,
        accountNo: member.acountNo,
      }));

      console.log('✅ Executive Members Fetched:');
      console.log('   - Count:', members.length);

      return {
        success: true,
        members,
        message: 'Executive members fetched successfully',
      };
    }

    return {
      success: false,
      members: [],
      message: response.data.message || 'Failed to fetch executive members',
    };
  } catch (error) {
    console.error('Executive members fetch error:', error.message);
    return {
      success: false,
      members: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Office Bearers (For MessageDetailsScreen.jsx - Tag Users Dropdown)
 * Fetches all office bearers for recipient selection
 * Uses GET /api/office-bearer?isPagination=false&sortBy=recent endpoint
 * @returns { success, bearers, message }
 */
export const getOfficeBearers = async () => {
  try {
    const bearersApi = createAxiosInstance('office-bearer');

    const response = await bearersApi.get('?isPagination=false&sortBy=recent');

    if (response.data.statusCode === 200 && response.data.data?.bearers) {
      const bearers = response.data.data.bearers.map(bearer => ({
        id: bearer._id,
        name: bearer.name,
        memberType: 'OfficeBearer',
        designation: bearer.designation?.name,
        city: bearer.city,
        phone: bearer.mobileNumber,
        accountNo: bearer.acountNo,
      }));

      console.log('✅ Office Bearers Fetched:');
      console.log('   - Count:', bearers.length);

      return {
        success: true,
        bearers,
        message: 'Office bearers fetched successfully',
      };
    }

    return {
      success: false,
      bearers: [],
      message: response.data.message || 'Failed to fetch office bearers',
    };
  } catch (error) {
    console.error('Office bearers fetch error:', error.message);
    return {
      success: false,
      bearers: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Local Secretaries (For MessageDetailsScreen.jsx - Tag Users Dropdown)
 * Fetches all local secretaries for recipient selection
 * Uses GET /api/local-secretary?isPagination=false endpoint
 * @returns { success, secretaries, message }
 */
export const getLocalSecretaries = async () => {
  try {
    const secretariesApi = createAxiosInstance('local-secretary');

    const response = await secretariesApi.get('?isPagination=false');

    if (response.data.statusCode === 200 && response.data.data?.members) {
      const secretaries = response.data.data.members.map(secretary => ({
        id: secretary._id,
        name: secretary.name,
        memberType: 'LocalSecretary',
        city: secretary.city,
        phone: secretary.mobileNumber,
        accountNo: secretary.acountNo,
      }));

      console.log('✅ Local Secretaries Fetched:');
      console.log('   - Count:', secretaries.length);

      return {
        success: true,
        secretaries,
        message: 'Local secretaries fetched successfully',
      };
    }

    return {
      success: false,
      secretaries: [],
      message: response.data.message || 'Failed to fetch local secretaries',
    };
  } catch (error) {
    console.error('Local secretaries fetch error:', error.message);
    return {
      success: false,
      secretaries: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Mark Message as Read (For Messagingscreen.jsx - Message Detail View)
 * Marks a message as read by current user
 * Uses PATCH /api/messaging/read/{messageId} endpoint
 * @param {string} messageId - Message ID
 * @returns { success, messageInfo }
 */
export const markMessageAsRead = async (messageId) => {
  try {
    if (!messageId) {
      return {
        success: false,
        messageInfo: 'Message ID required',
      };
    }

    // Create separate axios instance for messaging API
    const messagingApi = createAxiosInstance('messaging');

    const response = await messagingApi.patch(`/read/${messageId}`);

    if (response.data.statusCode === 200) {
      console.log('✅ Message Marked as Read:');
      console.log('   - ID:', messageId);

      return {
        success: true,
        messageInfo: response.data.message || 'Message marked as read',
      };
    }

    return {
      success: false,
      messageInfo: response.data.message || 'Failed to mark message as read',
    };
  } catch (error) {
    console.error('Mark as read error:', error.message);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      messageInfo: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Helper function to format message date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatMessageDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  }
};

/**
 * Create Communication (Draft)
 * @param {object} data - Communication data
 * @returns { success, communication, message }
 */
export const createCommunication = async (data) => {
  try {
    if (!data.from || !data.to || !data.description) {
      return {
        success: false,
        communication: null,
        message: 'Missing required fields: from, to, description',
      };
    }

    const payload = {
      type: 'draft',
      from: data.from,
      to: data.to,
      description: data.description,
      document: data.document || '',
      tagTo: data.tagTo || [],
    };

    const response = await communicationApi.post('/communication', payload);

    if (response.data.success) {
      console.log('✅ Communication Created:');
      console.log('   - From:', data.from);
      console.log('   - To:', data.to);

      return {
        success: true,
        communication: response.data.data,
        message: response.data.message,
      };
    }

    return {
      success: false,
      communication: null,
      message: response.data.message || 'Failed to create communication',
    };
  } catch (error) {
    console.error('Create error:', error.message);
    return {
      success: false,
      communication: null,
      message: error.response?.data?.message || error.message,
    };
  }
};
