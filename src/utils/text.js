function normalizeText(text = '') {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function containsKeyword(message, keyword) {
  if (!message || !keyword) {
    return false;
  }

  return message.includes(keyword.toLowerCase());
}

module.exports = {
  normalizeText,
  containsKeyword,
};
