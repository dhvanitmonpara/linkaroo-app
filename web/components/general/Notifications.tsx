"use client";

import NotificationCard from "@/components/general/NotificationCard";
import useMethodStore from "@/store/MethodStore";

const Notifications: React.FC = () => {
  const { notifications } = useMethodStore();

  const markAsRead = (notificationId: string) => {
    console.log(notificationId);
  };

  return (
    <div className="md:p-2 p-4">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          buttonMethods={{
            onAccept: () => markAsRead(notification.id),
            onDismiss: () => markAsRead(notification.id),
          }}
          notification={notification}
        />
      ))}
    </div>
  );
};

export default Notifications;
