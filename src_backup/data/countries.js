// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt())
  return String.fromCodePoint(...codePoints)
}

// Country codes with phone number formats and flag emojis
export const countries = [
  { code: 'PH', name: 'Philippines', dialCode: '+63', format: 'XXX XXX XXXX', maxLength: 10, flag: getFlagEmoji('PH') },
  { code: 'US', name: 'United States', dialCode: '+1', format: '(XXX) XXX-XXXX', maxLength: 10, flag: getFlagEmoji('US') },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', format: 'XXXX XXXXXX', maxLength: 10, flag: getFlagEmoji('GB') },
  { code: 'CA', name: 'Canada', dialCode: '+1', format: '(XXX) XXX-XXXX', maxLength: 10, flag: getFlagEmoji('CA') },
  { code: 'AU', name: 'Australia', dialCode: '+61', format: 'X XXXX XXXX', maxLength: 9, flag: getFlagEmoji('AU') },
  { code: 'SG', name: 'Singapore', dialCode: '+65', format: 'XXXX XXXX', maxLength: 8, flag: getFlagEmoji('SG') },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', format: 'X-XXX XXXX', maxLength: 9, flag: getFlagEmoji('MY') },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', format: 'XXX-XXXX-XXXX', maxLength: 10, flag: getFlagEmoji('ID') },
  { code: 'TH', name: 'Thailand', dialCode: '+66', format: 'XX-XXX-XXXX', maxLength: 9, flag: getFlagEmoji('TH') },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', format: 'XXX-XXXX-XXX', maxLength: 9, flag: getFlagEmoji('VN') },
  { code: 'JP', name: 'Japan', dialCode: '+81', format: 'XX-XXXX-XXXX', maxLength: 10, flag: getFlagEmoji('JP') },
  { code: 'KR', name: 'South Korea', dialCode: '+82', format: 'XX-XXXX-XXXX', maxLength: 10, flag: getFlagEmoji('KR') },
  { code: 'CN', name: 'China', dialCode: '+86', format: 'XXX XXXX XXXX', maxLength: 11, flag: getFlagEmoji('CN') },
  { code: 'IN', name: 'India', dialCode: '+91', format: 'XXXXX XXXXX', maxLength: 10, flag: getFlagEmoji('IN') },
  { code: 'DE', name: 'Germany', dialCode: '+49', format: 'XXXX XXXXXXX', maxLength: 11, flag: getFlagEmoji('DE') },
  { code: 'FR', name: 'France', dialCode: '+33', format: 'X XX XX XX XX', maxLength: 9, flag: getFlagEmoji('FR') },
  { code: 'IT', name: 'Italy', dialCode: '+39', format: 'XXX XXX XXXX', maxLength: 10, flag: getFlagEmoji('IT') },
  { code: 'ES', name: 'Spain', dialCode: '+34', format: 'XXX XXX XXX', maxLength: 9, flag: getFlagEmoji('ES') },
  { code: 'BR', name: 'Brazil', dialCode: '+55', format: '(XX) XXXXX-XXXX', maxLength: 11, flag: getFlagEmoji('BR') },
  { code: 'MX', name: 'Mexico', dialCode: '+52', format: 'XX XXXX XXXX', maxLength: 10, flag: getFlagEmoji('MX') },
]

export const getCountryByCode = (code) => {
  return countries.find(c => c.code === code) || countries[0]
}

export const formatPhoneNumber = (phone, country) => {
  if (!phone || !country) return phone
  const digits = phone.replace(/\D/g, '')
  const format = country.format.replace(/X/g, '')
  // Simple formatting - just add spaces/dashes based on format
  return digits
}

