import { OneInchQuoteResponse } from '@/types/1inch';
import { ethers } from 'ethers';

export const formatBalance = (balance: string, decimals: number): string => {
  try {
    const formatted = ethers.formatUnits(balance, decimals);
    const num = parseFloat(formatted);
    
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
    return (num / 1000000).toFixed(2) + 'M';
  } catch {
    return '0';
  }
};

export const formatOneInchAmount = (amount: string, decimals: number): string => {
  try {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
    return (num / 1000000).toFixed(2) + 'M';
  } catch {
    return '0';
  }
};

export const formatUSD = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const shortenAddress = (address: string): string => {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getProtocolNames = (protocols: OneInchQuoteResponse['protocols']): string[] => {
  return protocols.flat().map(p => p.name);
};

export const calculatePriceImpact = (
  inputAmount: string,
  outputAmount: string,
  inputDecimals: number,
  outputDecimals: number,
  rate: number
): number => {
  try {
    const input = parseFloat(inputAmount) / Math.pow(10, inputDecimals);
    const output = parseFloat(outputAmount) / Math.pow(10, outputDecimals);
    const expectedOutput = input * rate;
    return ((expectedOutput - output) / expectedOutput) * 100;
  } catch {
    return 0;
  }
};