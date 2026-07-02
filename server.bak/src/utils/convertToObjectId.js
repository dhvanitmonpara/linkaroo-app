import { Types } from "mongoose";

function convertToObjectId(hexString) {
  try {
    if (typeof hexString !== 'string' || !/^[0-9a-fA-F]{24}$/.test(hexString)) {
      throw new Error('Invalid hexadecimal string');
    }
    return new Types.ObjectId(hexString);
  } catch (error) {
    console.error('Error converting to ObjectId:', error.message);
    return null;
  }
}

export default convertToObjectId