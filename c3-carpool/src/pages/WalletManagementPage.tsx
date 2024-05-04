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
  const [processing, setProcessing] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [cvv, setCVV] = useState<string>("");

  // Retrieve user type from localStorage
  const userType = localStorage.getItem("userType");

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/wallet", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wallet balance");
      }

      const data: WalletBalanceResponse = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      alert("Error fetching wallet balance");
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    if (!amount || isNaN(parseFloat(amount))) {
      alert("Please enter a valid amount.");
      setProcessing(false);
      return;
    }

    setTimeout(async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            type: transactionType,
            cardNumber,
            expiryDate,
            cvv,
          }),
        });

        const data: TransactionResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Transaction failed");
        }

        alert(data.message);
        setBalance(data.new_balance);
        setAmount("");
        setCardNumber("");
        setExpiryDate("");
        setCVV("");
      } catch (error: any) {
        console.error("Error handling transaction:", error);
        alert(error.message || "Error processing transaction");
      } finally {
        setProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="WalletManagement">
      <h2>Wallet Balance: ${balance.toFixed(2)}</h2>
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
              disabled={userType !== "driver"} // Disable selection if not a driver
            >
              <option value="add">Add Funds</option>
              <option value="withdraw">Withdraw Funds</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Card Number:
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              maxLength={16}
              placeholder="1234 5678 9123 4567"
              required
            />
          </label>
        </div>
        <div>
          <label>
            Expiry Date:
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder="MM/YY"
              required
            />
          </label>
        </div>
        <div>
          <label>
            CVV:
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCVV(e.target.value)}
              maxLength={3}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={processing}>
          {processing ? "Processing..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default WalletManagementPage;
