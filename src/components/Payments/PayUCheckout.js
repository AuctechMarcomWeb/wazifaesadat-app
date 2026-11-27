import { useEffect, useRef, useCallback } from 'react';
import { NativeEventEmitter } from 'react-native';
import PayUBizSdk from 'payu-non-seam-less-react';

const PayUCheckout = ({
  onSuccess,
  onFailure,
  onCancel,
  onError,
  backendUrl,
}) => {
  const callbacks = useRef({});
  const emitterRef = useRef(null);

  callbacks.current = {
    onSuccess,
    onFailure,
    onCancel,
    onError,
  };

  useEffect(() => {
    if (!PayUBizSdk) {
      console.error('❌ [PayU] PayUBizSdk is not available');
      return;
    }

    const emitter = new NativeEventEmitter(PayUBizSdk);
    emitterRef.current = emitter;

    const subscriptions = [];

    subscriptions.push(
      emitter.addListener('onPaymentSuccess', event => {
        console.log('✅ [PayU] onPaymentSuccess:', JSON.stringify(event));
        callbacks.current.onSuccess?.(event);
      }),
    );

    subscriptions.push(
      emitter.addListener('onPaymentFailure', event => {
        console.log('❌ [PayU] onPaymentFailure:', JSON.stringify(event));
        callbacks.current.onFailure?.(event);
      }),
    );

    subscriptions.push(
      emitter.addListener('onPaymentCancel', event => {
        console.log('⚠️ [PayU] onPaymentCancel:', JSON.stringify(event));
        callbacks.current.onCancel?.(event);
      }),
    );

    subscriptions.push(
      emitter.addListener('onError', event => {
        console.error('🚨 [PayU] onError FULL:', JSON.stringify(event));
        callbacks.current.onError?.(event);
      }),
    );

    subscriptions.push(
      emitter.addListener('generateHash', async event => {
        console.log('====================================');
        console.log('🔐 [PayU] generateHash EVENT:', {
          hashName: event?.hashName,
          hashString: event?.hashString,
          postSalt: event?.postSalt ?? null,
        });

        try {
          const { hashString, hashName, postSalt } = event || {};

          if (!hashString || !hashName) {
            throw new Error('Invalid PayU hash callback data');
          }

          if (!backendUrl) {
            throw new Error('Backend URL is missing');
          }

          const url = `${backendUrl}/donation/payu/generate-hash`;

          const requestPayload = {
            hashString,
            hashName,
            ...(postSalt ? { postSalt } : {}),
          };

          console.log('📤 [PayU] Sending to backend:', {
            url,
            requestPayload,
          });

          const response = await PayUBizSdk.makeHttpRequest(
            url,
            'POST',
            JSON.stringify(requestPayload),
            { 'Content-Type': 'application/json' },
          );

          console.log('📥 [PayU] Raw backend response:', response);

          const parsedResponse =
            typeof response === 'string' ? JSON.parse(response) : response;

          if (
            parsedResponse?.success === false ||
            (parsedResponse?.statusCode && parsedResponse.statusCode !== 200)
          ) {
            throw new Error(
              parsedResponse?.message || 'Backend hash API failed',
            );
          }

          const hashValue = parsedResponse?.data?.hash || parsedResponse?.hash;
          const returnedHashName =
            parsedResponse?.data?.hashName ||
            parsedResponse?.hashName ||
            hashName;

          console.log('🔑 [PayU] Backend hash parsed:', {
            hashName,
            returnedHashName,
            hashLength: hashValue?.length,
            hashValue,
          });

          if (!hashValue || !/^[a-f0-9]{128}$/i.test(hashValue)) {
            throw new Error('Invalid SHA-512 hash received from backend');
          }

          if (returnedHashName !== hashName) {
            throw new Error(
              `Hash name mismatch: expected ${hashName}, received ${returnedHashName}`,
            );
          }

          const result = {
            [hashName]: hashValue,
          };

          console.log('🚀 [PayU] Calling PayUBizSdk.hashGenerated:', result);
          console.log('====================================');
          PayUBizSdk.hashGenerated(result);
        } catch (error) {
          console.error('❌ [PayU] Hash generation error:', error);
          callbacks.current.onError?.({
            errorCode: 'HASH_GENERATION_FAILED',
            errorMsg: error?.message || 'Unable to generate PayU hash',
          });
        }
      }),
    );

    return () => {
      subscriptions.forEach(sub => sub.remove());
      emitterRef.current = null;
    };
  }, [backendUrl]);

  const openPayment = useCallback(paymentParams => {
    try {
      if (!paymentParams) {
        throw new Error('PayU payment parameters are missing');
      }

      const {
        key,
        transactionId,
        amount,
        productInfo,
        productinfo,
        firstName,
        firstname,
        email,
        phone,
        android_surl,
        android_furl,
        ios_surl,
        ios_furl,
        environment,
        userCredential,
        userToken,
        additionalParam,
      } = paymentParams;

      const resolvedProductInfo = productInfo ?? productinfo;
      const resolvedFirstName = firstName ?? firstname;

      if (
        !key ||
        !transactionId ||
        !amount ||
        !resolvedProductInfo ||
        !resolvedFirstName ||
        !email
      ) {
        throw new Error('Required PayU payment parameters are missing');
      }

      if (String(transactionId).length > 25) {
        throw new Error('PayU transaction ID cannot exceed 25 characters');
      }

      const payUPaymentParams = {
        key: String(key),
        transactionId: String(transactionId),
        amount: String(amount),
        productInfo: String(resolvedProductInfo),
        firstName: String(resolvedFirstName),
        email: String(email),
        phone: String(phone || ''),
        android_surl: android_surl || '',
        android_furl: android_furl || '',
        ios_surl: ios_surl || '',
        ios_furl: ios_furl || '',
        environment: String(environment ?? '0'),
        userCredential: userCredential || `${key}:${email}`,
        ...(userToken ? { userToken } : {}),
        ...(additionalParam ? { additionalParam } : {}),
        hashes: {},
      };

      console.log(
        '💳 [PayU] openCheckoutScreen FULL PARAMS:',
        payUPaymentParams,
      );

      PayUBizSdk.openCheckoutScreen({
        payUPaymentParams,
      });
    } catch (error) {
      console.error('❌ [PayU] Checkout error:', error);
      callbacks.current.onError?.({
        errorCode: 'CHECKOUT_INITIALIZATION_FAILED',
        errorMsg: error?.message || 'Unable to open PayU checkout',
      });
    }
  }, []);

  return {
    openPayment,
  };
};

export default PayUCheckout;
