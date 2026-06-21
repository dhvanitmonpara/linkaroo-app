"use client";

import { BsCheckLg } from "react-icons/bs";
import { BsXLg } from "react-icons/bs";

type NotificationType = {
  title: string;
  description: string;
  time: string;
};

type NotificationButtonMethods = {
  onAccept: () => void;
  onDismiss: () => void;
};

type NotificationCardType = {
  buttonMethods?: NotificationButtonMethods;
  notification: NotificationType;
};

const NotificationCard = ({
  buttonMethods,
  notification,
}: NotificationCardType) => {
  return (
    <div className="w-full">
      <div className="w-full p-2 min-h-16 rounded bg-zinc-800 hover:brightness-110 space-y-2">
        <div>
          <h2 className="text-white">{notification.title}</h2>
          <p className="text-sm text-gray-300">{notification.description}</p>
          <p className="text-sm text-gray-300">{notification.time}</p>
        </div>
        {buttonMethods && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={buttonMethods.onAccept}
              className="text-emerald-400 w-full h-11 rounded-md hover:bg-zinc-700 font-semibold flex justify-center items-center"
            >
              <BsCheckLg />
            </button>
            <button
              onClick={buttonMethods.onDismiss}
              className="text-red-400 w-full h-11 rounded-md hover:bg-zinc-700 font-semibold flex justify-center items-center"
            >
              <BsXLg />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
