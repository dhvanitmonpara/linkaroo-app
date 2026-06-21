"use client";

import { Input } from "@/components/ui/input";

type ProfileSetupProps = {
  firstName: string;
  lastName: string;
  username: string;
  avatarImage?: File;
  updateFields: (fields: Partial<ProfileSetupProps>) => void;
};

const ProfileSetup = ({
  firstName,
  lastName,
  username,
  updateFields,
}: ProfileSetupProps) => {
  return (
    <>
      <div className="flex space-x-2">
        <div className="w-full space-y-2">
          <label htmlFor="first-name">First name</label>
          <Input
            id="first-name"
            type="text"
            placeholder="Enter First name"
            className="bg-slate-800"
            value={firstName}
            onChange={(e) => updateFields({ firstName: e.target.value })}
            required
            autoFocus
          />
        </div>
        <div className="w-full space-y-2">
          <label htmlFor="last-name">Last name &#40;Optional&#41;</label>
          <Input
            id="last-name"
            type="text"
            placeholder="Enter Last name"
            className="bg-slate-800"
            value={lastName}
            onChange={(e) => updateFields({ lastName: e.target.value })}
          />
        </div>
      </div>
      <div className="w-full space-y-2">
        <label htmlFor="username">Username</label>
        <Input
          id="username"
          type="text"
          placeholder="Enter Username"
          className="bg-slate-800"
          required
          onChange={(e) => updateFields({ username: e.target.value })}
          value={username}
        />
      </div>
      <div className="w-full space-y-2">
        <label htmlFor="avatar">Avatar &#40;Optional&#41;</label>
        <Input
          id="avatar"
          type="file"
          className="bg-slate-800 text-white"
          onChange={(e) =>
            updateFields({ avatarImage: e.target.files?.[0] })
          }
        />
      </div>
    </>
  );
};

export default ProfileSetup;
