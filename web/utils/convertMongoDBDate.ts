function convertMongoDBDate(isoDate: string) {
  const date = new Date(isoDate);

  // Extract the day, month, and year
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1; // Months are zero-indexed in JavaScript
  const year = date.getUTCFullYear();

  // Format the date as DD/MM/YYYY with leading zeros if necessary
  const formattedDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

  return formattedDate;
}

export default convertMongoDBDate;
