import { useEffect, useRef, useCallback } from 'react';
import { NativeEventEmitter, Alert } from 'react-native';
import PayUBizSdk from 'payu-non-seam-less-react';

const PayUCheckout = ({ onSuccess, onFailure, onCancel, onError, backendUrl }) => {
  const callbacks = useRef({});
  const emitterRef = useRef(null);

  callbacks.current = {
    onSuccess,
    onFailure,
    onCancel,
    onError,
  };

  // Register SDK event listeners
  useEffect(() => {
    try {
      // Check if PayUBizSdk has proper event emitter support
      if (!PayUBizSdk || typeof PayUBizSdk !== 'object') {
        console.warn('⚠️ PayUBizSdk not properly loaded');
        return;
      }

      const emitter = new NativeEventEmitter(PayUBizSdk);
      emitterRef.current = emitter;

      const subscriptions = [
        emitter.addListener('onPaymentSuccess', event => {
          console.log('✅ PayU Payment Success:', event);
          callbacks.current.onSuccess?.(event);
        }),

        emitter.addListener('onPaymentFailure', event => {
          console.log('❌ PayU Payment Failure:', event);
          callbacks.current.onFailure?.(event);
        }),

        emitter.addListener('onPaymentCancel', event => {
          console.log('⚠️ PayU Payment Cancelled');
          callbacks.current.onCancel?.(event);
        }),

        emitter.addListener('onError', event => {
          console.log('⚠️ PayU Payment Error:', event);
          callbacks.current.onError?.(event);
        }),

        // ✅ CRITICAL: Dynamic Hash Generation Callback
        // SDK calls this during transaction to get runtime hash
        // For React Native 0.82.0+, MUST use PayUBizSdk.makeHttpRequest instead of fetch/axios
        emitter.addListener('generateHash', async event => {
          console.log('🔐 generateHash callback received:', event);
          
          try {
            const hashString = event.hashString;
            const hashName = event.hashName;
            const postSalt = event.postSalt; // Required for split payment/additional charges
            
            if (!hashString) {
              console.error('❌ No hashString in generateHash callback');
              return;
            }

            console.log(`📤 Generating hash for ${hashName}:`, hashString.substring(0, 50) + '...');
            if (postSalt) {
              console.log(`📝 postSalt provided:`, postSalt);
            }

            // Prepare request body
            const rawBody = JSON.stringify({
              hashString,
              postSalt: postSalt || undefined,
            });
            
            // Prepare headers
            const headers = {
              'Content-Type': 'application/json',
            };
            
            // Build URL - backendUrl should be http://ip:port/api
            const url = `${backendUrl}/payment/payu/generate-hash`;
            console.log(`📍 Hash endpoint URL: ${url}`);
            
            // ⚠️ CRITICAL FIX: Use PayUBizSdk.makeHttpRequest for React Native 0.82.0+
            // This is REQUIRED by official PayU docs - not using it causes error 5019
            const response = await PayUBizSdk.makeHttpRequest(
              url,
              'POST',
              rawBody,
              headers
            );

            console.log('📥 Raw response from makeHttpRequest:', response);
            
            // Parse response - it may come as string or object
            let parsedResponse;
            if (typeof response === 'string') {
              parsedResponse = JSON.parse(response);
            } else {
              parsedResponse = response;
            }

            console.log('📦 Parsed response:', parsedResponse);

            // Extract hash from backend response
            // Backend returns: { data: { hash: "...", hashName: "..." } }
            const hash = parsedResponse?.data?.hash || parsedResponse?.hash;
            
            if (hash) {
              console.log(`✅ Hash generated successfully:`, hash.substring(0, 50) + '...');
              
              // Send hash back to SDK via callback
              const result = { [hashName]: hash };
              console.log(`📤 Calling PayUBizSdk.hashGenerated with:`, result);
              PayUBizSdk.hashGenerated(result);
            } else {
              console.error('❌ No hash in response:', parsedResponse);
              callbacks.current.onError?.({ error: 'Hash generation failed - no hash returned' });
            }
          } catch (err) {
            console.error('❌ Error in generateHash:', err);
            console.error('Error message:', err.message);
            console.error('Error details:', JSON.stringify(err));
            callbacks.current.onError?.({ error: `Hash generation error: ${err.message}` });
          }
        }),
      ];

      return () => {
        subscriptions.forEach(item => item.remove());
      };
    } catch (err) {
      console.error('❌ Error setting up PayU event emitter:', err.message);
      callbacks.current.onError?.({ error: 'Failed to setup PayU SDK' });
    }
  }, [backendUrl]);

  // Open PayU Checkout
  const openPayment = useCallback(paymentParams => {
    console.log('🚀 Opening PayU Checkout with params:', paymentParams);
    
    try {
      // PayU React Native SDK expects these exact parameter names (official docs)
      const params = {
        key: paymentParams.key,
        transactionId: paymentParams.transactionId,  // Changed from txnid
        amount: paymentParams.amount,
        productinfo: paymentParams.productinfo,
        firstname: paymentParams.firstname,
        email: paymentParams.email,
        phone: paymentParams.phone,
        // Platform-specific URLs
        android_surl: paymentParams.android_surl,
        android_furl: paymentParams.android_furl,
        ios_surl: paymentParams.ios_surl,
        ios_furl: paymentParams.ios_furl,
        // Nested hashes object
        hashes: paymentParams.hashes,
        environment: paymentParams.environment,
        userCredential: paymentParams.userCredential,
      };

      console.log('📤 Sending to SDK:', params);

      PayUBizSdk.openCheckoutScreen({
        payUPaymentParams: params,
      });
    } catch (error) {
      console.error('❌ Error opening PayU checkout:', error);
      callbacks.current.onError?.(error);
    }
  }, []);

  return { openPayment };
};

export default PayUCheckout;
