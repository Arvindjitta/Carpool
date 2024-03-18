import React, { useState, useEffect } from "react";
import "../styles/WalletManagementPage.css";
interface WalletBalanceResponse {
  balance: number;
}

interface TransactionResponse {
  message: string;
  new_balance: number;
  transaction_type: string;
}

const WalletManagementPage: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [transactionType, setTransactionType] = useState<"add" | "withdraw">(
    "add"
  );

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/wallet", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Include Authorization header if JWT is required
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wallet balance");
      }

      const data: WalletBalanceResponse = await response.json();
      setBalance(data.balance);
      console.log("BALANCE", data.balance);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include Authorization header if JWT is required
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type: transactionType,
        }),
      });

      if (!response.ok) {
        throw new Error("Transaction failed");
      }

      const data: TransactionResponse = await response.json();
      alert(data.message);
      setBalance(data.new_balance); // Update balance displayed to the user
      setAmount(""); // Reset amount field
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="WalletManagement">
      <h2>Wallet Balance: ${balance}</h2>
      <form onSubmit={handleTransaction}>
        <div>
          <label>
            Amount:
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </label>
        </div>
        <div>
          <label>
            Transaction Type:
            <select
              value={transactionType}
              onChange={(e) =>
                setTransactionType(e.target.value as "add" | "withdraw")
              }
            >
              <option value="add">Add Funds</option>
              <option value="withdraw">Withdraw Funds</option>
            </select>
          </label>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default WalletManagementPage;
