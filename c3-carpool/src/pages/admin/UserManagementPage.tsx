import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./UserManagementPage.css";

interface User {
  id: number;
  _id: {
    $oid: string;
  };
  name: string;
  email: string;
  userType: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data: User[] = await response.json();
      console.log("DATA", data);
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to load users");
    }
    setLoading(false);
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/users/${encodeURIComponent(userId)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to delete user");
        }
        alert("User deleted successfully");
        setUsers(users.filter((user) => user._id.$oid !== userId));
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  return (
    <div className="UserManagement">
      <h1>User Management</h1>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>UserType</th>

              {/* <th>Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id.$oid}>
                <td>{user._id.$oid}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.userType}</td>

                {/* <td> */}
                {/* <button onClick={() => alert("Edit user not implemented")}>
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button> */}
                {/* <button onClick={() => deleteUser(user._id.$oid)}>
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button> */}
                {/* </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagementPage;
