export const submitPayment = async (paymentData) => {
  console.log('Mock payment payload:', paymentData);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const shouldFail = false; // error simulation

      if (shouldFail) {
        reject({
          success: false,
          message: 'Payment failed. Please try again.',
        });
        return;
      }

      resolve({
        success: true,
        orderId: `ORD-${Date.now()}`,
        message: 'Payment processed successfully.',
      });
    }, 1500);
  });
};