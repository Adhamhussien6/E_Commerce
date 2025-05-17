import usermodel from "../../DB/models/user.model.js";

export const generateEmailSuggestions = async (email, count = 3) => {
  const [username, domain] = email.split("@");
  const suggestions = new Set();

  // حاول تولد اقتراحات لحد ما توصل للعدد المطلوب أو توصل للحد الأقصى من المحاولات
  let attempts = 0;
  while (suggestions.size < count && attempts < 20) {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const suggestion = `${username}${randomSuffix}@${domain}`;

    const exists = await usermodel.findOne({ email: suggestion });
    if (!exists) {
      suggestions.add(suggestion);
    }

    attempts++;
  }

  return Array.from(suggestions);
};
