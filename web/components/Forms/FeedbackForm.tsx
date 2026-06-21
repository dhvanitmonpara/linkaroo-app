"use client";

import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type HandleFeedbackType = {
  title: string;
  description: string;
  type: "bug-report" | "suggest-feature";
};

function FeedbackForm({
  setIsOpen,
}: {
  setIsOpen: (value: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, register } = useForm<HandleFeedbackType>({
    defaultValues: {
      title: "",
      description: "",
      type: "bug-report",
    },
  });

  const handleFeedbackSubmit = async (data: HandleFeedbackType) => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_API_URL}/users/feedback`,
        data,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Feedback sent successfully");
      } else {
        if (typeof res.data.data.error === "string") {
          toast.error(res.data.data.error);
        } else {
          console.log(res.data.data.error);
          toast.error("Failed to send feedback");
        }
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.message);
      } else {
        console.error(error);
        toast.error("Error while sending feedback");
      }
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="dark:text-white flex flex-col w-full sm:max-w-96 justify-center items-center space-y-3">
      <form
        className="h-4/5 flex flex-col space-y-4 w-full justify-center items-center"
        onSubmit={handleSubmit(handleFeedbackSubmit)}
      >
        <Controller
          name="type"
          control={control}
          rules={{ required: "Please select a type" }}
          render={({ field: { onChange, value } }) => (
            <Select defaultValue="bug-report" value={value} onValueChange={onChange}>
              <SelectTrigger className="text-zinc-100 bg-zinc-800 border-zinc-800 sm:max-w-96">
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:text-white dark:border-zinc-800">
                <SelectGroup>
                  <SelectItem value="bug-report">Report a bug</SelectItem>
                  <SelectItem value="suggest-feature">
                    Suggest a new feature
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />

        <Input
          id="title"
          type="text"
          placeholder="Enter title"
          {...register("title", { required: "Title is required" })}
        />

        <Textarea
          id="description"
          placeholder="Enter description"
          {...register("description", {
            required: "Description is required",
          })}
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
          <Button
            type="submit"
            className="dark:bg-zinc-300 bg-zinc-900 dark:text-zinc-950 text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-400/90 font-semibold w-full"
          >
            Submit feedback
          </Button>
        )}
      </form>
    </div>
  );
}

export default FeedbackForm;
