import { useState, useEffect } from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { jwtDecode } from "jwt-decode"; // You'll need to install this: npm install jwt-decode

function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');

  // Replace with your Google Client ID
  const clientId = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; 

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser(decoded);
    fetchTransactions(decoded.email);
  };

  const fetchTransactions = async (email) => {
    // In dev: http://127.0.0.1:8000. In prod: Your Vercel Backend URL
    const res = await axios.get(`http://127.0.0.1:8000/transactions/${email}`);
    setTransactions(res.data);
  };

  const addTransaction = async () => {
    await axios.post('http://127.0.0.1:8000/add-transaction', {
      amount: parseFloat(amount),
      category: "Food", // Hardcoded for demo
      type: "expense",
      user_email: user.email
    });
    setAmount('');
    fetchTransactions(user.email);
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div style={{ padding: '20px' }}>
        <h1>Finance Tracker</h1>
        
        {!user ? (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.log('Login Failed')}
          />
        ) : (
          <div>
            <h3>Welcome, {user.name}</h3>
            <div style={{ marginBottom: '20px'}}>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="Amount (e.g. 300)"
              />
              <button onClick={addTransaction}>Add Expense</button>
            </div>

            <h4>Your History:</h4>
            <ul>
              {transactions.map((t, index) => (
                <li key={index}>₹{t.amount} - {t.category}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  )
}

export default App