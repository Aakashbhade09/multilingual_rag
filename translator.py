from langdetect import detect
from deep_translator import GoogleTranslator


class MultilingualTranslator:
    def __init__(self):
        self.supported_languages = {
            'en': 'English',
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'bn': 'Bengali',
            'ta': 'Tamil',
            'te': 'Telugu',
            'mr': 'Marathi',
            'ur': 'Urdu',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean'
        }

    def detect_language(self, text):
        try:
            if not text or len(text.strip()) < 3:
                return 'en'
            return detect(text)
        except Exception:
            return 'en'

    def translate(self, text, target_lang='en', source_lang='auto'):
        try:
            if not text or source_lang == target_lang:
                return text

            translator = GoogleTranslator(source=source_lang, target=target_lang)
            return translator.translate(text)
        except Exception as e:
            print(f"Translation error: {e}")
            return text

    def get_language_name(self, lang_code):
        return self.supported_languages.get(lang_code, lang_code or 'Unknown')
