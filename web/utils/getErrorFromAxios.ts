import { AxiosError } from "axios";

const getErrorFromAxios = (err: AxiosError) => {
  if (err !== null && typeof err === "object" && "response" in err) {
    const axiosError = err as AxiosError;

    if (axiosError.response !== undefined && "data" in axiosError.response) {
      const responseData = axiosError.response.data as { message: string };
      return responseData.message;
    }
  }
};

export default getErrorFromAxios;
