export function formatWhatsAppNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (!digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return `${digits}@s.whatsapp.net`;
}


const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, ""); // remove tudo que não é dígito
};

export const buildPhoneVariants = (phone: string): string[] => {
  const digits = normalizePhone(phone);
  
  // Remove o 55 do início caso venha com código do país
  const localDigits = digits.startsWith("55") ? digits.slice(2) : digits;
  
  const areaCode = localDigits.slice(0, 2);
  const number = localDigits.slice(2);
  const numberFormatted = `${number.slice(0, 5)}-${number.slice(5)}`;

  return [
    localDigits,                                 // 11994703386
    `55${localDigits}`,                          // 5511994703386
    `+55${localDigits}`,                         // +5511994703386
    `(${areaCode})${numberFormatted}`,           // (11)99470-3386
    `(${areaCode}) ${numberFormatted}`,          // (11) 99470-3386
    `${areaCode} ${numberFormatted}`,            // 11 99470-3386
  ];
};