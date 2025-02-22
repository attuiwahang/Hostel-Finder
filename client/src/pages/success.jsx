import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, ArrowLeft, Receipt } from 'lucide-react';

const Success = () => {
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    orderId: '',
    status: 'processing'
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const pidx = queryParams.get('pidx');
    const amount = queryParams.get('amount');
    const purchase_order_id = queryParams.get('purchase_order_id');

    if (pidx && amount && purchase_order_id) {
      setPaymentDetails({
        amount,
        orderId: purchase_order_id,
        status: 'processing'
      });

      const confirmPayment = async () => {
        try {
          const response = await axios.get("http://localhost:8870/booking/confirmpayment", {
            params: { pidx, amount, purchase_order_id }
          });
          console.log('Payment confirmation response:', response.data);
          setPaymentDetails(prev => ({ ...prev, status: 'success' }));
        } catch (error) {
          console.error('Error confirming payment:', error);
          setPaymentDetails(prev => ({ ...prev, status: 'error' }));
        }
      };
      confirmPayment();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your payment. Your transaction has been completed successfully.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">Amount Paid</span>
              <span className="text-gray-900 font-semibold">
                Rs. {paymentDetails.amount / 100|| '0'}
              </span>
            </div>
            
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Return to Home
            </button>
            
            <button 
              onClick={() => window.print()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Receipt className="h-5 w-5" />
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;