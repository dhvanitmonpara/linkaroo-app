"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { fontOptions, themeType } from "@/lib/types";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import useProfileStore from "@/store/profileStore";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

type HandleSettingsType = {
  theme: themeType;
  font: fontOptions;
};

const SettingsForm = ({ afterSubmit }: { afterSubmit?: () => void }) => {

  const { updateProfile, profile } = useProfileStore();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    theme: profile.theme,
    font: profile.font,
    useFullTypeFormAdder: profile.useFullTypeFormAdder,
    isSearchShortcutEnabled: profile.isSearchShortcutEnabled
  })

  const { control, handleSubmit } = useForm<HandleSettingsType>({
    defaultValues: {
      theme: profile.theme,
      font: profile.font,
    },
  });

  const handleUpdateSettings = async () => {
    try {

      setLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/users/settings/update/${profile._id}`,
        settings,
        { withCredentials: true }
      );

      if (response.status !== 200) {
        toast.error("Failed to update settings");
      }

      updateProfile({ ...profile, ...settings })
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.message)
      } else {
        console.error(error);
        toast.error("Error while updating settings")
      }
    } finally {
      setLoading(false);
      afterSubmit && afterSubmit()
    }
  };

  return (
    <div className="dark:text-white flex flex-col sm:max-w-96 justify-center items-center space-y-3">
      <form
        className="h-4/5 flex flex-col space-y-3 w-full justify-center items-center"
        onSubmit={handleSubmit(handleUpdateSettings)}
      >
        <Controller
          name="theme"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              value={value}
              onValueChange={(value: any) => {
                if (value) onChange(value);
              }}
            >
              <SelectTrigger className="text-zinc-100 bg-zinc-800 border-zinc-800 sm:max-w-96">
                <SelectValue placeholder="Change theme" />
              </SelectTrigger>
              <SelectContent
                className="dark:bg-zinc-900 dark:text-white dark:border-zinc-800"
              >
                <SelectGroup>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />

        <div className="flex p-3 space-x-6 rounded-md text-zinc-100 bg-zinc-800 border-zinc-800 w-full sm:max-w-96">
          <Label className="space-y-1" htmlFor="search-shortcut">
            <span className="text-sm font-medium">Search shortcut</span>
            <p className="text-xs text-zinc-400">Show search button instead of quick collection/link add button, this will only work on mobile phones.</p>
          </Label>
          <Switch id="search-shortcut" checked={settings.isSearchShortcutEnabled} onCheckedChange={() => setSettings({ ...settings, isSearchShortcutEnabled: !settings.isSearchShortcutEnabled })} />
        </div>

        <div className="flex p-3 space-x-6 rounded-md text-zinc-100 bg-zinc-800 border-zinc-800 w-full sm:max-w-96">
          <Label className="space-y-1" htmlFor="quick-add-link">
            <span className="text-sm font-medium">Quick add link</span>
            <p className="text-xs text-zinc-400">Add links quickly from inside collection page.</p>
          </Label>
          <Switch id="quick-add-link" checked={settings.useFullTypeFormAdder} onCheckedChange={() => setSettings({ ...settings, useFullTypeFormAdder: !settings.useFullTypeFormAdder })} />
        </div>

        <Controller
          name="font"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              value={value}
              onValueChange={(value: any) => {
                if (value) onChange(value);
              }}
            >
              <SelectTrigger className={`text-zinc-100 bg-zinc-800 border-zinc-800 sm:max-w-96 ${value}`}>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent
                className="dark:bg-zinc-900 dark:text-white dark:border-zinc-800"
              >
                <SelectGroup>
                  <SelectItem className="font-mono" value="font-mono">Mono</SelectItem>
                  <SelectItem className="font-poppins" value="font-poppins">Poppins</SelectItem>
                  <SelectItem className="font-sans" value="font-sans">Sans</SelectItem>
                  <SelectItem className="font-helvetica" value="font-helvetica">Helvetica</SelectItem>
                  <SelectItem className="font-comic" value="font-comic">Comic Sans</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />

        {loading ? (
          <Button
            disabled
            className="dark:bg-zinc-300 bg-zinc-900 dark:text-zinc-950 text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-400/90 font-semibold w-full cursor-wait"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin dark:text-white" />
            Please wait
          </Button>
        ) : (
          <Button className="dark:bg-zinc-300 bg-zinc-900 dark:text-zinc-950 text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-400/90 font-semibold w-full">
            Save changes
          </Button>
        )}
      </form>
    </div>
  );
};

export default SettingsForm;
