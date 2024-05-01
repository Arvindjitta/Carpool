import React, { useState, useEffect } from "react";
import "./index.css";

interface Transaction {
  _id: {
    $oid: string;
  };
  amount: number;
  commission: number;
  created_At: string;
  date: string;
  type: string; // 'credit' or 'debit'
}

const FinancialManagementPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commissionEarned, setCommissionEarned] = useState<number | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchAdminDetails();
  }, []);

  function formatDate(dateStr: string) {
    if (!dateStr) {
      return "No date provided"; // Handle empty or null date strings
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  // Define a function to fetch the admin details
  const fetchAdminDetails = async (): Promise<number | null> => {
    try {
      const response = await fetch("http://127.0.0.1:5000/admin-details", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch admin details");
      }
      const data = await response.json();
      setCommissionEarned(data.commissionEarned);
      console.log("Commission Earned", data.commissionEarned);
      return data.commissionEarned;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data: Transaction[] = await response.json();
      setTransactions(data);
      console.log("Data", data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert("Failed to load transactions");
    }
    setLoading(false);
  };

  return (
    <div className="FinancialManagement">
      <h1>Financial Transactions</h1>
      <p>
        Total Commission Earned: <b>{commissionEarned}$</b>
      </p>
      {loading ? (
        <p>Loading transactions...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>

              {/* <th>User Name</th> */}
              <th>Amount</th>
              <th>Comission earned</th>

              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction._id?.$oid}>
                <td>{transaction._id?.$oid}</td>
                {/* <td>{transaction.userName}</td> */}
                <td>${transaction.amount.toFixed(2)}</td>
                <td>
                  {transaction.commission
                    ? `${transaction.commission.toFixed(2)}$`
                    : "-"}
                </td>

                <td>
                  {transaction.type ? `wallet ${transaction.type}` : "payment"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FinancialManagementPage;
