import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import colors from '../../themes/colors';

const PayUWebView = ({ paymentData, payuUrl, onSuccess, onFailure }) => {
  if (!paymentData || !payuUrl) {
    return null;
  }

  // Build HTML form with auto-submit
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh;
          flex-direction: column;
        }
        .form-wrapper {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #167A43;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        p { color: #666; margin-top: 10px; }
        input { display: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="form-wrapper">
          <h2>Processing Payment...</h2>
          <div class="spinner"></div>
          <p>Please wait while we redirect you to the payment gateway</p>
        </div>
      </div>

      <form id="payuForm" method="POST" action="${payuUrl}">
        <input type="hidden" name="key" value="${paymentData.key}" />
        <input type="hidden" name="txnid" value="${paymentData.txnid}" />
        <input type="hidden" name="amount" value="${paymentData.amount}" />
        <input type="hidden" name="productinfo" value="${paymentData.productinfo}" />
        <input type="hidden" name="firstname" value="${paymentData.firstname}" />
        <input type="hidden" name="email" value="${paymentData.email}" />
        <input type="hidden" name="phone" value="${paymentData.phone}" />
        <input type="hidden" name="surl" value="${paymentData.surl}" />
        <input type="hidden" name="furl" value="${paymentData.furl}" />
        <input type="hidden" name="hash" value="${paymentData.hash}" />
        <input type="hidden" name="service_provider" value="${paymentData.service_provider}" />
      </form>

      <script>
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(() => {
            console.log('Submitting PayU form...');
            document.getElementById('payuForm').submit();
          }, 1000);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webView}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator
              size="large"
              color={colors.primary || '#167A43'}
            />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onNavigationStateChange={(navState) => {
          console.log('PayU Navigation:', navState.url);
          // Handle success/failure URLs
          if (navState.url.includes('success')) {
            onSuccess?.();
          } else if (navState.url.includes('failure')) {
            onFailure?.();
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PayUWebView;
