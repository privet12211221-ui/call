import { CapturedCall } from '../types';

// Mock service to simulate Telegram interactions
export const syncWithTelegram = async (phoneNumber: string): Promise<NonNullable<CapturedCall['telegramInfo']>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // In a real app, this would call a backend that uses MTProto or a bot to search/add
  // For demonstration, we'll return mock data based on the number
  const lastDigit = parseInt(phoneNumber.slice(-1));
  
  const mockProfiles = [
    { fullName: 'Alexey Ivanov', username: '@alex_dev', bio: 'Product Designer & Coffee lover' },
    { fullName: 'Elena Petrova', username: '@elena_p', bio: 'Marketing Specialist' },
    { fullName: 'Dmitry Sidorov', username: '@dima_sid', bio: 'Founder of TechFlow' },
    { fullName: 'Maria Sokolova', username: '@mary_s', bio: 'Freelance Illustrator' }
  ];

  const profile = mockProfiles[lastDigit % mockProfiles.length];

  return {
    ...profile,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`
  };
};

export const formatPhone = (phone: string) => {
  return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
};
