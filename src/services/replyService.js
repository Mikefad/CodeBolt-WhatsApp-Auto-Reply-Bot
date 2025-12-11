const { normalizeText, containsKeyword } = require('../utils/text');

function determineIntent(message, keywordMapping = {}) {
  if (!message) {
    return null;
  }

  for (const [intent, keywords] of Object.entries(keywordMapping)) {
    if (!Array.isArray(keywords)) {
      continue;
    }

    const matched = keywords.some((keyword) => containsKeyword(message, keyword));
    if (matched) {
      return intent;
    }
  }

  return null;
}

function getReplyForMessage(message, businessConfig) {
  const normalizedMessage = normalizeText(message);
  const intent = determineIntent(normalizedMessage, businessConfig.keywordMapping);

  const fallbackTemplate =
    businessConfig.templates?.fallback ||
    'Thanks for reaching out! A member of our team will respond shortly.';

  const selectedIntent =
    intent && businessConfig.templates[intent] ? intent : 'fallback';

  const replyText =
    businessConfig.templates[selectedIntent] ||
    fallbackTemplate;

  return {
    intent: intent || 'fallback',
    templateKey: selectedIntent,
    replyText,
  };
}

module.exports = {
  getReplyForMessage,
  determineIntent,
};
