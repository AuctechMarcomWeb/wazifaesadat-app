import RazorpayCheckout from 'react-native-razorpay';

export const openRazorpayCheckout = async ({
  key,
  orderId,
  amount,
  name,
  email,
  phone,
  description = 'Donation Payment',
}) => {
  try {
    const options = {
      key,
      order_id: orderId,
      amount: String(amount), // Amount in paise, from backend
      currency: 'INR',
      name: 'AWSM',
      description,
      prefill: {
        name,
        email,
        contact: phone,
      },
      theme: {
        color: '#2563EB',
      },
    };

    const response = await RazorpayCheckout.open(options);

    console.log('Razorpay Success:', response);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.log('Razorpay Error:', error);

    return {
      success: false,
      message: error?.description || 'Payment failed or cancelled',
      data: error,
    };
  }
};
