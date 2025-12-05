export const formatKoreanPrice = (price: number): string => {
  if (price === 0) return '0원';
  
  const EOK = 100000000;
  const MAN = 10000;
  
  let result = '';
  const eokUnit = Math.floor(price / EOK);
  const remainder = price % EOK;
  const manUnit = Math.floor(remainder / MAN);
  
  if (eokUnit > 0) {
    result += `${eokUnit}억 `;
  }
  
  if (manUnit > 0) {
    result += `${manUnit.toLocaleString()}만원`;
  } else if (eokUnit === 0) {
    result += `${price.toLocaleString()}원`;
  }
  
  return result.trim();
};

export const formatFullPrice = (dealType: string, price: number, deposit?: number): string => {
  if (dealType === 'WOLSE' && deposit) {
    return `보증금 ${formatKoreanPrice(deposit)} / 월 ${formatKoreanPrice(price)}`;
  }
  return formatKoreanPrice(price);
};