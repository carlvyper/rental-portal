import React from "react";

const NotificationCard = ({ notification }) => {
  return (
    <div className="border p-2 rounded mb-2 shadow-sm">
      <p>{notification.message}</p>
      <small>{new Date(notification.created_at).toLocaleString()}</small>
    </div>
  );
};

export default NotificationCard;
