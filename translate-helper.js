const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');

/**
 * Instantiate the Watson Language Translator Service
 */
const languageTranslator = new LanguageTranslatorV3({
  // See: https://github.com/watson-developer-cloud/node-sdk#authentication
  version: '2018-05-01',
});

const isEnglishText = (textToTranslate) => {
  return languageTranslator.identify({
    text: textToTranslate,
  });
}

const translateText = (textToTranslate) => {
  return languageTranslator.translate({
    text: textToTranslate,
    source: 'en',
    target: 'tr',
  });
}

module.exports = {
  isEnglishText,
  translateText
}