import { PLACEHOLDER_PROFILE } from '@/data/mockProfile';
import type { StudentProfile } from '@/types/profile';

import { delay } from './mockApi';

export function getProfile(): Promise<StudentProfile> {
  return delay(PLACEHOLDER_PROFILE, 250);
}
